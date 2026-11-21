import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { UserRepository } from '../repositories/user.repository.js';
import { config } from '../config/env.js';

const userRepo = new UserRepository();

/**
 * Helper to extract JWT token from request cookies or Authorization header.
 * @param {import('express').Request} req 
 * @returns {string|null}
 */
export function extractToken(req) {
  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies[config.cookie.name]) {
    return req.cookies[config.cookie.name];
  }

  // 2. Fallback to Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Sanitizes user database row for client consumption.
 * @param {object} user 
 * @returns {object}
 */
export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    role: user.role,
    authProvider: user.auth_provider || 'local',
    googleId: user.google_id || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLoginAt: user.last_login_at || null,
  };
}

/**
 * Middleware that requires a valid, active user authentication session.
 */
export async function requireAuth(req, res, next) {
  try {
    const hasCookieHeader = Boolean(req.headers.cookie);
    const hasAuthCookie = Boolean(req.cookies && req.cookies[config.cookie.name]);
    const hasAuthHeader = Boolean(req.headers.authorization && req.headers.authorization.startsWith('Bearer '));

    const token = extractToken(req);

    if (!token) {
      if (config.isDevelopment || process.env.AUTH_DEBUG === 'true') {
        console.warn(`[AUTH] Authentication required on ${req.method} ${req.originalUrl || req.path} | hasCookieHeader=${hasCookieHeader} | hasAuthCookie=${hasAuthCookie} | hasAuthHeader=${hasAuthHeader}`);
      }
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
      if (process.env.AUTH_DEBUG === 'true') {
        console.log(`[AUTH] JWT verified successfully for ${req.method} ${req.originalUrl || req.path}`);
      }
    } catch (err) {
      if (config.isDevelopment || process.env.AUTH_DEBUG === 'true') {
        console.warn(`[AUTH] Token verification failed on ${req.method} ${req.originalUrl || req.path} | error=${err.name}`);
      }
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Your session has expired. Please log in again.');
      }
      throw new ApiError(401, 'Invalid authentication token.');
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      throw new ApiError(401, 'Invalid authentication token payload.');
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      throw new ApiError(401, 'User account no longer exists.');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account has been deactivated. Please contact support.');
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication: attaches user if valid token exists, proceeds regardless.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      try {
        const decoded = verifyToken(token);
        const userId = decoded.id || decoded.userId;
        if (userId) {
          const user = await userRepo.findById(userId);
          if (user && user.is_active) {
            req.user = sanitizeUser(user);
          }
        }
      } catch (err) {
        // Silently ignore invalid token in optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
}

/**
 * Middleware to restrict route to specific roles (e.g. 'ADMIN').
 * @param  {...string} roles 
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: Insufficient privileges.'));
    }
    next();
  };
}

export default requireAuth;
