/**
 * Startup environment validation.
 *
 * Signing tokens with an undefined secret or silently running without a
 * database are both security/correctness failures, so the process refuses to
 * start rather than beginning in a broken state.
 */
const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    console.error(
      `[env] missing required environment variable(s): ${missing.join(', ')}\n` +
        '[env] copy backend/.env.example to backend/.env and fill in the values.'
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 16) {
    console.error('[env] JWT_SECRET is too short — use a long random string (32+ characters).');
    process.exit(1);
  }
}
