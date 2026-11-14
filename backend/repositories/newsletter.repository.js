import { pool } from '../config/db.js';

export class NewsletterRepository {
  constructor(dbPool = pool) {
    this.pool = dbPool;
  }

  /**
   * Finds subscriber record by email.
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const query = `
      SELECT id, email, consent, subscribed_at, unsubscribed_at, unsubscribe_token_hash
      FROM subscribers
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(query, [email]);
    return rows[0] || null;
  }

  /**
   * Inserts a new newsletter subscriber.
   * @param {Object} subscriberData 
   * @returns {Promise<Object>}
   */
  async createSubscriber({ email, consent = true, unsubscribeTokenHash = null }) {
    const query = `
      INSERT INTO subscribers (email, consent, unsubscribe_token_hash, subscribed_at, unsubscribed_at)
      VALUES (LOWER($1), $2, $3, CURRENT_TIMESTAMP, NULL)
      RETURNING id, email, consent, subscribed_at;
    `;
    const { rows } = await this.pool.query(query, [email, consent, unsubscribeTokenHash]);
    return rows[0];
  }

  /**
   * Reactivates a previously unsubscribed email.
   * @param {Object} param0 
   * @returns {Promise<Object>}
   */
  async resubscribe({ email, consent = true, unsubscribeTokenHash = null }) {
    const query = `
      UPDATE subscribers
      SET consent = $2,
          unsubscribe_token_hash = COALESCE($3, unsubscribe_token_hash),
          subscribed_at = CURRENT_TIMESTAMP,
          unsubscribed_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER($1)
      RETURNING id, email, consent, subscribed_at;
    `;
    const { rows } = await this.pool.query(query, [email, consent, unsubscribeTokenHash]);
    return rows[0];
  }

  /**
   * Finds subscriber by unsubscribe token hash.
   * @param {string} tokenHash 
   * @returns {Promise<Object|null>}
   */
  async findByTokenHash(tokenHash) {
    const query = `
      SELECT id, email, consent, subscribed_at, unsubscribed_at
      FROM subscribers
      WHERE unsubscribe_token_hash = $1
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(query, [tokenHash]);
    return rows[0] || null;
  }

  /**
   * Marks a subscriber as unsubscribed by token hash.
   * @param {string} tokenHash 
   * @returns {Promise<Object|null>}
   */
  async unsubscribeByTokenHash(tokenHash) {
    const query = `
      UPDATE subscribers
      SET unsubscribed_at = CURRENT_TIMESTAMP,
          consent = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE unsubscribe_token_hash = $1 AND unsubscribed_at IS NULL
      RETURNING id, email, unsubscribed_at;
    `;
    const { rows } = await this.pool.query(query, [tokenHash]);
    return rows[0] || null;
  }
}

export const newsletterRepository = new NewsletterRepository();
export default newsletterRepository;
