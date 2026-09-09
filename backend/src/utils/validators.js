import { ApiError } from './ApiError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const PASSWORD_MIN_LENGTH = 8;

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw ApiError.badRequest(`${field} is required`);
  }
  return value.trim();
}

/**
 * Validates and normalises a signup payload.
 * Runs before the database is touched so the client gets one clear message per
 * problem instead of a raw Mongoose validation error.
 */
export function validateSignupInput(body = {}) {
  const name = requireString(body.name, 'Name');
  const username = requireString(body.username, 'Username').toLowerCase();
  const email = requireString(body.email, 'Email').toLowerCase();
  const password = requireString(body.password, 'Password');

  if (name.length < 2 || name.length > 50) {
    throw ApiError.badRequest('Name must be between 2 and 50 characters');
  }
  if (username.length < 3 || username.length > 20) {
    throw ApiError.badRequest('Username must be between 3 and 20 characters');
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw ApiError.badRequest('Username may only contain letters, numbers and underscores');
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest('Please enter a valid email address');
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw ApiError.badRequest(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  return { name, username, email, password };
}

export function validateLoginInput(body = {}) {
  const email = requireString(body.email, 'Email').toLowerCase();
  const password = requireString(body.password, 'Password');
  return { email, password };
}
