import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupTestDatabase } from './setupTestDb.js';
import { ServiceRepository } from '../repositories/service.repository.js';
import { ContactRepository } from '../repositories/contact.repository.js';
import { NewsletterRepository } from '../repositories/newsletter.repository.js';
import { ArticleRepository } from '../repositories/article.repository.js';
import { ServiceService } from '../services/service.service.js';
import { ContactService } from '../services/contact.service.js';
import { NewsletterService } from '../services/newsletter.service.js';
import { ArticleService } from '../services/article.service.js';
import notFoundHandler from '../middleware/notFound.middleware.js';
import errorHandler from '../middleware/error.middleware.js';
import { validateServiceQuery, validateServiceSlug } from '../validators/service.validator.js';
import { validateContactSubmission } from '../validators/contact.validator.js';
import { validateSubscribe, validateUnsubscribe } from '../validators/newsletter.validator.js';
import { validateArticleQuery, validateArticleSlug } from '../validators/article.validator.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export async function createTestApp() {
  const { pool, db } = await setupTestDatabase();

  const serviceRepo = new ServiceRepository(pool);
  const contactRepo = new ContactRepository(pool);
  const newsletterRepo = new NewsletterRepository(pool);
  const articleRepo = new ArticleRepository(pool);

  const testServiceService = new ServiceService(serviceRepo);
  const testContactService = new ContactService(contactRepo);
  const testNewsletterService = new NewsletterService(newsletterRepo);
  const testArticleService = new ArticleService(articleRepo);

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Health endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  const apiRouter = express.Router();

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

  app.use('/api/v1', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, pool, db, repos: { serviceRepo, contactRepo, newsletterRepo, articleRepo } };
}

export default createTestApp;
