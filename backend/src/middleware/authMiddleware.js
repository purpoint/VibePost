import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Resolves the token's user from the database.
 *
 * The identity always comes from the verified token, never from anything the
 * client sends in a body or query. Re-reading the user also means a deleted
 * account stops being able to act even while its token is still valid.
 */
async function resolveUser(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.userId);
  return user;
}

/**
 * Requires a valid token. Populates req.user or rejects with 401.
 */
export async function protect(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return next(ApiError.unauthorized('You must be logged in to do that.'));
  }

  try {
    const user = await resolveUser(token);
    if (!user) {
      return next(ApiError.unauthorized('Your account no longer exists.'));
    }
    req.user = user;
    return next();
  } catch (error) {
    // Invalid / expired tokens are translated by the centralised error handler.
    return next(error);
  }
}

/**
 * Populates req.user when a valid token is present but never blocks the
 * request. Used by the public feed so logged-out visitors can browse while
 * logged-in users still get their own like state.
 */
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = (await resolveUser(token)) ?? undefined;
  } catch {
    // A bad token is treated as "not logged in" rather than an error.
  }
  return next();
}
