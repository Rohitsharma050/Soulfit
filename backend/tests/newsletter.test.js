import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';

describe('Newsletter API (/api/v1/newsletter)', async () => {
  let app;
  let pool;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    pool = testApp.pool;
  });

  it('POST /api/v1/newsletter/subscribe - should register new subscription in PostgreSQL', async () => {
    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({
        email: 'wellness.seeker@example.com',
        consent: true,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.email, 'wellness.seeker@example.com');
    assert.strictEqual(res.body.data.alreadySubscribed, false);

    // Verify database record
    const dbCheck = await pool.query('SELECT * FROM subscribers WHERE email = $1;', ['wellness.seeker@example.com']);
    assert.strictEqual(dbCheck.rows.length, 1);
    assert.strictEqual(dbCheck.rows[0].consent, true);
    assert.strictEqual(dbCheck.rows[0].unsubscribed_at, null);
  });

  it('POST /api/v1/newsletter/subscribe - should handle duplicate subscription gracefully', async () => {
    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({
        email: 'wellness.seeker@example.com',
        consent: true,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.alreadySubscribed, true);
    assert.match(res.body.message, /already part of our/i);
  });

  it('POST /api/v1/newsletter/subscribe - should reject missing consent with 400', async () => {
    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({
        email: 'no.consent@example.com',
        consent: false,
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/v1/newsletter/subscribe - should reactivate previously unsubscribed user', async () => {
    // Manually mark user as unsubscribed
    await pool.query("UPDATE subscribers SET unsubscribed_at = NOW(), consent = FALSE WHERE email = 'wellness.seeker@example.com';");

    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({
        email: 'wellness.seeker@example.com',
        consent: true,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.resubscribed, true);

    const dbCheck = await pool.query('SELECT * FROM subscribers WHERE email = $1;', ['wellness.seeker@example.com']);
    assert.strictEqual(dbCheck.rows[0].unsubscribed_at, null);
    assert.strictEqual(dbCheck.rows[0].consent, true);
  });

  it('POST /api/v1/newsletter/unsubscribe - should reject invalid token with 400', async () => {
    const res = await request(app)
      .post('/api/v1/newsletter/unsubscribe')
      .send({
        token: 'invalid-nonexistent-token-12345',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });
});
