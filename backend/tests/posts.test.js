import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, createUser, multipart, REAL_PNG } from './helpers/testServer.js';

let api;
let alice;
let bob;

before(async () => {
  api = await startTestServer();
});
after(async () => {
  await api.close();
});
beforeEach(async () => {
  await api.reset();
  alice = await createUser(api, 1);
  bob = await createUser(api, 2);
});

const postMultipart = (token, fields, file) => {
  const { body, contentType } = multipart(fields, file);
  return api.request('POST', '/api/posts', { token, body, contentType, raw: true });
};
const imageFile = (buffer = REAL_PNG, contentType = 'image/png', filename = 'photo.png') => ({
  field: 'image',
  filename,
  contentType,
  buffer,
});

describe('creating posts', () => {
  it('accepts a text-only post', async () => {
    const res = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'Hello VibePost' },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.post.text, 'Hello VibePost');
    assert.equal(res.body.data.post.imageUrl, '');
  });

  it('stores the author identity from the token', async () => {
    const res = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'mine' },
    });

    assert.equal(res.body.data.post.author.username, 'user1');
    assert.equal(res.body.data.post.author.userId, alice.user.id);
  });

  it('ignores an author supplied in the request body', async () => {
    const res = await api.request('POST', '/api/posts', {
      token: bob.token,
      body: {
        text: 'pretending to be someone else',
        author: { userId: alice.user.id, username: 'user1', name: 'User 1' },
      },
    });

    assert.equal(res.body.data.post.author.username, 'user2');
  });

  it('ignores an imageUrl supplied in the request body', async () => {
    const res = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'hi', imageUrl: 'https://elsewhere.example.com/tracker.gif' },
    });

    assert.equal(res.body.data.post.imageUrl, '');
  });

  it('rejects a post with neither text nor image', async () => {
    const res = await api.request('POST', '/api/posts', { token: alice.token, body: {} });

    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Post text or image is required');
  });

  it('rejects a whitespace-only post', async () => {
    const res = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: '   \n  ' },
    });

    assert.equal(res.status, 400);
  });

  it('rejects a post longer than the limit', async () => {
    const res = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'x'.repeat(1001) },
    });

    assert.equal(res.status, 400);
  });

  it('requires authentication', async () => {
    const res = await api.request('POST', '/api/posts', { body: { text: 'anonymous' } });
    assert.equal(res.status, 401);
  });

  it('starts a post with empty likes and comments', async () => {
    const res = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'fresh' },
    });

    assert.deepEqual(res.body.data.post.likes, []);
    assert.deepEqual(res.body.data.post.comments, []);
    assert.equal(res.body.data.post.likeCount, 0);
    assert.equal(res.body.data.post.commentCount, 0);
  });
});

describe('image uploads', () => {
  it('accepts a text-only multipart post with no file', async () => {
    const res = await postMultipart(alice.token, { text: 'no file attached' });
    assert.equal(res.status, 201);
  });

  it('rejects a file whose declared type is not an image', async () => {
    const res = await postMultipart(alice.token, { text: 'doc' }, imageFile(REAL_PNG, 'application/pdf', 'a.pdf'));

    assert.equal(res.status, 400);
    assert.match(res.body.message, /JPG, PNG, WEBP and GIF/);
  });

  it('rejects a non-image whose bytes do not match its declared type', async () => {
    const disguised = Buffer.from(`<?php system($_GET[0]); ?>${'x'.repeat(64)}`);
    const res = await postMultipart(alice.token, { text: 'sneaky' }, imageFile(disguised, 'image/png', 'payload.png'));

    assert.equal(res.status, 400);
    assert.match(res.body.message, /not a valid/i);
  });

  it('rejects a file over the size limit', async () => {
    const oversized = Buffer.concat([REAL_PNG, Buffer.alloc(6 * 1024 * 1024)]);
    const res = await postMultipart(alice.token, { text: 'huge' }, imageFile(oversized));

    assert.equal(res.status, 400);
    assert.match(res.body.message, /5MB/);
  });

  it('rejects a file sent under an unexpected field name', async () => {
    const res = await postMultipart(alice.token, { text: 'x' }, { ...imageFile(), field: 'avatar' });
    assert.equal(res.status, 400);
  });

  it('reports clearly when image storage is not configured', async () => {
    // No Cloudinary credentials in the test environment, so a genuine image
    // reaches the upload step and stops there.
    const res = await postMultipart(alice.token, {}, imageFile());

    assert.equal(res.status, 503);
    assert.match(res.body.message, /not configured/i);
  });

  it('creates no post when the upload step fails', async () => {
    await postMultipart(alice.token, { text: 'with image' }, imageFile());

    const feed = await api.request('GET', '/api/posts');
    assert.equal(feed.body.data.pagination.totalPosts, 0);
  });
});

describe('reading and deleting posts', () => {
  it('serves the feed without authentication', async () => {
    await api.request('POST', '/api/posts', { token: alice.token, body: { text: 'public' } });
    const res = await api.request('GET', '/api/posts');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.posts.length, 1);
  });

  it('returns 404 for a post that does not exist', async () => {
    const res = await api.request('GET', '/api/posts/6aa114a447ec32b1eb20d799');
    assert.equal(res.status, 404);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await api.request('GET', '/api/posts/not-an-id');
    assert.equal(res.status, 400);
  });

  it("refuses to delete another user's post", async () => {
    const created = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'alice owns this' },
    });

    const res = await api.request('DELETE', `/api/posts/${created.body.data.post._id}`, {
      token: bob.token,
    });

    assert.equal(res.status, 403);
  });

  it('refuses to delete without authentication', async () => {
    const created = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'alice owns this' },
    });

    const res = await api.request('DELETE', `/api/posts/${created.body.data.post._id}`);
    assert.equal(res.status, 401);
  });

  it('lets the author delete their own post', async () => {
    const created = await api.request('POST', '/api/posts', {
      token: alice.token,
      body: { text: 'temporary' },
    });
    const id = created.body.data.post._id;

    const res = await api.request('DELETE', `/api/posts/${id}`, { token: alice.token });
    assert.equal(res.status, 200);

    const gone = await api.request('GET', `/api/posts/${id}`);
    assert.equal(gone.status, 404);
  });
});
