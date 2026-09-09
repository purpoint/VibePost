import { ApiError } from '../utils/ApiError.js';

const SWEEP_THRESHOLD = 5000;

/**
 * A small fixed-window rate limiter.
 *
 * Counters live in this process's memory, which is enough for a single
 * instance and avoids adding a dependency or a Redis. Running more than one
 * instance would give each its own allowance, so a shared store would be the
 * next step if this ever scaled out.
 */
export function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();

    // Drop expired entries occasionally so the map cannot grow without bound.
    if (hits.size > SWEEP_THRESHOLD) {
      for (const [key, entry] of hits) {
        if (now > entry.resetAt) hits.delete(key);
      }
    }

    const key = req.ip ?? 'unknown';
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new ApiError(429, message));
    }

    return next();
  };
}

/**
 * Guards the credential endpoints against password guessing. The allowance is
 * generous enough that a person mistyping their password is never affected.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});
