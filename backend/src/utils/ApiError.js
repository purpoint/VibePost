/**
 * An error carrying the HTTP status the client should receive.
 * Anything thrown that is not an ApiError is treated as a 500 by the error
 * handler, so internal failures never leak their message in production.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }

  static badRequest(message) {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'You must be logged in to do that.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You are not allowed to do that.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found.') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }
}
