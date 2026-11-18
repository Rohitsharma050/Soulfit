import crypto from 'crypto';
import { pool as defaultPool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export class ConsultationRepository {
  constructor(pool = defaultPool) {
    this.pool = pool;
  }

  /**
   * Generates a human-friendly unique booking reference: HP-YYYY-XXXXXX
   */
  generateBookingReference() {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `HP-${year}-${randomHex}`;
  }

  /**
   * Retrieves all active or specified consultation types.
   */
  async getTypes({ isActive = true } = {}) {
    const query = `
      SELECT id, slug, name, description, duration_minutes, buffer_minutes,
             price_display, is_active, display_order, created_at, updated_at
      FROM consultation_types
      WHERE ($1::boolean IS NULL OR is_active = $1)
      ORDER BY display_order ASC, name ASC;
    `;
    const res = await this.pool.query(query, [isActive]);
    return res.rows;
  }

  /**
   * Retrieves consultation type by ID.
   */
  async getTypeById(id) {
    const res = await this.pool.query('SELECT * FROM consultation_types WHERE id = $1;', [id]);
    return res.rows[0] || null;
  }

  /**
   * Retrieves consultation type by slug.
   */
  async getTypeBySlug(slug) {
    const res = await this.pool.query('SELECT * FROM consultation_types WHERE slug = $1;', [slug]);
    return res.rows[0] || null;
  }

  /**
   * Retrieves weekly recurring availability rules for a consultation type (with global fallbacks).
   */
  async getAvailabilityRules(typeId = null) {
    const query = `
      SELECT id, consultation_type_id, day_of_week, start_time, end_time,
             break_start, break_end, is_active
      FROM availability_rules
      WHERE is_active = true
        AND (consultation_type_id = $1 OR consultation_type_id IS NULL)
      ORDER BY day_of_week ASC, consultation_type_id NULLS LAST;
    `;
    const res = await this.pool.query(query, [typeId]);
    return res.rows;
  }

  /**
   * Retrieves date-specific overrides (holidays / custom working hours).
   */
  async getAvailabilityOverrides(startDate, endDate, typeId = null) {
    const query = `
      SELECT id, consultation_type_id, override_date, is_available,
             start_time, end_time, reason
      FROM availability_overrides
      WHERE override_date >= $1 AND override_date <= $2
        AND (consultation_type_id = $3 OR consultation_type_id IS NULL)
      ORDER BY override_date ASC;
    `;
    const res = await this.pool.query(query, [startDate, endDate, typeId]);
    return res.rows;
  }

  /**
   * Retrieves all active confirmed or pending bookings overlapping a date/time window.
   */
  async getActiveBookingsInRange(startDate, endDate) {
    const query = `
      SELECT id, consultation_type_id, slot_start, slot_end, status
      FROM consultations
      WHERE status IN ('CONFIRMED', 'PENDING')
        AND slot_start < $2
        AND slot_end > $1
      ORDER BY slot_start ASC;
    `;
    const res = await this.pool.query(query, [startDate, endDate]);
    return res.rows;
  }

  /**
   * Retrieves consultation details by ID with consultation type details.
   */
  async findById(id) {
    const query = `
      SELECT c.*,
             t.name as type_name,
             t.slug as type_slug,
             t.duration_minutes as type_duration_minutes,
             t.price_display as type_price_display
      FROM consultations c
      LEFT JOIN consultation_types t ON c.consultation_type_id = t.id
      WHERE c.id = $1;
    `;
    const res = await this.pool.query(query, [id]);
    return res.rows[0] || null;
  }

  /**
   * Retrieves existing booking by idempotency key for duplicate request prevention.
   */
  async findByIdempotencyKey(key, userId) {
    if (!key) return null;
    const query = `
      SELECT c.*, t.name as type_name, t.slug as type_slug
      FROM consultations c
      LEFT JOIN consultation_types t ON c.consultation_type_id = t.id
      WHERE c.idempotency_key = $1 AND c.user_id = $2;
    `;
    const res = await this.pool.query(query, [key, userId]);
    return res.rows[0] || null;
  }

  /**
   * Retrieves consultations for a specific user with status filter & pagination.
   */
  async findByUser(userId, { status = 'all', limit = 20, offset = 0 } = {}) {
    let whereClause = 'WHERE c.user_id = $1';
    const params = [userId];

    if (status === 'upcoming') {
      whereClause += ` AND c.status IN ('CONFIRMED', 'PENDING') AND c.slot_start >= CURRENT_TIMESTAMP`;
    } else if (status === 'past') {
      whereClause += ` AND (c.status IN ('COMPLETED', 'CANCELLED') OR (c.status IN ('CONFIRMED', 'PENDING') AND c.slot_start < CURRENT_TIMESTAMP))`;
    } else if (status !== 'all') {
      params.push(status.toUpperCase());
      whereClause += ` AND c.status = $${params.length}`;
    }

    const countQuery = `SELECT COUNT(*) FROM consultations c ${whereClause};`;
    const countRes = await this.pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const orderClause = status === 'upcoming' ? 'ORDER BY c.slot_start ASC' : 'ORDER BY c.slot_start DESC';

    params.push(limit, offset);
    const dataQuery = `
      SELECT c.*,
             t.name as type_name,
             t.slug as type_slug,
             t.duration_minutes as type_duration_minutes,
             t.price_display as type_price_display
      FROM consultations c
      LEFT JOIN consultation_types t ON c.consultation_type_id = t.id
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const dataRes = await this.pool.query(dataQuery, params);
    return {
      consultations: dataRes.rows,
      total,
      limit,
      offset,
    };
  }

  /**
   * Creates a consultation booking inside a PostgreSQL transaction with concurrency locking.
   */
  async createBookingWithTransaction({
    userId,
    consultationTypeId,
    fullName,
    email,
    phone,
    pillarInterest,
    goals,
    slotStart,
    slotEnd,
    timezone = 'Asia/Kolkata',
    idempotencyKey = null,
    targetDateStr,
  }) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN;');

      // 1. Acquire transaction-level advisory lock on target date
      // Serializes concurrent booking attempts for the same calendar day while allowing other days to book in parallel.
      try {
        await client.query("SELECT pg_advisory_xact_lock(hashtext('booking_day_' || $1));", [targetDateStr]);
      } catch (lockErr) {
        // Safe fallback in environments like pg-mem without native advisory locks
      }

      // 2. Check Idempotency Key
      if (idempotencyKey) {
        const idempRes = await client.query(
          `SELECT c.*, t.name as type_name, t.slug as type_slug
           FROM consultations c
           LEFT JOIN consultation_types t ON c.consultation_type_id = t.id
           WHERE c.idempotency_key = $1 AND c.user_id = $2;`,
          [idempotencyKey, userId]
        );
        if (idempRes.rows.length > 0) {
          await client.query('COMMIT;');
          return { booking: idempRes.rows[0], idempotentReplay: true };
        }
      }

      // 3. Concurrency Overlap Check inside transaction
      const overlapQuery = `
        SELECT id, booking_reference FROM consultations
        WHERE status IN ('CONFIRMED', 'PENDING')
          AND slot_start < $2
          AND slot_end > $1
        FOR UPDATE;
      `;
      const overlapRes = await client.query(overlapQuery, [slotStart, slotEnd]);

      if (overlapRes.rows.length > 0) {
        await client.query('ROLLBACK;');
        throw ApiError.conflict('The selected time slot has already been booked by another sanctuary member. Please select another time.');
      }

      // 4. Generate unique non-guessable booking reference
      let bookingRef = this.generateBookingReference();
      let refCheck = await client.query('SELECT id FROM consultations WHERE booking_reference = $1;', [bookingRef]);
      while (refCheck.rows.length > 0) {
        bookingRef = this.generateBookingReference();
        refCheck = await client.query('SELECT id FROM consultations WHERE booking_reference = $1;', [bookingRef]);
      }

      // 5. Insert consultation booking
      const insertQuery = `
        INSERT INTO consultations (
          user_id, consultation_type_id, full_name, email, phone, pillar_interest,
          goals, slot_start, slot_end, timezone, status, booking_reference, idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'CONFIRMED', $11, $12)
        RETURNING *;
      `;
      const insertRes = await client.query(insertQuery, [
        userId,
        consultationTypeId,
        fullName,
        email,
        phone || '',
        pillarInterest || 'General Sanctuary Guidance',
        goals || null,
        slotStart,
        slotEnd,
        timezone,
        bookingRef,
        idempotencyKey,
      ]);

      await client.query('COMMIT;');
      return { booking: insertRes.rows[0], idempotentReplay: false };
    } catch (err) {
      try {
        await client.query('ROLLBACK;');
      } catch (rbErr) {
        // ignore rollback errors if connection was dropped
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancels a booking atomically verifying ownership and status.
   */
  async cancelBooking({ id, userId, reason }) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN;');

      // Lock row for update
      const checkRes = await client.query('SELECT * FROM consultations WHERE id = $1 FOR UPDATE;', [id]);
      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK;');
        throw ApiError.notFound('Consultation booking not found.');
      }

      const booking = checkRes.rows[0];
      if (booking.user_id !== userId) {
        await client.query('ROLLBACK;');
        throw ApiError.forbidden('You do not have authorization to cancel this consultation.');
      }

      if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
        await client.query('ROLLBACK;');
        throw ApiError.badRequest(`Consultation cannot be cancelled as it is already ${booking.status.toLowerCase()}.`);
      }

      const updateRes = await client.query(
        `UPDATE consultations
         SET status = 'CANCELLED',
             cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *;`,
        [reason || 'Cancelled by member', id]
      );

      await client.query('COMMIT;');
      return updateRes.rows[0];
    } catch (err) {
      try {
        await client.query('ROLLBACK;');
      } catch (rbErr) {}
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Reschedules an existing consultation to a new slot atomically.
   */
  async rescheduleBooking({ id, userId, newSlotStart, newSlotEnd, targetDateStr }) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN;');

      // 1. Lock original booking
      const checkRes = await client.query('SELECT * FROM consultations WHERE id = $1 FOR UPDATE;', [id]);
      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK;');
        throw ApiError.notFound('Consultation booking not found.');
      }

      const booking = checkRes.rows[0];
      if (booking.user_id !== userId) {
        await client.query('ROLLBACK;');
        throw ApiError.forbidden('You do not have authorization to reschedule this consultation.');
      }

      if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
        await client.query('ROLLBACK;');
        throw ApiError.badRequest(`Consultation cannot be rescheduled as it is ${booking.status.toLowerCase()}.`);
      }

      // 2. Lock target date
      try {
        await client.query("SELECT pg_advisory_xact_lock(hashtext('booking_day_' || $1));", [targetDateStr]);
      } catch (lockErr) {}

      // 3. Overlap check on new slot (excluding self)
      const overlapQuery = `
        SELECT id FROM consultations
        WHERE id != $1
          AND status IN ('CONFIRMED', 'PENDING')
          AND slot_start < $3
          AND slot_end > $2
        FOR UPDATE;
      `;
      const overlapRes = await client.query(overlapQuery, [id, newSlotStart, newSlotEnd]);

      if (overlapRes.rows.length > 0) {
        await client.query('ROLLBACK;');
        throw ApiError.conflict('The selected reschedule slot is no longer available. Please select another time.');
      }

      // 4. Update booking with new slot
      const updateRes = await client.query(
        `UPDATE consultations
         SET slot_start = $1,
             slot_end = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *;`,
        [newSlotStart, newSlotEnd, id]
      );

      await client.query('COMMIT;');
      return updateRes.rows[0];
    } catch (err) {
      try {
        await client.query('ROLLBACK;');
      } catch (rbErr) {}
      throw err;
    } finally {
      client.release();
    }
  }
}

export const consultationRepository = new ConsultationRepository();
export default consultationRepository;
