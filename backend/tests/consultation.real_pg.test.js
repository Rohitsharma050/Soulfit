import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import pg from 'pg';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { fileURLToPath } from 'url';

import { ConsultationRepository } from '../repositories/consultation.repository.js';
import { ConsultationService } from '../services/consultation.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { AuthService } from '../services/auth.service.js';
import { seedConsultationData } from '../database/seeds/003_consultation_seeds.js';
import { seedServices } from '../database/seeds/001_services_seed.js';
import { seedArticles } from '../database/seeds/002_articles_seed.js';
import { generateToken } from '../utils/jwt.js';
import errorHandler from '../middleware/error.middleware.js';
import notFoundHandler from '../middleware/notFound.middleware.js';
import { validateBookConsultation } from '../validators/consultation.validator.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractToken, sanitizeUser } from '../middleware/auth.middleware.js';
import { ApiError } from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

describe('REAL PostgreSQL Concurrency & Transaction Row-Locking Tests', () => {
  const PG_PORT = 5433;
  const PG_USER = 'postgres';
  const PG_DB = 'harmony_real_concurrency_test';
  const testClusterDir = path.join(os.tmpdir(), 'harmony_real_pg_cluster');
  const pgBinDir = 'C:\\Program Files\\PostgreSQL\\18\\bin';
  const initDbPath = path.join(pgBinDir, 'initdb.exe');
  const pgCtlPath = path.join(pgBinDir, 'pg_ctl.exe');

  let realPool;
  let serverProcessStarted = false;
  let app;
  let user1;
  let user2;
  let user1Cookie;
  let user2Cookie;
  let testType;

  before(async () => {
    // 1. Initialize & Start Ephemeral Real PostgreSQL 18 instance if pg_ctl exists
    if (fs.existsSync(initDbPath) && fs.existsSync(pgCtlPath)) {
      if (!fs.existsSync(testClusterDir)) {
        console.log('[REAL PG TEST] Initializing real PostgreSQL 18 cluster at:', testClusterDir);
        execSync(`"${initDbPath}" -D "${testClusterDir}" -U ${PG_USER} -A trust --no-locale -E UTF8`, {
          stdio: 'pipe',
        });
      }

      console.log('[REAL PG TEST] Starting real PostgreSQL 18 on port', PG_PORT);
      try {
        spawnSync(pgCtlPath, ['-D', testClusterDir, '-l', 'nul', '-o', `-p ${PG_PORT}`, '-w', 'start'], {
          stdio: 'ignore',
          windowsHide: true,
        });
        serverProcessStarted = true;
      } catch (e) {
        // May already be running from a previous check
      }

      // Wait 1.5 seconds for socket ready
      await new Promise((r) => setTimeout(r, 1500));
    }

    // 2. Connect to postgres database and create test database
    const adminClient = new pg.Client({
      host: '127.0.0.1',
      port: PG_PORT,
      user: PG_USER,
      database: 'postgres',
    });

    await adminClient.connect();
    await adminClient.query(`DROP DATABASE IF EXISTS ${PG_DB};`);
    await adminClient.query(`CREATE DATABASE ${PG_DB};`);
    await adminClient.end();

    // 3. Connect Pool to the dedicated test database
    realPool = new pg.Pool({
      host: '127.0.0.1',
      port: PG_PORT,
      user: PG_USER,
      database: PG_DB,
      max: 20,
    });

    // 4. Run real SQL migrations in order
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_expand_schema.sql',
      '003_auth_schema.sql',
      '004_consultation_booking_schema.sql',
    ];

    const migrationClient = await realPool.connect();
    try {
      for (const mFile of migrationFiles) {
        const sql = fs.readFileSync(path.join(migrationsDir, mFile), 'utf8');
        await migrationClient.query(sql);
      }

      // Seed real database
      await seedServices(migrationClient);
      await seedArticles(migrationClient);
      await seedConsultationData(migrationClient);
    } finally {
      migrationClient.release();
    }

    console.log('[REAL PG TEST] Real PostgreSQL 18 migrations and seeds applied successfully ✓');

    // 5. Build minimal express app with real Pool
    const userRepo = new UserRepository(realPool);
    const consultationRepo = new ConsultationRepository(realPool);
    const consultationService = new ConsultationService(consultationRepo);

    // Create real test users
    user1 = await userRepo.create({
      name: 'Rohan Verma',
      email: 'rohan.real@example.com',
      passwordHash: 'hashed123',
      role: 'USER',
      authProvider: 'local',
    });

    user2 = await userRepo.create({
      name: 'Pooja Iyer',
      email: 'pooja.real@example.com',
      passwordHash: 'hashed456',
      role: 'USER',
      authProvider: 'local',
    });

    const token1 = generateToken({ id: user1.id, email: user1.email, role: user1.role });
    const token2 = generateToken({ id: user2.id, email: user2.email, role: user2.role });

    user1Cookie = `auth_token=${token1}`;
    user2Cookie = `auth_token=${token2}`;

    const types = await consultationRepo.getTypes({ isActive: true });
    testType = types[0];

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    const testRequireAuth = async (req, res, next) => {
      try {
        const token = extractToken(req);
        if (!token) throw new ApiError(401, 'Auth required');
        const user = token === token1 ? user1 : user2;
        req.user = sanitizeUser(user);
        next();
      } catch (err) {
        next(err);
      }
    };

    app.post(
      '/api/v1/consultations/book',
      testRequireAuth,
      validateBookConsultation,
      asyncHandler(async (req, res) => {
        const result = await consultationService.bookConsultation({
          user: req.user,
          typeId: req.body.type_id,
          slotStart: req.body.slot_start,
          goals: req.body.goals,
          notes: req.body.notes,
          phone: req.body.phone,
          idempotencyKey: req.body.idempotency_key,
          timeZone: req.body.timezone || 'Asia/Kolkata',
        });
        return ApiResponse.success(res, result.consultation, result.message, result.idempotentReplay ? 200 : 201);
      })
    );

    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  after(async () => {
    if (realPool) {
      await realPool.end();
    }
    if (serverProcessStarted && fs.existsSync(pgCtlPath)) {
      try {
        console.log('[REAL PG TEST] Stopping real PostgreSQL 18 test server...');
        spawnSync(pgCtlPath, ['-D', testClusterDir, '-m', 'fast', 'stop'], {
          stdio: 'ignore',
          windowsHide: true,
        });
      } catch (e) {}
    }
  });

  it('REAL PG: should execute simultaneous concurrent booking race condition with mutual exclusion', async () => {
    // Target slot in the future
    const d = new Date();
    d.setDate(d.getDate() + 35);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // skip Sunday
    const dateStr = d.toISOString().split('T')[0];
    const targetSlot = `${dateStr}T10:00:00+05:30`;

    // Fire 2 concurrent HTTP requests at the exact same millisecond using real PostgreSQL transactions
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: testType.id,
          slot_start: targetSlot,
          goals: 'Concurrent Request A',
        }),
      request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({
          type_id: testType.id,
          slot_start: targetSlot,
          goals: 'Concurrent Request B',
        }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    assert.deepStrictEqual(
      statuses,
      [201, 409],
      `Expected exactly one 201 Created and one 409 Conflict under real concurrency. Got [${resA.status}, ${resB.status}]`
    );

    const winner = resA.status === 201 ? resA.body.data : resB.body.data;
    const loser = resA.status === 409 ? resA.body : resB.body;

    assert.ok(winner.id);
    assert.ok(winner.booking_reference.startsWith('HP-'));
    assert.ok(loser.message.includes('already been booked'));

    // Verify inside real PostgreSQL that ONLY 1 record exists for that slot
    const checkQuery = await realPool.query(
      `SELECT count(*) FROM consultations
       WHERE slot_start = $1 AND status = 'CONFIRMED';`,
      [new Date(targetSlot)]
    );
    assert.strictEqual(parseInt(checkQuery.rows[0].count, 10), 1);
  });

  it('REAL PG: should prevent overlapping appointments with different durations in real PostgreSQL', async () => {
    const typesRes = await realPool.query(
      `SELECT id, slug, duration_minutes FROM consultation_types WHERE slug IN ('vastu-architecture', 'astrology-cosmic') ORDER BY duration_minutes DESC;`
    );
    const vastu = typesRes.rows[0]; // 60 min
    const astrology = typesRes.rows[1]; // 45 min

    const d = new Date();
    d.setDate(d.getDate() + 36);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const dateStr = d.toISOString().split('T')[0];

    // First booking: 11:00 to 12:00
    const slot1 = `${dateStr}T11:00:00+05:30`;
    const res1 = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user1Cookie)
      .send({
        type_id: vastu.id,
        slot_start: slot1,
      })
      .expect(201);

    assert.strictEqual(res1.body.success, true);

    // Second booking: 11:30 (overlaps with 11:00-12:00)
    const slot2 = `${dateStr}T11:30:00+05:30`;
    const res2 = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user2Cookie)
      .send({
        type_id: astrology.id,
        slot_start: slot2,
      })
      .expect(409);

    assert.strictEqual(res2.body.success, false);
    assert.ok(res2.body.message.includes('already been booked'));
  });
});
