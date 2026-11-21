import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';
import { getAuthCookieOptions, getClearAuthCookieOptions, generateToken } from '../utils/jwt.js';
import { config } from '../config/env.js';

describe('Production Cookie Configuration & Dual Auth (Cookie + Bearer) Tests', async () => {
  let app;
  let authToken;
  let authCookie;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  describe('1. Production & Development Cookie Options', () => {
    it('should generate SameSite=Lax and secure=false in development/test environment', () => {
      const devOptions = getAuthCookieOptions(false);
      assert.strictEqual(devOptions.httpOnly, true);
      assert.strictEqual(devOptions.sameSite, 'lax');
      assert.strictEqual(devOptions.secure, false);
      assert.strictEqual(devOptions.path, '/');
      assert.strictEqual(devOptions.partitioned, undefined);
    });

    it('should support SameSite=None, Secure=true, and Partitioned=true when configured for cross-site production', () => {
      // Temporarily simulate production config
      const originalSameSite = config.cookie.sameSite;
      const originalSecure = config.cookie.secure;

      try {
        config.cookie.sameSite = 'none';
        config.cookie.secure = true;

        const prodOptions = getAuthCookieOptions(true);
        assert.strictEqual(prodOptions.httpOnly, true);
        assert.strictEqual(prodOptions.sameSite, 'none');
        assert.strictEqual(prodOptions.secure, true);
        assert.strictEqual(prodOptions.partitioned, true, 'Must include Partitioned for CHIPS cross-site support');
        assert.strictEqual(prodOptions.maxAge, 30 * 24 * 60 * 60 * 1000);

        const clearOptions = getClearAuthCookieOptions();
        assert.strictEqual(clearOptions.sameSite, 'none');
        assert.strictEqual(clearOptions.secure, true);
        assert.strictEqual(clearOptions.partitioned, true);
      } finally {
        config.cookie.sameSite = originalSameSite;
        config.cookie.secure = originalSecure;
      }
    });
  });

  describe('2. Dual-Authentication Token Delivery in Register & Login', () => {
    const testEmail = `dual_auth_${Date.now()}@example.com`;

    it('POST /api/v1/auth/register - should return token in JSON response and set HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Dual Auth User',
          email: testEmail,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.user, 'User object must be in data');
      assert.ok(res.body.data.token, 'JWT token must be included in JSON data payload for cross-domain Bearer fallback');
      assert.strictEqual(typeof res.body.data.token, 'string');

      // Verify cookie is also set
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies, 'Set-Cookie header must be present');
      const authCookieHeader = cookies.find((c) => c.startsWith('auth_token='));
      assert.ok(authCookieHeader);

      authToken = res.body.data.token;
      authCookie = authCookieHeader.split(';')[0];
    });

    it('POST /api/v1/auth/login - should return token in JSON response and set HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.user);
      assert.ok(res.body.data.token, 'Login response must include token in data payload');
      authToken = res.body.data.token;
    });
  });

  describe('3. Protected Route Access via Cookie vs Bearer Header', () => {
    it('GET /api/v1/auth/me - should succeed when authenticating via HttpOnly Cookie', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', authCookie);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Dual Auth User');
    });

    it('GET /api/v1/auth/me - should succeed when authenticating via Authorization: Bearer <token> (third-party cookie fallback)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Dual Auth User');
    });

    it('POST /api/v1/consultations/book - should succeed authenticating via Bearer token when cookies are blocked', async () => {
      // Get a valid consultation type from test DB
      const typesRes = await request(app).get('/api/v1/consultations/types');
      const typeId = typesRes.body.data[0].id;

      const slotStart = new Date(Date.now() + 86400000);
      slotStart.setUTCHours(10, 0, 0, 0);

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Authorization', `Bearer ${authToken}`)
        // Note: No Cookie header sent, simulating third-party cookie blocking on Vercel -> Render!
        .send({
          type_id: typeId,
          slot_start: slotStart.toISOString(),
          phone: '+919876543210',
          goals: 'Stress relief and physical posture',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.booking_reference);
    });

    it('POST /api/v1/consultations/book - should reject with 401 when neither Cookie nor Bearer token is provided', async () => {
      const typesRes = await request(app).get('/api/v1/consultations/types');
      const typeId = typesRes.body.data[0].id;

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .send({
          type_id: typeId,
          slot_start: new Date().toISOString(),
          phone: '+919876543210',
          goals: 'Unauthenticated attempt',
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Authentication required'));
    });
  });
});
