import http from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Boots the real Express app against a throwaway in-memory MongoDB.
 *
 * Nothing is stubbed: requests go through the actual middleware, routes,
 * controllers and schemas, so a passing test says the API behaves, not that
 * the mocks agree with each other.
 */
export async function startTestServer() {
  const mongo = await MongoMemoryServer.create();

  process.env.MONGODB_URI = mongo.getUri('vibepost_test');
  process.env.JWT_SECRET = 'test-secret-value-that-is-long-enough-32';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.NODE_ENV = 'test';

  // Imported after the environment is set: the app reads CLIENT_URL at import.
  const { default: app } = await import('../../src/app.js');

  await mongoose.connect(process.env.MONGODB_URI);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  return {
    port,
    request: (method, path, options) => request(port, method, path, options),
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.disconnect();
      await mongo.stop();
    },
    async reset() {
      const { collections } = mongoose.connection;
      await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
    },
  };
}

/**
 * Minimal HTTP client. `body` is JSON unless `raw` is set, which allows
 * multipart payloads to be sent verbatim.
 */
export function request(port, method, path, { body, token, raw, contentType, origin } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body && !raw ? JSON.stringify(body) : body;
    const headers = {};

    if (contentType) headers['Content-Type'] = contentType;
    else if (payload && !raw) headers['Content-Type'] = 'application/json';
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers.Authorization = `Bearer ${token}`;
    if (origin) headers.Origin = origin;

    const req = http.request({ host: '127.0.0.1', port, method, path, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {
          /* non-JSON responses are returned as text */
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Signs up a user and returns their token and public profile. */
export async function createUser(api, n, overrides = {}) {
  const res = await api.request('POST', '/api/auth/signup', {
    body: {
      name: `User ${n}`,
      username: `user${n}`,
      email: `user${n}@example.com`,
      password: 'supersecret1',
      ...overrides,
    },
  });
  return { token: res.body.data?.token, user: res.body.data?.user, res };
}

/** Builds a multipart/form-data body. */
export function multipart(fields = {}, file = null) {
  const boundary = `----vibepost${Math.random().toString(16).slice(2)}`;
  const parts = [];

  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    );
  }

  if (file) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; ` +
          `filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
      ),
      file.buffer,
      Buffer.from('\r\n')
    );
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

/** A genuine 1x1 PNG, for upload tests. */
export const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
