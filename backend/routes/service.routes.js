import { Router } from 'express';
import { getServices, getServiceBySlug } from '../controllers/service.controller.js';
import { validateServiceQuery, validateServiceSlug } from '../validators/service.validator.js';
import { publicApiLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Apply public rate limiting
router.use(publicApiLimiter);

// GET /api/v1/services
router.get('/', validateServiceQuery, getServices);

// GET /api/v1/services/:slug
router.get('/:slug', validateServiceSlug, getServiceBySlug);

export default router;
