import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { setupTestDatabase } from './setupTestDb.js';
import { ServiceRepository } from '../repositories/service.repository.js';
import { ContactRepository } from '../repositories/contact.repository.js';
import { NewsletterRepository } from '../repositories/newsletter.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ConsultationRepository } from '../repositories/consultation.repository.js';
import { ServiceService } from '../services/service.service.js';
import { ContactService } from '../services/contact.service.js';
import { NewsletterService } from '../services/newsletter.service.js';
import { ArticleService } from '../services/article.service.js';
import { AuthService } from '../services/auth.service.js';
import { ConsultationService } from '../services/consultation.service.js';
import notFoundHandler from '../middleware/notFound.middleware.js';
import errorHandler from '../middleware/error.middleware.js';
import { validateServiceQuery, validateServiceSlug } from '../validators/service.validator.js';
import { validateContactSubmission } from '../validators/contact.validator.js';
import { validateSubscribe, validateUnsubscribe } from '../validators/newsletter.validator.js';
import { validateArticleQuery, validateArticleSlug } from '../validators/article.validator.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import {
  validateAvailabilityDates,
  validateAvailabilitySlots,
  validateBookConsultation,
  validateMyConsultations,
  validateConsultationId,
  validateCancelBooking,
  validateRescheduleBooking,
} from '../validators/consultation.validator.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAuthCookieOptions, getClearAuthCookieOptions, verifyToken } from '../utils/jwt.js';
import { config } from '../config/env.js';
import { sanitizeUser, extractToken } from '../middleware/auth.middleware.js';
import { ApiError } from '../utils/ApiError.js';

export async function createTestApp() {
  const { pool, db } = await setupTestDatabase();

  const serviceRepo = new ServiceRepository(pool);
  const contactRepo = new ContactRepository(pool);
  const newsletterRepo = new NewsletterRepository(pool);
  const articleRepo = new ArticleRepository(pool);
  const userRepo = new UserRepository(pool);
  const consultationRepo = new ConsultationRepository(pool);

  const testServiceService = new ServiceService(serviceRepo);
  const testContactService = new ContactService(contactRepo);
  const testNewsletterService = new NewsletterService(newsletterRepo);
  const testArticleService = new ArticleService(articleRepo);
  const testAuthService = new AuthService(userRepo);
  const testConsultationService = new ConsultationService(consultationRepo);

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Health endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  const apiRouter = express.Router();

  // Test requireAuth middleware using test userRepo
  const testRequireAuth = async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new ApiError(401, 'Authentication required. Please log in.');
      }
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          throw new ApiError(401, 'Your session has expired. Please log in again.');
        }
        throw new ApiError(401, 'Invalid authentication token.');
      }
      const userId = decoded.id || decoded.userId;
      const user = await userRepo.findById(userId);
      if (!user) {
        throw new ApiError(401, 'User account no longer exists.');
      }
      if (!user.is_active) {
        throw new ApiError(403, 'Account has been deactivated. Please contact support.');
      }
      req.user = sanitizeUser(user);
      next();
    } catch (err) {
      next(err);
    }
  };

  // 1. Services Routes
  apiRouter.get('/services', validateServiceQuery, asyncHandler(async (req, res) => {
    const { category, featured } = req.query;
    const services = await testServiceService.getAllServices({ category, featured });
    return ApiResponse.success(res, services, 'Services retrieved successfully', 200, { count: services.length });
  }));

  apiRouter.get('/services/:slug', validateServiceSlug, asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const service = await testServiceService.getServiceBySlug(slug);
    return ApiResponse.success(res, service, 'Service details retrieved successfully');
  }));

  // 2. Contact Routes
  apiRouter.post('/contact', validateContactSubmission, asyncHandler(async (req, res) => {
    const result = await testContactService.submitInquiry(req.body);
    return ApiResponse.created(res, result, 'Your inquiry has been received.');
  }));

  // 3. Newsletter Routes
  apiRouter.post('/newsletter/subscribe', validateSubscribe, asyncHandler(async (req, res) => {
    const { email, consent } = req.body;
    const result = await testNewsletterService.subscribe({ email, consent });
    const statusCode = result.alreadySubscribed ? 200 : 201;
    return ApiResponse.success(res, result, result.message, statusCode);
  }));

  apiRouter.post('/newsletter/unsubscribe', validateUnsubscribe, asyncHandler(async (req, res) => {
    const { token } = req.body;
    const result = await testNewsletterService.unsubscribe(token);
    return ApiResponse.success(res, result, result.message, 200);
  }));

  // 4. Articles Routes
  apiRouter.get('/articles', validateArticleQuery, asyncHandler(async (req, res) => {
    const { page, limit, category, search } = req.query;
    const result = await testArticleService.getPublishedArticles({ page, limit, category, search });
    return ApiResponse.success(res, result.articles, 'Published articles retrieved successfully', 200, {
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }));

  apiRouter.get('/articles/:slug', validateArticleSlug, asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const article = await testArticleService.getArticleBySlug(slug);
    return ApiResponse.success(res, article, 'Article content retrieved successfully');
  }));

  // 5. Auth Routes (Phase 4)
  apiRouter.post('/auth/register', validateRegister, asyncHandler(async (req, res) => {
    const result = await testAuthService.register(req.body);
    res.cookie(config.cookie.name, result.token, getAuthCookieOptions(false));
    return ApiResponse.created(res, { user: result.user }, 'Registration successful.');
  }));

  apiRouter.post('/auth/login', validateLogin, asyncHandler(async (req, res) => {
    const result = await testAuthService.login(req.body);
    res.cookie(config.cookie.name, result.token, getAuthCookieOptions(result.rememberMe));
    return ApiResponse.success(res, { user: result.user }, 'Login successful.');
  }));

  apiRouter.get('/auth/google', asyncHandler(async (req, res) => {
    try {
      const url = testAuthService.getGoogleAuthUrl(req.query.state);
      if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
        return ApiResponse.success(res, { url }, 'Google OAuth URL generated.');
      }
      return res.redirect(url);
    } catch (err) {
      if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
        throw err;
      }
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(err.message)}`);
    }
  }));

  apiRouter.get('/auth/google/callback', asyncHandler(async (req, res) => {
    const { code, error } = req.query;
    if (error) {
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(error)}`);
    }
    try {
      const result = await testAuthService.handleGoogleCallback(code);
      res.cookie(config.cookie.name, result.token, getAuthCookieOptions(false));
      return res.redirect(`${config.frontendUrl}/dashboard?auth=success`);
    } catch (err) {
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(err.message)}`);
    }
  }));

  apiRouter.get('/auth/me', testRequireAuth, asyncHandler(async (req, res) => {
    return ApiResponse.success(res, { user: req.user }, 'Profile retrieved.');
  }));

  apiRouter.post('/auth/logout', asyncHandler(async (req, res) => {
    res.clearCookie(config.cookie.name, getClearAuthCookieOptions());
    return ApiResponse.success(res, null, 'Logged out successfully.');
  }));

  // 6. Consultation Booking Routes (Phase 5)
  apiRouter.get('/consultations/types', asyncHandler(async (req, res) => {
    const types = await testConsultationService.getAllTypes();
    return ApiResponse.success(res, types, 'Consultation types retrieved.', 200, { count: types.length });
  }));

  apiRouter.get('/consultations/availability/dates', validateAvailabilityDates, asyncHandler(async (req, res) => {
    const { type_id, month, start_date, end_date, timezone } = req.query;
    const result = await testConsultationService.getAvailableDates({
      typeId: type_id,
      month,
      startDate: start_date,
      endDate: end_date,
      timeZone: timezone,
    });
    return ApiResponse.success(res, result, 'Available dates retrieved.');
  }));

  apiRouter.get('/consultations/availability', validateAvailabilitySlots, asyncHandler(async (req, res) => {
    const { type_id, date, timezone } = req.query;
    const result = await testConsultationService.getAvailableSlots({
      typeId: type_id,
      dateStr: date,
      timeZone: timezone,
    });
    return ApiResponse.success(res, result, 'Available slots retrieved.');
  }));

  apiRouter.post('/consultations/book', testRequireAuth, validateBookConsultation, asyncHandler(async (req, res) => {
    const { type_id, slot_start, goals, notes, phone, idempotency_key, timezone } = req.body;
    const result = await testConsultationService.bookConsultation({
      user: req.user,
      typeId: type_id,
      slotStart: slot_start,
      goals,
      notes,
      phone,
      idempotencyKey: idempotency_key,
      timeZone: timezone,
    });
    return ApiResponse.success(res, result.consultation, result.message, result.idempotentReplay ? 200 : 201);
  }));

  apiRouter.get('/consultations/my', testRequireAuth, validateMyConsultations, asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const result = await testConsultationService.getUserConsultations(req.user.id, { status, page, limit });
    return ApiResponse.success(res, result.consultations, 'My consultations retrieved.', 200, result.meta);
  }));

  apiRouter.get('/consultations/:id', testRequireAuth, validateConsultationId, asyncHandler(async (req, res) => {
    const booking = await testConsultationService.getConsultationById(req.params.id, req.user.id);
    return ApiResponse.success(res, booking, 'Consultation details retrieved.');
  }));

  apiRouter.patch('/consultations/:id/cancel', testRequireAuth, validateCancelBooking, asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const updated = await testConsultationService.cancelConsultation(req.params.id, req.user.id, reason);
    return ApiResponse.success(res, updated, 'Consultation cancelled.');
  }));

  apiRouter.patch('/consultations/:id/reschedule', testRequireAuth, validateRescheduleBooking, asyncHandler(async (req, res) => {
    const { new_slot_start, timezone } = req.body;
    const updated = await testConsultationService.rescheduleConsultation(req.params.id, req.user.id, new_slot_start, timezone);
    return ApiResponse.success(res, updated, 'Consultation rescheduled.');
  }));

  app.use('/api/v1', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return {
    app,
    pool,
    db,
    repos: { serviceRepo, contactRepo, newsletterRepo, articleRepo, userRepo, consultationRepo },
    services: { testAuthService, testConsultationService },
  };
}

export default createTestApp;
