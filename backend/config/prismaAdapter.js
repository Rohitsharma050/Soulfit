/**
 * Compatibility adapter enabling Prisma Client method calls
 * (such as prisma.services.*, prisma.articles.*, prisma.subscribers.*) to execute against
 * in-memory pg-mem / pg pools used in unit & integration test suites.
 *
 * @param {Object} pool - A pg Pool instance or pg-mem adapter
 * @returns {Object} Prisma-compatible delegate object
 */
export function createPrismaPgAdapter(pool) {
  return {
    services: {
      /**
       * Translates prisma.services.findMany({ where, select, orderBy })
       * to PostgreSQL parameterized SELECT queries.
       */
      async findMany({ where = {}, select, orderBy = [] } = {}) {
        const conditions = [];
        const values = [];
        let paramIdx = 1;

        if (where.is_active !== undefined) {
          conditions.push(`is_active = $${paramIdx++}`);
          values.push(where.is_active);
        }

        if (where.category) {
          if (where.category.mode === 'insensitive') {
            conditions.push(`LOWER(category) = LOWER($${paramIdx++})`);
            values.push(where.category.equals);
          } else {
            conditions.push(`category = $${paramIdx++}`);
            values.push(where.category.equals || where.category);
          }
        }

        if (where.is_featured !== undefined) {
          conditions.push(`is_featured = $${paramIdx++}`);
          values.push(where.is_featured);
        }

        const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const orderSql = orderBy.length
          ? `ORDER BY ${orderBy
              .map((o) => {
                const col = Object.keys(o)[0];
                return `${col} ${String(o[col]).toUpperCase()}`;
              })
              .join(', ')}`
          : '';

        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `SELECT ${cols} FROM services ${whereSql} ${orderSql};`;
        const { rows } = await pool.query(sql, values);
        return rows;
      },

      /**
       * Translates prisma.services.findFirst({ where, select })
       * to PostgreSQL parameterized SELECT query with LIMIT 1.
       */
      async findFirst({ where = {}, select } = {}) {
        const conditions = [];
        const values = [];
        let paramIdx = 1;

        if (where.is_active !== undefined) {
          conditions.push(`is_active = $${paramIdx++}`);
          values.push(where.is_active);
        }

        if (where.slug) {
          if (where.slug.mode === 'insensitive') {
            conditions.push(`LOWER(slug) = LOWER($${paramIdx++})`);
            values.push(where.slug.equals);
          } else {
            conditions.push(`slug = $${paramIdx++}`);
            values.push(where.slug.equals || where.slug);
          }
        }

        const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `SELECT ${cols} FROM services ${whereSql} LIMIT 1;`;
        const { rows } = await pool.query(sql, values);
        return rows[0] || null;
      },
    },

    articles: {
      /**
       * Translates prisma.articles.count({ where })
       */
      async count({ where = {} } = {}) {
        const { whereSql, values } = buildArticleWhere(where);
        const sql = `SELECT COUNT(*)::int AS total FROM articles ${whereSql};`;
        const { rows } = await pool.query(sql, values);
        return rows[0]?.total || 0;
      },

      /**
       * Translates prisma.articles.findMany({ where, select, orderBy, skip, take })
       */
      async findMany({ where = {}, select, orderBy = [], skip = 0, take = 10 } = {}) {
        const { whereSql, values } = buildArticleWhere(where);
        let paramIdx = values.length + 1;

        let orderSql = '';
        if (orderBy.length) {
          orderSql = `ORDER BY ${orderBy
            .map((o) => {
              const col = Object.keys(o)[0];
              return `${col} ${String(o[col]).toUpperCase()}`;
            })
            .join(', ')}`;
        }

        const cols = select ? Object.keys(select).join(', ') : '*';
        const limitSql = `LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        const finalValues = [...values, take, skip];

        const sql = `SELECT ${cols} FROM articles ${whereSql} ${orderSql} ${limitSql};`;
        const { rows } = await pool.query(sql, finalValues);
        return rows;
      },

      /**
       * Translates prisma.articles.findFirst({ where, select })
       */
      async findFirst({ where = {}, select } = {}) {
        const { whereSql, values } = buildArticleWhere(where);
        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `SELECT ${cols} FROM articles ${whereSql} LIMIT 1;`;
        const { rows } = await pool.query(sql, values);
        return rows[0] || null;
      },
    },

    subscribers: {
      /**
       * Translates prisma.subscribers.findFirst({ where, select })
       */
      async findFirst({ where = {}, select } = {}) {
        const conditions = [];
        const values = [];
        let paramIdx = 1;

        if (where.email) {
          const emailVal = where.email.equals !== undefined ? where.email.equals : where.email;
          if (where.email.mode === 'insensitive') {
            conditions.push(`LOWER(email) = LOWER($${paramIdx++})`);
          } else {
            conditions.push(`email = $${paramIdx++}`);
          }
          values.push(emailVal);
        }

        if (where.unsubscribe_token_hash !== undefined) {
          conditions.push(`unsubscribe_token_hash = $${paramIdx++}`);
          values.push(where.unsubscribe_token_hash);
        }

        if (where.unsubscribed_at === null) {
          conditions.push(`unsubscribed_at IS NULL`);
        } else if (where.unsubscribed_at !== undefined) {
          conditions.push(`unsubscribed_at = $${paramIdx++}`);
          values.push(where.unsubscribed_at);
        }

        if (where.id) {
          conditions.push(`id = $${paramIdx++}`);
          values.push(where.id);
        }

        const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `SELECT ${cols} FROM subscribers ${whereSql} LIMIT 1;`;
        const { rows } = await pool.query(sql, values);
        return rows[0] || null;
      },

      /**
       * Translates prisma.subscribers.create({ data, select })
       */
      async create({ data = {}, select } = {}) {
        const email = data.email ? data.email.toLowerCase() : null;
        const consent = data.consent !== undefined ? Boolean(data.consent) : true;
        const tokenHash = data.unsubscribe_token_hash || null;
        const cols = select ? Object.keys(select).join(', ') : '*';

        const sql = `
          INSERT INTO subscribers (email, consent, unsubscribe_token_hash, subscribed_at, unsubscribed_at)
          VALUES (LOWER($1), $2, $3, CURRENT_TIMESTAMP, NULL)
          RETURNING ${cols};
        `;
        const { rows } = await pool.query(sql, [email, consent, tokenHash]);
        return rows[0];
      },

      /**
       * Translates prisma.subscribers.update({ where, data, select })
       */
      async update({ where = {}, data = {}, select } = {}) {
        const setClauses = [];
        const values = [];
        let paramIdx = 1;

        if (data.consent !== undefined) {
          setClauses.push(`consent = $${paramIdx++}`);
          values.push(Boolean(data.consent));
        }

        if (data.unsubscribe_token_hash !== undefined) {
          setClauses.push(`unsubscribe_token_hash = $${paramIdx++}`);
          values.push(data.unsubscribe_token_hash);
        }

        if (data.subscribed_at !== undefined) {
          setClauses.push(`subscribed_at = CURRENT_TIMESTAMP`);
        }

        if (data.unsubscribed_at !== undefined) {
          if (data.unsubscribed_at === null) {
            setClauses.push(`unsubscribed_at = NULL`);
          } else {
            setClauses.push(`unsubscribed_at = CURRENT_TIMESTAMP`);
          }
        }

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        const whereConditions = [];
        if (where.id) {
          whereConditions.push(`id = $${paramIdx++}`);
          values.push(where.id);
        }
        if (where.email) {
          const emailVal = where.email.equals !== undefined ? where.email.equals : where.email;
          whereConditions.push(`LOWER(email) = LOWER($${paramIdx++})`);
          values.push(emailVal);
        }

        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `
          UPDATE subscribers
          SET ${setClauses.join(', ')}
          WHERE ${whereConditions.join(' AND ')}
          RETURNING ${cols};
        `;
        const { rows } = await pool.query(sql, values);
        return rows[0] || null;
      },

      /**
       * Translates prisma.subscribers.updateMany({ where, data })
       * Atomically executes UPDATE ... WHERE ...
       * Returns { count: number }
       */
      async updateMany({ where = {}, data = {} } = {}) {
        const setClauses = [];
        const values = [];
        let paramIdx = 1;

        if (data.consent !== undefined) {
          setClauses.push(`consent = $${paramIdx++}`);
          values.push(Boolean(data.consent));
        }

        if (data.unsubscribe_token_hash !== undefined) {
          setClauses.push(`unsubscribe_token_hash = $${paramIdx++}`);
          values.push(data.unsubscribe_token_hash);
        }

        if (data.unsubscribed_at !== undefined) {
          if (data.unsubscribed_at === null) {
            setClauses.push(`unsubscribed_at = NULL`);
          } else {
            setClauses.push(`unsubscribed_at = CURRENT_TIMESTAMP`);
          }
        }

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        const whereConditions = [];
        if (where.unsubscribe_token_hash !== undefined) {
          whereConditions.push(`unsubscribe_token_hash = $${paramIdx++}`);
          values.push(where.unsubscribe_token_hash);
        }
        if (where.unsubscribed_at === null) {
          whereConditions.push(`unsubscribed_at IS NULL`);
        } else if (where.unsubscribed_at !== undefined) {
          whereConditions.push(`unsubscribed_at = $${paramIdx++}`);
          values.push(where.unsubscribed_at);
        }
        if (where.id) {
          whereConditions.push(`id = $${paramIdx++}`);
          values.push(where.id);
        }
        if (where.email) {
          const emailVal = where.email.equals !== undefined ? where.email.equals : where.email;
          if (where.email.mode === 'insensitive') {
            whereConditions.push(`LOWER(email) = LOWER($${paramIdx++})`);
          } else {
            whereConditions.push(`email = $${paramIdx++}`);
          }
          values.push(emailVal);
        }

        const whereSql = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const sql = `
          UPDATE subscribers
          SET ${setClauses.join(', ')}
          ${whereSql};
        `;
        const res = await pool.query(sql, values);
        return { count: res.rowCount || 0 };
      },
    },

    contact_messages: {
      /**
       * Translates prisma.contact_messages.create({ data, select })
       */
      async create({ data = {}, select } = {}) {
        const name = data.name;
        const email = data.email ? data.email.toLowerCase() : null;
        const phone = data.phone || null;
        const subject = data.subject || null;
        const message = data.message;
        const status = data.status || 'NEW';
        const cols = select ? Object.keys(select).join(', ') : '*';

        const sql = `
          INSERT INTO contact_messages (name, email, phone, subject, message, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING ${cols};
        `;
        const { rows } = await pool.query(sql, [name, email, phone, subject, message, status]);
        return rows[0];
      },

      /**
       * Translates prisma.contact_messages.findUnique({ where, select })
       */
      async findUnique({ where = {}, select } = {}) {
        if (!where.id) return null;
        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `SELECT ${cols} FROM contact_messages WHERE id = $1 LIMIT 1;`;
        const { rows } = await pool.query(sql, [where.id]);
        return rows[0] || null;
      },

      /**
       * Translates prisma.contact_messages.findMany({ where, select, orderBy, skip, take })
       */
      async findMany({ where = {}, select, orderBy = [], skip = 0, take = 50 } = {}) {
        const conditions = [];
        const values = [];
        let paramIdx = 1;

        if (where.id) {
          conditions.push(`id = $${paramIdx++}`);
          values.push(where.id);
        }

        if (where.email) {
          conditions.push(`LOWER(email) = LOWER($${paramIdx++})`);
          values.push(where.email);
        }

        if (where.status) {
          conditions.push(`status = $${paramIdx++}`);
          values.push(where.status);
        }

        const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const cols = select ? Object.keys(select).join(', ') : '*';
        const limitSql = `LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        const finalValues = [...values, take, skip];

        const sql = `SELECT ${cols} FROM contact_messages ${whereSql} ORDER BY created_at DESC ${limitSql};`;
        const { rows } = await pool.query(sql, finalValues);
        return rows;
      },

      /**
       * Translates prisma.contact_messages.update({ where, data, select })
       */
      async update({ where = {}, data = {}, select } = {}) {
        if (!where.id) return null;
        const setClauses = [];
        const values = [];
        let paramIdx = 1;

        if (data.status !== undefined) {
          setClauses.push(`status = $${paramIdx++}`);
          values.push(data.status);
        }

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(where.id);

        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `
          UPDATE contact_messages
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIdx}
          RETURNING ${cols};
        `;
        const { rows } = await pool.query(sql, values);
        return rows[0] || null;
      },

      /**
       * Translates prisma.contact_messages.count({ where })
       */
      async count({ where = {} } = {}) {
        const conditions = [];
        const values = [];
        let paramIdx = 1;

        if (where.status) {
          conditions.push(`status = $${paramIdx++}`);
          values.push(where.status);
        }

        if (where.email) {
          conditions.push(`LOWER(email) = LOWER($${paramIdx++})`);
          values.push(where.email);
        }

        const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `SELECT COUNT(*)::int AS count FROM contact_messages ${whereSql};`;
        const { rows } = await pool.query(sql, values);
        return rows[0]?.count || 0;
      },
    },

    consultation_types: {
      /**
       * Translates prisma.consultation_types.findMany({ where, orderBy })
       */
      async findMany({ where = {}, orderBy = [] } = {}) {
        let sql = 'SELECT * FROM consultation_types';
        const params = [];
        if (where.is_active !== undefined) {
          sql += ` WHERE is_active = $1`;
          params.push(where.is_active);
        }
        sql += ' ORDER BY display_order ASC, name ASC;';
        const { rows } = await pool.query(sql, params);
        return rows;
      },

      /**
       * Translates prisma.consultation_types.findUnique({ where })
       */
      async findUnique({ where = {} } = {}) {
        if (where.id) {
          const { rows } = await pool.query('SELECT * FROM consultation_types WHERE id = $1;', [where.id]);
          return rows[0] || null;
        }
        if (where.slug) {
          const { rows } = await pool.query('SELECT * FROM consultation_types WHERE slug = $1;', [where.slug]);
          return rows[0] || null;
        }
        return null;
      },

      /**
       * Translates prisma.consultation_types.findFirst({ where })
       */
      async findFirst({ where = {} } = {}) {
        return this.findUnique({ where });
      },
    },

    availability_rules: {
      /**
       * Translates prisma.availability_rules.findMany({ where, orderBy })
       */
      async findMany({ where = {} } = {}) {
        let typeId = null;
        if (where.OR && Array.isArray(where.OR)) {
          const typeClause = where.OR.find((c) => c.consultation_type_id !== null && c.consultation_type_id !== undefined);
          if (typeClause) {
            typeId = typeClause.consultation_type_id;
          }
        }
        const query = `
          SELECT id, consultation_type_id, day_of_week, start_time, end_time,
                 break_start, break_end, is_active
          FROM availability_rules
          WHERE is_active = true
            AND (consultation_type_id = $1 OR consultation_type_id IS NULL)
          ORDER BY day_of_week ASC, consultation_type_id NULLS LAST;
        `;
        const { rows } = await pool.query(query, [typeId]);
        return rows;
      },
    },

    availability_overrides: {
      /**
       * Translates prisma.availability_overrides.findMany({ where, orderBy })
       */
      async findMany({ where = {} } = {}) {
        const start = where.override_date?.gte ? new Date(where.override_date.gte).toISOString().slice(0, 10) : null;
        const end = where.override_date?.lte ? new Date(where.override_date.lte).toISOString().slice(0, 10) : null;
        let typeId = null;
        if (where.OR && Array.isArray(where.OR)) {
          const typeClause = where.OR.find((c) => c.consultation_type_id !== null && c.consultation_type_id !== undefined);
          if (typeClause) {
            typeId = typeClause.consultation_type_id;
          }
        }
        const query = `
          SELECT id, consultation_type_id, override_date, is_available,
                 start_time, end_time, reason
          FROM availability_overrides
          WHERE override_date >= $1 AND override_date <= $2
            AND (consultation_type_id = $3 OR consultation_type_id IS NULL)
          ORDER BY override_date ASC;
        `;
        const { rows } = await pool.query(query, [start, end, typeId]);
        return rows;
      },
    },

    consultations: {
      /**
       * Translates prisma.consultations.findUnique({ where, select, include })
       */
      async findUnique({ where = {}, select, include } = {}) {
        if (where.id) {
          const query = `
            SELECT c.*, t.name as type_name, t.slug as type_slug,
                   t.duration_minutes as type_duration_minutes, t.price_display as type_price_display
            FROM consultations c
            LEFT JOIN consultation_types t ON c.consultation_type_id = t.id
            WHERE c.id = $1;
          `;
          const { rows } = await pool.query(query, [where.id]);
          if (!rows[0]) return null;
          return formatConsultationRowWithInclude(rows[0], include);
        }
        if (where.booking_reference) {
          const { rows } = await pool.query('SELECT * FROM consultations WHERE booking_reference = $1;', [where.booking_reference]);
          return rows[0] || null;
        }
        return null;
      },

      /**
       * Translates prisma.consultations.findFirst({ where, select, include })
       */
      async findFirst({ where = {}, select, include } = {}) {
        if (where.idempotency_key && where.user_id) {
          const query = `
            SELECT c.*, t.name as type_name, t.slug as type_slug,
                   t.duration_minutes as type_duration_minutes, t.price_display as type_price_display
            FROM consultations c
            LEFT JOIN consultation_types t ON c.consultation_type_id = t.id
            WHERE c.idempotency_key = $1 AND c.user_id = $2;
          `;
          const { rows } = await pool.query(query, [where.idempotency_key, where.user_id]);
          if (!rows[0]) return null;
          return formatConsultationRowWithInclude(rows[0], include);
        }
        return null;
      },

      /**
       * Translates prisma.consultations.findMany({ where, select, include, orderBy, skip, take })
       */
      async findMany({ where = {}, select, include, orderBy = [], skip = 0, take = 50 } = {}) {
        // Range overlap query (getActiveBookingsInRange)
        if (where.slot_start && where.slot_start.lt && where.slot_end && where.slot_end.gt) {
          const end = where.slot_start.lt;
          const start = where.slot_end.gt;
          const query = `
            SELECT id, consultation_type_id, slot_start, slot_end, status
            FROM consultations
            WHERE status IN ('CONFIRMED', 'PENDING')
              AND slot_start < $2
              AND slot_end > $1
            ORDER BY slot_start ASC;
          `;
          const { rows } = await pool.query(query, [start, end]);
          return rows;
        }

        // findByUser query
        if (where.user_id) {
          let whereClause = 'WHERE c.user_id = $1';
          const params = [where.user_id];
          if (where.status && where.status.in) {
            whereClause += ` AND c.status IN ('CONFIRMED', 'PENDING') AND c.slot_start >= CURRENT_TIMESTAMP`;
          } else if (where.OR) {
            whereClause += ` AND (c.status IN ('COMPLETED', 'CANCELLED') OR (c.status IN ('CONFIRMED', 'PENDING') AND c.slot_start < CURRENT_TIMESTAMP))`;
          } else if (where.status) {
            params.push(where.status);
            whereClause += ` AND c.status = $${params.length}`;
          }

          const orderClause = where.status && where.status.in
            ? 'ORDER BY c.slot_start ASC'
            : 'ORDER BY c.slot_start DESC';

          params.push(take, skip);
          const query = `
            SELECT c.*, t.name as type_name, t.slug as type_slug,
                   t.duration_minutes as type_duration_minutes, t.price_display as type_price_display
            FROM consultations c
            LEFT JOIN consultation_types t ON c.consultation_type_id = t.id
            ${whereClause}
            ${orderClause}
            LIMIT $${params.length - 1} OFFSET $${params.length};
          `;
          const { rows } = await pool.query(query, params);
          return rows.map((r) => formatConsultationRowWithInclude(r, include));
        }

        const { rows } = await pool.query('SELECT * FROM consultations;');
        return rows;
      },

      /**
       * Translates prisma.consultations.count({ where })
       */
      async count({ where = {} } = {}) {
        if (where.user_id) {
          let whereClause = 'WHERE user_id = $1';
          const params = [where.user_id];
          if (where.status && where.status.in) {
            whereClause += ` AND status IN ('CONFIRMED', 'PENDING') AND slot_start >= CURRENT_TIMESTAMP`;
          } else if (where.OR) {
            whereClause += ` AND (status IN ('COMPLETED', 'CANCELLED') OR (status IN ('CONFIRMED', 'PENDING') AND slot_start < CURRENT_TIMESTAMP))`;
          } else if (where.status) {
            params.push(where.status);
            whereClause += ` AND status = $${params.length}`;
          }
          const { rows } = await pool.query(`SELECT count(*)::int as count FROM consultations ${whereClause};`, params);
          return rows[0]?.count || 0;
        }
        const { rows } = await pool.query('SELECT count(*)::int as count FROM consultations;');
        return rows[0]?.count || 0;
      },

      /**
       * Translates prisma.consultations.create({ data, select })
       */
      async create({ data = {}, select } = {}) {
        const query = `
          INSERT INTO consultations (
            user_id, consultation_type_id, full_name, email, phone, pillar_interest,
            goals, slot_start, slot_end, timezone, status, booking_reference, idempotency_key
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        const values = [
          data.user_id,
          data.consultation_type_id,
          data.full_name,
          data.email,
          data.phone || '',
          data.pillar_interest || 'General Sanctuary Guidance',
          data.goals || null,
          data.slot_start,
          data.slot_end,
          data.timezone || 'Asia/Kolkata',
          data.status || 'CONFIRMED',
          data.booking_reference,
          data.idempotency_key,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
      },

      /**
       * Translates prisma.consultations.update({ where, data, select })
       */
      async update({ where = {}, data = {}, select } = {}) {
        const setClauses = [];
        const values = [];
        let paramIdx = 1;

        if (data.status !== undefined) {
          setClauses.push(`status = $${paramIdx++}`);
          values.push(data.status);
        }
        if (data.cancelled_at !== undefined) {
          setClauses.push(`cancelled_at = $${paramIdx++}`);
          values.push(data.cancelled_at);
        }
        if (data.cancellation_reason !== undefined) {
          setClauses.push(`cancellation_reason = $${paramIdx++}`);
          values.push(data.cancellation_reason);
        }
        if (data.slot_start !== undefined) {
          setClauses.push(`slot_start = $${paramIdx++}`);
          values.push(data.slot_start);
        }
        if (data.slot_end !== undefined) {
          setClauses.push(`slot_end = $${paramIdx++}`);
          values.push(data.slot_end);
        }

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(where.id);

        const query = `
          UPDATE consultations
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIdx}
          RETURNING *;
        `;
        const { rows } = await pool.query(query, values);
        return rows[0] || null;
      },
    },

    users: {
      /**
       * Translates prisma.users.findUnique({ where, select })
       */
      async findUnique({ where = {}, select } = {}) {
        const cols = select ? Object.keys(select).join(', ') : '*';
        if (where.id) {
          const { rows } = await pool.query(`SELECT ${cols} FROM users WHERE id = $1 LIMIT 1;`, [where.id]);
          return rows[0] || null;
        }
        if (where.email) {
          const emailVal = where.email.equals !== undefined ? where.email.equals : where.email;
          const { rows } = await pool.query(`SELECT ${cols} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`, [emailVal]);
          return rows[0] || null;
        }
        if (where.google_id) {
          const { rows } = await pool.query(`SELECT ${cols} FROM users WHERE google_id = $1 LIMIT 1;`, [where.google_id]);
          return rows[0] || null;
        }
        return null;
      },

      /**
       * Translates prisma.users.findFirst({ where, select })
       */
      async findFirst({ where = {}, select } = {}) {
        return this.findUnique({ where, select });
      },

      /**
       * Translates prisma.users.create({ data, select })
       */
      async create({ data = {}, select } = {}) {
        const name = data.name ? data.name.trim() : '';
        const email = data.email ? data.email.trim().toLowerCase() : '';
        const passwordHash = data.password_hash || null;
        const googleId = data.google_id || null;
        const avatar = data.avatar || null;
        const role = data.role || 'USER';
        const authProvider = data.auth_provider || 'local';
        const isActive = data.is_active !== undefined ? Boolean(data.is_active) : true;
        const cols = select ? Object.keys(select).join(', ') : '*';

        const sql = `
          INSERT INTO users (name, email, password_hash, google_id, avatar, role, auth_provider, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING ${cols};
        `;
        const values = [name, email, passwordHash, googleId, avatar, role, authProvider, isActive];
        const { rows } = await pool.query(sql, values);
        return rows[0];
      },

      /**
       * Translates prisma.users.update({ where, data, select })
       */
      async update({ where = {}, data = {}, select } = {}) {
        if (!where.id) return null;
        const setClauses = [];
        const values = [];
        let paramIdx = 1;

        if (data.google_id !== undefined) {
          setClauses.push(`google_id = $${paramIdx++}`);
          values.push(data.google_id);
        }

        if (data.avatar !== undefined) {
          setClauses.push(`avatar = $${paramIdx++}`);
          values.push(data.avatar);
        }

        if (data.auth_provider !== undefined) {
          setClauses.push(`auth_provider = $${paramIdx++}`);
          values.push(data.auth_provider);
        }

        if (data.last_login_at !== undefined) {
          setClauses.push(`last_login_at = $${paramIdx++}`);
          values.push(data.last_login_at);
        }

        if (data.is_active !== undefined) {
          setClauses.push(`is_active = $${paramIdx++}`);
          values.push(Boolean(data.is_active));
        }

        if (data.name !== undefined) {
          setClauses.push(`name = $${paramIdx++}`);
          values.push(data.name);
        }

        if (data.role !== undefined) {
          setClauses.push(`role = $${paramIdx++}`);
          values.push(data.role);
        }

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(where.id);

        const cols = select ? Object.keys(select).join(', ') : '*';
        const sql = `
          UPDATE users
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIdx}
          RETURNING ${cols};
        `;
        const { rows } = await pool.query(sql, values);
        return rows[0] || null;
      },
    },

    /**
     * Translates prisma.$transaction(callback)
     * For pg.Pool instances, secures a dedicated client and manages BEGIN / COMMIT / ROLLBACK.
     */
    async $transaction(callback) {
      if (typeof pool.connect === 'function') {
        const client = await pool.connect();
        try {
          await client.query('BEGIN;');
          const txAdapter = createPrismaPgAdapter(client);
          const result = await callback(txAdapter);
          await client.query('COMMIT;');
          return result;
        } catch (err) {
          try {
            await client.query('ROLLBACK;');
          } catch (rbErr) {}
          throw err;
        } finally {
          client.release();
        }
      }
      return callback(this);
    },

    /**
     * Translates prisma.$executeRaw`...`
     *
     * Advisory-lock compatibility: pg_advisory_xact_lock is unsupported in pg-mem.
     * Only that specific function call is silently treated as a no-op.
     * All other SQL errors are re-thrown so callers are not misled by silent failures.
     */
    async $executeRaw(strings, ...values) {
      const { sql, params } = parseTaggedTemplate(strings, values);
      try {
        const res = await pool.query(sql, params);
        return res.rowCount || 1;
      } catch (err) {
        // Allow pg-mem to silently skip advisory lock calls it cannot execute.
        // Any other failure must propagate to the caller.
        if (sql.includes('pg_advisory_xact_lock')) {
          return 1;
        }
        throw err;
      }
    },

    /**
     * Translates prisma.$queryRaw`...`
     */
    async $queryRaw(strings, ...values) {
      const { sql, params } = parseTaggedTemplate(strings, values);
      const res = await pool.query(sql, params);
      return res.rows;
    },
  };
}

/**
 * Helper to parse Prisma tagged template literals into parameterized SQL ($1, $2, ...)
 */
function parseTaggedTemplate(strings, values) {
  if (Array.isArray(strings) && strings.raw) {
    let sql = '';
    const params = [];
    for (let i = 0; i < strings.length; i++) {
      sql += strings[i];
      if (i < values.length) {
        params.push(values[i]);
        sql += `$${params.length}`;
      }
    }
    return { sql, params };
  }
  return { sql: String(strings), params: values };
}

/**
 * Helper to structure consultation row with nested consultation_types relation
 */
function formatConsultationRowWithInclude(row, include) {
  if (!row) return null;
  if (include && include.consultation_types) {
    return {
      ...row,
      consultation_types: {
        name: row.type_name,
        slug: row.type_slug,
        duration_minutes: row.type_duration_minutes,
        price_display: row.type_price_display,
      },
    };
  }
  return row;
}

/**
 * Internal helper to construct WHERE clauses from Prisma-like article filter objects.
 */
function buildArticleWhere(where) {
  const conditions = [];
  const values = [];
  let paramIdx = 1;

  if (where.status) {
    conditions.push(`status = $${paramIdx++}`);
    values.push(where.status);
  }

  if (where.category) {
    if (where.category.mode === 'insensitive') {
      conditions.push(`LOWER(category) = LOWER($${paramIdx++})`);
      values.push(where.category.equals);
    } else {
      conditions.push(`category = $${paramIdx++}`);
      values.push(where.category.equals || where.category);
    }
  }

  if (where.slug) {
    if (where.slug.mode === 'insensitive') {
      conditions.push(`LOWER(slug) = LOWER($${paramIdx++})`);
      values.push(where.slug.equals);
    } else {
      conditions.push(`slug = $${paramIdx++}`);
      values.push(where.slug.equals || where.slug);
    }
  }

  if (where.OR && Array.isArray(where.OR)) {
    const orConditions = [];
    for (const clause of where.OR) {
      if (clause.title && clause.title.contains) {
        orConditions.push(`title ILIKE $${paramIdx}`);
        values.push(`%${clause.title.contains}%`);
        paramIdx++;
      } else if (clause.excerpt && clause.excerpt.contains) {
        orConditions.push(`excerpt ILIKE $${paramIdx}`);
        values.push(`%${clause.excerpt.contains}%`);
        paramIdx++;
      }
    }
    if (orConditions.length) {
      conditions.push(`(${orConditions.join(' OR ')})`);
    }
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, values };
}

export default createPrismaPgAdapter;
