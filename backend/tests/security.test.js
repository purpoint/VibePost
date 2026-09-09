import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, createUser } from './helpers/testServer.js';

let api;

before(async () => {
  api = await startTestServer();
});
after(async () => {
  await api.close();
});
beforeEach(async () => {
  await api.reset();
});

describe('injection', () => {
  it('rejects an operator object where a login email is expected', async () => {
    await createUser(api, 1);

    const res = await api.request('POST', '/api/auth/login', {
      body: { email: { $ne: null }, password: { $ne: null } },
    });

    assert.equal(res.status, 400, 'an operator object must not be treated as a credential');
    assert.notEqual(res.status, 200);
  });

  it('rejects an operator object in a signup field', async () => {
    const res = await api.request('POST', '/api/auth/signup', {
      body: { name: 'X', username: { $ne: null }, email: 'a@b.com', password: 'supersecret1' },
    });

    assert.equal(res.status, 400);
  });

  it('treats an operator object in the search query as no search', async () => {
    const { token } = await createUser(api, 1);
    await api.request('POST', '/api/posts', { token, body: { text: 'visible post' } });

    const res = await api.request('GET', '/api/posts?search[$ne]=x');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.pagination.totalPosts, 1);
  });

  it('ignores an unknown sort value rather than passing it through', async () => {
    const res = await api.request('GET', '/api/posts?sort[$where]=1');
    assert.equal(res.status, 200);
  });

  it('rejects an operator object where a comment body is expected', async () => {
    const { token } = await createUser(api, 1);
    const post = await api.request('POST', '/api/posts', { token, body: { text: 'p' } });

    const res = await api.request('POST', `/api/posts/${post.body.data.post._id}/comments`, {
      token,
      body: { text: { $ne: null } },
    });

    assert.equal(res.status, 400);
  });
});

describe('secrets and data exposure', () => {
  it('never exposes a password hash through any endpoint that returns a user', async () => {
    const { token, res: signup } = await createUser(api, 1);
    const login = await api.request('POST', '/api/auth/login', {
      body: { email: 'user1@example.com', password: 'supersecret1' },
    });
    const me = await api.request('GET', '/api/auth/me', { token });

    for (const [label, res] of [['signup', signup], ['login', login], ['me', me]]) {
      const body = JSON.stringify(res.body);
      assert.doesNotMatch(body, /passwordHash/, `${label} leaked the field name`);
      assert.doesNotMatch(body, /\$2[aby]\$/, `${label} leaked a bcrypt hash`);
    }
  });

  it('does not expose a password hash through the feed', async () => {
    const { token } = await createUser(api, 1);
    await api.request('POST', '/api/posts', { token, body: { text: 'hello' } });

    const feed = await api.request('GET', '/api/posts');
    assert.doesNotMatch(JSON.stringify(feed.body), /passwordHash|\$2[aby]\$/);
  });

  it('stores the password only as a bcrypt hash', async () => {
    const mongoose = (await import('mongoose')).default;
    await createUser(api, 1, { password: 'supersecret1' });

    const stored = await mongoose.connection.db.collection('users').findOne({ username: 'user1' });

    assert.ok(stored.passwordHash, 'no hash stored');
    assert.match(stored.passwordHash, /^\$2[aby]\$/, 'the stored value is not a bcrypt hash');
    assert.notEqual(stored.passwordHash, 'supersecret1');
    assert.equal(stored.password, undefined, 'a plaintext password field exists');
  });

  it('does not advertise the server technology', async () => {
    const res = await api.request('GET', '/api/health');
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  it('sets the security headers helmet provides', async () => {
    const res = await api.request('GET', '/api/health');

    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['x-frame-options'] || res.headers['content-security-policy']);
  });
});

describe('authorisation', () => {
  it('refuses every write without a token', async () => {
    const { token } = await createUser(api, 1);
    const post = await api.request('POST', '/api/posts', { token, body: { text: 'p' } });
    const id = post.body.data.post._id;

    const attempts = await Promise.all([
      api.request('POST', '/api/posts', { body: { text: 'x' } }),
      api.request('POST', `/api/posts/${id}/like`),
      api.request('POST', `/api/posts/${id}/comments`, { body: { text: 'x' } }),
      api.request('DELETE', `/api/posts/${id}`),
      api.request('GET', '/api/auth/me'),
    ]);

    for (const res of attempts) assert.equal(res.status, 401);
  });

  it('does not let one user delete another user\'s post', async () => {
    const alice = await createUser(api, 1);
    const bob = await createUser(api, 2);
    const post = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'alice owns this' },
    });

    const res = await api.request('DELETE', `/api/posts/${post.body.data.post._id}`, {
      token: bob.token,
    });

    assert.equal(res.status, 403);
  });
});

describe('CORS', () => {
  it('allows the configured origin', async () => {
    const res = await api.request('GET', '/api/health', { origin: 'http://localhost:5173' });

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
  });

  it('refuses an unknown origin without granting the header', async () => {
    const res = await api.request('GET', '/api/health', { origin: 'https://evil.example.com' });

    assert.equal(res.headers['access-control-allow-origin'], undefined);
    assert.equal(res.status, 403, 'a blocked origin should be a refusal, not a server error');
  });
});
