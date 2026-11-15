import { fileURLToPath } from 'url';
import { pool, closeDbPool } from '../config/db.js';
import { seedServices } from './seeds/001_services_seed.js';
import { seedArticles } from './seeds/002_articles_seed.js';

export async function runAllSeeds(dbPool = pool) {
  console.log('[SEED] Starting database seed process...');
  const client = await dbPool.connect();

  try {
    await client.query('BEGIN;');
    await seedServices(client);
    await seedArticles(client);
    await client.query('COMMIT;');
    console.log('[SEED] All database seeds completed successfully ✓');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('[SEED ERROR] Seed transaction failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// CLI Execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await runAllSeeds();
      process.exit(0);
    } catch (err) {
      const errMsg = err.message || err.name || 'Database connection failed';
      console.error('[SEED ERROR]', errMsg);
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach((e, i) => console.error(`  [Cause ${i + 1}]:`, e.message || e));
      }
      process.exit(1);
    } finally {
      await closeDbPool();
    }
  })();
}
