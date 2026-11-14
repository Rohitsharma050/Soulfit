import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { setupTestDatabase } from './setupTestDb.js';

describe('Database Integrity, Seeds & Constraints Tests', async () => {
  let pool;
  let db;

  before(async () => {
    const testDb = await setupTestDatabase();
    pool = testDb.pool;
    db = testDb.db;
  });

  it('should verify initial seed counts for services and articles', async () => {
    const services = await pool.query('SELECT slug FROM services WHERE is_active = TRUE;');
    const articles = await pool.query('SELECT slug FROM articles WHERE status = \'PUBLISHED\';');

    assert.strictEqual(services.rows.length, 5);
    assert.strictEqual(articles.rows.length, 3);
  });

  it('should enforce unique constraint on service slugs', async () => {
    await assert.rejects(async () => {
      await pool.query(`
        INSERT INTO services (slug, title, short_description)
        VALUES ('yoga-wellness', 'Duplicate Slug Test', 'Description');
      `);
    }, (err) => {
      return err.code === '23505'; // Unique constraint violation
    });
  });

  it('should enforce unique constraint on subscriber emails', async () => {
    await pool.query("INSERT INTO subscribers (email, consent) VALUES ('unique.test@example.com', TRUE);");

    await assert.rejects(async () => {
      await pool.query("INSERT INTO subscribers (email, consent) VALUES ('unique.test@example.com', TRUE);");
    }, (err) => {
      return err.code === '23505';
    });
  });

  it('should enforce status check constraint on contact messages', async () => {
    await assert.rejects(async () => {
      await pool.query(`
        INSERT INTO contact_messages (name, email, message, status)
        VALUES ('Test', 'test@test.com', 'Message', 'INVALID_STATUS');
      `);
    });
  });

  it('should enforce status check constraint on consultations', async () => {
    await assert.rejects(async () => {
      await pool.query(`
        INSERT INTO consultations (full_name, email, phone, pillar_interest, status)
        VALUES ('Test User', 'test@test.com', '1234567890', 'Soulfit', 'INVALID_STATUS');
      `);
    });
  });

  it('should verify point-in-time state rollback using snapshot restoration', async () => {
    const snapshot = db.backup();
    await pool.query("INSERT INTO subscribers (email, consent) VALUES ('temporary.snapshot@test.com', TRUE);");
    const foundBefore = await pool.query("SELECT * FROM subscribers WHERE email = 'temporary.snapshot@test.com';");
    assert.strictEqual(foundBefore.rows.length, 1);

    // Rollback to snapshot
    snapshot.restore();

    const foundAfter = await pool.query("SELECT * FROM subscribers WHERE email = 'temporary.snapshot@test.com';");
    assert.strictEqual(foundAfter.rows.length, 0);
  });
});
