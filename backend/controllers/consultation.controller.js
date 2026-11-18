import { consultationService } from '../services/consultation.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/consultations/types
 * Returns active sanctuary consultation types.
 */
export const getConsultationTypes = asyncHandler(async (req, res) => {
  const types = await consultationService.getAllTypes();
  return ApiResponse.success(res, types, 'Consultation types retrieved successfully', 200, {
    count: types.length,
  });
});

/**
 * GET /api/v1/consultations/availability/dates
 * Returns dates that have available booking slots.
 */
export const getAvailableDates = asyncHandler(async (req, res) => {
  const { type_id, month, start_date, end_date, timezone } = req.query;
  const result = await consultationService.getAvailableDates({
    typeId: type_id,
    month,
    startDate: start_date,
    endDate: end_date,
    timeZone: timezone,
  });

  return ApiResponse.success(res, result, 'Available dates retrieved successfully');
});

/**
 * GET /api/v1/consultations/availability
 * Returns available time slots for a specific date and consultation type.
 */
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { type_id, date, timezone } = req.query;
  const result = await consultationService.getAvailableSlots({
    typeId: type_id,
    dateStr: date,
    timeZone: timezone,
  });

  return ApiResponse.success(res, result, 'Available time slots retrieved successfully');
});

/**
 * POST /api/v1/consultations/book
 * Books a consultation atomically with concurrency lock. Requires authentication.
 */
export const bookConsultation = asyncHandler(async (req, res) => {
  const { type_id, slot_start, goals, notes, phone, idempotency_key, timezone } = req.body;

  const result = await consultationService.bookConsultation({
    user: req.user,
    typeId: type_id,
    slotStart: slot_start,
    goals,
    notes,
    phone,
    idempotencyKey: idempotency_key,
    timeZone: timezone,
  });

  const statusCode = result.idempotentReplay ? 200 : 201;
  return ApiResponse.success(res, result.consultation, result.message, statusCode);
});

/**
 * GET /api/v1/consultations/my
 * Retrieves authenticated user's consultation history (upcoming / past).
 */
export const getMyConsultations = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await consultationService.getUserConsultations(req.user.id, {
    status,
    page,
    limit,
  });

  return ApiResponse.success(
    res,
    result.consultations,
    'Consultations retrieved successfully',
    200,
    result.meta
  );
});

/**
 * GET /api/v1/consultations/:id
 * Retrieves single consultation by ID (owner only).
 */
export const getConsultationById = asyncHandler(async (req, res) => {
  const booking = await consultationService.getConsultationById(req.params.id, req.user.id);
  return ApiResponse.success(res, booking, 'Consultation details retrieved successfully');
});

/**
 * PATCH /api/v1/consultations/:id/cancel
 * Cancels a consultation (owner only).
 */
export const cancelConsultation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const updated = await consultationService.cancelConsultation(req.params.id, req.user.id, reason);
  return ApiResponse.success(res, updated, 'Consultation cancelled successfully.');
});

/**
 * PATCH /api/v1/consultations/:id/reschedule
 * Reschedules a consultation to a new slot (owner only).
 */
export const rescheduleConsultation = asyncHandler(async (req, res) => {
  const { new_slot_start, timezone } = req.body;
  const updated = await consultationService.rescheduleConsultation(
    req.params.id,
    req.user.id,
    new_slot_start,
    timezone
  );
  return ApiResponse.success(res, updated, 'Consultation rescheduled successfully.');
});

export default {
  getConsultationTypes,
  getAvailableDates,
  getAvailableSlots,
  bookConsultation,
  getMyConsultations,
  getConsultationById,
  cancelConsultation,
  rescheduleConsultation,
};
