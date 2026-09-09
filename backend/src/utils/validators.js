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

export const POST_TEXT_MAX_LENGTH = 1000;

/**
 * Validates the text half of a create-post request.
 *
 * A post needs text, an image, or both. The image itself arrives as an
 * uploaded file rather than a URL, so whether one is present is decided by the
 * upload middleware and passed in here.
 */
export function validatePostInput(body = {}, { hasImage = false } = {}) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';

  if (!text && !hasImage) {
    throw ApiError.badRequest('Post text or image is required');
  }
  if (text.length > POST_TEXT_MAX_LENGTH) {
    throw ApiError.badRequest(`Post must be at most ${POST_TEXT_MAX_LENGTH} characters`);
  }

  return { text };
}

export const FEED_SORTS = ['latest', 'foryou', 'liked', 'commented'];
const FEED_LIMIT_MAX = 50;
const SEARCH_MAX_LENGTH = 100;

/**
 * Escapes a user-supplied search term before it is used in a regular
 * expression, so characters like ( or * cannot alter the pattern or be used to
 * build a catastrophically slow one.
 */
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses and clamps the feed query string. Out-of-range values are corrected
 * rather than rejected, so a bad link still renders a sensible page.
 */
export function parseFeedQuery(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

  const requestedLimit = Number.parseInt(query.limit, 10) || 10;
  const limit = Math.min(FEED_LIMIT_MAX, Math.max(1, requestedLimit));

  const sort = FEED_SORTS.includes(query.sort) ? query.sort : 'latest';

  const search =
    typeof query.search === 'string' ? query.search.trim().slice(0, SEARCH_MAX_LENGTH) : '';

  return { page, limit, sort, search };
}

export const COMMENT_MAX_LENGTH = 500;

/**
 * Validates a comment body. An empty or whitespace-only comment is rejected.
 */
export function validateCommentInput(body = {}) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';

  if (!text) {
    throw ApiError.badRequest('Comment cannot be empty');
  }
  if (text.length > COMMENT_MAX_LENGTH) {
    throw ApiError.badRequest(`Comment must be at most ${COMMENT_MAX_LENGTH} characters`);
  }

  return { text };
}
