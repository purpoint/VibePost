/**
 * Inspects the built bundle before it ships.
 *
 * Vite inlines every VITE_* variable into the output, so a missing or wrong
 * VITE_API_URL does not fail the build — it quietly bakes in the development
 * fallback and produces a site that cannot reach its API.
 *
 * The check is deliberately specific. Searching the bundle for "localhost"
 * matches vendor code (React Router and axios both carry the string in their
 * own messages), so instead it looks for the exact fallback this app would
 * embed, and confirms the configured API URL is really present.
 *
 * On a deployment platform a problem is fatal; locally it is only reported,
 * because a development build pointing at localhost is correct.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Must match the fallback in src/services/api.js.
const DEV_FALLBACK = 'http://localhost:5050/api';

const DIST = new URL('../dist/', import.meta.url).pathname;
const isDeployment = Boolean(process.env.VERCEL || process.env.CI || process.env.NETLIFY);
const apiUrl = process.env.VITE_API_URL?.trim();

const SECRET_PATTERNS = [
  { label: 'a MongoDB connection string', pattern: /mongodb(\+srv)?:\/\/[^\s"'`]+/i },
  { label: 'a Cloudinary secret or URL', pattern: /cloudinary:\/\/\d+:|CLOUDINARY_API_SECRET/i },
  { label: 'a JWT signing secret', pattern: /JWT_SECRET/i },
  { label: 'a bcrypt hash', pattern: /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{20}/ },
];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? collectFiles(path) : [path];
    })
  );
  return nested.flat();
}

const files = (await collectFiles(DIST)).filter((f) => /\.(js|css|html|json|map)$/.test(f));
const problems = [];
let apiUrlFound = false;

for (const file of files) {
  const contents = await readFile(file, 'utf8');
  const name = file.replace(DIST, '');

  if (contents.includes(DEV_FALLBACK)) {
    problems.push(
      `${name} contains the development API fallback (${DEV_FALLBACK}). ` +
        'Set VITE_API_URL to the deployed API before building.'
    );
  }

  if (apiUrl && contents.includes(apiUrl)) apiUrlFound = true;

  for (const { label, pattern } of SECRET_PATTERNS) {
    if (pattern.test(contents)) problems.push(`${name} appears to contain ${label}.`);
  }
}

console.log(`[check-build] scanned ${files.length} files in dist/`);

if (isDeployment && !apiUrl) {
  problems.push('VITE_API_URL is not set, so the bundle cannot reach a deployed API.');
} else if (apiUrl && /localhost|127\.0\.0\.1/.test(apiUrl) && isDeployment) {
  problems.push(`VITE_API_URL points at a local address (${apiUrl}).`);
} else if (apiUrl && !apiUrlFound) {
  problems.push(`VITE_API_URL is set to ${apiUrl} but that URL is not present in the bundle.`);
}

if (problems.length === 0) {
  console.log(
    `[check-build] no secrets, no development fallback${apiUrl ? `, API URL ${apiUrl} embedded` : ''}.`
  );
  process.exit(0);
}

for (const problem of problems) {
  console.error(`[check-build] ${isDeployment ? 'error' : 'note'}: ${problem}`);
}

if (isDeployment) {
  console.error('[check-build] refusing to ship this bundle.');
  process.exit(1);
}

console.log('[check-build] local build, so this is only a note.');
