import { z } from 'zod';
import { validateRequest } from './validate.js';

export const availabilityDatesQuerySchema = z.object({
  type_id: z.string({ required_error: 'Consultation type ID or slug is required.' }).min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format.').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format.').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format.').optional(),
  timezone: z.string().optional(),
});

export const availabilitySlotsQuerySchema = z.object({
  type_id: z.string({ required_error: 'Consultation type ID or slug is required.' }).min(1),
  date: z.string({ required_error: 'Date is required.' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  timezone: z.string().optional(),
});

export const bookConsultationSchema = z.object({
  type_id: z.string({ required_error: 'Consultation type ID or slug is required.' }).min(1),
  slot_start: z.string({ required_error: 'Selected slot start timestamp is required.' }).datetime({ offset: true }),
  goals: z.string().max(2000, 'Goals must not exceed 2000 characters.').optional().nullable(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters.').optional().nullable(),
  phone: z.string().max(30, 'Phone must not exceed 30 characters.').optional().nullable(),
  idempotency_key: z.string().max(64, 'Idempotency key must not exceed 64 characters.').optional().nullable(),
  timezone: z.string().optional(),
});

export const myConsultationsQuerySchema = z.object({
  status: z.enum(['upcoming', 'past', 'all', 'confirmed', 'pending', 'cancelled', 'completed', 'rescheduled']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const consultationIdParamSchema = z.object({
  id: z.string().uuid('Invalid consultation booking ID format.'),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500, 'Cancellation reason must not exceed 500 characters.').optional().nullable(),
});

export const rescheduleBookingSchema = z.object({
  new_slot_start: z.string({ required_error: 'New slot start timestamp is required.' }).datetime({ offset: true }),
  timezone: z.string().optional(),
});

// Middleware generators using validateRequest
export const validateAvailabilityDates = validateRequest({ query: availabilityDatesQuerySchema });
export const validateAvailabilitySlots = validateRequest({ query: availabilitySlotsQuerySchema });
export const validateBookConsultation = validateRequest({ body: bookConsultationSchema });
export const validateMyConsultations = validateRequest({ query: myConsultationsQuerySchema });
export const validateConsultationId = validateRequest({ params: consultationIdParamSchema });
export const validateCancelBooking = validateRequest({
  params: consultationIdParamSchema,
  body: cancelBookingSchema,
});
export const validateRescheduleBooking = validateRequest({
  params: consultationIdParamSchema,
  body: rescheduleBookingSchema,
});
