import { Router } from 'express';
import { createContact } from '../controllers/contact.controller.js';
import { validateContactSubmission } from '../validators/contact.validator.js';
import { contactLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// POST /api/v1/contact
router.post('/', contactLimiter, validateContactSubmission, createContact);

export default router;
