/**
 * Phase 3.4.3 — Server-Side Consultation Slot Validation Tests
 *
 * Verifies:
 *   1. Valid 09:00–10:00 IST slot.
 *   2. Slot ending exactly at closing time (18:00 weekday, 17:00 Saturday).
 *   3. Slot starting before opening time (e.g. 08:30 IST).
 *   4. Slot ending after closing time (e.g. 17:30 on Saturday).
 *   5. Slot crossing IST midnight (e.g. 23:30 to 00:30 next day).
 *   6. Slot whose UTC date differs from its IST date.
 *   7. Slot with different client-supplied timezone offset representing same instant.
 *   8. Direct validation tests for invalid / reversed start/end timestamps and duration mismatch.
 *   9. Rescheduling requests violating the same rules.
 *  10. Verification that server timezone (UTC) does not alter validation results.
 *  11. Evidence that invalid requests never reach repository write methods.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';
import { generateToken } from '../utils/jwt.js';
import {
  ConsultationService,
  getSanctuaryDateTimeParts,
  formatMinutesToTimeStr,
  SANCTUARY_TIMEZONE,
} from '../services/consultation.service.js';
import { ApiError } from '../utils/ApiError.js';

describe('Phase 3.4.3 — Server-Side Slot Validation & Operating Hours Tests', () => {
  let app;
  let pool;
  let userRepo;
  let consultationRepo;
  let consultationService;
  let testUser;
  let userCookie;
  let yogaType; // 60 min
  let astrologyType; // 45 min

  // Helper: target specific future day of week (1=Mon, 2=Tue, 5=Fri, 6=Sat, 0=Sun)
  function getFutureDate(dayOfWeekTarget = 2, weeksAhead = 2) {
    const d = new Date();
    d.setDate(d.getDate() + weeksAhead * 7);
    const currentDay = d.getDay();
    const diff = (dayOfWeekTarget - currentDay + 7) % 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }

  function makeSlot(dateStr, timeStr) {
    return `${dateStr}T${timeStr}:00+05:30`;
  }

  before(async () => {
    const testSetup = await createTestApp();
    app = testSetup.app;
    pool = testSetup.pool;
    userRepo = testSetup.repos.userRepo;
    consultationRepo = testSetup.repos.consultationRepo;
    consultationService = new ConsultationService(consultationRepo);

    testUser = await userRepo.create({
      name: 'Slot Validation Tester',
      email: 'slot_validator@example.com',
      passwordHash: 'hashedpassword123',
      role: 'USER',
      authProvider: 'local',
    });

    const token = generateToken({ id: testUser.id, email: testUser.email, role: testUser.role });
    userCookie = `auth_token=${token}`;

    const types = await consultationRepo.getTypes({ isActive: true });
    yogaType = types.find((t) => t.slug === 'yoga-wellness'); // 60 min
    astrologyType = types.find((t) => t.slug === 'astrology-cosmic'); // 45 min
  });

  describe('1. Direct Service-Level Slot Validation Unit Tests', () => {
    it('should validate and approve a valid 09:00-10:00 IST weekday slot', async () => {
      const weekday = getFutureDate(2, 3); // Tuesday
      const start = new Date(`${weekday}T09:00:00+05:30`);
      const end = new Date(`${weekday}T10:00:00+05:30`);

      const isValid = await consultationService.validateSlotWithinSanctuaryRules({
        start,
        end,
        consultationType: yogaType,
      });
      assert.strictEqual(isValid, true);
    });

    it('should approve a slot ending exactly at weekday closing time (17:00-18:00 IST)', async () => {
      const weekday = getFutureDate(3, 3); // Wednesday (closes at 18:00)
      const start = new Date(`${weekday}T17:00:00+05:30`);
      const end = new Date(`${weekday}T18:00:00+05:30`);

      const isValid = await consultationService.validateSlotWithinSanctuaryRules({
        start,
        end,
        consultationType: yogaType,
      });
      assert.strictEqual(isValid, true);
    });

    it('should approve a slot ending exactly at Saturday closing time (16:00-17:00 IST)', async () => {
      const saturday = getFutureDate(6, 3); // Saturday (closes at 17:00)
      const start = new Date(`${saturday}T16:00:00+05:30`);
      const end = new Date(`${saturday}T17:00:00+05:30`);

      const isValid = await consultationService.validateSlotWithinSanctuaryRules({
        start,
        end,
        consultationType: yogaType,
      });
      assert.strictEqual(isValid, true);
    });

    it('should reject a slot starting before opening time (08:30 IST) with 400', async () => {
      const weekday = getFutureDate(4, 3); // Thursday
      const start = new Date(`${weekday}T08:30:00+05:30`);
      const end = new Date(`${weekday}T09:30:00+05:30`);

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start,
            end,
            consultationType: yogaType,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('earlier than sanctuary opening time'));
          return true;
        }
      );
    });

    it('should reject a slot ending after closing time on weekday (17:30-18:30 IST) with 400', async () => {
      const weekday = getFutureDate(5, 3); // Friday (closes at 18:00)
      const start = new Date(`${weekday}T17:30:00+05:30`);
      const end = new Date(`${weekday}T18:30:00+05:30`);

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start,
            end,
            consultationType: yogaType,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('later than sanctuary closing time'));
          return true;
        }
      );
    });

    it('should reject a slot ending after Saturday closing time (16:30-17:30 IST) with 400', async () => {
      const saturday = getFutureDate(6, 3); // Saturday (closes at 17:00)
      const start = new Date(`${saturday}T16:30:00+05:30`);
      const end = new Date(`${saturday}T17:30:00+05:30`);

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start,
            end,
            consultationType: yogaType,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('later than sanctuary closing time'));
          return true;
        }
      );
    });

    it('should reject a slot crossing IST midnight (23:30 to 00:30 next day) with 400', async () => {
      const weekday = getFutureDate(1, 3); // Monday
      const nextDay = getFutureDate(2, 3); // Tuesday
      const start = new Date(`${weekday}T23:30:00+05:30`);
      const end = new Date(`${nextDay}T00:30:00+05:30`);

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start,
            end,
            consultationType: yogaType,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('cross calendar day boundaries'));
          return true;
        }
      );
    });

    it('should reject invalid or reversed timestamps (end <= start) with 400', async () => {
      const weekday = getFutureDate(2, 3);
      const start = new Date(`${weekday}T11:00:00+05:30`);
      const reversedEnd = new Date(`${weekday}T10:00:00+05:30`);

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start,
            end: reversedEnd,
            consultationType: yogaType,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('strictly before'));
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start: 'invalid-date',
            end: reversedEnd,
            consultationType: yogaType,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('Invalid'));
          return true;
        }
      );
    });

    it('should reject slot when duration does not match consultation type duration', async () => {
      const weekday = getFutureDate(3, 3);
      // Yoga requires 60 min, but we submit 90 min (10:00 to 11:30)
      const start = new Date(`${weekday}T10:00:00+05:30`);
      const end = new Date(`${weekday}T11:30:00+05:30`);

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start,
            end,
            consultationType: yogaType, // 60 min
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('does not match required duration'));
          return true;
        }
      );
    });

    it('should reject booking on an inactive day (Sunday) with 400', async () => {
      const sunday = getFutureDate(0, 3); // Sunday
      const start = new Date(`${sunday}T10:00:00+05:30`);
      const end = new Date(`${sunday}T11:00:00+05:30`);

      await assert.rejects(
        async () => {
          await consultationService.validateSlotWithinSanctuaryRules({
            start,
            end,
            consultationType: yogaType,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('No scheduled availability'));
          return true;
        }
      );
    });

    it('should verify validation results are completely independent of server local timezone', () => {
      // 09:00 IST on 2026-12-10 is 03:30 UTC on 2026-12-10
      const istInstant = new Date('2026-12-10T09:00:00+05:30');
      const utcInstant = new Date('2026-12-10T03:30:00.000Z');
      const usEasternInstant = new Date('2026-12-09T22:30:00-05:00');

      assert.strictEqual(istInstant.getTime(), utcInstant.getTime());
      assert.strictEqual(utcInstant.getTime(), usEasternInstant.getTime());

      const istParts = getSanctuaryDateTimeParts(istInstant, SANCTUARY_TIMEZONE);
      const utcParts = getSanctuaryDateTimeParts(utcInstant, SANCTUARY_TIMEZONE);
      const usParts = getSanctuaryDateTimeParts(usEasternInstant, SANCTUARY_TIMEZONE);

      assert.deepStrictEqual(istParts, utcParts);
      assert.deepStrictEqual(utcParts, usParts);
      assert.strictEqual(istParts.dateStr, '2026-12-10');
      assert.strictEqual(istParts.hour, 9);
      assert.strictEqual(istParts.minute, 0);
      assert.strictEqual(istParts.minutesFromMidnight, 540);
    });
  });

  describe('2. HTTP Write Path: POST /book Slot Validation', () => {
    it('POST /book - should successfully book valid slot at opening time (09:00 IST)', async () => {
      const weekday = getFutureDate(1, 4);
      const slotStart = makeSlot(weekday, '09:00');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
          goals: 'Opening time test',
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
    });

    it('POST /book - should successfully book valid slot ending at weekday closing time (17:00 IST -> 18:00)', async () => {
      const weekday = getFutureDate(2, 4);
      const slotStart = makeSlot(weekday, '17:00');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
          goals: 'Closing time test',
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
    });

    it('POST /book - should successfully book valid slot using UTC ISO string representing 09:00 IST', async () => {
      const weekday = getFutureDate(3, 4);
      // 09:00 IST is 03:30 UTC
      const utcSlot = `${weekday}T03:30:00.000Z`;

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: utcSlot,
          goals: 'UTC representation test',
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
    });

    it('POST /book - should reject slot starting before opening time (08:30 IST) with 400', async () => {
      const weekday = getFutureDate(4, 4);
      const slotStart = makeSlot(weekday, '08:30');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('earlier than sanctuary opening time'));
    });

    it('POST /book - should reject slot ending after weekday closing time (17:30 IST for 60 min) with 400', async () => {
      const weekday = getFutureDate(5, 4);
      // Starts at 17:30, ends at 18:30 (closing is 18:00)
      const slotStart = makeSlot(weekday, '17:30');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('later than sanctuary closing time'));
    });

    it('POST /book - should reject slot ending after Saturday closing time (16:30 IST for 60 min) with 400', async () => {
      const saturday = getFutureDate(6, 4);
      // Saturday closes at 17:00; slot from 16:30 ends at 17:30
      const slotStart = makeSlot(saturday, '16:30');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('later than sanctuary closing time'));
    });

    it('POST /book - should reject slot crossing midnight (23:30 IST) with 400', async () => {
      const weekday = getFutureDate(1, 5);
      const slotStart = makeSlot(weekday, '23:30');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(
        res.body.message.includes('cross calendar day boundaries') ||
        res.body.message.includes('closing time')
      );
    });

    it('POST /book - should reject slot when UTC date differs from IST date and falls outside operating hours', async () => {
      const weekday = getFutureDate(2, 5);
      // 03:00 IST is 21:30 UTC previous day -> early morning before 09:00 opening
      const slotStart = makeSlot(weekday, '03:00');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('earlier than sanctuary opening time'));
    });
  });

  describe('3. HTTP Write Path: PATCH /:id/reschedule Slot Validation', () => {
    let bookingId;

    before(async () => {
      // Book an initial valid booking to use for reschedule testing
      const weekday = getFutureDate(1, 6);
      const slotStart = makeSlot(weekday, '10:00');

      const res = await request(app)
        .post('/api/v1/consultations/book')
        .set('Cookie', userCookie)
        .send({
          type_id: yogaType.id,
          slot_start: slotStart,
        })
        .expect(201);

      bookingId = res.body.data.id;
    });

    it('PATCH /:id/reschedule - should reject reschedule starting before opening time (08:30 IST) with 400', async () => {
      const targetDate = getFutureDate(2, 6);
      const newSlot = makeSlot(targetDate, '08:30');

      const res = await request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', userCookie)
        .send({ new_slot_start: newSlot })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('earlier than sanctuary opening time'));
    });

    it('PATCH /:id/reschedule - should reject reschedule ending after closing time with 400', async () => {
      const targetDate = getFutureDate(3, 6);
      const newSlot = makeSlot(targetDate, '17:30'); // 17:30 to 18:30 on weekday

      const res = await request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', userCookie)
        .send({ new_slot_start: newSlot })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('later than sanctuary closing time'));
    });

    it('PATCH /:id/reschedule - should reject reschedule crossing midnight with 400', async () => {
      const targetDate = getFutureDate(4, 6);
      const newSlot = makeSlot(targetDate, '23:30');

      const res = await request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', userCookie)
        .send({ new_slot_start: newSlot })
        .expect(400);

      assert.strictEqual(res.body.success, false);
      assert.ok(
        res.body.message.includes('cross calendar day boundaries') ||
        res.body.message.includes('closing time')
      );
    });

    it('PATCH /:id/reschedule - should successfully reschedule to a valid operating hour slot (11:00-12:00 IST)', async () => {
      const targetDate = getFutureDate(5, 6);
      const newSlot = makeSlot(targetDate, '11:00');

      const res = await request(app)
        .patch(`/api/v1/consultations/${bookingId}/reschedule`)
        .set('Cookie', userCookie)
        .send({ new_slot_start: newSlot })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(new Date(res.body.data.slot_start).toISOString(), new Date(newSlot).toISOString());
    });
  });

  describe('4. Proof of Isolation: Invalid requests never invoke repository write methods', () => {
    it('should never invoke createBookingWithTransaction when slot validation fails', async () => {
      let repoCreateCalled = false;
      const mockRepo = {
        async getTypeById() {
          return yogaType;
        },
        async getTypeBySlug() {
          return yogaType;
        },
        async getAvailabilityOverrides() {
          return [];
        },
        async getAvailabilityRules() {
          return [
            { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
          ];
        },
        async createBookingWithTransaction() {
          repoCreateCalled = true;
          return { booking: { id: 'dummy' }, idempotentReplay: false };
        },
      };

      const testService = new ConsultationService(mockRepo);
      const weekday = getFutureDate(2, 7);
      const invalidSlot = makeSlot(weekday, '08:00'); // Before 09:00

      let caught = null;
      try {
        await testService.bookConsultation({
          user: { id: 'u-1', name: 'User 1', email: 'u1@example.com' },
          typeId: yogaType.id,
          slotStart: invalidSlot,
        });
      } catch (err) {
        caught = err;
      }

      assert.ok(caught, 'Expected bookConsultation to throw error');
      assert.strictEqual(caught.statusCode, 400);
      assert.strictEqual(repoCreateCalled, false, 'createBookingWithTransaction must NEVER be invoked');
    });

    it('should never invoke rescheduleBooking when target slot validation fails', async () => {
      let repoRescheduleCalled = false;
      const futureStart = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const mockRepo = {
        async findById() {
          return {
            id: 'b-1',
            user_id: 'u-1',
            consultation_type_id: yogaType.id,
            type_duration_minutes: 60,
            slot_start: futureStart,
            email: 'u1@example.com',
          };
        },
        async getTypeById() {
          return yogaType;
        },
        async getAvailabilityOverrides() {
          return [];
        },
        async getAvailabilityRules() {
          return [
            { day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
          ];
        },
        async rescheduleBooking() {
          repoRescheduleCalled = true;
          return { id: 'b-1' };
        },
      };

      const testService = new ConsultationService(mockRepo);
      const weekday = getFutureDate(3, 7);
      const invalidTargetSlot = makeSlot(weekday, '17:30'); // 17:30 to 18:30 ends after 18:00

      let caught = null;
      try {
        await testService.rescheduleConsultation('b-1', 'u-1', invalidTargetSlot);
      } catch (err) {
        caught = err;
      }

      assert.ok(caught, 'Expected rescheduleConsultation to throw error');
      assert.strictEqual(caught.statusCode, 400);
      assert.strictEqual(repoRescheduleCalled, false, 'rescheduleBooking must NEVER be invoked');
    });
  });
});
