import { ApiError } from '../utils/ApiError.js';

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
 * Translates the error types this API can produce into a status and a message
 * that is safe and useful to show a user.
 */
function normalise(err) {
  if (err instanceof ApiError) {
    return { status: err.statusCode, message: err.message };
  }

  // Mongoose schema validation — surface the first field message.
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors ?? {})[0];
    return { status: 400, message: first?.message ?? 'Please check the submitted values' };
  }

  // Unique index violation, e.g. two signups racing for the same username.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    const label = field === 'email' ? 'An account with this email' : 'That username';
    return { status: 409, message: `${label} already exists` };
  }

  // Upload problems detected by multer before the handler runs.
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { status: 400, message: 'Image must be 5MB or smaller' };
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return { status: 400, message: 'Only one image can be attached to a post' };
    }
    return { status: 400, message: 'That image could not be uploaded' };
  }

  // Malformed ObjectId in a route parameter.
  if (err.name === 'CastError') {
    return { status: 400, message: 'Invalid identifier' };
  }

  if (err.name === 'JsonWebTokenError') {
    return { status: 401, message: 'Invalid authentication token' };
  }

  if (err.name === 'TokenExpiredError') {
    return { status: 401, message: 'Your session has expired. Please log in again.' };
  }

  return { status: err.statusCode || err.status || 500, message: err.message };
}

/**
 * Centralised error handler. Every error leaving the API is normalised into
 * `{ success: false, message }` so the client only has to understand one shape.
 *
 * Express 5 forwards rejected promises from async handlers to this middleware
 * automatically, so route handlers do not need a try/catch wrapper.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies handlers by arity
export function errorHandler(err, req, res, next) {
  const { status, message } = normalise(err);

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    success: false,
    message:
      status >= 500 && process.env.NODE_ENV === 'production'
        ? 'Something went wrong. Please try again.'
        : message || 'Something went wrong. Please try again.',
  });
}
