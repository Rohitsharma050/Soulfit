import authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getAuthCookieOptions, getClearAuthCookieOptions } from '../utils/jwt.js';
import { extractToken } from '../middleware/auth.middleware.js';
import { config } from '../config/env.js';

/**
 * Registers a new user with name, email, and password.
 * POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });

    // Set secure HttpOnly session cookie
    res.cookie(config.cookie.name, result.token, getAuthCookieOptions(false));

    return ApiResponse.created(
      res,
      { user: result.user, token: result.token },
      'Registration successful. Welcome to The Harmony Project sanctuary.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticates user credentials and establishes a session.
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await authService.login({ email, password, rememberMe });

    // Set secure HttpOnly session cookie with rememberMe duration if requested
    res.cookie(config.cookie.name, result.token, getAuthCookieOptions(result.rememberMe));

    return ApiResponse.success(
      res,
      { user: result.user, token: result.token },
      'Welcome back. Authentication successful.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Initiates Google OAuth 2.0 flow.
 * GET /api/v1/auth/google
 */
export const getGoogleAuth = async (req, res, next) => {
  try {
    const state = req.query.state || 'harmony_auth_state';

    // If Google OAuth credentials are not configured in backend/.env
    if (!config.google.isConfigured) {
      if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
        return res.status(503).json({
          success: false,
          statusCode: 503,
          message:
            'Google Sign-In is currently not configured on this server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.',
        });
      }
      const returnTarget = (req.headers.referer && req.headers.referer.includes('/register')) ? 'register' : 'login';
      return res.redirect(`${config.frontendUrl}/${returnTarget}?error=google_not_configured`);
    }

    const authUrl = authService.getGoogleAuthUrl(state);

    // If client requested JSON (e.g. from single-page app button or API test)
    if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
      return ApiResponse.success(res, { url: authUrl }, 'Google OAuth authorization URL generated.');
    }

    // Direct browser redirect to Google consent screen
    return res.redirect(authUrl);
  } catch (error) {
    if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
      return next(error);
    }
    const returnTarget = (req.headers.referer && req.headers.referer.includes('/register')) ? 'register' : 'login';
    return res.redirect(
      `${config.frontendUrl}/${returnTarget}?error=${encodeURIComponent(error.message || 'google_auth_failed')}`
    );
  }
};

/**
 * Handles Google OAuth redirect callback.
 * GET /api/v1/auth/google/callback
 */
export const googleCallback = async (req, res, next) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      const reason = error_description || error;
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(reason)}`);
    }

    const result = await authService.handleGoogleCallback(code);

    // Set secure HttpOnly session cookie
    res.cookie(config.cookie.name, result.token, getAuthCookieOptions(false));

    // Redirect authenticated user to frontend dashboard with token handoff for cross-domain cookie resiliency
    return res.redirect(`${config.frontendUrl}/dashboard?auth=success&token=${encodeURIComponent(result.token)}`);
  } catch (error) {
    // Graceful redirection to frontend login with error indicator
    const errorMessage = error.message || 'Google authentication failed';
    return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
  }
};

/**
 * Retrieves the currently authenticated user's profile.
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is guaranteed by requireAuth middleware
    const token = extractToken(req);
    return ApiResponse.success(
      res,
      { user: req.user, token: token || undefined },
      'Current authenticated user profile retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Terminates user session and clears the HttpOnly cookie.
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie(config.cookie.name, getClearAuthCookieOptions());
    return ApiResponse.success(res, null, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy status check for backward compatibility.
 * GET /api/v1/auth/status
 */
export const getAuthStatus = async (req, res) => {
  const user = req.user || null;
  return ApiResponse.success(res, {
    authenticated: Boolean(user),
    user,
  }, 'Auth status retrieved.');
};

/**
 * POST /api/v1/auth/google (Credential or Token callback fallback)
 */
export const googleAuthCallback = googleCallback;

export default {
  register,
  login,
  getGoogleAuth,
  googleCallback,
  getMe,
  logout,
  getAuthStatus,
};
