import { prisma as defaultPrisma } from '../config/prisma.js';
import { createPrismaPgAdapter } from '../config/prismaAdapter.js';

export class UserRepository {
  /**
   * Initializes UserRepository with Prisma Client or test adapter.
   * @param {Object} [client=defaultPrisma] - PrismaClient instance or pool adapter
   */
  constructor(client = defaultPrisma) {
    this.prisma =
      client && typeof client.query === 'function' && !client.users
        ? createPrismaPgAdapter(client)
        : client;
  }

  /**
   * Finds user by primary key UUID.
   * Returns full user record including password_hash for internal authentication verification.
   * @param {string} id - User UUID
   * @returns {Promise<object|null>} Complete user record or null
   */
  async findById(id) {
    if (!id) return null;
    const user = await this.prisma.users.findUnique({
      where: { id },
    });
    return user || null;
  }

  /**
   * Finds user by case-insensitive email.
   * Returns full user record including password_hash for credential validation.
   * @param {string} email - Inquirer email
   * @returns {Promise<object|null>} Complete user record or null
   */
  async findByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.users.findFirst({
      where: {
        email: {
          equals: normalized,
          mode: 'insensitive',
        },
      },
    });
    return user || null;
  }

  /**
   * Finds user by Google OAuth provider ID.
   * @param {string} googleId - Google OAuth subject ID
   * @returns {Promise<object|null>} Complete user record or null
   */
  async findByGoogleId(googleId) {
    if (!googleId) return null;
    const user = await this.prisma.users.findUnique({
      where: { google_id: googleId },
    });
    return user || null;
  }

  /**
   * Creates a new user record.
   * CRITICAL SECURITY INVARIANT: password_hash is strictly omitted from the return projection.
   * @param {object} userData
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string|null} [userData.passwordHash=null]
   * @param {string|null} [userData.googleId=null]
   * @param {string|null} [userData.avatar=null]
   * @param {string} [userData.role='USER']
   * @param {string} [userData.authProvider='local']
   * @returns {Promise<object>} Safe user record projection
   */
  async create({
    name,
    email,
    passwordHash = null,
    googleId = null,
    avatar = null,
    role = 'USER',
    authProvider = 'local',
  }) {
    const user = await this.prisma.users.create({
      data: {
        name: name ? name.trim() : '',
        email: email ? email.trim().toLowerCase() : '',
        password_hash: passwordHash,
        google_id: googleId,
        avatar,
        role: role || 'USER',
        auth_provider: authProvider || 'local',
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        google_id: true,
        avatar: true,
        role: true,
        auth_provider: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  }

  /**
   * Updates last login timestamp.
   * @param {string} id - User UUID
   * @returns {Promise<void>}
   */
  async updateLastLogin(id) {
    if (!id) return;
    await this.prisma.users.update({
      where: { id },
      data: {
        last_login_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Links Google account to existing user by ID.
   * CRITICAL SECURITY INVARIANT: password_hash is strictly omitted from the return projection.
   * @param {string} id - User UUID
   * @param {string} googleId - Google OAuth subject ID
   * @param {string|null} [avatar=null] - Google avatar URL
   * @param {string} [authProvider='google'] - Auth provider designation
   * @returns {Promise<object|null>} Safe updated user record
   */
  async linkGoogleAccount(id, googleId, avatar = null, authProvider = 'google') {
    if (!id) return null;

    const existing = await this.prisma.users.findUnique({
      where: { id },
      select: { avatar: true, auth_provider: true },
    });

    if (!existing) return null;

    const updatedAvatar = existing.avatar || avatar || null;
    const updatedAuthProvider =
      existing.auth_provider === 'local'
        ? 'local,google'
        : (authProvider || existing.auth_provider);

    const user = await this.prisma.users.update({
      where: { id },
      data: {
        google_id: googleId,
        avatar: updatedAvatar,
        auth_provider: updatedAuthProvider,
        last_login_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        google_id: true,
        avatar: true,
        role: true,
        auth_provider: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  }
}

export const userRepository = new UserRepository();
export default userRepository;
