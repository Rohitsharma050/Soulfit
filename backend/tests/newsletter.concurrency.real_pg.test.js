import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import pg from 'pg';
import { prisma } from '../config/prisma.js';
import { newsletterRepository } from '../repositories/newsletter.repository.js';
import { config } from '../config/env.js';

describe('Newsletter Atomic Unsubscribe Concurrency (Live PostgreSQL)', () => {
  let pool;
  let testSubscriberId;
  const testEmail = `concurrency.newsletter.${Date.now()}@example.com`;
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  before(async () => {
    pool = new pg.Pool({ connectionString: config.databaseUrl });

    // Seed one active subscriber in the real PostgreSQL database
    const created = await newsletterRepository.createSubscriber({
      email: testEmail,
      consent: true,
      unsubscribeTokenHash: tokenHash,
    });
    testSubscriberId = created.id;
  });

  after(async () => {
    if (testSubscriberId) {
      await pool.query('DELETE FROM subscribers WHERE id = $1', [testSubscriberId]);
    }
    await pool.end();
  });

  it('should atomically process concurrent unsubscribe requests with exactly one success and one null', async () => {
    // Dispatch two concurrent unsubscribe calls simultaneously
    const [resultA, resultB] = await Promise.all([
      newsletterRepository.unsubscribeByTokenHash(tokenHash),
      newsletterRepository.unsubscribeByTokenHash(tokenHash),
    ]);

    // Count outcomes
    const successCount = (resultA !== null ? 1 : 0) + (resultB !== null ? 1 : 0);
    const nullCount = (resultA === null ? 1 : 0) + (resultB === null ? 1 : 0);

    // Assert exactly one won the race and exactly one was rejected
    assert.strictEqual(successCount, 1, 'Exactly one concurrent unsubscribe operation must succeed');
    assert.strictEqual(nullCount, 1, 'Exactly one concurrent unsubscribe operation must return null');

    const winner = resultA || resultB;
    assert.strictEqual(winner.email, testEmail.toLowerCase());
    assert.ok(winner.unsubscribed_at instanceof Date, 'unsubscribed_at must be a valid Date object');
    assert.strictEqual(winner.unsubscribe_token_hash, undefined, 'token hash must NOT be exposed in result');

    // Verify final state directly in the live database via native pg
    const { rows } = await pool.query('SELECT consent, unsubscribed_at, unsubscribe_token_hash FROM subscribers WHERE id = $1', [testSubscriberId]);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].consent, false, 'Database consent must be false');
    assert.ok(rows[0].unsubscribed_at, 'Database unsubscribed_at must be populated');
    assert.strictEqual(rows[0].unsubscribe_token_hash, tokenHash, 'Database token hash must remain intact');
  });
});
