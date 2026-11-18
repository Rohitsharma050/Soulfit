import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';
import { generateToken, getAuthCookieOptions } from '../utils/jwt.js';

describe('Consultation Booking & Availability API (/api/v1/consultations)', () => {
  let app;
  let pool;
  let userRepo;
  let consultationRepo;
  let user1;
  let user2;
  let user1Cookie;
  let user2Cookie;
  let testTypes;

  before(async () => {
    const testSetup = await createTestApp();
    app = testSetup.app;
    pool = testSetup.pool;
    userRepo = testSetup.repos.userRepo;
    consultationRepo = testSetup.repos.consultationRepo;

    // Create test user 1
    user1 = await userRepo.create({
      name: 'Aarav Patel',
      email: 'aarav@example.com',
      passwordHash: 'hashedpassword123',
      role: 'USER',
      authProvider: 'local',
    });

    // Create test user 2 (for authorization tests)
    user2 = await userRepo.create({
      name: 'Meera Sen',
      email: 'meera@example.com',
      passwordHash: 'hashedpassword456',
      role: 'USER',
      authProvider: 'local',
    });

    const token1 = generateToken({ id: user1.id, email: user1.email, role: user1.role });
    const token2 = generateToken({ id: user2.id, email: user2.email, role: user2.role });

    user1Cookie = `auth_token=${token1}`;
    user2Cookie = `auth_token=${token2}`;

    // Load seeded types
    testTypes = await consultationRepo.getTypes({ isActive: true });
  });

  // Helper to get a valid future weekday date string (YYYY-MM-DD)
  function getFutureWeekday(daysAhead = 10) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    // If Sunday (0), advance to Monday (1)
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  }

  // Helper to format ISO slot
  function makeSlot(dateStr, timeStr) {
    return `${dateStr}T${timeStr}:00+05:30`;
  }

  describe('1. Consultation Types & Public Availability', () => {
    it('GET /types - should retrieve active consultation types with duration and buffer', async () => {
      const res = await request(app)
        .get('/api/v1/consultations/types')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 5);

      const yoga = res.body.data.find((t) => t.slug === 'yoga-wellness');
      assert.ok(yoga);
      assert.strictEqual(yoga.duration_minutes, 60);
      assert.strictEqual(yoga.buffer_minutes, 15);
      assert.strictEqual(yoga.is_active, true);
    });

    it('GET /availability/dates - should return future available dates for a month', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthStr = nextMonth.toISOString().slice(0, 7); // YYYY-MM

      const res = await request(app)
        .get(`/api/v1/consultations/availability/dates?type_id=${yogaType.id}&month=${monthStr}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.availableDates));
      assert.ok(res.body.data.availableDates.length > 0);
    });

    it('GET /availability - should return available time slots excluding breaks and closed days', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(7);

      const res = await request(app)
        .get(`/api/v1/consultations/availability?type_id=${yogaType.id}&date=${testDate}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.date, testDate);
      assert.ok(Array.isArray(res.body.data.slots));
      assert.ok(res.body.data.slots.length > 0);

      // Verify no slot falls within lunch break (13:00 - 14:00)
      for (const slot of res.body.data.slots) {
        const start = new Date(slot.slotStart);
        const startHours = start.getUTCHours() + start.getUTCMinutes() / 60 + 5.5; // IST decimal hours
        assert.ok(
          !(startHours >= 13 && startHours < 14),
          `Slot ${slot.formattedTime} must not start during 13:00-14:00 break (got ${startHours})`
        );
      }
    });

    it('GET /availability - should return empty slots for inactive days (Sunday)', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      // Find upcoming Sunday
      const d = new Date();
      d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
      const sundayStr = d.toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/v1/consultations/availability?type_id=${yogaType.id}&date=${sundayStr}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.slots.length, 0);
      assert.strictEqual(res.body.data.isAvailable, false);
    });
  });

  describe('2. Booking Transactions & Concurrency Safety', () => {
    it('POST /book - should reject unauthenticated booking request with 401', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(5);
      const slotStart = makeSlot(testDate, '10:00');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(401);

      assert.strictEqual(res.body.success, false);
    });

    it('POST /book - should reject booking request for a time in the past with 400', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const pastSlot = '2020-01-01T10:00:00+05:30';

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: pastSlot,
        })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('past'));
    });

    it('POST /book - should successfully book a consultation and generate unique booking reference', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(12);
      const slotStart = makeSlot(testDate, '10:00');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
          goals: 'Restore spinal mobility and manage desk fatigue',
          notes: 'Prefer gentle restorative stretches',
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
      assert.ok(res.body.data.booking_reference.startsWith('HP-'));
      assert.strictEqual(res.body.data.status, 'CONFIRMED');
      assert.strictEqual(res.body.data.user_id, user1.id);
      assert.strictEqual(res.body.data.email, user1.email);
    });

    it('POST /book - should reject double booking of the same slot with 409 Conflict', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(14);
      const slotStart = makeSlot(testDate, '11:00');

      // First user books the slot
      await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(201);

      // Second user attempts to book the exact same slot
      const conflictRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(409);

      assert.strictEqual(conflictRes.body.success, false);
      assert.ok(conflictRes.body.message.includes('already been booked'));
    });

    it('POST /book - should reject overlapping bookings with different durations', async () => {
      const vastuType = testTypes.find((t) => t.slug === 'vastu-architecture'); // 60 min
      const astrologyType = testTypes.find((t) => t.slug === 'astrology-cosmic'); // 45 min
      const testDate = getFutureWeekday(16);

      // User 1 books 14:00 to 15:00 (Vastu - 60 min)
      await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: vastuType.id,
          slot_start: makeSlot(testDate, '14:00'),
        })
        .expect(201);

      // User 2 attempts to book 14:30 to 15:15 (Astrology - 45 min) which overlaps 14:00-15:00
      const overlapRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({
          type_id: astrologyType.id,
          slot_start: makeSlot(testDate, '14:30'),
        })
        .expect(409);

      assert.strictEqual(overlapRes.body.success, false);
      assert.ok(overlapRes.body.message.includes('already been booked'));
    });

    it('POST /book - should support idempotency keys to safely return previous booking without duplication', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(18);
      const slotStart = makeSlot(testDate, '09:00');
      const idempotencyKey = 'idemp_key_' + Date.now();

      // First call
      const firstRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
          idempotency_key: idempotencyKey,
        })
        .expect(201);

      const bookingId = firstRes.body.data.id;

      // Duplicate retry call with same idempotency key
      const replayRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
          idempotency_key: idempotencyKey,
        })
        .expect(200);

      assert.strictEqual(replayRes.body.success, true);
      assert.strictEqual(replayRes.body.data.id, bookingId);
      assert.ok(replayRes.body.message.includes('previously confirmed'));
    });
  });

  describe('3. Multi-Tenant Authorization & Consultation History', () => {
    let user1BookingId;
    let user2BookingId;

    before(async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(20);

      // Book for user 1
      const res1 = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: makeSlot(testDate, '09:00'),
        });
      user1BookingId = res1.body.data.id;

      // Book for user 2
      const res2 = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: makeSlot(testDate, '10:15'),
        });
      user2BookingId = res2.body.data.id;
    });

    it('GET /my - should return only consultations belonging to the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/consultations/my?status=all')
        .set('Cookie', user1Cookie)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      for (const booking of res.body.data) {
        assert.strictEqual(booking.user_id, user1.id);
      }
    });

    it('GET /:id - should allow user to view their own consultation', async () => {
      const res = await request(app)
        .get(`/api/v1/consultations/${user1BookingId}`)
        .set('Cookie', user1Cookie)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.id, user1BookingId);
    });

    it('GET /:id - should forbid user from accessing another user consultation with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/consultations/${user2BookingId}`)
        .set('Cookie', user1Cookie)
        .expect(403);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('authorization'));
    });

    it('PATCH /:id/cancel - should forbid user from cancelling another user consultation with 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/consultations/${user2BookingId}/cancel`)
        .set('Cookie', user1Cookie)
        .send({ reason: 'Malicious cancellation attempt' })
        .expect(403);

      assert.strictEqual(res.body.success, false);
    });

    it('PATCH /:id/reschedule - should forbid user from rescheduling another user consultation with 403', async () => {
      const newSlot = makeSlot(getFutureWeekday(22), '09:00');
      const res = await request(app)
        .patch(`/api/v1/consultations/${user2BookingId}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({ new_slot_start: newSlot })
        .expect(403);

      assert.strictEqual(res.body.success, false);
    });
  });

  describe('4. Cancellation, Rescheduling & Slot Release', () => {
    it('PATCH /:id/cancel - should successfully cancel a booking and release the slot', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(24);
      const slotStart = makeSlot(testDate, '10:00');

      // User 1 books slot
      const bookRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(201);

      const bookingId = bookRes.body.data.id;

      // User 1 cancels booking
      const cancelRes = await request(app)
        .patch(`/api/v1/consultations/${bookingId}/cancel`)
        .set('Cookie', user1Cookie)
        .send({ reason: 'Schedule conflict with travel' })
        .expect(200);

      assert.strictEqual(cancelRes.body.success, true);
      assert.strictEqual(cancelRes.body.data.status, 'CANCELLED');
      assert.strictEqual(cancelRes.body.data.cancellation_reason, 'Schedule conflict with travel');

      // Now user 2 should be able to book the exact same slot that was released!
      const rebookRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(201);

      assert.strictEqual(rebookRes.body.success, true);
      assert.strictEqual(rebookRes.body.data.user_id, user2.id);
    });

    it('PATCH /:id/reschedule - should reschedule consultation to a new slot atomically', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate1 = getFutureWeekday(25);
      const testDate2 = getFutureWeekday(26);
      const oldSlot = makeSlot(testDate1, '10:00');
      const newSlot = makeSlot(testDate2, '11:15');

      // Book original slot
      const bookRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: oldSlot,
        })
        .expect(201);

      const bookingId = bookRes.body.data.id;

      // Reschedule to newSlot
      const reschedRes = await request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', user1Cookie)
        .send({
          new_slot_start: newSlot,
        })
        .expect(200);

      assert.strictEqual(reschedRes.body.success, true);
      const updatedStart = new Date(reschedRes.body.data.slot_start).toISOString();
      assert.strictEqual(updatedStart, new Date(newSlot).toISOString());

      // Verify that oldSlot is now released and free for another user to book!
      const takeOldSlotRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user2Cookie)
        .send({
          type_id: yogaType.id,
          slot_start: oldSlot,
        })
        .expect(201);

      assert.strictEqual(takeOldSlotRes.body.success, true);
    });

    it('PATCH /:id/cancel - should reject cancelling an already cancelled booking', async () => {
      const yogaType = testTypes.find((t) => t.slug === 'yoga-wellness');
      const testDate = getFutureWeekday(27);
      const slotStart = makeSlot(testDate, '10:00');

      const bookRes = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', user1Cookie)
        .send({ type_id: yogaType.id, slot_start: slotStart })
        .expect(201);

      const bookingId = bookRes.body.data.id;

      // Cancel once
      await request(app)
        .patch(`/api/v1/consultations/${bookingId}/cancel`)
        .set('Cookie', user1Cookie)
        .send({ reason: 'Initial cancel' })
        .expect(200);

      // Cancel again -> should fail with 400
      const secondCancel = await request(app)
        .patch(`/api/v1/consultations/${bookingId}/cancel`)
        .set('Cookie', user1Cookie)
        .send({ reason: 'Duplicate cancel attempt' })
        .expect(400);

      assert.strictEqual(secondCancel.body.success, false);
      assert.ok(secondCancel.body.message.includes('already cancelled'));
    });
  });
});
