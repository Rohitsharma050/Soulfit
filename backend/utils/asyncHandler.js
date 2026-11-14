/**
 * Higher-Order Function for Controller Handlers
 * Catches rejected promises from async controller methods and passes them to next(err).
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
