import { pool } from '../config/db.js';

export class UserRepository {
  constructor(dbPool = pool) {
    this.pool = dbPool;
  }

  /**
   * Finds user by primary key UUID.
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const query = `
      SELECT id, name, email, password_hash, google_id, avatar, role, auth_provider, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Finds user by case-insensitive email.
   * @param {string} email 
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    if (!email) return null;
    const query = `
      SELECT id, name, email, password_hash, google_id, avatar, role, auth_provider, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(query, [email]);
    return rows[0] || null;
  }

  /**
   * Finds user by Google OAuth provider ID.
   * @param {string} googleId 
   * @returns {Promise<object|null>}
   */
  async findByGoogleId(googleId) {
    if (!googleId) return null;
    const query = `
      SELECT id, name, email, password_hash, google_id, avatar, role, auth_provider, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE google_id = $1
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(query, [googleId]);
    return rows[0] || null;
  }

  /**
   * Creates a new user record.
   * @param {object} userData
   * @returns {Promise<object>}
   */
  async create({ name, email, passwordHash = null, googleId = null, avatar = null, role = 'USER', authProvider = 'local' }) {
    const query = `
      INSERT INTO users (name, email, password_hash, google_id, avatar, role, auth_provider, is_active, created_at, updated_at)
      VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, email, google_id, avatar, role, auth_provider, is_active, created_at, updated_at;
    `;
    const values = [name.trim(), email.trim(), passwordHash, googleId, avatar, role, authProvider];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  /**
   * Updates last login timestamp.
   * @param {string} id 
   * @returns {Promise<void>}
   */
  async updateLastLogin(id) {
    const query = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await this.pool.query(query, [id]);
  }

  /**
   * Links Google account to existing user by ID.
   * @param {string} id 
   * @param {string} googleId 
   * @param {string} [avatar]
   * @param {string} [authProvider]
   * @returns {Promise<object>}
   */
  async linkGoogleAccount(id, googleId, avatar = null, authProvider = 'google') {
    const query = `
      UPDATE users
      SET google_id = $2,
          avatar = COALESCE(avatar, $3),
          auth_provider = CASE 
            WHEN auth_provider = 'local' THEN 'local,google'
            ELSE COALESCE($4, auth_provider)
          END,
          last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, email, google_id, avatar, role, auth_provider, is_active, created_at, updated_at;
    `;
    const { rows } = await this.pool.query(query, [id, googleId, avatar, authProvider]);
    return rows[0];
  }
}

export default new UserRepository();
