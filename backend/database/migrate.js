import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, closeDbPool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

/**
 * Initializes the schema_migrations tracking table if it does not exist.
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
}

/**
 * Runs pending database migrations in chronological order.
 */
export async function migrateUp(dbPool = pool) {
  console.log('[MIGRATION] Checking for pending migrations...');
  const client = await dbPool.connect();

  try {
    await ensureMigrationsTable(client);

    // Retrieve already executed migrations
    const res = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC;');
    const appliedMigrations = new Set(res.rows.map((row) => row.name));

    // Read and sort all up migration files
    const allFiles = fs.readdirSync(migrationsDir);
    const upFiles = allFiles
      .filter((file) => file.endsWith('.sql') && !file.endsWith('.down.sql'))
      .sort();

    let count = 0;
    for (const file of upFiles) {
      if (!appliedMigrations.has(file)) {
        console.log(`[MIGRATION] Applying: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query('BEGIN;');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
          await client.query('COMMIT;');
          console.log(`[MIGRATION] Applied:  ${file} ✓`);
          count++;
        } catch (err) {
          await client.query('ROLLBACK;');
          throw new Error(`Failed to apply migration ${file}: ${err.message}`);
        }
      }
    }

    if (count === 0) {
      console.log('[MIGRATION] Database schema is already up to date.');
    } else {
      console.log(`[MIGRATION] Successfully executed ${count} migration(s).`);
    }

    return { success: true, appliedCount: count };
  } finally {
    client.release();
  }
}

/**
 * Reverts the most recently executed migration.
 */
export async function migrateDown(dbPool = pool) {
  console.log('[MIGRATION] Checking for migrations to revert...');
  const client = await dbPool.connect();

  try {
    await ensureMigrationsTable(client);

    const res = await client.query('SELECT name FROM schema_migrations ORDER BY id DESC LIMIT 1;');
    if (res.rows.length === 0) {
      console.log('[MIGRATION] No migrations to revert.');
      return { success: true, reverted: null };
    }

    const lastMigration = res.rows[0].name;
    const downFile = lastMigration.replace('.sql', '.down.sql');
    const downFilePath = path.join(migrationsDir, downFile);

    if (!fs.existsSync(downFilePath)) {
      throw new Error(`Down migration file not found: ${downFile}`);
    }

    console.log(`[MIGRATION] Reverting: ${lastMigration} using ${downFile}...`);
    const sql = fs.readFileSync(downFilePath, 'utf8');

    await client.query('BEGIN;');
    try {
      await client.query(sql);
      await client.query('DELETE FROM schema_migrations WHERE name = $1;', [lastMigration]);
      await client.query('COMMIT;');
      console.log(`[MIGRATION] Reverted:  ${lastMigration} ✓`);
    } catch (err) {
      await client.query('ROLLBACK;');
      throw new Error(`Failed to revert migration ${lastMigration}: ${err.message}`);
    }

    return { success: true, reverted: lastMigration };
  } finally {
    client.release();
  }
}

// CLI Execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'up';

  (async () => {
    try {
      if (command === 'up') {
        await migrateUp();
      } else if (command === 'down') {
        await migrateDown();
      } else {
        console.error(`[MIGRATION] Unknown command: "${command}". Use "up" or "down".`);
        process.exit(1);
      }
      process.exit(0);
    } catch (err) {
      console.error('[MIGRATION ERROR]', err.message);
      process.exit(1);
    } finally {
      await closeDbPool();
    }
  })();
}
