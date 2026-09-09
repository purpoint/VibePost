/**
 * Startup environment validation.
 *
 * Signing tokens with an undefined secret or silently running without a
 * database are both security/correctness failures, so the process refuses to
 * start rather than beginning in a broken state.
 */
const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'];

const PLACEHOLDER_SECRETS = [
  'replace-with-a-long-random-secret',
  'changeme',
  'secret',
];

function fail(...lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    fail(
      `[env] missing required environment variable(s): ${missing.join(', ')}`,
      '[env] copy backend/.env.example to backend/.env and fill in the values.'
    );
  }

  if (process.env.JWT_SECRET.length < 16) {
    fail('[env] JWT_SECRET is too short — use a long random string (32+ characters).');
  }

  if (process.env.NODE_ENV === 'production') {
    validateProductionEnv();
  }
}

/**
 * Extra checks that only matter once the app is public.
 *
 * These are refusals rather than warnings: a warning in a startup log is easy
 * to miss, and each of these would leave the deployment insecure or broken in
 * a way that is hard to notice from the outside.
 */
function validateProductionEnv() {
  if (PLACEHOLDER_SECRETS.includes(process.env.JWT_SECRET.trim().toLowerCase())) {
    fail(
      '[env] JWT_SECRET is still the example value.',
      '[env] generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }

  const clientUrl = process.env.CLIENT_URL?.trim();

  if (!clientUrl) {
    fail(
      '[env] CLIENT_URL must be set in production.',
      '[env] without it CORS falls back to localhost and the deployed frontend cannot reach the API.'
    );
  }

  if (/localhost|127\.0\.0\.1/.test(clientUrl)) {
    fail(
      `[env] CLIENT_URL still points at a local address: ${clientUrl}`,
      '[env] set it to the deployed frontend origin, e.g. https://your-app.vercel.app'
    );
  }

  const origins = clientUrl.split(',').map((value) => value.trim()).filter(Boolean);
  const invalid = origins.filter((origin) => !/^https?:\/\/[^/]+$/.test(origin));

  if (invalid.length > 0) {
    fail(
      `[env] CLIENT_URL entries must be bare origins with no path or trailing slash: ${invalid.join(', ')}`,
      '[env] for example https://your-app.vercel.app, not https://your-app.vercel.app/'
    );
  }

  if (origins.some((origin) => origin.startsWith('http://'))) {
    console.warn('[env] warning: a CLIENT_URL origin uses http, so tokens would travel unencrypted.');
  }
}
