import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Creates a user after checking that the username and email are still free.
 *
 * The pre-flight lookup produces friendly, field-specific messages; the unique
 * indexes remain the actual guarantee, and a duplicate-key error racing past
 * this check is translated by the error handler.
 */
export async function registerUser({ name, username, email, password }) {
  const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();

  if (existing) {
    if (existing.email === email) {
      throw ApiError.conflict('An account with this email already exists');
    }
    throw ApiError.conflict('That username is already taken');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, username, email, passwordHash });

  return user;
}

/**
 * Verifies credentials.
 *
 * A missing user and a wrong password return the same message so the endpoint
 * cannot be used to discover which emails are registered.
 */
export async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return user;
}
