import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers/testServer.js';

let api;

before(async () => {
  // Its own file, and so its own process: a small allowance here cannot
  // throttle the suites that legitimately create many accounts.
  api = await startTestServer({ env: { AUTH_RATE_LIMIT_MAX: '4' } });
});
after(async () => {
  await api.close();
});

describe('rate limiting', () => {
  it('throttles repeated credential attempts and says when to retry', async () => {
    const attempts = [];
    for (let i = 0; i < 8; i += 1) {
      attempts.push(
        await api.request('POST', '/api/auth/login', {
          body: { email: 'nobody@example.com', password: 'guessing' },
        })
      );
    }

    const allowed = attempts.filter((res) => res.status === 401);
    const limited = attempts.filter((res) => res.status === 429);

    assert.equal(allowed.length, 4, 'the configured allowance should be honoured exactly');
    assert.equal(limited.length, 4, 'everything past the allowance should be throttled');
    assert.ok(limited[0].headers['retry-after'], 'no Retry-After header on a throttled response');
    assert.match(limited[0].body.message, /too many/i);
  });

  it('leaves the rest of the API reachable while auth is throttled', async () => {
    const feed = await api.request('GET', '/api/posts');

    assert.equal(feed.status, 200, 'throttling credentials must not take the feed down');
  });
});
