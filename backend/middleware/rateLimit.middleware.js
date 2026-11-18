import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Contact Inquiries
 * Protects against inbox flooding and automated contact spam.
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Up to 15 inquiries per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many contact messages sent from this IP. Please wait 15 minutes before submitting again.',
    errors: [{ field: 'rate_limit', message: 'Rate limit exceeded' }],
  },
});

/**
 * Rate Limiter for Newsletter Subscriptions
 * Protects against automated mass registration abuse.
 */
export const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Up to 20 subscription attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many newsletter requests from this IP. Please try again later.',
    errors: [{ field: 'rate_limit', message: 'Rate limit exceeded' }],
  },
});

/**
 * Rate Limiter for Authentication Endpoints (Login & Register)
 * Protects against credential stuffing and brute force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Up to 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    errors: [{ field: 'rate_limit', message: 'Authentication rate limit exceeded' }],
  },
});

/**
 * General Public API Rate Limiter
 * Applied across all public read endpoints (/services, /articles).
 */
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Up to 200 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many API requests from this IP. Please try again after some time.',
    errors: [{ field: 'rate_limit', message: 'Rate limit exceeded' }],
  },
});

/**
 * Rate Limiter for Consultation Bookings & Availability Probes
 * Protects against reservation hoarding, spam bookings, and slot enumeration.
 */
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Up to 30 booking requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many booking requests from this IP. Please wait 15 minutes before submitting again.',
    errors: [{ field: 'rate_limit', message: 'Booking rate limit exceeded' }],
  },
});

export default {
  contactLimiter,
  newsletterLimiter,
  authLimiter,
  bookingLimiter,
  publicApiLimiter,
};
