import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';

describe('Articles API (/api/v1/articles)', async () => {
  let app;
  let pool;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    pool = testApp.pool;
  });

  it('GET /api/v1/articles - should fetch published articles with pagination metadata', async () => {
    const res = await request(app).get('/api/v1/articles?page=1&limit=2');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Array.isArray(res.body.data), true);
    assert.strictEqual(res.body.data.length, 2);
    assert.strictEqual(res.body.meta.totalCount, 3);
    assert.strictEqual(res.body.meta.totalPages, 2);
    assert.strictEqual(res.body.meta.page, 1);
    assert.strictEqual(res.body.meta.limit, 2);

    // List view should exclude heavy content field
    assert.strictEqual(res.body.data[0].content, undefined);
  });

  it('GET /api/v1/articles - should exclude DRAFT and ARCHIVED articles', async () => {
    await pool.query(`
      INSERT INTO articles (slug, title, content, status)
      VALUES ('draft-guide', 'Draft Guide', 'Unpublished content', 'DRAFT');
    `);

    const res = await request(app).get('/api/v1/articles');
    assert.strictEqual(res.status, 200);
    const slugs = res.body.data.map((a) => a.slug);
    assert.strictEqual(slugs.includes('draft-guide'), false);
  });

  it('GET /api/v1/articles?category=FOOD AS MEDICINE - should filter articles by category', async () => {
    const res = await request(app).get('/api/v1/articles?category=FOOD AS MEDICINE');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].slug, 'gut-inflammation-mind-anxiety');
  });

  it('GET /api/v1/articles?search=Postural - should search articles by keyword', async () => {
    const res = await request(app).get('/api/v1/articles?search=Postural');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].slug, 'postural-alignment-vs-cardio');
  });

  it('GET /api/v1/articles/:slug - should fetch full published article by slug', async () => {
    const res = await request(app).get('/api/v1/articles/northeast-water-corner-vastu');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.slug, 'northeast-water-corner-vastu');
    assert.strictEqual(typeof res.body.data.content, 'string');
    assert.strictEqual(res.body.data.content.length > 50, true);
  });

  it('GET /api/v1/articles/:slug - should return 404 for nonexistent or draft article', async () => {
    const res = await request(app).get('/api/v1/articles/draft-guide');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });
});
