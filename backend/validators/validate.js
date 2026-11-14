import { ApiError } from '../utils/ApiError.js';

/**
 * Express middleware generator that validates request parts using Zod schemas.
 * @param {Object} schemas - Optional schemas for body, query, and params
 */
export const validateRequest = (schemas = {}) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ApiError(400, 'Validation failed for request parameters', formattedErrors));
      }
      next(error);
    }
  };
};

export default validateRequest;
