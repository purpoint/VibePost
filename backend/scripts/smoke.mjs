#!/usr/bin/env node
/**
 * Smoke-tests a running VibePost API.
 *
 *   node scripts/smoke.mjs https://vibepost-api.onrender.com
 *
 * Point it at the deployed backend after a release. It exercises the real
 * service over the network: auth, posts, engagement, feed controls and the
 * security behaviour, then deletes the posts it created.
 *
 * It signs up two throwaway accounts with randomised usernames. There is no
 * account-deletion endpoint, so those two accounts remain — that is the only
 * trace it leaves behind, and it is reported at the end.
 */
const baseUrl = (process.argv[2] ?? '').replace(/\/$/, '');

if (!baseUrl) {
  console.error('usage: node scripts/smoke.mjs <api-base-url>');
  console.error('example: node scripts/smoke.mjs https://vibepost-api.onrender.com');
  process.exit(2);
}

const api = (path) => `${baseUrl}${path}`;
const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? `  ${detail}` : ''}`);
  }
}

function section(name) {
  console.log(`\n${name}`);
}

async function call(method, path, { body, token, headers = {}, raw, contentType } = {}) {
  const requestHeaders = { ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (contentType) requestHeaders['Content-Type'] = contentType;
  else if (body && !raw) requestHeaders['Content-Type'] = 'application/json';

  const res = await fetch(api(path), {
    method,
    headers: requestHeaders,
    body: body ? (raw ? body : JSON.stringify(body)) : undefined,
  });

  let parsed = null;
  const text = await res.text();
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  return { status: res.status, headers: res.headers, body: parsed };
}

function multipart(fields = {}, file = null) {
  const boundary = `----vibepost${Math.random().toString(16).slice(2)}`;
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`)
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

const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

console.log(`VibePost production smoke test\ntarget: ${baseUrl}`);

const createdPosts = [];
let alice;
let bob;

// ---------------------------------------------------------------- health ---
section('health');
{
  const res = await call('GET', '/api/health');
  check('health endpoint responds', res.status === 200, `status=${res.status}`);
  check('database is connected', res.body?.data?.database === 'connected', `db=${res.body?.data?.database}`);
  if (res.body?.data?.database !== 'connected') {
    console.error('\nThe API cannot reach its database. Stopping here.');
    process.exit(1);
  }
}

// ------------------------------------------------------------------ auth ---
section('authentication');
{
  const signup = async (suffix) =>
    call('POST', '/api/auth/signup', {
      body: {
        name: `Smoke ${suffix}`,
        username: `smoke_${stamp}_${suffix}`,
        email: `smoke_${stamp}_${suffix}@example.com`,
        password: 'smoke-test-password-1',
      },
    });

  const a = await signup('a');
  check('signup succeeds', a.status === 201, `status=${a.status} ${JSON.stringify(a.body).slice(0, 120)}`);
  check('signup returns a token', typeof a.body?.data?.token === 'string');
  check('signup never returns a password hash', !/passwordHash|\$2[aby]\$/.test(JSON.stringify(a.body)));
  alice = { token: a.body?.data?.token, user: a.body?.data?.user };

  const b = await signup('b');
  bob = { token: b.body?.data?.token, user: b.body?.data?.user };
  check('a second account can be created', b.status === 201, `status=${b.status}`);

  const dupEmail = await call('POST', '/api/auth/signup', {
    body: {
      name: 'Dup',
      username: `smoke_${stamp}_c`,
      email: `smoke_${stamp}_a@example.com`,
      password: 'smoke-test-password-1',
    },
  });
  check('duplicate email rejected', dupEmail.status === 409, `status=${dupEmail.status}`);

  const dupUser = await call('POST', '/api/auth/signup', {
    body: {
      name: 'Dup',
      username: `smoke_${stamp}_a`,
      email: `smoke_${stamp}_d@example.com`,
      password: 'smoke-test-password-1',
    },
  });
  check('duplicate username rejected', dupUser.status === 409, `status=${dupUser.status}`);

  const login = await call('POST', '/api/auth/login', {
    body: { email: `smoke_${stamp}_a@example.com`, password: 'smoke-test-password-1' },
  });
  check('login succeeds', login.status === 200, `status=${login.status}`);

  const wrong = await call('POST', '/api/auth/login', {
    body: { email: `smoke_${stamp}_a@example.com`, password: 'definitely-wrong' },
  });
  const unknown = await call('POST', '/api/auth/login', {
    body: { email: `nobody_${stamp}@example.com`, password: 'definitely-wrong' },
  });
  check('wrong password rejected', wrong.status === 401, `status=${wrong.status}`);
  check('login does not reveal which emails exist', wrong.body?.message === unknown.body?.message);

  const me = await call('GET', '/api/auth/me', { token: alice.token });
  check('session restores via /api/auth/me', me.status === 200 && me.body?.data?.user?.id === alice.user?.id);

  check('missing token rejected', (await call('GET', '/api/auth/me')).status === 401);
  check('tampered token rejected', (await call('GET', '/api/auth/me', { token: 'not.a.real.token' })).status === 401);
}

// ----------------------------------------------------------------- posts ---
section('posts');
{
  const textOnly = await call('POST', '/api/posts', {
    token: alice.token,
    body: { text: `smoke text-only ${stamp}` },
  });
  check('text-only post created', textOnly.status === 201, `status=${textOnly.status}`);
  if (textOnly.body?.data?.post?._id) createdPosts.push([textOnly.body.data.post._id, alice.token]);
  check('author recorded from the token', textOnly.body?.data?.post?.author?.username === alice.user?.username);

  const empty = await call('POST', '/api/posts', { token: alice.token, body: {} });
  check('empty post rejected', empty.status === 400 && empty.body?.message === 'Post text or image is required');

  const anon = await call('POST', '/api/posts', { body: { text: 'anonymous' } });
  check('post without a token rejected', anon.status === 401, `status=${anon.status}`);

  // Image posts: these are the ones that need Cloudinary configured.
  const imageOnly = multipart({}, { field: 'image', filename: 'smoke.png', contentType: 'image/png', buffer: REAL_PNG });
  const imageRes = await call('POST', '/api/posts', {
    token: alice.token,
    body: imageOnly.body,
    contentType: imageOnly.contentType,
    raw: true,
  });

  if (imageRes.status === 201) {
    check('image-only post created', true);
    check('image URL is https and hosted off-server', /^https:\/\//.test(imageRes.body?.data?.post?.imageUrl ?? ''),
      imageRes.body?.data?.post?.imageUrl);
    createdPosts.push([imageRes.body.data.post._id, alice.token]);

    const both = multipart(
      { text: `smoke text+image ${stamp}` },
      { field: 'image', filename: 'smoke.png', contentType: 'image/png', buffer: REAL_PNG }
    );
    const bothRes = await call('POST', '/api/posts', {
      token: alice.token, body: both.body, contentType: both.contentType, raw: true,
    });
    check('text + image post created', bothRes.status === 201, `status=${bothRes.status}`);
    if (bothRes.body?.data?.post?._id) createdPosts.push([bothRes.body.data.post._id, alice.token]);
  } else if (imageRes.status === 503) {
    check('image upload is configured', false, 'Cloudinary credentials are missing on the server (503)');
  } else {
    check('image-only post created', false, `status=${imageRes.status} ${JSON.stringify(imageRes.body).slice(0, 140)}`);
  }

  const badType = multipart({ text: 'bad' }, { field: 'image', filename: 'a.pdf', contentType: 'application/pdf', buffer: REAL_PNG });
  const badTypeRes = await call('POST', '/api/posts', {
    token: alice.token, body: badType.body, contentType: badType.contentType, raw: true,
  });
  check('disallowed file type rejected', badTypeRes.status === 400, `status=${badTypeRes.status}`);

  const disguised = Buffer.from(`<?php system($_GET[0]); ?>${'x'.repeat(64)}`);
  const fake = multipart({ text: 'fake' }, { field: 'image', filename: 'x.png', contentType: 'image/png', buffer: disguised });
  const fakeRes = await call('POST', '/api/posts', {
    token: alice.token, body: fake.body, contentType: fake.contentType, raw: true,
  });
  check('file that is not really an image rejected', fakeRes.status === 400, `status=${fakeRes.status}`);

  const oversized = multipart({ text: 'big' }, {
    field: 'image', filename: 'big.png', contentType: 'image/png',
    buffer: Buffer.concat([REAL_PNG, Buffer.alloc(6 * 1024 * 1024)]),
  });
  const oversizedRes = await call('POST', '/api/posts', {
    token: alice.token, body: oversized.body, contentType: oversized.contentType, raw: true,
  });
  check('oversized image rejected', oversizedRes.status === 400, `status=${oversizedRes.status}`);

  const feedPublic = await call('GET', '/api/posts');
  check('feed is readable while logged out', feedPublic.status === 200);

  const bobDelete = await call('DELETE', `/api/posts/${createdPosts[0]?.[0]}`, { token: bob.token });
  check('another user cannot delete the post', bobDelete.status === 403, `status=${bobDelete.status}`);
}

// ------------------------------------------------------------ engagement ---
section('engagement');
{
  const [postId] = createdPosts[0] ?? [];

  const like = await call('POST', `/api/posts/${postId}/like`, { token: bob.token });
  check('like succeeds', like.status === 200 && like.body?.data?.liked === true, `status=${like.status}`);
  check('like count is 1', like.body?.data?.likeCount === 1);
  check('liker username persisted', like.body?.data?.likes?.[0]?.username === bob.user?.username);

  const unlike = await call('POST', `/api/posts/${postId}/like`, { token: bob.token });
  check('unlike succeeds', unlike.body?.data?.liked === false && unlike.body?.data?.likeCount === 0);

  await call('POST', `/api/posts/${postId}/like`, { token: bob.token });

  const anonLike = await call('POST', `/api/posts/${postId}/like`);
  check('like requires authentication', anonLike.status === 401, `status=${anonLike.status}`);

  const comment = await call('POST', `/api/posts/${postId}/comments`, {
    token: bob.token,
    body: { text: `smoke comment ${stamp}` },
  });
  check('comment succeeds', comment.status === 201, `status=${comment.status}`);
  check('comment count is 1', comment.body?.data?.commentCount === 1);
  check('commenter username persisted', comment.body?.data?.comment?.username === bob.user?.username);

  const emptyComment = await call('POST', `/api/posts/${postId}/comments`, { token: bob.token, body: { text: '  ' } });
  check('empty comment rejected', emptyComment.status === 400, `status=${emptyComment.status}`);

  const anonComment = await call('POST', `/api/posts/${postId}/comments`, { body: { text: 'x' } });
  check('comment requires authentication', anonComment.status === 401, `status=${anonComment.status}`);

  const readComments = await call('GET', `/api/posts/${postId}/comments`);
  check('comments readable while logged out', readComments.status === 200 && readComments.body?.data?.commentCount === 1);

  const asBob = await call('GET', '/api/posts?limit=50', { token: bob.token });
  const asAlice = await call('GET', '/api/posts?limit=50', { token: alice.token });
  const mineForBob = asBob.body?.data?.posts?.find((p) => p._id === postId);
  const mineForAlice = asAlice.body?.data?.posts?.find((p) => p._id === postId);
  check('engagement survives a fresh read', mineForBob?.likeCount === 1 && mineForBob?.commentCount === 1);
  check('likedByMe is true only for the liker', mineForBob?.likedByMe === true && mineForAlice?.likedByMe === false);
}

// ------------------------------------------------------------------ feed ---
section('feed controls');
{
  for (const sort of ['latest', 'foryou', 'liked', 'commented']) {
    const res = await call('GET', `/api/posts?sort=${sort}&limit=5`, { token: alice.token });
    check(`sort=${sort} responds`, res.status === 200 && Array.isArray(res.body?.data?.posts), `status=${res.status}`);
  }

  const forYou = await call('GET', '/api/posts?sort=foryou&limit=50', { token: alice.token });
  check('for you excludes the reader\'s own posts',
    forYou.body?.data?.posts?.every((p) => p.author.username !== alice.user?.username));

  const search = await call('GET', `/api/posts?search=${encodeURIComponent(`smoke text-only ${stamp}`)}`);
  check('search finds the post just created', search.body?.data?.pagination?.totalPosts >= 1,
    `total=${search.body?.data?.pagination?.totalPosts}`);

  const noResults = await call('GET', `/api/posts?search=zzz_no_such_post_${stamp}`);
  check('search with no matches returns an empty page',
    noResults.body?.data?.posts?.length === 0 && noResults.body?.data?.pagination?.totalPosts === 0);

  const regexy = await call('GET', `/api/posts?search=${encodeURIComponent('.*(')}`);
  check('regex metacharacters in search are literal', regexy.status === 200, `status=${regexy.status}`);

  const page1 = await call('GET', '/api/posts?page=1&limit=2');
  const page2 = await call('GET', '/api/posts?page=2&limit=2');
  const ids = [...(page1.body?.data?.posts ?? []), ...(page2.body?.data?.posts ?? [])].map((p) => p._id);
  check('pagination returns the requested size', page1.body?.data?.posts?.length === 2);
  check('pages do not repeat a post', new Set(ids).size === ids.length, ids.join(','));
  check('pagination reports totals', typeof page1.body?.data?.pagination?.totalPosts === 'number');

  const beyond = await call('GET', '/api/posts?page=9999&limit=10');
  check('a page past the end is empty, not an error', beyond.status === 200 && beyond.body?.data?.posts?.length === 0);

  const combined = await call('GET', '/api/posts?search=smoke&sort=liked&page=1&limit=2');
  check('search, sort and pagination combine', combined.status === 200, `status=${combined.status}`);
}

// -------------------------------------------------------------- security ---
section('security');
{
  const injection = await call('POST', '/api/auth/login', { body: { email: { $ne: null }, password: { $ne: null } } });
  check('operator object rejected where a credential is expected', injection.status === 400, `status=${injection.status}`);

  const searchInjection = await call('GET', '/api/posts?search[$ne]=x');
  check('operator object in a query is ignored', searchInjection.status === 200, `status=${searchInjection.status}`);

  const badOrigin = await call('GET', '/api/health', { headers: { Origin: 'https://evil.example.com' } });
  check('unknown origin is refused', badOrigin.status === 403, `status=${badOrigin.status}`);
  check('unknown origin gets no allow header',
    !badOrigin.headers.get('access-control-allow-origin'),
    badOrigin.headers.get('access-control-allow-origin') ?? '');

  const health = await call('GET', '/api/health');
  check('server does not advertise its technology', !health.headers.get('x-powered-by'));
  check('nosniff header present', health.headers.get('x-content-type-options') === 'nosniff');

  const notFound = await call('GET', '/api/definitely-not-a-route');
  check('unknown route returns a clean 404', notFound.status === 404 && notFound.body?.success === false);
  check('errors carry no stack trace', !/\bat \w+.*:\d+:\d+/.test(JSON.stringify(notFound.body)));
}

// --------------------------------------------------------------- cleanup ---
section('cleanup');
{
  let removed = 0;
  for (const [id, token] of createdPosts) {
    const res = await call('DELETE', `/api/posts/${id}`, { token });
    if (res.status === 200) removed += 1;
  }
  check('smoke-test posts removed', removed === createdPosts.length, `${removed}/${createdPosts.length}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) console.log(`failing: ${failures.join('; ')}`);
console.log(
  `\nNote: two accounts remain on the server (smoke_${stamp}_a, smoke_${stamp}_b).\n` +
    'There is no account-deletion endpoint, so remove them from Atlas if you want a clean database.'
);

process.exit(failed > 0 ? 1 : 0);
