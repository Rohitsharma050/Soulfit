import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';

describe('Contact API (/api/v1/contact)', async () => {
  let app;
  let pool;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    pool = testApp.pool;
  });

  it('POST /api/v1/contact - should successfully save valid contact submission in PostgreSQL', async () => {
    const payload = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+91 9876543210',
      subject: 'Vastu Consultation Inquiry',
      message: 'I would like to explore spatial alignment for our new residence in Bangalore.',
    };

    const res = await request(app)
      .post('/api/v1/contact')
      .send(payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Priya Sharma');
    assert.strictEqual(res.body.data.email, 'priya@example.com');
    assert.strictEqual(res.body.data.status, 'NEW');

    // Verify database persistence directly
    const dbCheck = await pool.query('SELECT * FROM contact_messages WHERE email = $1;', ['priya@example.com']);
    assert.strictEqual(dbCheck.rows.length, 1);
    assert.strictEqual(dbCheck.rows[0].name, 'Priya Sharma');
  });

  it('POST /api/v1/contact - should reject invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({
        name: 'John Doe',
        email: 'invalid-email-string',
        message: 'Hello sanctuary team.',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.errors.some((e) => e.field === 'email'), true);
  });

  it('POST /api/v1/contact - should reject missing name or message', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({
        email: 'john@example.com',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/v1/contact - should reject honeypot spam submission', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({
        name: 'Spam Bot',
        email: 'bot@spam.com',
        message: 'Buy cheap watches now!',
        website: 'http://spamsite.xyz', // honeypot filled
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });
});
