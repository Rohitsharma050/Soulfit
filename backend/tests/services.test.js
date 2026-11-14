import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';

describe('Public Services API (/api/v1/services)', async () => {
  let app;
  let pool;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    pool = testApp.pool;
  });

  it('GET /api/v1/services - should fetch all active services in order', async () => {
    const res = await request(app).get('/api/v1/services');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Array.isArray(res.body.data), true);
    assert.strictEqual(res.body.data.length, 5);
    assert.strictEqual(res.body.meta.count, 5);

    // Verify ordering
    assert.strictEqual(res.body.data[0].slug, 'yoga-wellness');
    assert.strictEqual(res.body.data[1].slug, 'vastu');
    assert.strictEqual(res.body.data[2].slug, 'astrology');
    assert.strictEqual(res.body.data[3].slug, 'corporate-wellbeing');
    assert.strictEqual(res.body.data[4].slug, 'food-as-medicine');
  });

  it('GET /api/v1/services?featured=true - should filter featured services', async () => {
    const res = await request(app).get('/api/v1/services?featured=true');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length >= 1, true);
    res.body.data.forEach((s) => assert.strictEqual(s.is_featured, true));
  });

  it('GET /api/v1/services/:slug - should fetch an individual service by slug', async () => {
    const res = await request(app).get('/api/v1/services/vastu');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.slug, 'vastu');
    assert.strictEqual(res.body.data.title, 'Five Elements & Spatial Geometry');
    assert.strictEqual(Array.isArray(res.body.data.offerings), true);
  });

  it('GET /api/v1/services/:slug - should return 404 for nonexistent service', async () => {
    const res = await request(app).get('/api/v1/services/non-existent-slug');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });

  it('GET /api/v1/services - should exclude inactive services from results', async () => {
    // Insert an inactive service into test database
    await pool.query(`
      INSERT INTO services (slug, title, short_description, is_active, display_order)
      VALUES ('hidden-service', 'Hidden Offering', 'Inactive description', FALSE, 99);
    `);

    const res = await request(app).get('/api/v1/services');
    assert.strictEqual(res.status, 200);
    const slugs = res.body.data.map((s) => s.slug);
    assert.strictEqual(slugs.includes('hidden-service'), false);
  });
});
