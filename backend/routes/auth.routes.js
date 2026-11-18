import { Router } from 'express';
import {
  register,
  login,
  getGoogleAuth,
  googleCallback,
  getMe,
  logout,
  getAuthStatus,
  googleAuthCallback,
} from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// ==============================================================================
// Authentication & Identity Endpoints (Phase 4)
// ==============================================================================

// POST /api/v1/auth/register
router.post('/register', authLimiter, validateRegister, register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validateLogin, login);

// GET /api/v1/auth/google
router.get('/google', getGoogleAuth);

// GET /api/v1/auth/google/callback
router.get('/google/callback', googleCallback);

// POST /api/v1/auth/google (backward compatibility)
router.post('/google', googleAuthCallback);

// GET /api/v1/auth/me (Protected Route)
router.get('/me', requireAuth, getMe);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/status (Legacy / Optional Check)
router.get('/status', optionalAuth, getAuthStatus);

export default router;
