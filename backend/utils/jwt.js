import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Signs a JWT payload with the application secret.
 * @param {object} payload 
 * @param {string|number} [expiresIn] 
 * @returns {string}
 */
export function generateToken(payload, expiresIn) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: expiresIn || config.jwt.expiresIn,
  });
}

/**
 * Verifies a JWT token.
 * @param {string} token 
 * @returns {object} decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

/**
 * Returns security-hardened options for the HttpOnly auth cookie.
 * @param {boolean} [rememberMe=false] 
 * @returns {import('express').CookieOptions}
 */
export function getAuthCookieOptions(rememberMe = false) {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : config.cookie.maxAgeMs; // 7 days default

  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

/**
 * Returns matching options for clearing the auth cookie upon logout.
 * @returns {import('express').CookieOptions}
 */
export function getClearAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  };
}
