import { UserRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeUser } from '../middleware/auth.middleware.js';
import { config } from '../config/env.js';

export class AuthService {
  constructor(userRepository = new UserRepository()) {
    this.userRepo = userRepository;
  }

  /**
   * Registers a new local email/password user account.
   * @param {object} param0 
   * @returns {Promise<{ user: object, token: string }>}
   */
  async register({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Prevent duplicate email registration
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ApiError(409, 'An account with this email address already exists.');
    }

    // Secure password hashing
    const passwordHash = await hashPassword(password);

    // Create user in database
    const newUser = await this.userRepo.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'USER',
      authProvider: 'local',
    });

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: sanitizeUser(newUser),
      token,
    };
  }

  /**
   * Authenticates user using email and password.
   * Generic error message prevents account enumeration.
   * @param {object} param0 
   * @returns {Promise<{ user: object, token: string, rememberMe: boolean }>}
   */
  async login({ email, password, rememberMe = false }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(normalizedEmail);

    // Constant-time check or generic failure: never reveal if email exists
    if (!user || !user.password_hash) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account has been deactivated. Please contact support.');
    }

    // Update last login timestamp
    await this.userRepo.updateLastLogin(user.id);

    // Token expiration based on rememberMe
    const expiresIn = rememberMe ? '30d' : config.jwt.expiresIn;
    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      expiresIn
    );

    return {
      user: sanitizeUser(user),
      token,
      rememberMe,
    };
  }

  /**
   * Generates Google OAuth authorization URL.
   * @param {string} [state] 
   * @returns {string}
   */
  getGoogleAuthUrl(state = 'harmony_project_auth') {
    if (!config.google.isConfigured) {
      throw new ApiError(
        503,
        'Google Sign-In is currently not configured on this server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
      );
    }

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handles Google OAuth callback code exchange and user verification.
   * @param {string} code 
   * @returns {Promise<{ user: object, token: string }>}
   */
  async handleGoogleCallback(code) {
    if (!config.google.isConfigured) {
      throw new ApiError(503, 'Google OAuth credentials not configured on the backend.');
    }

    if (!code) {
      throw new ApiError(400, 'Authorization code is required.');
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new ApiError(401, tokenData.error_description || 'Failed to exchange authorization code with Google.');
    }

    // 2. Fetch verified Google user profile
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userinfoResponse.json();
    if (!userinfoResponse.ok || !googleUser.sub || !googleUser.email) {
      throw new ApiError(401, 'Unable to retrieve verified user profile from Google.');
    }

    return this.findOrCreateGoogleUser({
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
      avatar: googleUser.picture || null,
      emailVerified: googleUser.email_verified !== false,
    });
  }

  /**
   * Internal helper to link or create user from verified Google profile.
   * @param {object} param0 
   * @returns {Promise<{ user: object, token: string }>}
   */
  async findOrCreateGoogleUser({ googleId, email, name, avatar, emailVerified }) {
    if (!emailVerified) {
      throw new ApiError(400, 'Google email address must be verified before signing in.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user with this googleId already exists
    let user = await this.userRepo.findByGoogleId(googleId);

    if (user) {
      // Existing Google user - update last login
      await this.userRepo.updateLastLogin(user.id);
    } else {
      // 2. Check if user with this email already exists (e.g. registered locally)
      const existingEmailUser = await this.userRepo.findByEmail(normalizedEmail);

      if (existingEmailUser) {
        // Link Google ID to existing verified account
        user = await this.userRepo.linkGoogleAccount(
          existingEmailUser.id,
          googleId,
          avatar || existingEmailUser.avatar
        );
      } else {
        // 3. Brand new user created through Google OAuth
        user = await this.userRepo.create({
          name: name || 'Sanctuary Member',
          email: normalizedEmail,
          googleId,
          avatar,
          role: 'USER',
          authProvider: 'google',
        });
      }
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account has been deactivated. Please contact support.');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  /**
   * Retrieves fresh user profile by ID.
   * @param {string} userId 
   * @returns {Promise<object>}
   */
  async getCurrentUser(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found.');
    }
    if (!user.is_active) {
      throw new ApiError(403, 'Account has been deactivated.');
    }
    return sanitizeUser(user);
  }
}

export default new AuthService();
