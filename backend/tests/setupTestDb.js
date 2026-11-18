import { newDb, DataType } from 'pg-mem';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedServices } from '../database/seeds/001_services_seed.js';
import { seedArticles } from '../database/seeds/002_articles_seed.js';
import { seedConsultationData } from '../database/seeds/003_consultation_seeds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

/**
 * Creates an in-memory PostgreSQL test instance with all migrations & seeds applied.
 */
export async function setupTestDatabase() {
  const db = newDb();

  // Register native functions
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  db.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 16.0 (pg-mem test instance)',
  });

  const pgAdapter = db.adapters.createPg();
  const pool = new pgAdapter.Pool();

  // Load and sanitize migration SQL for pg-mem (omit plpgsql function bodies/comments that pg-mem parser does not support)
  const sanitizeForPgMem = (sql) => {
    return sql
      .replace(/CREATE\s+EXTENSION[\s\S]*?;/gi, '')
      .replace(/CREATE\s+OR\s+REPLACE\s+FUNCTION[\s\S]*?\$\$\s*language\s*['"]?plpgsql['"]?;/gi, '')
      .replace(/DROP\s+TRIGGER[\s\S]*?;/gi, '')
      .replace(/CREATE\s+TRIGGER[\s\S]*?;/gi, '')
      .replace(/COMMENT\s+ON\s+TABLE[\s\S]*?;/gi, '')
      .replace(/COMMENT\s+ON\s+COLUMN[\s\S]*?;/gi, '');
  };

  const sql1 = sanitizeForPgMem(fs.readFileSync(path.join(migrationsDir, '001_initial_schema.sql'), 'utf8'));
  const sql2 = sanitizeForPgMem(fs.readFileSync(path.join(migrationsDir, '002_expand_schema.sql'), 'utf8'));
  const sql3 = sanitizeForPgMem(fs.readFileSync(path.join(migrationsDir, '003_auth_schema.sql'), 'utf8'));
  const sql4 = sanitizeForPgMem(fs.readFileSync(path.join(migrationsDir, '004_consultation_booking_schema.sql'), 'utf8'));

  const client = await pool.connect();
  try {
    await client.query(sql1);
    await client.query(sql2);
    await client.query(sql3);
    await client.query(sql4);

    // Apply seed data
    await seedServices(client);
    await seedArticles(client);
    await seedConsultationData(client);
  } finally {
    client.release();
  }

  return { db, pool };
}

// Verification runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      const { pool } = await setupTestDatabase();
      const services = await pool.query('SELECT slug, title FROM services;');
      const articles = await pool.query('SELECT slug, title FROM articles;');
      console.log('Seeded Services:', services.rows.length);
      console.log('Seeded Articles:', articles.rows.length);
      console.log('Setup completed successfully ✓');
    } catch (err) {
      console.error('Setup error:', err);
    }
  })();
}
