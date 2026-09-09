/**
 * Catch-all for unmatched routes.
 */
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Centralised error handler. Every error leaving the API is normalised into
 * `{ success: false, message }` so the client only has to understand one shape.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies handlers by arity
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Something went wrong. Please try again.';

  if (status === 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ success: false, message });
}
