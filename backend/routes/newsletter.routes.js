import { Router } from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletter.controller.js';
import { validateSubscribe, validateUnsubscribe } from '../validators/newsletter.validator.js';
import { newsletterLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// POST /api/v1/newsletter/subscribe
router.post('/subscribe', newsletterLimiter, validateSubscribe, subscribe);

// POST /api/v1/newsletter/unsubscribe
router.post('/unsubscribe', newsletterLimiter, validateUnsubscribe, unsubscribe);

export default router;
