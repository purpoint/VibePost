import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
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

describe('signup', () => {
  it('creates an account and returns a token', async () => {
    const { res } = await createUser(api, 1);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(typeof res.body.data.token, 'string');
    assert.equal(res.body.data.user.username, 'user1');
  });

  it('never returns the password hash', async () => {
    const { res } = await createUser(api, 1, { password: 'supersecret1' });
    const serialised = JSON.stringify(res.body);

    assert.doesNotMatch(serialised, /passwordHash/);
    assert.doesNotMatch(serialised, /\$2[aby]\$/, 'a bcrypt hash reached the response');
  });

  it('normalises email and username to lowercase', async () => {
    const { res } = await createUser(api, 1, { email: 'MixedCase@Example.COM', username: 'user1' });

    assert.equal(res.body.data.user.email, 'mixedcase@example.com');
  });

  it('rejects a duplicate email', async () => {
    await createUser(api, 1);
    const { res } = await createUser(api, 1, { username: 'different' });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /email/i);
  });

  it('rejects a duplicate username', async () => {
    await createUser(api, 1);
    const { res } = await createUser(api, 1, { email: 'other@example.com' });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /username/i);
  });

  it('rejects a duplicate email that differs only by case', async () => {
    await createUser(api, 1, { email: 'person@example.com' });
    const { res } = await createUser(api, 2, { email: 'PERSON@example.com' });

    assert.equal(res.status, 409);
  });

  for (const [label, overrides] of [
    ['a missing name', { name: '' }],
    ['a short password', { password: 'short' }],
    ['an invalid email', { email: 'not-an-email' }],
    ['a username with illegal characters', { username: 'has spaces!' }],
    ['a username that is too short', { username: 'ab' }],
  ]) {
    it(`rejects ${label}`, async () => {
      const { res } = await createUser(api, 1, overrides);

      assert.equal(res.status, 400, JSON.stringify(res.body));
      assert.equal(res.body.success, false);
    });
  }
});

describe('login', () => {
  it('returns a token for valid credentials', async () => {
    await createUser(api, 1);
    const res = await api.request('POST', '/api/auth/login', {
      body: { email: 'user1@example.com', password: 'supersecret1' },
    });

    assert.equal(res.status, 200);
    assert.equal(typeof res.body.data.token, 'string');
  });

  it('accepts an email in a different case', async () => {
    await createUser(api, 1);
    const res = await api.request('POST', '/api/auth/login', {
      body: { email: 'USER1@EXAMPLE.COM', password: 'supersecret1' },
    });

    assert.equal(res.status, 200);
  });

  it('cannot be used to discover which emails are registered', async () => {
    await createUser(api, 1);

    const wrongPassword = await api.request('POST', '/api/auth/login', {
      body: { email: 'user1@example.com', password: 'wrongpassword' },
    });
    const unknownEmail = await api.request('POST', '/api/auth/login', {
      body: { email: 'nobody@example.com', password: 'wrongpassword' },
    });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(
      wrongPassword.body.message,
      unknownEmail.body.message,
      'the two failures must be indistinguishable'
    );
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { token } = await createUser(api, 1);
    const res = await api.request('GET', '/api/auth/me', { token });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.username, 'user1');
    assert.doesNotMatch(JSON.stringify(res.body), /passwordHash|\$2[aby]\$/);
  });

  it('rejects a missing token', async () => {
    const res = await api.request('GET', '/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('rejects a malformed token', async () => {
    const res = await api.request('GET', '/api/auth/me', { token: 'not.a.token' });
    assert.equal(res.status, 401);
  });

  it('rejects a token signed with a different secret', async () => {
    const { user } = await createUser(api, 1);
    const forged = jwt.sign({ userId: user.id }, 'a-totally-different-secret-value', {
      expiresIn: '7d',
    });

    const res = await api.request('GET', '/api/auth/me', { token: forged });
    assert.equal(res.status, 401);
  });

  it('rejects an expired token and says so', async () => {
    const { user } = await createUser(api, 1);
    const expired = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '-1s' });

    const res = await api.request('GET', '/api/auth/me', { token: expired });

    assert.equal(res.status, 401);
    assert.match(res.body.message, /expired/i);
  });

  it('rejects a valid token belonging to a deleted account', async () => {
    const ghost = jwt.sign({ userId: '6aa114a447ec32b1eb20d799' }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const res = await api.request('GET', '/api/auth/me', { token: ghost });
    assert.equal(res.status, 401);
  });
});
