/**
 * 404 Not Found Middleware
 * Intercepts requests that do not match any defined route handler.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: 'fail',
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    timestamp: new Date().toISOString(),
  });
}

export default notFoundHandler;
