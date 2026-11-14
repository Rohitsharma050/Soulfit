import { pool } from '../config/db.js';

export class ContactRepository {
  constructor(dbPool = pool) {
    this.pool = dbPool;
  }

  /**
   * Persists a validated contact inquiry message into PostgreSQL.
   * @param {Object} contactData 
   * @returns {Promise<Object>} Created record summary
   */
  async create({ name, email, phone = null, subject = null, message }) {
    const query = `
      INSERT INTO contact_messages (name, email, phone, subject, message, status)
      VALUES ($1, $2, $3, $4, $5, 'NEW')
      RETURNING id, name, email, subject, status, created_at;
    `;

    const values = [name, email, phone || null, subject || null, message];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }
}

export const contactRepository = new ContactRepository();
export default contactRepository;
