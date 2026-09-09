import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { startTestServer, createUser } from './helpers/testServer.js';

let api;
let alice;
let bob;
let postId;

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
  const created = await api.request('POST', '/api/posts', {
    token: alice.token,
    body: { text: 'a post to engage with' },
  });
  postId = created.body.data.post._id;
});

const likesOf = (id) =>
  mongoose.connection.db
    .collection('posts')
    .findOne({ _id: new mongoose.Types.ObjectId(id) })
    .then((doc) => doc.likes);

describe('likes', () => {
  it('adds a like and stores the username', async () => {
    const res = await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.liked, true);
    assert.equal(res.body.data.likeCount, 1);
    assert.equal(res.body.data.likes[0].username, 'user2');
  });

  it('removes the like when applied again', async () => {
    await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });
    const res = await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });

    assert.equal(res.body.data.liked, false);
    assert.equal(res.body.data.likeCount, 0);
  });

  it('is deterministic across sequential toggles', async () => {
    let res;
    for (let i = 0; i < 7; i += 1) {
      res = await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });
    }

    assert.equal(res.body.data.liked, true, 'an odd number of toggles ends liked');
    assert.equal(res.body.data.likeCount, 1);
  });

  it('counts each user separately', async () => {
    await api.request('POST', `/api/posts/${postId}/like`, { token: alice.token });
    const res = await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });

    assert.equal(res.body.data.likeCount, 2);
    assert.deepEqual(
      res.body.data.likes.map((like) => like.username).sort(),
      ['user1', 'user2']
    );
  });

  it('never stores a duplicate, even under concurrent requests', async () => {
    await Promise.all(
      Array.from({ length: 12 }, () =>
        api.request('POST', `/api/posts/${postId}/like`, { token: bob.token })
      )
    );

    const likes = await likesOf(postId);
    const ids = likes.map((like) => String(like.userId));

    assert.equal(new Set(ids).size, ids.length, 'the same user appears twice in likes');
    assert.ok(likes.length <= 1, `one user left ${likes.length} likes behind`);
  });

  it('records every user when many like at once', async () => {
    const crowd = [];
    for (let i = 10; i < 16; i += 1) crowd.push(await createUser(api, i));

    await Promise.all(
      crowd.map((user) => api.request('POST', `/api/posts/${postId}/like`, { token: user.token }))
    );

    const likes = await likesOf(postId);
    assert.equal(likes.length, 6);
    assert.equal(new Set(likes.map((l) => String(l.userId))).size, 6);
    assert.ok(likes.every((l) => typeof l.username === 'string' && l.username.length > 0));
  });

  it('requires authentication', async () => {
    const res = await api.request('POST', `/api/posts/${postId}/like`);
    assert.equal(res.status, 401);
  });

  it('returns 404 for a post that does not exist', async () => {
    const res = await api.request('POST', '/api/posts/6aa114a447ec32b1eb20d799/like', {
      token: bob.token,
    });
    assert.equal(res.status, 404);
  });
});

describe('comments', () => {
  it('adds a comment and stores the username', async () => {
    const res = await api.request('POST', `/api/posts/${postId}/comments`, {
      token: bob.token,
      body: { text: 'Nice post!' },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.commentCount, 1);
    assert.equal(res.body.data.comment.username, 'user2');
    assert.equal(res.body.data.comment.text, 'Nice post!');
    assert.ok(res.body.data.comment.createdAt);
  });

  it('returns comments newest first', async () => {
    await api.request('POST', `/api/posts/${postId}/comments`, {
      token: bob.token,
      body: { text: 'first' },
    });
    await api.request('POST', `/api/posts/${postId}/comments`, {
      token: alice.token,
      body: { text: 'second' },
    });

    const res = await api.request('GET', `/api/posts/${postId}/comments`);

    assert.equal(res.body.data.comments.length, 2);
    assert.equal(res.body.data.comments[0].text, 'second');
  });

  it('is readable without authentication', async () => {
    const res = await api.request('GET', `/api/posts/${postId}/comments`);
    assert.equal(res.status, 200);
  });

  it('keeps every comment when many arrive at once', async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        api.request('POST', `/api/posts/${postId}/comments`, {
          token: i % 2 ? alice.token : bob.token,
          body: { text: `comment ${i}` },
        })
      )
    );

    const res = await api.request('GET', `/api/posts/${postId}/comments`);
    assert.equal(res.body.data.commentCount, 10);
  });

  for (const [label, text] of [
    ['an empty comment', ''],
    ['a whitespace-only comment', '   \n '],
  ]) {
    it(`rejects ${label}`, async () => {
      const res = await api.request('POST', `/api/posts/${postId}/comments`, {
        token: bob.token,
        body: { text },
      });
      assert.equal(res.status, 400);
    });
  }

  it('rejects a comment over the length limit', async () => {
    const res = await api.request('POST', `/api/posts/${postId}/comments`, {
      token: bob.token,
      body: { text: 'x'.repeat(501) },
    });
    assert.equal(res.status, 400);
  });

  it('requires authentication to write', async () => {
    const res = await api.request('POST', `/api/posts/${postId}/comments`, {
      body: { text: 'anonymous' },
    });
    assert.equal(res.status, 401);
  });

  it('returns 404 for a post that does not exist', async () => {
    const res = await api.request('POST', '/api/posts/6aa114a447ec32b1eb20d799/comments', {
      token: bob.token,
      body: { text: 'hello' },
    });
    assert.equal(res.status, 404);
  });
});

describe('engagement is visible to other users', () => {
  it('shows one user the counts produced by another', async () => {
    await api.request('POST', `/api/posts/${postId}/like`, { token: alice.token });
    await api.request('POST', `/api/posts/${postId}/comments`, {
      token: alice.token,
      body: { text: 'from alice' },
    });

    const feed = await api.request('GET', '/api/posts', { token: bob.token });
    const post = feed.body.data.posts.find((p) => p._id === postId);

    assert.equal(post.likeCount, 1);
    assert.equal(post.commentCount, 1);
    assert.equal(post.likedByMe, false, "another user's like is not reported as mine");
  });

  it('reports likedByMe only for the user who liked', async () => {
    await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });

    const asBob = await api.request('GET', '/api/posts', { token: bob.token });
    const asAlice = await api.request('GET', '/api/posts', { token: alice.token });
    const anonymous = await api.request('GET', '/api/posts');

    assert.equal(asBob.body.data.posts.find((p) => p._id === postId).likedByMe, true);
    assert.equal(asAlice.body.data.posts.find((p) => p._id === postId).likedByMe, false);
    assert.equal(anonymous.body.data.posts.find((p) => p._id === postId).likedByMe, false);
  });

  it('removes engagement along with a deleted post', async () => {
    await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });
    await api.request('DELETE', `/api/posts/${postId}`, { token: alice.token });

    const comments = await api.request('GET', `/api/posts/${postId}/comments`);
    const like = await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });

    assert.equal(comments.status, 404);
    assert.equal(like.status, 404);
  });
});

describe('database shape', () => {
  it('uses exactly two collections', async () => {
    await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });
    await api.request('POST', `/api/posts/${postId}/comments`, {
      token: bob.token,
      body: { text: 'embedded, not a collection' },
    });

    const names = (await mongoose.connection.db.listCollections().toArray())
      .map((c) => c.name)
      .sort();

    assert.deepEqual(names, ['posts', 'users']);
  });

  it('embeds likes and comments inside the post document', async () => {
    await api.request('POST', `/api/posts/${postId}/like`, { token: bob.token });
    await api.request('POST', `/api/posts/${postId}/comments`, {
      token: bob.token,
      body: { text: 'inside the post' },
    });

    const doc = await mongoose.connection.db
      .collection('posts')
      .findOne({ _id: new mongoose.Types.ObjectId(postId) });

    assert.equal(doc.likes.length, 1);
    assert.equal(doc.comments.length, 1);
    assert.equal(doc.likes[0].username, 'user2');
    assert.equal(doc.comments[0].username, 'user2');
  });
});
