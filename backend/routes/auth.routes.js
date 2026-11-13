import { Router } from 'express';
import { getAuthStatus, googleAuthCallback } from '../controllers/auth.controller.js';

const router = Router();

// GET /api/v1/auth/status
router.get('/status', getAuthStatus);

// POST /api/v1/auth/google
router.post('/google', googleAuthCallback);

export default router;
