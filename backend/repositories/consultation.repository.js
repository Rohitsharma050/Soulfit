import crypto from 'crypto';
import { prisma as defaultPrisma } from '../config/prisma.js';
import { createPrismaPgAdapter } from '../config/prismaAdapter.js';
import { ApiError } from '../utils/ApiError.js';

export const SANCTUARY_TIMEZONE = 'Asia/Kolkata';
export const MAX_RESCHEDULE_ATTEMPTS = 3;

/**
 * Dedicated error class indicating a preflight reschedule snapshot was invalidated
 * by a concurrent modification before row lock acquisition.
 */
export class StaleRescheduleSnapshotError extends Error {
  constructor(message = 'Stale reschedule snapshot detected') {
    super(message);
    this.name = 'StaleRescheduleSnapshotError';
    this.isStaleSnapshot = true;
  }
}

/**
 * Normalizes PostgreSQL TIME values (deserialized by Prisma as Date) to "HH:MM:SS"
 */
export function formatDbTimeToTimeString(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.slice(0, 8);
  if (val instanceof Date) {
    return val.toISOString().slice(11, 19);
  }
  return String(val);
}

/**
 * Normalizes PostgreSQL DATE values (deserialized by Prisma as Date) to "YYYY-MM-DD"
 */
export function formatDbDateToDateString(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  return String(val);
}

/**
 * Formats a Date/Timestamp into the canonical Sanctuary Business Date (YYYY-MM-DD in Asia/Kolkata)
 */
export function formatToSanctuaryDateStr(val) {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return d.toLocaleDateString('en-CA', { timeZone: SANCTUARY_TIMEZONE });
}

/**
 * Flattens consultation relation properties for backward compatibility with existing services & controllers
 */
export function mapConsultationRecord(booking) {
  if (!booking) return null;
  const { consultation_types, ...rest } = booking;
  return {
    ...rest,
    type_name: consultation_types?.name ?? booking.type_name ?? null,
    type_slug: consultation_types?.slug ?? booking.type_slug ?? null,
    type_duration_minutes: consultation_types?.duration_minutes ?? booking.type_duration_minutes ?? null,
    type_price_display: consultation_types?.price_display ?? booking.type_price_display ?? null,
  };
}

export class ConsultationRepository {
  /**
   * Initializes repository with Prisma Client or test adapter.
   * Supports optional isolated test dependencies for stale snapshot and advisory lock failure simulation.
   * @param {Object} [client=defaultPrisma] - PrismaClient instance or test adapter
   * @param {Object} [options={}] - Configuration options
   * @param {Object} [options.staleSnapshotSimulator=null] - Test-only dependency for stale snapshot simulation
   * @param {Function|null} [options.advisoryLockFailureSimulator=null] - Test-only hook; when provided, called
   *   instead of executing the advisory lock SQL. If it throws, the transaction is rolled back and the error
   *   propagates to the caller (must NOT be a StaleRescheduleSnapshotError).
   */
  constructor(client = defaultPrisma, { staleSnapshotSimulator = null, advisoryLockFailureSimulator = null } = {}) {
    this.prisma =
      client && typeof client.query === 'function' && !client.consultations
        ? createPrismaPgAdapter(client)
        : client;
    this.staleSnapshotSimulator = staleSnapshotSimulator;
    this.advisoryLockFailureSimulator = advisoryLockFailureSimulator;
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
    const where = {};
    if (isActive !== null && isActive !== undefined) {
      where.is_active = Boolean(isActive);
    }

    const types = await this.prisma.consultation_types.findMany({
      where,
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' },
      ],
    });
    return types;
  }

  /**
   * Retrieves consultation type by ID.
   */
  async getTypeById(id) {
    if (!id) return null;
    const type = await this.prisma.consultation_types.findUnique({
      where: { id },
    });
    return type || null;
  }

  /**
   * Retrieves consultation type by slug.
   */
  async getTypeBySlug(slug) {
    if (!slug) return null;
    const type = await this.prisma.consultation_types.findUnique({
      where: { slug },
    });
    return type || null;
  }

  /**
   * Retrieves weekly recurring availability rules for a consultation type (with global fallbacks).
   * Normalizes TIME columns to "HH:MM:SS" strings for service-layer compatibility.
   */
  async getAvailabilityRules(typeId = null) {
    const rules = await this.prisma.availability_rules.findMany({
      where: {
        is_active: true,
        OR: [
          { consultation_type_id: typeId },
          { consultation_type_id: null },
        ],
      },
      orderBy: [
        { day_of_week: 'asc' },
        { consultation_type_id: 'desc' },
      ],
    });

    return rules.map((r) => ({
      ...r,
      start_time: formatDbTimeToTimeString(r.start_time),
      end_time: formatDbTimeToTimeString(r.end_time),
      break_start: formatDbTimeToTimeString(r.break_start),
      break_end: formatDbTimeToTimeString(r.break_end),
    }));
  }

  /**
   * Retrieves date-specific overrides (holidays / custom working hours).
   * Normalizes DATE to "YYYY-MM-DD" and TIME to "HH:MM:SS".
   */
  async getAvailabilityOverrides(startDate, endDate, typeId = null) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const overrides = await this.prisma.availability_overrides.findMany({
      where: {
        override_date: {
          gte: start,
          lte: end,
        },
        OR: [
          { consultation_type_id: typeId },
          { consultation_type_id: null },
        ],
      },
      orderBy: {
        override_date: 'asc',
      },
    });

    return overrides.map((o) => ({
      ...o,
      override_date: formatDbDateToDateString(o.override_date),
      start_time: formatDbTimeToTimeString(o.start_time),
      end_time: formatDbTimeToTimeString(o.end_time),
    }));
  }

  /**
   * Retrieves all active confirmed or pending bookings overlapping a date/time window.
   */
  async getActiveBookingsInRange(startDate, endDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    const bookings = await this.prisma.consultations.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        slot_start: { lt: end },
        slot_end: { gt: start },
      },
      select: {
        id: true,
        consultation_type_id: true,
        slot_start: true,
        slot_end: true,
        status: true,
      },
      orderBy: {
        slot_start: 'asc',
      },
    });

    return bookings;
  }

  /**
   * Retrieves consultation details by ID with consultation type details.
   */
  async findById(id) {
    if (!id) return null;
    const booking = await this.prisma.consultations.findUnique({
      where: { id },
      include: {
        consultation_types: {
          select: {
            name: true,
            slug: true,
            duration_minutes: true,
            price_display: true,
          },
        },
      },
    });
    return mapConsultationRecord(booking);
  }

  /**
   * Retrieves existing booking by idempotency key for duplicate request prevention.
   */
  async findByIdempotencyKey(key, userId) {
    if (!key) return null;
    const booking = await this.prisma.consultations.findFirst({
      where: {
        idempotency_key: key,
        user_id: userId,
      },
      include: {
        consultation_types: {
          select: {
            name: true,
            slug: true,
            duration_minutes: true,
            price_display: true,
          },
        },
      },
    });
    return mapConsultationRecord(booking);
  }

  /**
   * Retrieves consultations for a specific user with status filter & pagination.
   */
  async findByUser(userId, { status = 'all', limit = 20, offset = 0 } = {}) {
    const now = new Date();
    const where = { user_id: userId };

    if (status === 'upcoming') {
      where.status = { in: ['CONFIRMED', 'PENDING'] };
      where.slot_start = { gte: now };
    } else if (status === 'past') {
      where.OR = [
        { status: { in: ['COMPLETED', 'CANCELLED'] } },
        {
          status: { in: ['CONFIRMED', 'PENDING'] },
          slot_start: { lt: now },
        },
      ];
    } else if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    const total = await this.prisma.consultations.count({ where });

    const orderBy = status === 'upcoming'
      ? [{ slot_start: 'asc' }]
      : [{ slot_start: 'desc' }];

    const rows = await this.prisma.consultations.findMany({
      where,
      include: {
        consultation_types: {
          select: {
            name: true,
            slug: true,
            duration_minutes: true,
            price_display: true,
          },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    return {
      consultations: rows.map(mapConsultationRecord),
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
    timezone = SANCTUARY_TIMEZONE,
    idempotencyKey = null,
    targetDateStr = null,
  }) {
    const start = slotStart instanceof Date ? slotStart : new Date(slotStart);
    const end = slotEnd instanceof Date ? slotEnd : new Date(slotEnd);
    const canonicalTargetDateStr = formatToSanctuaryDateStr(start);

    return this.prisma.$transaction(async (tx) => {
      // 1. Acquire transaction-level advisory lock on target sanctuary date
      if (this.advisoryLockFailureSimulator) {
        this.advisoryLockFailureSimulator('booking_day_' + canonicalTargetDateStr);
      } else {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'booking_day_' + canonicalTargetDateStr}));`;
      }

      // 2. Check Idempotency Key
      if (idempotencyKey) {
        const idempRes = await tx.consultations.findFirst({
          where: {
            idempotency_key: idempotencyKey,
            user_id: userId,
          },
          include: {
            consultation_types: {
              select: {
                name: true,
                slug: true,
                duration_minutes: true,
                price_display: true,
              },
            },
          },
        });
        if (idempRes) {
          return { booking: mapConsultationRecord(idempRes), idempotentReplay: true };
        }
      }

      // 3. Concurrency Overlap Check inside transaction with row lock
      const overlapRows = await tx.$queryRaw`
        SELECT id, booking_reference FROM consultations
        WHERE status IN ('CONFIRMED', 'PENDING')
          AND slot_start < ${end}
          AND slot_end > ${start}
        FOR UPDATE;
      `;

      if (overlapRows.length > 0) {
        throw ApiError.conflict('The selected time slot has already been booked by another sanctuary member. Please select another time.');
      }

      // 4. Generate unique non-guessable booking reference
      let bookingRef = this.generateBookingReference();
      let refCheck = await tx.consultations.findUnique({
        where: { booking_reference: bookingRef },
        select: { id: true },
      });
      while (refCheck) {
        bookingRef = this.generateBookingReference();
        refCheck = await tx.consultations.findUnique({
          where: { booking_reference: bookingRef },
          select: { id: true },
        });
      }

      // 5. Insert consultation booking
      const inserted = await tx.consultations.create({
        data: {
          user_id: userId,
          consultation_type_id: consultationTypeId,
          full_name: fullName,
          email,
          phone: phone || '',
          pillar_interest: pillarInterest || 'General Sanctuary Guidance',
          goals: goals || null,
          slot_start: start,
          slot_end: end,
          timezone: timezone || SANCTUARY_TIMEZONE,
          status: 'CONFIRMED',
          booking_reference: bookingRef,
          idempotency_key: idempotencyKey,
        },
      });

      return { booking: inserted, idempotentReplay: false };
    });
  }

  /**
   * Cancels a booking atomically verifying ownership and status.
   */
  async cancelBooking({ id, userId, reason }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock row for update
      const checkRes = await tx.$queryRaw`
        SELECT * FROM consultations WHERE id = ${id}::uuid FOR UPDATE;
      `;
      if (!checkRes || checkRes.length === 0) {
        throw ApiError.notFound('Consultation booking not found.');
      }

      const booking = checkRes[0];
      if (booking.user_id !== userId) {
        throw ApiError.forbidden('You do not have authorization to cancel this consultation.');
      }

      if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
        throw ApiError.badRequest(`Consultation cannot be cancelled as it is already ${booking.status.toLowerCase()}.`);
      }

      // 2. Update booking status
      const updated = await tx.consultations.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelled_at: new Date(),
          cancellation_reason: reason || 'Cancelled by member',
          updated_at: new Date(),
        },
      });

      return updated;
    });
  }

  /**
   * Reschedules an existing consultation to a new slot atomically with deadlock safety
   * and bounded retry against stale preflight snapshots.
   */
  async rescheduleBooking({ id, userId, newSlotStart, newSlotEnd, targetDateStr = null }) {
    const newStart = newSlotStart instanceof Date ? newSlotStart : new Date(newSlotStart);
    const newEnd = newSlotEnd instanceof Date ? newSlotEnd : new Date(newSlotEnd);
    const canonicalTargetDateStr = formatToSanctuaryDateStr(newStart);

    for (let attempt = 1; attempt <= MAX_RESCHEDULE_ATTEMPTS; attempt++) {
      // 1. Preflight booking snapshot read without row lock
      const snapshot = await this.prisma.consultations.findUnique({
        where: { id },
        select: { id: true, user_id: true, status: true, slot_start: true, slot_end: true },
      });

      if (!snapshot) {
        throw ApiError.notFound('Consultation booking not found.');
      }
      if (snapshot.user_id !== userId) {
        throw ApiError.forbidden('You do not have authorization to reschedule this consultation.');
      }
      if (!['CONFIRMED', 'PENDING'].includes(snapshot.status)) {
        throw ApiError.badRequest(`Consultation cannot be rescheduled as it is ${snapshot.status.toLowerCase()}.`);
      }

      const preflightSourceDateStr = formatToSanctuaryDateStr(snapshot.slot_start);

      try {
        return await this.prisma.$transaction(async (tx) => {
          // 2. Determine unique dates to lock and sort lexicographically
          const datesToLock = preflightSourceDateStr === canonicalTargetDateStr
            ? [canonicalTargetDateStr]
            : [preflightSourceDateStr, canonicalTargetDateStr].sort();

          // 3. Acquire advisory locks in strict canonical order
          for (const dateStr of datesToLock) {
            if (this.advisoryLockFailureSimulator) {
              this.advisoryLockFailureSimulator('booking_day_' + dateStr);
            } else {
              await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'booking_day_' + dateStr}));`;
            }
          }

          // 4. Acquire row lock on original booking
          const lockedRows = await tx.$queryRaw`
            SELECT * FROM consultations WHERE id = ${id}::uuid FOR UPDATE;
          `;
          if (!lockedRows || lockedRows.length === 0) {
            throw ApiError.notFound('Consultation booking not found.');
          }

          const currentBooking = lockedRows[0];
          if (currentBooking.user_id !== userId) {
            throw ApiError.forbidden('You do not have authorization to reschedule this consultation.');
          }
          if (!['CONFIRMED', 'PENDING'].includes(currentBooking.status)) {
            throw ApiError.badRequest(`Consultation cannot be rescheduled as it is ${currentBooking.status.toLowerCase()}.`);
          }

          // 5. Test simulator hook (isolated dependency)
          let actualSourceDateStr = formatToSanctuaryDateStr(currentBooking.slot_start);
          if (this.staleSnapshotSimulator && typeof this.staleSnapshotSimulator.getSimulatedDate === 'function') {
            actualSourceDateStr = this.staleSnapshotSimulator.getSimulatedDate(attempt, actualSourceDateStr);
          }

          // 6. Stale Snapshot Verification
          if (actualSourceDateStr !== preflightSourceDateStr) {
            throw new StaleRescheduleSnapshotError(
              `Stale snapshot: source date changed from ${preflightSourceDateStr} to ${actualSourceDateStr}`
            );
          }

          // 7. Concurrency Overlap Check on new slot (excluding self)
          const overlapRows = await tx.$queryRaw`
            SELECT id FROM consultations
            WHERE id != ${id}::uuid
              AND status IN ('CONFIRMED', 'PENDING')
              AND slot_start < ${newEnd}
              AND slot_end > ${newStart}
            FOR UPDATE;
          `;

          if (overlapRows.length > 0) {
            throw ApiError.conflict('The selected reschedule slot is no longer available. Please select another time.');
          }

          // 8. Update booking with new slot
          const updated = await tx.consultations.update({
            where: { id },
            data: {
              slot_start: newStart,
              slot_end: newEnd,
              updated_at: new Date(),
            },
          });

          return updated;
        });
      } catch (err) {
        if (err instanceof StaleRescheduleSnapshotError) {
          if (attempt < MAX_RESCHEDULE_ATTEMPTS) {
            // Wait 10-30 ms jittered backoff outside transaction
            const jitter = 10 + Math.random() * 20;
            await new Promise((r) => setTimeout(r, jitter));
            continue;
          }
          throw ApiError.conflict('Unable to reschedule consultation due to concurrent updates. Please try again.');
        }
        throw err;
      }
    }

    throw ApiError.conflict('Unable to reschedule consultation due to concurrent updates. Please try again.');
  }
}

export const consultationRepository = new ConsultationRepository();
export default consultationRepository;
