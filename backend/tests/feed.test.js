import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { startTestServer, createUser } from './helpers/testServer.js';

let api;
let alice;
let bob;
let cara;
const ids = {};

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
  cara = await createUser(api, 3);

  const write = async (token, text, key) => {
    const res = await api.request('POST', '/api/posts', { token, body: { text } });
    ids[key] = res.body.data.post._id;
  };

  for (let i = 1; i <= 4; i += 1) await write(alice.token, `alice post ${i}`, `alice${i}`);
  for (let i = 1; i <= 3; i += 1) await write(bob.token, `bob post ${i}`, `bob${i}`);
  for (let i = 1; i <= 3; i += 1) await write(cara.token, `cara post ${i}`, `cara${i}`);

  // bob2 scores 3 (two likes, one comment); cara1 scores 2; alice1 scores 4.
  await api.request('POST', `/api/posts/${ids.bob2}/like`, { token: alice.token });
  await api.request('POST', `/api/posts/${ids.bob2}/like`, { token: cara.token });
  await api.request('POST', `/api/posts/${ids.bob2}/comments`, { token: cara.token, body: { text: 'great' } });
  await api.request('POST', `/api/posts/${ids.cara1}/like`, { token: bob.token });
  await api.request('POST', `/api/posts/${ids.cara1}/comments`, { token: bob.token, body: { text: 'nice' } });
  await api.request('POST', `/api/posts/${ids.alice1}/like`, { token: bob.token });
  await api.request('POST', `/api/posts/${ids.alice1}/like`, { token: cara.token });
  await api.request('POST', `/api/posts/${ids.alice1}/comments`, { token: bob.token, body: { text: 'wow' } });
  await api.request('POST', `/api/posts/${ids.alice1}/comments`, { token: cara.token, body: { text: 'yes' } });
});

describe('pagination', () => {
  it('returns the requested page size and reports the totals', async () => {
    const res = await api.request('GET', '/api/posts?page=1&limit=4');

    assert.equal(res.body.data.posts.length, 4);
    assert.deepEqual(res.body.data.pagination, {
      page: 1,
      limit: 4,
      totalPages: 3,
      totalPosts: 10,
      hasNextPage: true,
    });
  });

  it('returns the remainder on the last page and reports no next page', async () => {
    const res = await api.request('GET', '/api/posts?page=3&limit=4');

    assert.equal(res.body.data.posts.length, 2);
    assert.equal(res.body.data.pagination.hasNextPage, false);
  });

  it('never repeats a post across pages', async () => {
    const pages = await Promise.all(
      [1, 2, 3].map((page) => api.request('GET', `/api/posts?page=${page}&limit=4`))
    );
    const seen = pages.flatMap((p) => p.body.data.posts.map((post) => post._id));

    assert.equal(new Set(seen).size, 10);
  });

  it('pages consistently when posts share a timestamp', async () => {
    // Posts written in the same millisecond tie on createdAt. Without a
    // unique tiebreaker in the sort, MongoDB is free to order tied documents
    // differently per query, and paging then repeats or skips posts.
    const sameInstant = new Date('2026-01-01T00:00:00.000Z');
    await mongoose.connection.db
      .collection('posts')
      .updateMany({}, { $set: { createdAt: sameInstant } });

    const seen = [];
    for (const page of [1, 2, 3, 4, 5]) {
      const res = await api.request('GET', `/api/posts?page=${page}&limit=2`);
      seen.push(...res.body.data.posts.map((p) => p._id));
    }

    assert.equal(seen.length, 10, 'every post should be returned exactly once');
    assert.equal(new Set(seen).size, 10, 'a post was repeated across pages');
  });

  it('returns an empty page rather than an error past the end', async () => {
    const res = await api.request('GET', '/api/posts?page=99&limit=10');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.posts, []);
  });

  it('clamps out-of-range and unknown query values instead of rejecting them', async () => {
    const res = await api.request('GET', '/api/posts?page=-5&limit=9999&sort=nonsense');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.pagination.page, 1);
    assert.equal(res.body.data.pagination.limit, 50);
  });
});

describe('sorting', () => {
  it('sorts by newest first by default', async () => {
    const res = await api.request('GET', '/api/posts?limit=20');
    const dates = res.body.data.posts.map((p) => new Date(p.createdAt).getTime());

    assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  });

  it('sorts by like count', async () => {
    const res = await api.request('GET', '/api/posts?sort=liked&limit=20');
    const counts = res.body.data.posts.map((p) => p.likeCount);

    assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
    assert.equal(counts[0], 2, 'the most-liked post leads');
  });

  it('sorts by comment count', async () => {
    const res = await api.request('GET', '/api/posts?sort=commented&limit=20');
    const counts = res.body.data.posts.map((p) => p.commentCount);

    assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
  });
});

describe('for you', () => {
  it("excludes the reader's own posts", async () => {
    const res = await api.request('GET', '/api/posts?sort=foryou&limit=20', { token: alice.token });

    assert.ok(res.body.data.posts.every((p) => p.author.username !== 'user1'));
    assert.equal(res.body.data.pagination.totalPosts, 6);
  });

  it("excludes them even when the reader's post is the most engaged", async () => {
    const res = await api.request('GET', '/api/posts?sort=foryou&limit=20', { token: alice.token });

    assert.ok(
      res.body.data.posts.every((p) => p._id !== ids.alice1),
      'the most engaged post on the platform is still excluded from its own author'
    );
    assert.equal(res.body.data.posts[0]._id, ids.bob2);
  });

  it('gives a different reader a different exclusion', async () => {
    const res = await api.request('GET', '/api/posts?sort=foryou&limit=20', { token: bob.token });

    assert.ok(res.body.data.posts.every((p) => p.author.username !== 'user2'));
    assert.equal(res.body.data.posts[0]._id, ids.alice1);
  });

  it('ranks by engagement, descending', async () => {
    const res = await api.request('GET', '/api/posts?sort=foryou&limit=20', { token: alice.token });
    const scores = res.body.data.posts.map((p) => p.likeCount + p.commentCount);

    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  });

  it('works logged out with nothing to exclude', async () => {
    const res = await api.request('GET', '/api/posts?sort=foryou&limit=20');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.pagination.totalPosts, 10);
    assert.equal(res.body.data.posts[0]._id, ids.alice1);
  });

  it('paginates correctly with its own totals', async () => {
    const p1 = await api.request('GET', '/api/posts?sort=foryou&page=1&limit=4', { token: alice.token });
    const p2 = await api.request('GET', '/api/posts?sort=foryou&page=2&limit=4', { token: alice.token });

    assert.equal(p1.body.data.pagination.totalPosts, 6);
    assert.equal(p1.body.data.posts.length, 4);
    assert.equal(p2.body.data.posts.length, 2);
    assert.equal(p2.body.data.pagination.hasNextPage, false);
  });
});

describe('search', () => {
  it('matches post text', async () => {
    const res = await api.request('GET', '/api/posts?search=alice%20post');

    assert.equal(res.body.data.pagination.totalPosts, 4);
    assert.ok(res.body.data.posts.every((p) => p.text.includes('alice post')));
  });

  it('matches the author username', async () => {
    const res = await api.request('GET', '/api/posts?search=user2&limit=20');

    assert.equal(res.body.data.pagination.totalPosts, 3);
    assert.ok(res.body.data.posts.every((p) => p.author.username === 'user2'));
  });

  it('is case-insensitive', async () => {
    const lower = await api.request('GET', '/api/posts?search=alice');
    const upper = await api.request('GET', '/api/posts?search=ALICE');

    assert.equal(lower.body.data.pagination.totalPosts, upper.body.data.pagination.totalPosts);
  });

  it('returns an empty result set for no matches', async () => {
    const res = await api.request('GET', '/api/posts?search=zzzznothing');

    assert.equal(res.body.data.posts.length, 0);
    assert.equal(res.body.data.pagination.totalPosts, 0);
  });

  it('treats regular expression metacharacters as literal text', async () => {
    const res = await api.request('GET', `/api/posts?search=${encodeURIComponent('.*(')}`);

    assert.equal(res.status, 200, 'an unescaped pattern would throw');
    assert.equal(res.body.data.posts.length, 0);
  });

  it('paginates search results', async () => {
    const p1 = await api.request('GET', '/api/posts?search=post&page=1&limit=4');
    const p2 = await api.request('GET', '/api/posts?search=post&page=3&limit=4');

    assert.equal(p1.body.data.pagination.totalPosts, 10);
    assert.equal(p1.body.data.posts.length, 4);
    assert.equal(p2.body.data.posts.length, 2);
  });

  it('combines with sorting and for you', async () => {
    const res = await api.request('GET', '/api/posts?search=bob&sort=foryou&limit=20', {
      token: alice.token,
    });

    assert.ok(res.body.data.posts.every((p) => p.author.username === 'user2'));
    assert.equal(res.body.data.pagination.totalPosts, 3);
  });
});

describe('feed response shape', () => {
  it('omits the comments array but reports its size', async () => {
    const res = await api.request('GET', '/api/posts?sort=commented&limit=1');
    const post = res.body.data.posts[0];

    assert.equal(post.comments, undefined, 'the feed should not ship every comment');
    assert.equal(typeof post.commentCount, 'number');
    assert.ok(post.commentCount > 0);
  });

  it('includes the likes array so likers can be named', async () => {
    const res = await api.request('GET', '/api/posts?sort=liked&limit=1');
    const post = res.body.data.posts[0];

    assert.ok(Array.isArray(post.likes));
    assert.ok(post.likes.every((like) => typeof like.username === 'string'));
  });

  it('returns full comments from the single-post endpoint', async () => {
    const res = await api.request('GET', `/api/posts/${ids.alice1}`);

    assert.equal(res.body.data.post.comments.length, 2);
  });
});
