import { Router } from 'express';
import {
  getConsultationTypes,
  getAvailableDates,
  getAvailableSlots,
  bookConsultation,
  getMyConsultations,
  getConsultationById,
  cancelConsultation,
  rescheduleConsultation,
} from '../controllers/consultation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { bookingLimiter } from '../middleware/rateLimit.middleware.js';
import {
  validateAvailabilityDates,
  validateAvailabilitySlots,
  validateBookConsultation,
  validateMyConsultations,
  validateConsultationId,
  validateCancelBooking,
  validateRescheduleBooking,
} from '../validators/consultation.validator.js';

const router = Router();

// 1. Consultation Types (Public)
router.get('/types', getConsultationTypes);

// 2. Availability (Public)
router.get('/availability/dates', validateAvailabilityDates, getAvailableDates);
router.get('/availability', validateAvailabilitySlots, getAvailableSlots);

// 3. Booking Transactions (Requires Authentication + Rate Limiter)
router.post('/book', requireAuth, bookingLimiter, validateBookConsultation, bookConsultation);

// 4. Authenticated Member Consultation History
router.get('/my', requireAuth, validateMyConsultations, getMyConsultations);

// 5. Single Consultation Booking by ID (Requires Authentication)
router.get('/:id', requireAuth, validateConsultationId, getConsultationById);

// 6. Cancellation & Rescheduling (Requires Authentication)
router.patch('/:id/cancel', requireAuth, validateCancelBooking, cancelConsultation);
router.patch('/:id/reschedule', requireAuth, validateRescheduleBooking, rescheduleConsultation);

export default router;
