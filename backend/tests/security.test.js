import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';

describe('Security & Input Defense Tests', async () => {
  let app;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  it('should safely handle SQL injection attempts without leaking syntax errors', async () => {
    const maliciousInput = "'; DROP TABLE services; --";
    const res = await request(app).get(`/api/v1/services?category=${encodeURIComponent(maliciousInput)}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(Array.isArray(res.body.data), true);
    assert.strictEqual(res.body.data.length, 0); // Correctly treated as a literal search string
  });

  it('should reject malformed JSON payloads with 400 and clean error envelope', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .set('Content-Type', 'application/json')
      .send('{"name": "Broken JSON');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /malformed json/i);
  });

  it('should reject requests exceeding body size limit (> 10kb)', async () => {
    const oversizedMessage = 'A'.repeat(15 * 1024); // 15KB
    const res = await request(app)
      .post('/api/v1/contact')
      .send({
        name: 'Huge Body',
        email: 'huge@example.com',
        message: oversizedMessage,
      });

    assert.strictEqual(res.status, 413);
  });
});
