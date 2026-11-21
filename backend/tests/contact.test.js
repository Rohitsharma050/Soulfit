import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createTestApp } from './createTestApp.js';
import { ContactRepository } from '../repositories/contact.repository.js';

describe('Contact API & Repository (/api/v1/contact)', async () => {
  let app;
  let pool;
  let contactRepo;

  before(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    pool = testApp.pool;
    contactRepo = new ContactRepository(pool);
  });

  describe('1. HTTP API: POST /api/v1/contact', () => {
    it('POST /api/v1/contact - should successfully save valid contact submission in PostgreSQL', async () => {
      const payload = {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 9876543210',
        subject: 'Vastu Consultation Inquiry',
        message: 'I would like to explore spatial alignment for our new residence in Bangalore.',
      };

      const res = await request(app)
        .post('/api/v1/contact')
        .send(payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.name, 'Priya Sharma');
      assert.strictEqual(res.body.data.email, 'priya@example.com');
      assert.strictEqual(res.body.data.status, 'NEW');
      assert.ok(res.body.data.createdAt);

      // Verify database persistence directly
      const dbCheck = await pool.query('SELECT * FROM contact_messages WHERE email = $1;', ['priya@example.com']);
      assert.strictEqual(dbCheck.rows.length, 1);
      assert.strictEqual(dbCheck.rows[0].name, 'Priya Sharma');
    });

    it('POST /api/v1/contact - should reject invalid email format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'John Doe',
          email: 'invalid-email-string',
          message: 'Hello sanctuary team.',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.errors.some((e) => e.field === 'email'), true);
    });

    it('POST /api/v1/contact - should reject missing name or message', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          email: 'john@example.com',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('POST /api/v1/contact - should reject honeypot spam submission', async () => {
      const res = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'Spam Bot',
          email: 'bot@spam.com',
          message: 'Buy cheap watches now!',
          website: 'http://spamsite.xyz', // honeypot filled
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });
  });

  describe('2. ContactRepository Prisma Method Unit Tests', () => {
    let createdRecordId;

    it('create() - should insert contact inquiry and return exact projection shape', async () => {
      const created = await contactRepo.create({
        name: 'Arjun Das',
        email: 'arjun@example.com',
        phone: '+91 9123456789',
        subject: 'Yoga Therapy Questions',
        message: 'Inquiring about personal consultation slots for prenatal guidance.',
      });

      assert.ok(created.id);
      createdRecordId = created.id;
      assert.strictEqual(created.name, 'Arjun Das');
      assert.strictEqual(created.email, 'arjun@example.com');
      assert.strictEqual(created.subject, 'Yoga Therapy Questions');
      assert.strictEqual(created.status, 'NEW');
      assert.ok(created.created_at);
      // Verify phone and message were not returned in projection (preserving native behavior)
      assert.strictEqual(created.phone, undefined);
      assert.strictEqual(created.message, undefined);
    });

    it('findById() - should retrieve full contact record by primary key UUID', async () => {
      assert.ok(createdRecordId);
      const found = await contactRepo.findById(createdRecordId);

      assert.ok(found);
      assert.strictEqual(found.id, createdRecordId);
      assert.strictEqual(found.name, 'Arjun Das');
      assert.strictEqual(found.email, 'arjun@example.com');
      assert.strictEqual(found.phone, '+91 9123456789');
      assert.strictEqual(found.subject, 'Yoga Therapy Questions');
      assert.strictEqual(found.message, 'Inquiring about personal consultation slots for prenatal guidance.');
      assert.strictEqual(found.status, 'NEW');
    });

    it('findById() - should return null for nonexistent contact ID or null input', async () => {
      const notFound = await contactRepo.findById('a0000000-0000-0000-0000-000000000000');
      assert.strictEqual(notFound, null);

      const nullInput = await contactRepo.findById(null);
      assert.strictEqual(nullInput, null);
    });

    it('findByEmail() - should retrieve all inquiries for an email address', async () => {
      // Add another message from same user
      await contactRepo.create({
        name: 'Arjun Das',
        email: 'arjun@example.com',
        subject: 'Follow-up regarding dates',
        message: 'Looking for slots in January.',
      });

      const list = await contactRepo.findByEmail('arjun@example.com');
      assert.strictEqual(list.length, 2);
      assert.strictEqual(list[0].email, 'arjun@example.com');

      const emptyList = await contactRepo.findByEmail('nonexistent@example.com');
      assert.deepStrictEqual(emptyList, []);

      const nullEmailList = await contactRepo.findByEmail(null);
      assert.deepStrictEqual(nullEmailList, []);
    });

    it('updateStatus() - should update contact message status to READ then RESOLVED', async () => {
      const updatedRead = await contactRepo.updateStatus(createdRecordId, 'READ');
      assert.strictEqual(updatedRead.status, 'READ');

      const updatedResolved = await contactRepo.updateStatus(createdRecordId, 'RESOLVED');
      assert.strictEqual(updatedResolved.status, 'RESOLVED');

      // Verify persistence via findById
      const check = await contactRepo.findById(createdRecordId);
      assert.strictEqual(check.status, 'RESOLVED');
    });

    it('findMany() & count() - should support status filtering and pagination', async () => {
      // Create a third contact message with status NEW
      await contactRepo.create({
        name: 'Devika Nair',
        email: 'devika@example.com',
        subject: 'Corporate Session',
        message: 'Requesting consultation on executive wellness program.',
      });

      const allCount = await contactRepo.count();
      assert.ok(allCount >= 4);

      const resolvedCount = await contactRepo.count({ status: 'RESOLVED' });
      assert.strictEqual(resolvedCount, 1);

      const resolvedList = await contactRepo.findMany({ status: 'RESOLVED' });
      assert.strictEqual(resolvedList.length, 1);
      assert.strictEqual(resolvedList[0].id, createdRecordId);

      // Pagination
      const page1 = await contactRepo.findMany({ skip: 0, take: 2 });
      assert.strictEqual(page1.length, 2);

      const page2 = await contactRepo.findMany({ skip: 2, take: 2 });
      assert.ok(page2.length >= 1);
      assert.notStrictEqual(page1[0].id, page2[0].id);
    });
  });
});
