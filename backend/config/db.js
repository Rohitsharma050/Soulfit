import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

// Initialize PostgreSQL Connection Pool using validated configuration
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
});

// Pool-level error handler for idle clients
pool.on('error', (err) => {
  console.error('[DB ERROR] Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Tests database connectivity by executing a lightweight query.
 * @returns {Promise<{ ok: boolean, latencyMs: number, timestamp: string, version?: string }>}
 */
export async function testDbConnection() {
  const startTime = Date.now();
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version;');
    const latencyMs = Date.now() - startTime;
    return {
      ok: true,
      latencyMs,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      ok: false,
      latencyMs,
      error: error.message,
    };
  } finally {
    if (client) client.release();
  }
}

/**
 * Closes the PostgreSQL pool gracefully during application shutdown.
 */
export async function closeDbPool() {
  try {
    await pool.end();
    console.log('[DB] PostgreSQL connection pool closed successfully.');
  } catch (err) {
    console.error('[DB ERROR] Error during pool shutdown:', err.message);
  }
}

export default pool;
