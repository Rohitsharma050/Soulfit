/**
 * Phase 3.4.2.2 — Consultation Repository Safety Tests
 *
 * Covers:
 *   1. prismaAdapter.$executeRaw — selective error propagation
 *   2. rescheduleBooking — strict StaleRescheduleSnapshotError-only retry
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { createPrismaPgAdapter } from '../config/prismaAdapter.js';
import {
  ConsultationRepository,
  StaleRescheduleSnapshotError,
  MAX_RESCHEDULE_ATTEMPTS,
} from '../repositories/consultation.repository.js';
import { setupTestDatabase } from './setupTestDb.js';
import { UserRepository } from '../repositories/user.repository.js';

// ---------------------------------------------------------------------------
// Suite 1 — prismaAdapter.$executeRaw selective error propagation
// ---------------------------------------------------------------------------
describe('prismaAdapter.$executeRaw — selective error propagation', () => {
  let pool;

  before(async () => {
    const setup = await setupTestDatabase();
    pool = setup.pool;
  });

  it('should silently swallow pg_advisory_xact_lock errors (pg-mem compat)', async () => {
    const adapter = createPrismaPgAdapter(pool);
    // pg-mem does not support pg_advisory_xact_lock; must return 1 without throwing
    const result = await adapter.$executeRaw(
      Object.assign(['SELECT pg_advisory_xact_lock(hashtext($', '));'], { raw: ['SELECT pg_advisory_xact_lock(hashtext($', '));'] }),
      'booking_day_2026-01-01'
    );
    assert.strictEqual(result, 1, 'Expected silent no-op (return 1) for advisory lock call');
  });

  it('should re-throw errors from unrelated $executeRaw failures', async () => {
    const adapter = createPrismaPgAdapter(pool);
    // Execute SQL that is syntactically invalid / references non-existent table
    let caughtErr = null;
    try {
      // Use a tagged template literal calling a non-existent function
      await adapter.$executeRaw(
        Object.assign(['SELECT no_such_function_xyz()'], { raw: ['SELECT no_such_function_xyz()'] })
      );
    } catch (err) {
      caughtErr = err;
    }
    assert.ok(caughtErr, 'Expected $executeRaw to re-throw errors unrelated to advisory locks');
    // Must NOT silently return 1
    assert.ok(
      caughtErr.message || caughtErr.code,
      'Caught error must carry a message or code — not a silent success'
    );
  });

  it('should NOT swallow a DML error on a real table (e.g. NOT NULL violation)', async () => {
    const adapter = createPrismaPgAdapter(pool);
    let caughtErr = null;
    try {
      // Attempt to insert NULL into a NOT NULL column (email is required in subscribers)
      await adapter.$executeRaw(
        Object.assign(["INSERT INTO subscribers (email, consent) VALUES (NULL, true)"], {
          raw: ["INSERT INTO subscribers (email, consent) VALUES (NULL, true)"],
        })
      );
    } catch (err) {
      caughtErr = err;
    }
    assert.ok(caughtErr, 'Expected $executeRaw to re-throw NOT NULL constraint violations');
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — rescheduleBooking retry gating: only StaleRescheduleSnapshotError
// ---------------------------------------------------------------------------
describe('rescheduleBooking retry — only StaleRescheduleSnapshotError triggers retry', () => {
  let pool;
  let userRepo;
  let testUser;
  let testType;

  before(async () => {
    const setup = await setupTestDatabase();
    pool = setup.pool;
    userRepo = new UserRepository(pool);
    testUser = await userRepo.create({
      name: 'Retry Test User',
      email: 'retrytest@example.com',
      passwordHash: 'hashed',
      role: 'USER',
      authProvider: 'local',
    });
    const normalRepo = new ConsultationRepository(pool);
    const types = await normalRepo.getTypes({ isActive: true });
    testType = types[0];
  });

  /**
   * Books a slot via a fresh ConsultationRepository and returns the booking.
   */
  async function bookSlot(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const dateStr = d.toISOString().split('T')[0];
    const slotStart = new Date(`${dateStr}T10:00:00+05:30`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    const repo = new ConsultationRepository(pool);
    const { booking } = await repo.createBookingWithTransaction({
      userId: testUser.id,
      consultationTypeId: testType.id,
      fullName: testUser.name,
      email: testUser.email,
      phone: '',
      pillarInterest: 'General Sanctuary Guidance',
      goals: null,
      slotStart,
      slotEnd,
      timezone: 'Asia/Kolkata',
    });
    return { booking, slotStart, slotEnd };
  }

  it('should NOT retry when an unrelated error carries isStaleSnapshot = true', async () => {
    const { booking, slotStart } = await bookSlot(20);

    const targetDate = new Date(slotStart);
    targetDate.setDate(targetDate.getDate() + 1);
    if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
    const newStart = new Date(`${targetDate.toISOString().split('T')[0]}T10:00:00+05:30`);
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);

    // This plain Error has isStaleSnapshot = true but is NOT a StaleRescheduleSnapshotError instance.
    // Under the old broad check it would trigger retry; under the new strict check it must not.
    const impostor = new Error('Impostor error with isStaleSnapshot flag');
    impostor.isStaleSnapshot = true;

    let transactionAttempts = 0;

    // We inject a stale snapshot simulator that throws the impostor error on attempt 1
    // and would return a non-stale date on attempt 2 (should never reach attempt 2).
    const simulator = {
      getSimulatedDate(attemptNumber, actualDate) {
        transactionAttempts = attemptNumber;
        // Throw the impostor error (not a StaleRescheduleSnapshotError) on first attempt
        if (attemptNumber === 1) {
          throw impostor;
        }
        return actualDate;
      },
    };

    const testRepo = new ConsultationRepository(pool, { staleSnapshotSimulator: simulator });

    let caughtErr = null;
    try {
      await testRepo.rescheduleBooking({
        id: booking.id,
        userId: testUser.id,
        newSlotStart: newStart,
        newSlotEnd: newEnd,
      });
    } catch (err) {
      caughtErr = err;
    }

    // 1. Must have thrown
    assert.ok(caughtErr, 'Expected rescheduleBooking to throw the impostor error');

    // 2. Must be the original impostor (propagated immediately, not wrapped)
    assert.strictEqual(
      caughtErr,
      impostor,
      'Expected the original impostor error to propagate unchanged'
    );

    // 3. Only ONE transaction attempt — no retry occurred
    assert.strictEqual(
      transactionAttempts,
      1,
      `Expected exactly 1 transaction attempt (no retry for impostor); got ${transactionAttempts}`
    );
  });

  it('should still retry exactly MAX_RESCHEDULE_ATTEMPTS times for a real StaleRescheduleSnapshotError', async () => {
    const { booking, slotStart } = await bookSlot(25);

    const targetDate = new Date(slotStart);
    targetDate.setDate(targetDate.getDate() + 1);
    if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
    const newStart = new Date(`${targetDate.toISOString().split('T')[0]}T10:00:00+05:30`);
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);

    let transactionAttempts = 0;

    // Always return a stale date to exhaust all 3 attempts
    const simulator = {
      getSimulatedDate(attemptNumber, _actualDate) {
        transactionAttempts = attemptNumber;
        return '2099-01-01'; // Always stale
      },
    };

    const testRepo = new ConsultationRepository(pool, { staleSnapshotSimulator: simulator });

    let caughtErr = null;
    try {
      await testRepo.rescheduleBooking({
        id: booking.id,
        userId: testUser.id,
        newSlotStart: newStart,
        newSlotEnd: newEnd,
      });
    } catch (err) {
      caughtErr = err;
    }

    // 1. Must have thrown a 409 conflict
    assert.ok(caughtErr, 'Expected rescheduleBooking to throw on retry exhaustion');
    assert.strictEqual(caughtErr.statusCode, 409);

    // 2. Exactly MAX_RESCHEDULE_ATTEMPTS (3) transactions attempted
    assert.strictEqual(
      transactionAttempts,
      MAX_RESCHEDULE_ATTEMPTS,
      `Expected exactly ${MAX_RESCHEDULE_ATTEMPTS} attempts; got ${transactionAttempts}`
    );
  });

  it('should NOT retry when a Prisma-style error (non-stale) is thrown inside the transaction', async () => {
    const { booking, slotStart } = await bookSlot(30);

    const targetDate = new Date(slotStart);
    targetDate.setDate(targetDate.getDate() + 1);
    if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
    const newStart = new Date(`${targetDate.toISOString().split('T')[0]}T10:00:00+05:30`);
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);

    const dbError = new Error('connection terminated unexpectedly');
    dbError.code = 'ECONNRESET';

    let transactionAttempts = 0;
    const simulator = {
      getSimulatedDate(attemptNumber, _actualDate) {
        transactionAttempts = attemptNumber;
        throw dbError; // Throw a non-stale-snapshot error
      },
    };

    const testRepo = new ConsultationRepository(pool, { staleSnapshotSimulator: simulator });

    let caughtErr = null;
    try {
      await testRepo.rescheduleBooking({
        id: booking.id,
        userId: testUser.id,
        newSlotStart: newStart,
        newSlotEnd: newEnd,
      });
    } catch (err) {
      caughtErr = err;
    }

    assert.ok(caughtErr, 'Expected error to propagate');
    assert.strictEqual(caughtErr, dbError, 'Expected original db error to propagate unchanged');
    assert.strictEqual(transactionAttempts, 1, `Expected no retry; got ${transactionAttempts} attempts`);
  });
});
