import jwt from 'jsonwebtoken';

/**
 * Issues a JWT identifying the user.
 * The payload deliberately carries nothing but the user id — never the
 * password, the hash, or any other sensitive field.
 */
export function generateToken(userId) {
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
