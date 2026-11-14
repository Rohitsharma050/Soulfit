/**
 * Standardized Application Error Class
 * Encapsulates HTTP status codes, operational error flags, and validation error details.
 */
export class ApiError extends Error {
  constructor(statusCode, message = 'An unexpected error occurred', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Access forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Requested resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource conflict') {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

export default ApiError;
