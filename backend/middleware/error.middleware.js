import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Centralized Application Error Handling Middleware
 * Ensures consistent JSON envelope { success: false, message: '...', errors: [] }
 * Guarantees zero credential, stack trace, or raw SQL leaks.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'An unexpected internal server error occurred';
  let errors = [];

  // 1. Handle our custom ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  }
  // 2. Handle standard JSON syntax errors from express.json()
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body';
    errors = [{ field: 'body', message: 'Invalid JSON format' }];
  }
  // 3. Handle CORS origin rejections
  else if (err.message && err.message.includes('CORS policy')) {
    statusCode = 403;
    message = 'Access blocked by CORS security policy';
    errors = [{ field: 'origin', message: 'Origin not allowed' }];
  }
  // 4. Handle PostgreSQL specific errors safely
  else if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'A record with these unique details already exists';
        errors = [{ field: err.constraint || 'unique_constraint', message: 'Duplicate value conflict' }];
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Referenced related record does not exist';
        errors = [{ field: 'foreign_key', message: 'Referential integrity constraint failed' }];
        break;
      case '22P02': // Invalid text representation (e.g. invalid UUID)
        statusCode = 400;
        message = 'Invalid parameter format provided';
        errors = [{ field: 'syntax', message: 'Invalid data type syntax' }];
        break;
      default:
        statusCode = 500;
        message = config.isProduction ? 'Database operation failed' : err.message;
        errors = [];
    }
  }
  // 5. Fallback for generic errors
  else {
    statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
    message = statusCode >= 500 && config.isProduction ? 'Internal Server Error' : (err.message || 'Error processing request');
  }

  // Safe server-side structured log
  console.error(`[ERROR] [${req.method} ${req.originalUrl}] Status: ${statusCode} - ${err.message}`);
  if (config.isDevelopment && err.stack && !(err instanceof ApiError && statusCode < 500)) {
    console.error(err.stack);
  }

  // Sanitized client response
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(config.isDevelopment && statusCode >= 500 && { stack: err.stack }),
  });
}

export default errorHandler;
