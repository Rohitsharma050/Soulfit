import { config } from '../config/env.js';

/**
 * Centralized Application Error Handling Middleware
 * Ensures consistent error envelopes and protects against stack-trace / credential leakage.
 */
export function errorHandler(err, req, res, next) {
  // Capture status code (default to 500)
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  
  // Safe logging of the error on the server
  console.error(`[SERVER ERROR] [${req.method} ${req.originalUrl}] Status: ${statusCode} - ${err.message}`);
  if (config.isDevelopment && err.stack) {
    console.error(err.stack);
  }

  // Handle standard JSON syntax errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'fail',
      statusCode: 400,
      message: 'Malformed JSON payload in request body',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle CORS errors
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      status: 'fail',
      statusCode: 403,
      message: 'Access blocked by CORS policy',
      timestamp: new Date().toISOString(),
    });
  }

  // Deliver sanitized client response
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    statusCode,
    message: statusCode >= 500 && config.isProduction 
      ? 'An unexpected internal server error occurred' 
      : err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(config.isDevelopment && { stack: err.stack }),
  });
}

export default errorHandler;
