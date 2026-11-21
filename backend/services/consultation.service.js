import { ConsultationRepository, consultationRepository as defaultRepo } from '../repositories/consultation.repository.js';
import { notificationService } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';

export const SANCTUARY_TIMEZONE = 'Asia/Kolkata';

/**
 * Normalizes minutes from midnight to HH:MM format
 */
export function formatMinutesToTimeStr(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Extracts date and wall-clock time components in the specified timezone (default Asia/Kolkata).
 * Operates purely via Intl.DateTimeFormat to avoid any dependence on server local timezone.
 */
export function getSanctuaryDateTimeParts(date, timeZone = SANCTUARY_TIMEZONE) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(d);
  const partMap = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      partMap[p.type] = p.value;
    }
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const second = parseInt(partMap.second, 10);

  const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const minutesFromMidnight = hour * 60 + minute;
  // Day of week in target timezone (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateStr,
    minutesFromMidnight,
    dayOfWeek,
  };
}

export class ConsultationService {
  constructor(repository = defaultRepo, notifier = notificationService) {
    this.repository = repository;
    this.notifier = notifier;
    // Configurable booking policy in hours
    this.cancellationNoticeHours = 2;
    this.rescheduleNoticeHours = 2;
    this.defaultTimezone = 'Asia/Kolkata';
  }

  /**
   * Retrieves all active consultation offerings.
   */
  async getAllTypes() {
    return this.repository.getTypes({ isActive: true });
  }

  /**
   * Retrieves single consultation type by ID or slug.
   */
  async getTypeByIdOrSlug(identifier) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const type = isUuid
      ? await this.repository.getTypeById(identifier)
      : await this.repository.getTypeBySlug(identifier);

    if (!type || !type.is_active) {
      throw ApiError.notFound(`Consultation type "${identifier}" was not found or is inactive.`);
    }
    return type;
  }

  /**
   * Helper to format time into 12-hour AM/PM string.
   */
  formatTime(date, timeZone = 'Asia/Kolkata') {
    return date.toLocaleTimeString('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Helper to parse "HH:MM:SS" into minutes from midnight.
   */
  timeStrToMinutes(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  /**
   * Helper to get start and end of day in target timezone.
   */
  getDayRangeIso(dateStr, timeZone = 'Asia/Kolkata') {
    // Treat dateStr (YYYY-MM-DD) in Asia/Kolkata (+05:30)
    const startIso = `${dateStr}T00:00:00+05:30`;
    const endIso = `${dateStr}T23:59:59+05:30`;
    return {
      start: new Date(startIso),
      end: new Date(endIso),
    };
  }

  /**
   * Reusable server-side slot validator enforcing sanctuary calendar boundaries,
   * operating hours, and consultation type invariants.
   *
   * @param {Object} params
   * @param {Date|string} params.start - Slot start timestamp
   * @param {Date|string} params.end - Slot end timestamp
   * @param {Object} params.consultationType - Consultation type record
   * @param {string} [params.timeZone] - Timezone (evaluated in Asia/Kolkata for sanctuary rules)
   */
  async validateSlotWithinSanctuaryRules({
    start,
    end,
    consultationType,
    timeZone = this.defaultTimezone,
  }) {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);

    // 1. Start and end timestamps are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw ApiError.badRequest('Invalid consultation slot timestamp.');
    }

    // 2. Start is strictly before end
    if (startDate.getTime() >= endDate.getTime()) {
      throw ApiError.badRequest('Slot start time must be strictly before slot end time.');
    }

    // Explicit sanctuary timezone conversion (Asia/Kolkata)
    const startParts = getSanctuaryDateTimeParts(startDate, SANCTUARY_TIMEZONE);
    const endParts = getSanctuaryDateTimeParts(endDate, SANCTUARY_TIMEZONE);

    if (!startParts || !endParts) {
      throw ApiError.badRequest('Failed to parse slot timestamps in sanctuary timezone.');
    }

    // 3. Both timestamps belong to the same sanctuary calendar date in Asia/Kolkata
    if (startParts.dateStr !== endParts.dateStr) {
      throw ApiError.badRequest('Consultation slot cannot cross calendar day boundaries.');
    }

    // 6. The slot duration matches the applicable consultation type duration
    if (consultationType?.duration_minutes) {
      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));
      if (durationMinutes !== consultationType.duration_minutes) {
        throw ApiError.badRequest(
          `Selected slot duration of ${durationMinutes} minutes does not match required duration of ${consultationType.duration_minutes} minutes.`
        );
      }
    }

    const dateStr = startParts.dateStr;
    const dayOfWeek = startParts.dayOfWeek;

    // Check date overrides (holidays / custom working hours)
    const overrides = await this.repository.getAvailabilityOverrides(dateStr, dateStr, consultationType?.id || null);
    const override = overrides[0] || null;

    if (override && !override.is_available) {
      throw ApiError.badRequest(override.reason || 'Sanctuary is closed on this date.');
    }

    // Check weekly availability rules
    const rules = await this.repository.getAvailabilityRules(consultationType?.id || null);
    const rule = rules.find((r) => r.day_of_week === dayOfWeek) || null;

    if (!rule || !rule.is_active) {
      throw ApiError.badRequest('No scheduled availability on this day of the week.');
    }

    // Effective working hours from availability configuration
    const startTimeStr = override?.start_time || rule.start_time;
    const endTimeStr = override?.end_time || rule.end_time;

    const openMinutes = this.timeStrToMinutes(startTimeStr);
    const closeMinutes = this.timeStrToMinutes(endTimeStr);

    const slotStartMinutes = startParts.minutesFromMidnight;
    const slotEndMinutes = endParts.minutesFromMidnight;

    // 4. The slot starts no earlier than the configured opening time
    if (slotStartMinutes < openMinutes) {
      throw ApiError.badRequest(
        `Selected slot start time (${formatMinutesToTimeStr(slotStartMinutes)}) is earlier than sanctuary opening time (${startTimeStr.slice(0, 5)}).`
      );
    }

    // 5. The slot ends no later than the configured closing time
    if (slotEndMinutes > closeMinutes) {
      throw ApiError.badRequest(
        `Selected slot end time (${formatMinutesToTimeStr(slotEndMinutes)}) is later than sanctuary closing time (${endTimeStr.slice(0, 5)}).`
      );
    }

    return true;
  }

  /**
   * Alias for validateSlotWithinSanctuaryRules
   */
  async validateSlot(params) {
    return this.validateSlotWithinSanctuaryRules(params);
  }

  /**
   * Computes available slots for a specific date and consultation type.
   */
  async getAvailableSlots({ typeId, dateStr, timeZone = this.defaultTimezone }) {
    const consultationType = await this.getTypeByIdOrSlug(typeId);

    // Parse date parts
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) {
      throw ApiError.badRequest('Invalid date format. Expected YYYY-MM-DD.');
    }

    // Determine day of week (0 = Sunday, 1 = Monday ... 6 = Saturday)
    // Create Date at noon UTC to safely determine weekday
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = utcDate.getUTCDay();

    // Check date overrides (holidays / custom hours)
    const { start: dayStart, end: dayEnd } = this.getDayRangeIso(dateStr, timeZone);
    const overrides = await this.repository.getAvailabilityOverrides(dateStr, dateStr, consultationType.id);
    const override = overrides[0] || null;

    if (override && !override.is_available) {
      return {
        date: dateStr,
        timeZone,
        consultationType,
        isAvailable: false,
        reason: override.reason || 'Sanctuary closed on this date.',
        slots: [],
      };
    }

    // Check weekly availability rules
    const rules = await this.repository.getAvailabilityRules(consultationType.id);
    const rule = rules.find((r) => r.day_of_week === dayOfWeek) || null;

    if (!rule || !rule.is_active) {
      return {
        date: dateStr,
        timeZone,
        consultationType,
        isAvailable: false,
        reason: 'No scheduled availability on this day of the week.',
        slots: [],
      };
    }

    // Effective working hours & breaks
    const startTimeStr = override?.start_time || rule.start_time;
    const endTimeStr = override?.end_time || rule.end_time;
    const breakStartStr = override ? null : rule.break_start;
    const breakEndStr = override ? null : rule.break_end;

    const startMinutes = this.timeStrToMinutes(startTimeStr);
    const endMinutes = this.timeStrToMinutes(endTimeStr);
    const breakStartMinutes = this.timeStrToMinutes(breakStartStr);
    const breakEndMinutes = this.timeStrToMinutes(breakEndStr);

    const duration = consultationType.duration_minutes;
    const buffer = consultationType.buffer_minutes;

    // Fetch existing confirmed/pending bookings on this day
    const activeBookings = await this.repository.getActiveBookingsInRange(dayStart, dayEnd);

    // Current timestamp with 30-minute buffer to prevent last-second bookings
    const now = new Date();
    const cutoffTime = new Date(now.getTime() + 30 * 60 * 1000);

    const slots = [];
    let currentSlotStartMinutes = startMinutes;

    while (currentSlotStartMinutes + duration <= endMinutes) {
      const currentSlotEndMinutes = currentSlotStartMinutes + duration;

      // Check break overlap
      let overlapsBreak = false;
      if (breakStartMinutes !== null && breakEndMinutes !== null) {
        if (currentSlotStartMinutes < breakEndMinutes && currentSlotEndMinutes > breakStartMinutes) {
          overlapsBreak = true;
        }
      }

      if (!overlapsBreak) {
        // Construct ISO strings for slot
        const startH = String(Math.floor(currentSlotStartMinutes / 60)).padStart(2, '0');
        const startM = String(currentSlotStartMinutes % 60).padStart(2, '0');
        const endH = String(Math.floor(currentSlotEndMinutes / 60)).padStart(2, '0');
        const endM = String(currentSlotEndMinutes % 60).padStart(2, '0');

        const slotStart = new Date(`${dateStr}T${startH}:${startM}:00+05:30`);
        const slotEnd = new Date(`${dateStr}T${endH}:${endM}:00+05:30`);

        // Slot must be in future beyond cutoff
        const isFuture = slotStart > cutoffTime;

        // Check active booking collision
        const isCollision = activeBookings.some((b) => {
          const bStart = new Date(b.slot_start);
          const bEnd = new Date(b.slot_end);
          return slotStart < bEnd && slotEnd > bStart;
        });

        if (isFuture && !isCollision) {
          slots.push({
            id: `${dateStr}_${startH}${startM}`,
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            startTimeFormatted: this.formatTime(slotStart, timeZone),
            endTimeFormatted: this.formatTime(slotEnd, timeZone),
            formattedTime: `${this.formatTime(slotStart, timeZone)} - ${this.formatTime(slotEnd, timeZone)}`,
            durationMinutes: duration,
            available: true,
          });
        }
        currentSlotStartMinutes += duration + buffer;
      } else {
        // When overlapping a scheduled break, advance to after the break period
        currentSlotStartMinutes = Math.max(currentSlotStartMinutes + duration + buffer, breakEndMinutes);
      }
    }

    return {
      date: dateStr,
      timeZone,
      consultationType,
      isAvailable: slots.length > 0,
      slots,
    };
  }

  /**
   * Retrieves dates in a range that have at least one available slot.
   */
  async getAvailableDates({ typeId, month = null, startDate = null, endDate = null, timeZone = this.defaultTimezone }) {
    const consultationType = await this.getTypeByIdOrSlug(typeId);

    let start = new Date();
    let end = new Date();

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      start = new Date(Date.UTC(y, m - 1, 1));
      end = new Date(Date.UTC(y, m, 0)); // last day of month
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default: next 30 days
      end.setDate(end.getDate() + 30);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const availableDates = [];

    // Loop through each day
    const iter = new Date(start);
    const maxDays = 60;
    let dayCount = 0;

    while (iter <= end && dayCount < maxDays) {
      const dateStr = iter.toISOString().split('T')[0];
      if (dateStr >= todayStr) {
        const slotData = await this.getAvailableSlots({
          typeId: consultationType.id,
          dateStr,
          timeZone,
        });

        if (slotData.slots.length > 0) {
          availableDates.push(dateStr);
        }
      }
      iter.setDate(iter.getDate() + 1);
      dayCount++;
    }

    return {
      availableDates,
      consultationType,
      timeZone,
    };
  }

  /**
   * Books a consultation safely inside a transaction with concurrency protection.
   */
  async bookConsultation({
    user,
    typeId,
    slotStart,
    goals = null,
    notes = null,
    phone = null,
    idempotencyKey = null,
    timeZone = this.defaultTimezone,
  }) {
    if (!user || !user.id) {
      throw ApiError.unauthorized('Authentication required to book a consultation.');
    }

    const consultationType = await this.getTypeByIdOrSlug(typeId);

    const start = new Date(slotStart);
    if (isNaN(start.getTime())) {
      throw ApiError.badRequest('Invalid slotStart timestamp.');
    }

    const now = new Date();
    if (start <= now) {
      throw ApiError.badRequest('Cannot book a time slot in the past.');
    }

    const duration = consultationType.duration_minutes;
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Validate proposed slot against sanctuary calendar boundaries and operating hours
    await this.validateSlotWithinSanctuaryRules({
      start,
      end,
      consultationType,
      timeZone,
    });

    // Extract YYYY-MM-DD in Asia/Kolkata for advisory lock
    const targetDateStr = start.toLocaleDateString('en-CA', { timeZone });

    // Combine goals and notes if both provided
    const combinedGoals = [goals, notes ? `Notes: ${notes}` : null].filter(Boolean).join('\n\n') || null;

    const result = await this.repository.createBookingWithTransaction({
      userId: user.id,
      consultationTypeId: consultationType.id,
      fullName: user.name,
      email: user.email,
      phone: phone || '',
      pillarInterest: consultationType.name,
      goals: combinedGoals,
      slotStart: start,
      slotEnd: end,
      timezone: timeZone,
      idempotencyKey,
      targetDateStr,
    });

    // If it's a new booking, dispatch notification asynchronously
    if (!result.idempotentReplay) {
      this.notifier.sendBookingConfirmation({
        user,
        consultation: result.booking,
        consultationType,
      }).catch(() => {});
    }

    return {
      consultation: {
        ...result.booking,
        type_name: consultationType.name,
        type_slug: consultationType.slug,
        type_duration_minutes: consultationType.duration_minutes,
        type_price_display: consultationType.price_display,
      },
      idempotentReplay: result.idempotentReplay,
      message: result.idempotentReplay
        ? 'Your consultation booking was previously confirmed.'
        : 'Consultation successfully scheduled with Soulfit Sanctuary.',
    };
  }

  /**
   * Retrieves consultation history for current authenticated user.
   */
  async getUserConsultations(userId, { status = 'all', page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const result = await this.repository.findByUser(userId, {
      status,
      limit: limitNum,
      offset,
    });

    return {
      consultations: result.consultations,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum) || 1,
      },
    };
  }

  /**
   * Retrieves single consultation by ID verifying owner access.
   */
  async getConsultationById(id, userId) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw ApiError.notFound('Consultation not found.');
    }

    if (booking.user_id !== userId) {
      throw ApiError.forbidden('You do not have authorization to view this consultation.');
    }

    return booking;
  }

  /**
   * Cancels a consultation according to sanctuary policy.
   */
  async cancelConsultation(id, userId, reason) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw ApiError.notFound('Consultation not found.');
    }

    if (booking.user_id !== userId) {
      throw ApiError.forbidden('You do not have authorization to cancel this consultation.');
    }

    // Check cancellation deadline
    const now = new Date();
    const sessionTime = new Date(booking.slot_start);
    const hoursNotice = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursNotice < this.cancellationNoticeHours) {
      throw ApiError.badRequest(
        `Consultations can only be cancelled at least ${this.cancellationNoticeHours} hours before the scheduled session. Please contact the sanctuary concierge directly.`
      );
    }

    const updated = await this.repository.cancelBooking({ id, userId, reason });

    this.notifier.sendCancellationNotice({
      user: { id: userId, email: booking.email },
      consultation: updated,
      reason,
    }).catch(() => {});

    return updated;
  }

  /**
   * Reschedules a consultation according to sanctuary policy.
   */
  async rescheduleConsultation(id, userId, newSlotStart, timeZone = this.defaultTimezone) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw ApiError.notFound('Consultation not found.');
    }

    if (booking.user_id !== userId) {
      throw ApiError.forbidden('You do not have authorization to reschedule this consultation.');
    }

    // Check rescheduling policy on old session
    const now = new Date();
    const sessionTime = new Date(booking.slot_start);
    const hoursNotice = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursNotice < this.rescheduleNoticeHours) {
      throw ApiError.badRequest(
        `Consultations can only be rescheduled at least ${this.rescheduleNoticeHours} hours prior to the session time.`
      );
    }

    const newStart = new Date(newSlotStart);
    if (isNaN(newStart.getTime()) || newStart <= now) {
      throw ApiError.badRequest('New consultation start time must be a valid future timestamp.');
    }

    const duration = booking.type_duration_minutes || 60;
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    const consultationType = booking.consultation_type_id
      ? await this.getTypeByIdOrSlug(booking.consultation_type_id)
      : { id: null, duration_minutes: duration };

    // Validate proposed target slot against sanctuary calendar boundaries and operating hours
    await this.validateSlotWithinSanctuaryRules({
      start: newStart,
      end: newEnd,
      consultationType,
      timeZone,
    });

    const targetDateStr = newStart.toLocaleDateString('en-CA', { timeZone });

    const updated = await this.repository.rescheduleBooking({
      id,
      userId,
      newSlotStart: newStart,
      newSlotEnd: newEnd,
      targetDateStr,
    });

    this.notifier.sendRescheduleNotice({
      user: { id: userId, email: booking.email },
      consultation: updated,
      oldSlot: booking.slot_start,
      newSlot: newStart.toISOString(),
    }).catch(() => {});

    return updated;
  }
}

export const consultationService = new ConsultationService();
export default consultationService;
