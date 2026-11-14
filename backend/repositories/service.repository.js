import { pool } from '../config/db.js';

export class ServiceRepository {
  constructor(dbPool = pool) {
    this.pool = dbPool;
  }

  /**
   * Fetches all active services with optional filtering.
   * @param {Object} filters - Optional filters: { category, featured }
   * @returns {Promise<Array>} List of active services
   */
  async findAllActive(filters = {}) {
    const conditions = ['is_active = TRUE'];
    const values = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`LOWER(category) = LOWER($${paramIndex++})`);
      values.push(filters.category);
    }

    if (filters.featured !== undefined) {
      conditions.push(`is_featured = $${paramIndex++}`);
      values.push(filters.featured);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT 
        id, 
        slug, 
        title, 
        category, 
        short_description, 
        description, 
        image_url, 
        icon_name, 
        offerings, 
        is_featured, 
        display_order,
        created_at,
        updated_at
      FROM services
      WHERE ${whereClause}
      ORDER BY display_order ASC, title ASC;
    `;

    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  /**
   * Fetches an active service by its unique slug.
   * @param {string} slug 
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug) {
    const query = `
      SELECT 
        id, 
        slug, 
        title, 
        category, 
        short_description, 
        description, 
        image_url, 
        icon_name, 
        offerings, 
        is_featured, 
        display_order,
        created_at,
        updated_at
      FROM services
      WHERE LOWER(slug) = LOWER($1) AND is_active = TRUE
      LIMIT 1;
    `;

    const { rows } = await this.pool.query(query, [slug]);
    return rows[0] || null;
  }
}

export const serviceRepository = new ServiceRepository();
export default serviceRepository;
