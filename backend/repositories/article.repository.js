import { pool } from '../config/db.js';

export class ArticleRepository {
  constructor(dbPool = pool) {
    this.pool = dbPool;
  }

  /**
   * Fetches published articles with pagination, category filter, and search.
   * @param {Object} options - { page, limit, category, search }
   * @returns {Promise<{ articles: Array, totalCount: number, page: number, limit: number, totalPages: number }>}
   */
  async findPublished({ page = 1, limit = 10, category = null, search = null }) {
    const conditions = ["status = 'PUBLISHED'"];
    const values = [];
    let paramIndex = 1;

    if (category && category !== 'ALL') {
      conditions.push(`LOWER(category) = LOWER($${paramIndex++})`);
      values.push(category);
    }

    if (search && search.trim() !== '') {
      conditions.push(`(title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // 1. Total count query
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM articles
      WHERE ${whereClause};
    `;
    const countRes = await this.pool.query(countQuery, values);
    const totalCount = countRes.rows[0]?.total || 0;

    // 2. Paginated data query (excludes heavy 'content' column)
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        id, 
        title, 
        slug, 
        excerpt, 
        cover_image, 
        category, 
        author_name, 
        reading_time, 
        published_at,
        created_at
      FROM articles
      WHERE ${whereClause}
      ORDER BY published_at DESC, created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const dataValues = [...values, limit, offset];
    const { rows: articles } = await this.pool.query(dataQuery, dataValues);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      articles,
      totalCount,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Fetches an individual published article by unique slug, including full content.
   * @param {string} slug 
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug) {
    const query = `
      SELECT 
        id, 
        title, 
        slug, 
        excerpt, 
        content, 
        cover_image, 
        category, 
        author_name, 
        reading_time, 
        status,
        published_at, 
        created_at, 
        updated_at
      FROM articles
      WHERE LOWER(slug) = LOWER($1) AND status = 'PUBLISHED'
      LIMIT 1;
    `;

    const { rows } = await this.pool.query(query, [slug]);
    return rows[0] || null;
  }
}

export const articleRepository = new ArticleRepository();
export default articleRepository;
