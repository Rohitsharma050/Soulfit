import { Router } from 'express';
import { getArticles, getArticleBySlug } from '../controllers/article.controller.js';
import { validateArticleQuery, validateArticleSlug } from '../validators/article.validator.js';
import { publicApiLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Apply public rate limiting
router.use(publicApiLimiter);

// GET /api/v1/articles
router.get('/', validateArticleQuery, getArticles);

// GET /api/v1/articles/:slug
router.get('/:slug', validateArticleSlug, getArticleBySlug);

export default router;
