/**
 * 404 Not Found Middleware
 * Intercepts requests that do not match any registered route.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    errors: [{ field: 'path', message: 'Resource does not exist' }],
    timestamp: new Date().toISOString(),
  });
}

export default notFoundHandler;
