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

import { ConsultationRepository, StaleRescheduleSnapshotError } from '../repositories/consultation.repository.js';
import { ConsultationService } from '../services/consultation.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { AuthService } from '../services/auth.service.js';
import { seedConsultationData } from '../database/seeds/003_consultation_seeds.js';
import { seedServices } from '../database/seeds/001_services_seed.js';
import { seedArticles } from '../database/seeds/002_articles_seed.js';
import { generateToken } from '../utils/jwt.js';
import errorHandler from '../middleware/error.middleware.js';
import notFoundHandler from '../middleware/notFound.middleware.js';
import {
  validateBookConsultation,
  validateCancelBooking,
  validateRescheduleBooking,
} from '../validators/consultation.validator.js';
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

      let alreadyRunning = false;
      try {
        const statusRes = spawnSync(pgCtlPath, ['-D', testClusterDir, 'status'], { stdio: 'pipe' });
        if (statusRes.stdout && statusRes.stdout.toString().includes('server is running')) {
          alreadyRunning = true;
        }
      } catch (e) {}

      if (!alreadyRunning) {
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

    app.patch(
      '/api/v1/consultations/:id/cancel',
      testRequireAuth,
      validateCancelBooking,
      asyncHandler(async (req, res) => {
        const updated = await consultationService.cancelConsultation(req.params.id, req.user.id, req.body.reason);
        return ApiResponse.success(res, updated, 'Consultation cancelled successfully.');
      })
    );

    app.patch(
      '/api/v1/consultations/:id/reschedule',
      testRequireAuth,
      validateRescheduleBooking,
      asyncHandler(async (req, res) => {
        const updated = await consultationService.rescheduleConsultation(
          req.params.id,
          req.user.id,
          req.body.new_slot_start,
          req.body.timezone
        );
        return ApiResponse.success(res, updated, 'Consultation rescheduled successfully.');
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

  it('REAL PG CONCURRENCY 1: should handle two concurrent reschedules of the same booking to different target dates', async () => {
    // Book initial booking on Day 40
    const d1 = new Date();
    d1.setDate(d1.getDate() + 40);
    if (d1.getDay() === 0) d1.setDate(d1.getDate() + 1);
    const date1Str = d1.toISOString().split('T')[0];
    const initialSlot = `${date1Str}T10:00:00+05:30`;

    const bookRes = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user1Cookie)
      .send({ type_id: testType.id, slot_start: initialSlot })
      .expect(201);
    const bookingId = bookRes.body.data.id;

    // Target dates D2 (day 41) and D3 (day 42)
    const d2 = new Date(d1); d2.setDate(d2.getDate() + 1); if (d2.getDay() === 0) d2.setDate(d2.getDate() + 1);
    const d3 = new Date(d2); d3.setDate(d3.getDate() + 1); if (d3.getDay() === 0) d3.setDate(d3.getDate() + 1);
    const targetSlot2 = `${d2.toISOString().split('T')[0]}T10:00:00+05:30`;
    const targetSlot3 = `${d3.toISOString().split('T')[0]}T10:00:00+05:30`;

    // Fire two concurrent reschedules for the same booking
    const [resA, resB] = await Promise.all([
      request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({ new_slot_start: targetSlot2 }),
      request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({ new_slot_start: targetSlot3 }),
    ]);

    // Zero 500 errors, zero 40P01 deadlocks
    assert.ok([200, 409].includes(resA.status), `Unexpected status A: ${resA.status}`);
    assert.ok([200, 409].includes(resB.status), `Unexpected status B: ${resB.status}`);

    // Verify database state: exactly 1 booking exists, status CONFIRMED, slot is either slot 2 or slot 3
    const dbCheck = await realPool.query(
      'SELECT id, slot_start, status FROM consultations WHERE id = $1;',
      [bookingId]
    );
    assert.strictEqual(dbCheck.rows.length, 1);
    assert.strictEqual(dbCheck.rows[0].status, 'CONFIRMED');
    const finalStart = new Date(dbCheck.rows[0].slot_start).toISOString();
    assert.ok(
      finalStart === new Date(targetSlot2).toISOString() || finalStart === new Date(targetSlot3).toISOString(),
      `Final slot must match target 2 or target 3. Got: ${finalStart}`
    );
  });

  it('REAL PG CONCURRENCY 2: should handle reschedule racing with a new booking on the vacated source slot', async () => {
    // Booking on Day 44
    const d1 = new Date();
    d1.setDate(d1.getDate() + 44);
    if (d1.getDay() === 0) d1.setDate(d1.getDate() + 1);
    const date1Str = d1.toISOString().split('T')[0];
    const sourceSlot = `${date1Str}T10:00:00+05:30`;

    const bookRes = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user1Cookie)
      .send({ type_id: testType.id, slot_start: sourceSlot })
      .expect(201);
    const bookingId = bookRes.body.data.id;

    // Target date Day 45
    const d2 = new Date(d1); d2.setDate(d2.getDate() + 1); if (d2.getDay() === 0) d2.setDate(d2.getDate() + 1);
    const targetSlot = `${d2.toISOString().split('T')[0]}T10:00:00+05:30`;

    // Race: User 1 reschedules away from sourceSlot, User 2 tries to book sourceSlot
    const [reschedRes, bookSourceRes] = await Promise.all([
      request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({ new_slot_start: targetSlot }),
      request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({ type_id: testType.id, slot_start: sourceSlot }),
    ]);

    assert.strictEqual(reschedRes.status, 200);
    assert.ok([201, 409].includes(bookSourceRes.status));

    // Verify database state: no duplicate or corrupted bookings on sourceSlot
    const dbSourceCheck = await realPool.query(
      `SELECT count(*) FROM consultations WHERE slot_start = $1 AND status = 'CONFIRMED';`,
      [new Date(sourceSlot)]
    );
    const sourceCount = parseInt(dbSourceCheck.rows[0].count, 10);
    assert.ok(sourceCount <= 1, `Expected at most 1 confirmed booking on sourceSlot, got ${sourceCount}`);
  });

  it('REAL PG CONCURRENCY 3: should enforce mutual exclusion when reschedule races with new booking on target slot', async () => {
    // User 1 has booking on Day 47
    const d1 = new Date();
    d1.setDate(d1.getDate() + 47);
    if (d1.getDay() === 0) d1.setDate(d1.getDate() + 1);
    const date1Str = d1.toISOString().split('T')[0];
    const sourceSlot = `${date1Str}T09:00:00+05:30`;

    const bookRes = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user1Cookie)
      .send({ type_id: testType.id, slot_start: sourceSlot })
      .expect(201);
    const bookingId = bookRes.body.data.id;

    // Target slot on Day 48
    const d2 = new Date(d1); d2.setDate(d2.getDate() + 1); if (d2.getDay() === 0) d2.setDate(d2.getDate() + 1);
    const targetSlot = `${d2.toISOString().split('T')[0]}T14:00:00+05:30`;

    // Race: User 1 reschedules to targetSlot, User 2 books targetSlot
    const [reschedRes, newBookRes] = await Promise.all([
      request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({ new_slot_start: targetSlot }),
      request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({ type_id: testType.id, slot_start: targetSlot }),
    ]);

    const statuses = [reschedRes.status, newBookRes.status].sort();
    assert.deepStrictEqual(
      statuses,
      [reschedRes.status === 200 ? 200 : 201, 409],
      `Expected exactly one success (200 or 201) and one conflict (409). Got [${reschedRes.status}, ${newBookRes.status}]`
    );

    // Verify inside real PostgreSQL: exactly 1 booking exists on targetSlot
    const dbTargetCheck = await realPool.query(
      `SELECT count(*) FROM consultations WHERE slot_start = $1 AND status = 'CONFIRMED';`,
      [new Date(targetSlot)]
    );
    assert.strictEqual(parseInt(dbTargetCheck.rows[0].count, 10), 1);
  });

  it('REAL PG CONCURRENCY 4: should prevent deadlocks when concurrent cross-day reschedules swap dates', async () => {
    // Day 50 and Day 51
    const d1 = new Date(); d1.setDate(d1.getDate() + 50); if (d1.getDay() === 0) d1.setDate(d1.getDate() + 1);
    const d2 = new Date(d1); d2.setDate(d2.getDate() + 1); if (d2.getDay() === 0) d2.setDate(d2.getDate() + 1);
    const slotD1 = `${d1.toISOString().split('T')[0]}T10:00:00+05:30`;
    const slotD2 = `${d2.toISOString().split('T')[0]}T10:00:00+05:30`;

    // User 1 books Day 50
    const res1 = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user1Cookie)
      .send({ type_id: testType.id, slot_start: slotD1 })
      .expect(201);
    const booking1Id = res1.body.data.id;

    // User 2 books Day 51
    const res2 = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user2Cookie)
      .send({ type_id: testType.id, slot_start: slotD2 })
      .expect(201);
    const booking2Id = res2.body.data.id;

    // New slots to swap
    const newSlotFor1 = `${d2.toISOString().split('T')[0]}T11:30:00+05:30`;
    const newSlotFor2 = `${d1.toISOString().split('T')[0]}T11:30:00+05:30`;

    // Swap race: User 1 moves D1 -> D2, User 2 moves D2 -> D1
    const [swap1Res, swap2Res] = await Promise.all([
      request(app)
        .patch(`/api/v1/consultations/${booking1Id}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({ new_slot_start: newSlotFor1 }),
      request(app)
        .patch(`/api/v1/consultations/${booking2Id}/reschedule`)
        .set('Cookie', user2Cookie)
        .send({ new_slot_start: newSlotFor2 }),
    ]);

    // Zero 500 errors, zero 40P01 deadlocks!
    assert.strictEqual(swap1Res.status, 200);
    assert.strictEqual(swap2Res.status, 200);

    const check1 = await realPool.query('SELECT slot_start FROM consultations WHERE id = $1;', [booking1Id]);
    const check2 = await realPool.query('SELECT slot_start FROM consultations WHERE id = $1;', [booking2Id]);
    assert.strictEqual(new Date(check1.rows[0].slot_start).toISOString(), new Date(newSlotFor1).toISOString());
    assert.strictEqual(new Date(check2.rows[0].slot_start).toISOString(), new Date(newSlotFor2).toISOString());
  });

  it('REAL PG CONCURRENCY 5: should handle race between reschedule and cancellation cleanly', async () => {
    // Booking on Day 53
    const d = new Date(); d.setDate(d.getDate() + 53); if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const initialSlot = `${d.toISOString().split('T')[0]}T10:00:00+05:30`;

    const bookRes = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user1Cookie)
      .send({ type_id: testType.id, slot_start: initialSlot })
      .expect(201);
    const bookingId = bookRes.body.data.id;

    const dNext = new Date(d); dNext.setDate(dNext.getDate() + 1); if (dNext.getDay() === 0) dNext.setDate(dNext.getDate() + 1);
    const newSlot = `${dNext.toISOString().split('T')[0]}T10:00:00+05:30`;

    // Race: User 1 calls reschedule and cancel concurrently
    const [reschedRes, cancelRes] = await Promise.all([
      request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({ new_slot_start: newSlot }),
      request(app)
        .patch(`/api/v1/consultations/${bookingId}/cancel`)
        .set('Cookie', user1Cookie)
        .send({ reason: 'Concurrent cancel test' }),
    ]);

    // Neither should crash with 500
    assert.ok([200, 400].includes(reschedRes.status), `Unexpected reschedule status: ${reschedRes.status}`);
    assert.strictEqual(cancelRes.status, 200);

    // Final state in PostgreSQL: booking must be CANCELLED
    const dbFinal = await realPool.query('SELECT status FROM consultations WHERE id = $1;', [bookingId]);
    assert.strictEqual(dbFinal.rows[0].status, 'CANCELLED');
  });

  it('REAL PG CONCURRENCY 6: should exhaust retries and return 409 when stale snapshot persists for MAX_RESCHEDULE_ATTEMPTS', async () => {
    // Booking on Day 55
    const d = new Date(); d.setDate(d.getDate() + 55); if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const initialSlot = `${d.toISOString().split('T')[0]}T10:00:00+05:30`;

    const bookRes = await request(app)
      .post('/api/v1/consultations/book')
      .set('Cookie', user1Cookie)
      .send({ type_id: testType.id, slot_start: initialSlot })
      .expect(201);
    const bookingId = bookRes.body.data.id;

    const dTarget = new Date(d); dTarget.setDate(dTarget.getDate() + 1); if (dTarget.getDay() === 0) dTarget.setDate(dTarget.getDate() + 1);
    const targetSlot = `${dTarget.toISOString().split('T')[0]}T10:00:00+05:30`;

    // Create test simulator that simulates stale snapshot 3 times (exhaustion)
    class TestExhaustionSimulator {
      constructor(attempts = 3) {
        this.attemptsRemaining = attempts;
        this.attemptsExecuted = 0;
      }
      getSimulatedDate(attemptNumber, actualDate) {
        this.attemptsExecuted = attemptNumber;
        if (this.attemptsRemaining > 0) {
          this.attemptsRemaining--;
          return '2099-01-01'; // Force stale mismatch
        }
        return actualDate;
      }
    }

    const simulator = new TestExhaustionSimulator(3);
    const testRepo = new ConsultationRepository(realPool, { staleSnapshotSimulator: simulator });

    // Expect repository to throw ApiError 409 after 3 attempts
    let caughtErr = null;
    try {
      await testRepo.rescheduleBooking({
        id: bookingId,
        userId: user1.id,
        newSlotStart: new Date(targetSlot),
        newSlotEnd: new Date(new Date(targetSlot).getTime() + 60 * 60 * 1000),
      });
    } catch (err) {
      caughtErr = err;
    }

    assert.ok(caughtErr, 'Expected rescheduleBooking to throw on retry exhaustion');
    assert.strictEqual(caughtErr.statusCode, 409);
    assert.ok(caughtErr.message.includes('Unable to reschedule consultation due to concurrent updates'));
    assert.strictEqual(simulator.attemptsExecuted, 3, 'Expected exactly 3 total attempts');

    // Database verification: booking must NOT have moved (rollback verified)
    const dbCheck = await realPool.query('SELECT slot_start, status FROM consultations WHERE id = $1;', [bookingId]);
    assert.strictEqual(new Date(dbCheck.rows[0].slot_start).toISOString(), new Date(initialSlot).toISOString());
    assert.strictEqual(dbCheck.rows[0].status, 'CONFIRMED');
  });

  it('REAL PG CONCURRENCY 7: advisory lock failure in createBookingWithTransaction must abort transaction with no row inserted', async () => {
    const d = new Date(); d.setDate(d.getDate() + 60); if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const slot = `${d.toISOString().split('T')[0]}T10:00:00+05:30`;
    const slotStart = new Date(slot);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    const lockError = new Error('Simulated advisory lock failure');
    lockError.code = 'SIMULATED_LOCK_FAIL';

    // Simulator throws immediately when advisory lock is requested
    const testRepo = new ConsultationRepository(realPool, {
      advisoryLockFailureSimulator: () => { throw lockError; },
    });

    // Count existing bookings for this slot before the attempt
    const before = await realPool.query(
      `SELECT count(*) FROM consultations WHERE slot_start = $1 AND status IN ('CONFIRMED', 'PENDING');`,
      [slotStart]
    );
    const countBefore = parseInt(before.rows[0].count, 10);

    let caughtErr = null;
    try {
      await testRepo.createBookingWithTransaction({
        userId: user1.id,
        consultationTypeId: testType.id,
        fullName: 'Test User',
        email: 'locktest@example.com',
        phone: '',
        pillarInterest: 'General Sanctuary Guidance',
        goals: 'Advisory lock failure test',
        slotStart,
        slotEnd,
        timezone: 'Asia/Kolkata',
      });
    } catch (err) {
      caughtErr = err;
    }

    // 1. Must throw the advisory lock error (not silently swallowed)
    assert.ok(caughtErr, 'Expected createBookingWithTransaction to throw on advisory lock failure');
    assert.strictEqual(caughtErr.code, 'SIMULATED_LOCK_FAIL', `Expected the original lock error; got: ${caughtErr.message}`);

    // 2. Must NOT be a StaleRescheduleSnapshotError — advisory lock failures must not trigger retry logic
    assert.ok(
      !(caughtErr instanceof StaleRescheduleSnapshotError) && !caughtErr.isStaleSnapshot,
      'Advisory lock failure must NOT be classified as a stale snapshot error'
    );

    // 3. No booking row must have been inserted (transaction rolled back)
    const after = await realPool.query(
      `SELECT count(*) FROM consultations WHERE slot_start = $1 AND status IN ('CONFIRMED', 'PENDING');`,
      [slotStart]
    );
    const countAfter = parseInt(after.rows[0].count, 10);
    assert.strictEqual(countAfter, countBefore, `Expected no new booking row; found ${countAfter - countBefore} extra`);
  });

  it('REAL PG CONCURRENCY 8: advisory lock failure in rescheduleBooking must abort transaction with slot unchanged and no retry', async () => {
    const d = new Date(); d.setDate(d.getDate() + 62); if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const initialSlot = `${d.toISOString().split('T')[0]}T10:00:00+05:30`;
    const initialStart = new Date(initialSlot);
    const initialEnd = new Date(initialStart.getTime() + 60 * 60 * 1000);

    // Book initial slot with normal repo
    const normalRepo = new ConsultationRepository(realPool);
    const { booking } = await normalRepo.createBookingWithTransaction({
      userId: user1.id,
      consultationTypeId: testType.id,
      fullName: 'Lock Test User',
      email: 'reschedlock@example.com',
      phone: '',
      pillarInterest: 'General Sanctuary Guidance',
      goals: 'Reschedule advisory lock failure test',
      slotStart: initialStart,
      slotEnd: initialEnd,
      timezone: 'Asia/Kolkata',
    });
    const bookingId = booking.id;

    const dTarget = new Date(d); dTarget.setDate(dTarget.getDate() + 1); if (dTarget.getDay() === 0) dTarget.setDate(dTarget.getDate() + 1);
    const targetSlot = `${dTarget.toISOString().split('T')[0]}T10:00:00+05:30`;
    const newStart = new Date(targetSlot);
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);

    const lockError = new Error('Simulated advisory lock failure in reschedule');
    lockError.code = 'SIMULATED_RESCHEDULE_LOCK_FAIL';

    let lockCallCount = 0;
    const testRepo = new ConsultationRepository(realPool, {
      advisoryLockFailureSimulator: () => {
        lockCallCount++;
        throw lockError;
      },
    });

    let caughtErr = null;
    try {
      await testRepo.rescheduleBooking({
        id: bookingId,
        userId: user1.id,
        newSlotStart: newStart,
        newSlotEnd: newEnd,
      });
    } catch (err) {
      caughtErr = err;
    }

    // 1. Must throw the original advisory lock error
    assert.ok(caughtErr, 'Expected rescheduleBooking to throw on advisory lock failure');
    assert.strictEqual(caughtErr.code, 'SIMULATED_RESCHEDULE_LOCK_FAIL', `Expected original lock error; got: ${caughtErr.message}`);

    // 2. Must NOT be classified as stale snapshot — no retry must have occurred
    assert.ok(
      !(caughtErr instanceof StaleRescheduleSnapshotError) && !caughtErr.isStaleSnapshot,
      'Advisory lock failure must NOT be classified as a stale snapshot error'
    );

    // 3. Only ONE lock attempt must have been made — no retry loop triggered
    assert.strictEqual(lockCallCount, 1, `Expected exactly 1 advisory lock attempt (no retry); got ${lockCallCount}`);

    // 4. Booking slot must be unchanged (rollback verified)
    const dbCheck = await realPool.query('SELECT slot_start, status FROM consultations WHERE id = $1;', [bookingId]);
    assert.strictEqual(dbCheck.rows.length, 1);
    assert.strictEqual(dbCheck.rows[0].status, 'CONFIRMED');
    assert.strictEqual(
      new Date(dbCheck.rows[0].slot_start).toISOString(),
      initialStart.toISOString(),
      'Booking slot must remain unchanged after advisory lock failure rollback'
    );
  });
});
