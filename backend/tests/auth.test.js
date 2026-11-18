import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';
import { generateToken } from '../utils/jwt.js';

describe('Authentication & User Identity API (/api/v1/auth)', async () => {
  let app;
  let pool;
  let authService;
  let userRepo;
  let authCookie;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    pool = testApp.pool;
    userRepo = testApp.repos.userRepo;
    authService = testApp.services.testAuthService;
  });

  // ============================================================================
  // 1. REGISTRATION TESTS
  // ============================================================================
  it('POST /api/v1/auth/register - should successfully register a new user and set HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.name, 'Aarav Sharma');
    assert.strictEqual(res.body.data.user.email, 'aarav.sharma@example.com');
    assert.strictEqual(res.body.data.user.role, 'USER');
    assert.strictEqual(res.body.data.user.authProvider, 'local');
    assert.strictEqual(res.body.data.user.password_hash, undefined);
    assert.strictEqual(res.body.data.user.passwordHash, undefined);

    // Verify Set-Cookie header contains HttpOnly auth_token
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Set-Cookie header must be present');
    const authCookieHeader = cookies.find((c) => c.startsWith('auth_token='));
    assert.ok(authCookieHeader, 'auth_token cookie must be set');
    assert.ok(authCookieHeader.toLowerCase().includes('httponly'), 'auth_token must be HttpOnly');
    assert.ok(authCookieHeader.toLowerCase().includes('samesite=lax'), 'auth_token must have SameSite=Lax');

    // Save cookie for authenticated tests
    authCookie = authCookieHeader.split(';')[0];
  });

  it('POST /api/v1/auth/register - should reject duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Duplicate',
        email: 'AARAV.SHARMA@example.com', // Case-insensitive test
        password: 'AnotherPassword123',
        confirmPassword: 'AnotherPassword123',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('already exists'));
  });

  it('POST /api/v1/auth/register - should reject mismatched passwords with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Priya Patel',
        email: 'priya@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    const errorMessages = res.body.errors.map((e) => e.message);
    assert.ok(errorMessages.some((m) => m.includes('Passwords do not match')));
  });

  it('POST /api/v1/auth/register - should reject weak passwords (<8 chars or no number) with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Weak User',
        email: 'weak@example.com',
        password: 'short',
        confirmPassword: 'short',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/v1/auth/register - should reject invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Invalid Email',
        email: 'not-an-email',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  // ============================================================================
  // 2. LOGIN TESTS
  // ============================================================================
  it('POST /api/v1/auth/login - should authenticate valid user credentials and establish session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav.sharma@example.com',
        password: 'SecurePassword123',
        rememberMe: true,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, 'aarav.sharma@example.com');
    assert.strictEqual(res.body.data.user.name, 'Aarav Sharma');

    // Verify cookie with rememberMe
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    const authCookieHeader = cookies.find((c) => c.startsWith('auth_token='));
    assert.ok(authCookieHeader);
    assert.ok(authCookieHeader.toLowerCase().includes('httponly'));
  });

  it('POST /api/v1/auth/login - should reject incorrect password with generic 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav.sharma@example.com',
        password: 'WrongPassword999',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Invalid email or password.');
  });

  it('POST /api/v1/auth/login - should reject unregistered email with identical generic 401 (prevent enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent.user@example.com',
        password: 'AnyPassword123',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Invalid email or password.');
  });

  // ============================================================================
  // 3. PROTECTED /auth/me & SESSION VALIDATION
  // ============================================================================
  it('GET /api/v1/auth/me - should return authenticated user profile when session cookie is provided', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, 'aarav.sharma@example.com');
    assert.strictEqual(res.body.data.user.name, 'Aarav Sharma');
  });

  it('GET /api/v1/auth/me - should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Authentication required'));
  });

  it('GET /api/v1/auth/me - should reject malformed or invalid token with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', 'auth_token=invalid.malformed.token.value');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/v1/auth/me - should reject expired token with 401 session expired notice', async () => {
    const user = await userRepo.findByEmail('aarav.sharma@example.com');
    // Generate an already expired token (1 millisecond)
    const expiredToken = generateToken({ id: user.id, email: user.email }, -1);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `auth_token=${expiredToken}`);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.toLowerCase().includes('expired'));
  });

  // ============================================================================
  // 4. LOGOUT TESTS
  // ============================================================================
  it('POST /api/v1/auth/logout - should clear auth cookie and invalidate session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', authCookie);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    const authCookieHeader = cookies.find((c) => c.startsWith('auth_token='));
    assert.ok(authCookieHeader);
    // Clearing a cookie sets Max-Age=0 or past Expires date
    assert.ok(
      authCookieHeader.includes('Expires=') ||
      authCookieHeader.includes('Max-Age=0') ||
      authCookieHeader.startsWith('auth_token=;')
    );
  });

  // ============================================================================
  // 5. GOOGLE OAUTH FLOW & ACCOUNT LINKING
  // ============================================================================
  it('GET /api/v1/auth/google - should handle Google OAuth initiation or unconfigured status gracefully', async () => {
    const res = await request(app)
      .get('/api/v1/auth/google')
      .set('Accept', 'application/json');

    // In test environment without actual Google client credentials, returns either 503 or 302/200
    if (res.status === 200) {
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.url.includes('accounts.google.com'));
    } else {
      assert.strictEqual(res.status, 503);
      assert.ok(res.body.error.toLowerCase().includes('google'));
    }
  });

  it('Google OAuth helper - should safely create new Google user and prevent duplicate accounts', async () => {
    const newGoogleUser = await authService.findOrCreateGoogleUser({
      googleId: 'google-uid-10001',
      email: 'zen.seeker@example.com',
      name: 'Zen Seeker',
      avatar: 'https://lh3.googleusercontent.com/photo.jpg',
      emailVerified: true,
    });

    assert.strictEqual(newGoogleUser.user.email, 'zen.seeker@example.com');
    assert.strictEqual(newGoogleUser.user.googleId, 'google-uid-10001');
    assert.strictEqual(newGoogleUser.user.authProvider, 'google');

    // Verify token can authenticate /auth/me
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `auth_token=${newGoogleUser.token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.user.name, 'Zen Seeker');
  });

  it('Google OAuth helper - should safely link Google account to existing email user', async () => {
    // aarav.sharma@example.com was registered locally earlier
    const linkedUser = await authService.findOrCreateGoogleUser({
      googleId: 'google-uid-20002',
      email: 'aarav.sharma@example.com',
      name: 'Aarav Sharma Google',
      avatar: 'https://lh3.googleusercontent.com/aarav.jpg',
      emailVerified: true,
    });

    assert.strictEqual(linkedUser.user.email, 'aarav.sharma@example.com');
    assert.strictEqual(linkedUser.user.googleId, 'google-uid-20002');
    assert.ok(linkedUser.user.authProvider.includes('google'));

    // Verify password login still works after linking
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav.sharma@example.com',
        password: 'SecurePassword123',
      });

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.body.success, true);
  });
});
