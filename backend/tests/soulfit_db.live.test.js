import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ConsultationRepository } from '../repositories/consultation.repository.js';
import { NewsletterRepository } from '../repositories/newsletter.repository.js';
import { ContactRepository } from '../repositories/contact.repository.js';
import { ServiceRepository } from '../repositories/service.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';

describe('Live PostgreSQL soulfit_db Integration & Concurrency Tests', () => {
  const userRepo = new UserRepository(pool);
  const consultationRepo = new ConsultationRepository(pool);
  const newsletterRepo = new NewsletterRepository(pool);
  const contactRepo = new ContactRepository(pool);
  const serviceRepo = new ServiceRepository(pool);
  const articleRepo = new ArticleRepository(pool);

  let testUserId;
  let testBookingId;
  const testEmail = `live_test_${Date.now()}@harmony.sanctuary`;

  after(async () => {
    // Clean up test records
    if (testBookingId) {
      await pool.query('DELETE FROM consultations WHERE id = $1;', [testBookingId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1;', [testUserId]);
    }
    await pool.query("DELETE FROM contact_messages WHERE email = 'live_inquiry@harmony.sanctuary';");
    await pool.query("DELETE FROM subscribers WHERE email LIKE '%live_sub_%@harmony.sanctuary';");
    await pool.end();
  });

  describe('1. Schema & Seed Verification', () => {
    it('should verify all core tables exist in soulfit_db', async () => {
      const expectedTables = [
        'articles',
        'availability_overrides',
        'availability_rules',
        'consultation_types',
        'consultations',
        'contact_messages',
        'schema_migrations',
        'services',
        'subscribers',
        'users',
      ];

      const res = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      const existing = res.rows.map((r) => r.table_name);
      for (const t of expectedTables) {
        assert(existing.includes(t), `Table ${t} must exist in public schema`);
      }
    });

    it('should verify all 4 migrations are tracked in schema_migrations', async () => {
      const res = await pool.query('SELECT name FROM schema_migrations ORDER BY id ASC;');
      const applied = res.rows.map((r) => r.name);
      assert.deepStrictEqual(applied, [
        '001_initial_schema.sql',
        '002_expand_schema.sql',
        '003_auth_schema.sql',
        '004_consultation_booking_schema.sql',
      ]);
    });

    it('should verify seeded wellness pillars and sanctuary articles exist', async () => {
      const services = await serviceRepo.findAllActive();
      assert.strictEqual(services.length, 5, 'Must contain 5 active wellness pillars');

      const articlesData = await articleRepo.findPublished({ page: 1, limit: 10 });
      assert.strictEqual(articlesData.articles.length, 3, 'Must contain 3 published articles');

      const types = await consultationRepo.getTypes({ isActive: true });
      assert.strictEqual(types.length, 5, 'Must contain 5 consultation types');
    });
  });

  describe('2. User Authentication & Registration', () => {
    it('should register a new user in the users table with hashed password', async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('SanctuarySecure123!', salt);

      const user = await userRepo.create({
        name: 'Live Verified Member',
        email: testEmail,
        passwordHash,
        role: 'USER',
        authProvider: 'local',
      });

      assert(user.id, 'User record must have a UUID');
      assert.strictEqual(user.email, testEmail.toLowerCase());
      assert.strictEqual(user.role, 'USER');
      testUserId = user.id;
    });

    it('should reject duplicate email registration via database UNIQUE constraint', async () => {
      await assert.rejects(
        async () => {
          await userRepo.create({
            name: 'Duplicate Member',
            email: testEmail.toUpperCase(),
            passwordHash: 'dummy_hash',
          });
        },
        (err) => err.code === '23505'
      );
    });

    it('should look up user by email and verify password hash match', async () => {
      const user = await userRepo.findByEmail(testEmail);
      assert(user, 'User must be found by email');
      assert.strictEqual(user.id, testUserId);

      const valid = await bcrypt.compare('SanctuarySecure123!', user.password_hash);
      assert.strictEqual(valid, true, 'Password must validate against stored bcrypt hash');
    });

    it('should link Google OAuth account and update auth_provider', async () => {
      const googleId = `google_sub_${Date.now()}`;
      const updated = await userRepo.linkGoogleAccount(testUserId, googleId, 'https://avatar.url/sanctuary.jpg', 'local,google');
      assert.strictEqual(updated.google_id, googleId);
      assert.strictEqual(updated.auth_provider, 'local,google');
    });
  });

  describe('3. Newsletter & Contact Inquiry Systems', () => {
    it('should subscribe, unsubscribe, and resubscribe to newsletter', async () => {
      const subEmail = `live_sub_${Date.now()}@harmony.sanctuary`;
      const tokenHash = `tok_hash_${Date.now()}`;

      const created = await newsletterRepo.createSubscriber({
        email: subEmail,
        consent: true,
        unsubscribeTokenHash: tokenHash,
      });
      assert(created.id);
      assert.strictEqual(created.email, subEmail.toLowerCase());

      const unsubbed = await newsletterRepo.unsubscribeByTokenHash(tokenHash);
      assert(unsubbed.unsubscribed_at !== null);

      const resubbed = await newsletterRepo.resubscribe({
        email: subEmail,
        consent: true,
        unsubscribeTokenHash: `new_tok_${Date.now()}`,
      });
      assert(resubbed);
      assert.strictEqual(resubbed.email, subEmail.toLowerCase());
    });

    it('should persist contact messages with default status NEW', async () => {
      const msg = await contactRepo.create({
        name: 'Contact Member',
        email: 'live_inquiry@harmony.sanctuary',
        phone: '+919876543210',
        subject: 'General Guidance',
        message: 'Looking forward to visiting the sanctuary.',
      });
      assert(msg.id);
      assert.strictEqual(msg.status, 'NEW');
    });
  });

  describe('4. Booking Concurrency & Transaction Safety', () => {
    let consultationTypeId;
    const tomorrowSlotStart = new Date(Date.now() + 86400000);
    tomorrowSlotStart.setUTCHours(9, 0, 0, 0);
    const tomorrowSlotEnd = new Date(tomorrowSlotStart.getTime() + 60 * 60 * 1000);
    const targetDateStr = tomorrowSlotStart.toISOString().split('T')[0];

    before(async () => {
      const types = await consultationRepo.getTypes({ isActive: true });
      consultationTypeId = types[0].id;
    });

    it('should create booking atomically with transaction and advisory lock', async () => {
      const { booking, idempotentReplay } = await consultationRepo.createBookingWithTransaction({
        userId: testUserId,
        consultationTypeId,
        fullName: 'Live Verified Member',
        email: testEmail,
        phone: '+919876543210',
        pillarInterest: 'Yoga Therapy',
        slotStart: tomorrowSlotStart,
        slotEnd: tomorrowSlotEnd,
        timezone: 'Asia/Kolkata',
        targetDateStr,
      });

      assert(booking.id);
      assert.strictEqual(idempotentReplay, false);
      assert(booking.booking_reference.startsWith('HP-'));
      assert.strictEqual(booking.status, 'CONFIRMED');
      testBookingId = booking.id;
    });

    it('should reject overlapping booking on same slot with 409 conflict', async () => {
      await assert.rejects(
        async () => {
          await consultationRepo.createBookingWithTransaction({
            userId: testUserId,
            consultationTypeId,
            fullName: 'Conflicting Requester',
            email: 'conflict@harmony.sanctuary',
            phone: '+919999999999',
            pillarInterest: 'Yoga Therapy',
            slotStart: tomorrowSlotStart,
            slotEnd: tomorrowSlotEnd,
            timezone: 'Asia/Kolkata',
            targetDateStr,
          });
        },
        (err) => err.statusCode === 409
      );
    });

    it('should prevent double-booking when two requests race concurrently', async () => {
      const raceSlotStart = new Date(Date.now() + 2 * 86400000);
      raceSlotStart.setUTCHours(11, 0, 0, 0);
      const raceSlotEnd = new Date(raceSlotStart.getTime() + 60 * 60 * 1000);
      const raceDateStr = raceSlotStart.toISOString().split('T')[0];

      let successCount = 0;
      let conflictCount = 0;

      const results = await Promise.allSettled([
        consultationRepo.createBookingWithTransaction({
          userId: testUserId,
          consultationTypeId,
          fullName: 'Race Candidate 1',
          email: 'race1@harmony.sanctuary',
          slotStart: raceSlotStart,
          slotEnd: raceSlotEnd,
          targetDateStr: raceDateStr,
        }),
        consultationRepo.createBookingWithTransaction({
          userId: testUserId,
          consultationTypeId,
          fullName: 'Race Candidate 2',
          email: 'race2@harmony.sanctuary',
          slotStart: raceSlotStart,
          slotEnd: raceSlotEnd,
          targetDateStr: raceDateStr,
        }),
      ]);

      for (const res of results) {
        if (res.status === 'fulfilled') {
          successCount++;
          // Clean up winning booking
          await pool.query('DELETE FROM consultations WHERE id = $1;', [res.value.booking.id]);
        } else if (res.status === 'rejected' && res.reason.statusCode === 409) {
          conflictCount++;
        }
      }

      assert.strictEqual(successCount, 1, 'Exactly one booking must succeed in a concurrent race');
      assert.strictEqual(conflictCount, 1, 'Exactly one booking must receive a 409 conflict');
    });

    it('should cancel booking and update status to CANCELLED', async () => {
      const cancelled = await consultationRepo.cancelBooking({
        id: testBookingId,
        userId: testUserId,
        reason: 'Testing cancellation flow',
      });
      assert.strictEqual(cancelled.status, 'CANCELLED');
      assert.strictEqual(cancelled.cancellation_reason, 'Testing cancellation flow');
    });
  });
});
