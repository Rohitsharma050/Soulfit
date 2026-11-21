import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { createTestApp } from './createTestApp.js';
import { UserRepository } from '../repositories/user.repository.js';
import { prisma as defaultPrisma } from '../config/prisma.js';

describe('Phase 3.5.2 — UserRepository Prisma Migration Tests', async () => {
  let pool;
  let userRepo;

  before(async () => {
    const testApp = await createTestApp();
    pool = testApp.pool;
    userRepo = new UserRepository(pool);
  });

  describe('1. User Creation & Projection Boundaries', () => {
    it('create() - should insert user and strictly omit password_hash from return projection', async () => {
      const user = await userRepo.create({
        name: 'Kabir Mehta',
        email: 'kabir.mehta@example.com',
        passwordHash: 'argon2_hashed_secret_123',
        role: 'USER',
        authProvider: 'local',
      });

      assert.ok(user.id);
      assert.strictEqual(user.name, 'Kabir Mehta');
      assert.strictEqual(user.email, 'kabir.mehta@example.com');
      assert.strictEqual(user.role, 'USER');
      assert.strictEqual(user.auth_provider, 'local');
      assert.strictEqual(user.is_active, true);
      assert.ok(user.created_at);
      assert.ok(user.updated_at);

      // SECURITY CRITICAL: password_hash must NOT be present in create() return projection
      assert.strictEqual(user.password_hash, undefined, 'password_hash must be excluded from create() return');
      assert.strictEqual(user.passwordHash, undefined);
    });

    it('create() - should preserve role when ADMIN role is specified', async () => {
      const adminUser = await userRepo.create({
        name: 'Admin Sanctuary',
        email: 'admin.sanctuary@example.com',
        passwordHash: 'argon2_admin_hash',
        role: 'ADMIN',
        authProvider: 'local',
      });

      assert.strictEqual(adminUser.role, 'ADMIN');
      assert.strictEqual(adminUser.email, 'admin.sanctuary@example.com');
    });

    it('create() - should normalize email by lowercasing and trimming whitespace', async () => {
      const user = await userRepo.create({
        name: 'Spaces User',
        email: '   SPACES.USER@example.com   ',
        passwordHash: 'hash123',
      });

      assert.strictEqual(user.email, 'spaces.user@example.com');
    });

    it('create() - should reject duplicate email registration with unique constraint error', async () => {
      await assert.rejects(
        async () => {
          await userRepo.create({
            name: 'Duplicate Kabir',
            email: 'kabir.mehta@example.com',
            passwordHash: 'another_hash',
          });
        },
        (err) => {
          assert.ok(err);
          // Checks for either PostgreSQL 23505 code or message
          assert.ok(err.code === '23505' || err.message.toLowerCase().includes('unique') || err.message.toLowerCase().includes('duplicate'));
          return true;
        }
      );
    });
  });

  describe('2. Lookup by ID & Email (Password Hash Retention for Auth)', () => {
    let testUserId;

    before(async () => {
      const u = await userRepo.create({
        name: 'Lookup User',
        email: 'lookup.test@example.com',
        passwordHash: 'stored_secret_hash_999',
        avatar: 'https://avatar.example.com/lookup.png',
      });
      testUserId = u.id;
    });

    it('findById() - should return full user record including password_hash for session verification', async () => {
      const user = await userRepo.findById(testUserId);

      assert.ok(user);
      assert.strictEqual(user.id, testUserId);
      assert.strictEqual(user.name, 'Lookup User');
      assert.strictEqual(user.email, 'lookup.test@example.com');
      assert.strictEqual(user.avatar, 'https://avatar.example.com/lookup.png');
      // password_hash is required internally by auth for login/session comparison
      assert.strictEqual(user.password_hash, 'stored_secret_hash_999');
    });

    it('findById() - should return null for nonexistent UUID or null parameter', async () => {
      const notFound = await userRepo.findById('00000000-0000-0000-0000-000000000000');
      assert.strictEqual(notFound, null);

      const nullParam = await userRepo.findById(null);
      assert.strictEqual(nullParam, null);

      const emptyParam = await userRepo.findById('');
      assert.strictEqual(emptyParam, null);
    });

    it('findByEmail() - should find user case-insensitively and return password_hash for credential check', async () => {
      const foundLower = await userRepo.findByEmail('lookup.test@example.com');
      assert.ok(foundLower);
      assert.strictEqual(foundLower.id, testUserId);
      assert.strictEqual(foundLower.password_hash, 'stored_secret_hash_999');

      // Mixed/uppercase lookup
      const foundUpper = await userRepo.findByEmail('LOOKUP.TEST@EXAMPLE.COM');
      assert.ok(foundUpper);
      assert.strictEqual(foundUpper.id, testUserId);

      // Whitespace trimmed lookup
      const foundWhitespace = await userRepo.findByEmail('   lookup.test@example.com   ');
      assert.ok(foundWhitespace);
      assert.strictEqual(foundWhitespace.id, testUserId);
    });

    it('findByEmail() - should return null for nonexistent email or null parameter', async () => {
      const notFound = await userRepo.findByEmail('nonexistent.email@example.com');
      assert.strictEqual(notFound, null);

      const nullParam = await userRepo.findByEmail(null);
      assert.strictEqual(nullParam, null);

      const emptyParam = await userRepo.findByEmail('');
      assert.strictEqual(emptyParam, null);
    });
  });

  describe('3. Google OAuth & Account Linking', () => {
    let oauthUserId;

    it('findByGoogleId() - should retrieve user by Google OAuth subject ID', async () => {
      const created = await userRepo.create({
        name: 'OAuth User',
        email: 'oauth.google@example.com',
        googleId: 'google-sub-777',
        authProvider: 'google',
        avatar: 'https://lh3.google.com/photo.png',
      });
      oauthUserId = created.id;

      const found = await userRepo.findByGoogleId('google-sub-777');
      assert.ok(found);
      assert.strictEqual(found.id, oauthUserId);
      assert.strictEqual(found.google_id, 'google-sub-777');
      assert.strictEqual(found.auth_provider, 'google');

      const notFound = await userRepo.findByGoogleId('google-sub-nonexistent');
      assert.strictEqual(notFound, null);

      const nullParam = await userRepo.findByGoogleId(null);
      assert.strictEqual(nullParam, null);
    });

    it('linkGoogleAccount() - should link Google ID to local user and strictly omit password_hash', async () => {
      const localUser = await userRepo.create({
        name: 'Local For Linking',
        email: 'linking.test@example.com',
        passwordHash: 'secret_local_hash',
        authProvider: 'local',
      });

      const linked = await userRepo.linkGoogleAccount(
        localUser.id,
        'google-sub-888',
        'https://lh3.google.com/linked.png'
      );

      assert.ok(linked);
      assert.strictEqual(linked.id, localUser.id);
      assert.strictEqual(linked.google_id, 'google-sub-888');
      assert.strictEqual(linked.avatar, 'https://lh3.google.com/linked.png');
      assert.strictEqual(linked.auth_provider, 'local,google');
      assert.strictEqual(linked.password_hash, undefined, 'password_hash must be excluded from linkGoogleAccount return');

      // Verify persistence via findById
      const check = await userRepo.findById(localUser.id);
      assert.strictEqual(check.google_id, 'google-sub-888');
      assert.strictEqual(check.auth_provider, 'local,google');
      // Password hash still preserved in database for local login
      assert.strictEqual(check.password_hash, 'secret_local_hash');
    });

    it('linkGoogleAccount() - should return null if user ID does not exist', async () => {
      const result = await userRepo.linkGoogleAccount('00000000-0000-0000-0000-000000000000', 'gid-999');
      assert.strictEqual(result, null);

      const nullId = await userRepo.linkGoogleAccount(null, 'gid-999');
      assert.strictEqual(nullId, null);
    });
  });

  describe('4. Last Login Updates', () => {
    it('updateLastLogin() - should update last_login_at timestamp', async () => {
      const u = await userRepo.create({
        name: 'Login Timestamp User',
        email: 'login.time@example.com',
        passwordHash: 'hash',
      });

      const beforeUser = await userRepo.findById(u.id);
      assert.strictEqual(beforeUser.last_login_at, null);

      await userRepo.updateLastLogin(u.id);

      const afterUser = await userRepo.findById(u.id);
      assert.ok(afterUser.last_login_at);
      assert.ok(afterUser.last_login_at instanceof Date || typeof afterUser.last_login_at === 'string');
    });
  });

  describe('5. Real PostgreSQL Direct Prisma Verification', () => {
    it('should perform full user lifecycle directly on PostgreSQL via default Prisma Client', async () => {
      const realRepo = new UserRepository(defaultPrisma);

      const uniqueEmail = `lifecycle.${Date.now()}@example.com`;
      const created = await realRepo.create({
        name: 'Prisma Direct User',
        email: uniqueEmail,
        passwordHash: 'real_pg_hash_456',
        role: 'USER',
        authProvider: 'local',
      });

      assert.ok(created.id);
      assert.strictEqual(created.email, uniqueEmail);
      assert.strictEqual(created.password_hash, undefined);

      const foundById = await realRepo.findById(created.id);
      assert.ok(foundById);
      assert.strictEqual(foundById.password_hash, 'real_pg_hash_456');

      const foundByEmail = await realRepo.findByEmail(uniqueEmail.toUpperCase());
      assert.ok(foundByEmail);
      assert.strictEqual(foundByEmail.id, created.id);

      await realRepo.updateLastLogin(created.id);
      const afterLogin = await realRepo.findById(created.id);
      assert.ok(afterLogin.last_login_at);

      const linked = await realRepo.linkGoogleAccount(created.id, `gid-${Date.now()}`, 'https://avatar.png');
      assert.ok(linked);
      assert.strictEqual(linked.auth_provider, 'local,google');
      assert.strictEqual(linked.password_hash, undefined);

      // Clean up test user
      await realRepo.prisma.users.delete({ where: { id: created.id } });
      const verifyDeleted = await realRepo.findById(created.id);
      assert.strictEqual(verifyDeleted, null);
    });
  });
});
