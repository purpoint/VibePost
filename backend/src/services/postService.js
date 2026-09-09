import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/validators.js';

/**
 * Builds the author snapshot stored on a post from the authenticated user.
 * Taking it from req.user rather than the request body is what stops a client
 * from posting as somebody else.
 */
function authorFrom(user) {
  return {
    userId: user._id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

export async function createPost({ author, text, imageUrl }) {
  const post = await Post.create({
    author: authorFrom(author),
    text,
    imageUrl,
  });

  return post;
}

const SORT_STAGES = {
  latest: { createdAt: -1 },
  liked: { likeCount: -1, createdAt: -1 },
  commented: { commentCount: -1, createdAt: -1 },
};

/**
 * Builds the feed.
 *
 * One aggregation does the whole job: it filters, derives the engagement
 * counts, sorts by them, and returns the page alongside the total in a single
 * round trip. Counts are computed here rather than stored on the document, so
 * sorting by 'liked' can never disagree with the likes array itself.
 *
 * The comments array is left out of the response — it can be long, and the
 * feed only needs its size. The likes array is small and is kept so the UI can
 * name who liked a post.
 */
export async function listPosts({ page, limit, sort, search, currentUserId }) {
  const pipeline = [];

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    pipeline.push({
      $match: {
        $or: [{ text: pattern }, { 'author.username': pattern }, { 'author.name': pattern }],
      },
    });
  }

  pipeline.push({
    $addFields: {
      likeCount: { $size: '$likes' },
      commentCount: { $size: '$comments' },
      likedByMe: currentUserId ? { $in: [currentUserId, '$likes.userId'] } : false,
    },
  });

  pipeline.push({
    $facet: {
      posts: [
        { $sort: SORT_STAGES[sort] ?? SORT_STAGES.latest },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { comments: 0 } },
      ],
      totalPosts: [{ $count: 'value' }],
    },
  });

  const [result] = await Post.aggregate(pipeline);

  const posts = result?.posts ?? [];
  const totalPosts = result?.totalPosts?.[0]?.value ?? 0;
  const totalPages = Math.ceil(totalPosts / limit);

  return {
    posts,
    pagination: {
      page,
      limit,
      totalPages,
      totalPosts,
      hasNextPage: page < totalPages,
    },
  };
}

export async function getPostById(postId) {
  const post = await Post.findById(postId);

  if (!post) {
    throw ApiError.notFound('That post no longer exists.');
  }

  return post;
}

/**
 * Deletes a post, but only for its author.
 *
 * The ownership check compares against the authenticated user's id, never an
 * id supplied by the caller.
 */
export async function deletePost({ postId, user }) {
  const post = await getPostById(postId);

  if (!post.author.userId.equals(user._id)) {
    throw ApiError.forbidden('You can only delete your own posts.');
  }

  await post.deleteOne();

  return post;
}

/**
 * Adds or removes the current user's like.
 *
 * The add is guarded by `likes.userId: { $ne }`, so the push only happens when
 * the user is not already in the array. That guard is evaluated by MongoDB as
 * part of the same operation, which means two concurrent likes cannot both
 * insert — the array can never hold a duplicate, without needing a transaction
 * or a read-modify-write cycle.
 */
export async function toggleLike({ postId, user }) {
  const added = await Post.updateOne(
    { _id: postId, 'likes.userId': { $ne: user._id } },
    { $push: { likes: { userId: user._id, username: user.username } } }
  );

  const liked = added.modifiedCount > 0;

  if (!liked) {
    // Either the user had already liked this post, or it does not exist.
    const removed = await Post.updateOne(
      { _id: postId },
      { $pull: { likes: { userId: user._id } } }
    );

    if (removed.matchedCount === 0) {
      throw ApiError.notFound('That post no longer exists.');
    }
  }

  const post = await Post.findById(postId).select('likes');

  if (!post) {
    throw ApiError.notFound('That post no longer exists.');
  }

  return { liked, likeCount: post.likes.length, likes: post.likes };
}

/**
 * Returns a post's comments, newest first.
 */
export async function listComments(postId) {
  const post = await Post.findById(postId).select('comments');

  if (!post) {
    throw ApiError.notFound('That post no longer exists.');
  }

  const comments = [...post.comments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return { comments, commentCount: post.comments.length };
}

/**
 * Appends a comment.
 *
 * $push is atomic, so simultaneous comments from different users are both
 * kept — a read, modify and save cycle could lose one of them.
 */
export async function addComment({ postId, user, text }) {
  const comment = {
    _id: new mongoose.Types.ObjectId(),
    userId: user._id,
    username: user.username,
    text,
    createdAt: new Date(),
  };

  const post = await Post.findByIdAndUpdate(
    postId,
    { $push: { comments: comment } },
    { new: true, select: 'comments' }
  );

  if (!post) {
    throw ApiError.notFound('That post no longer exists.');
  }

  return { comment, commentCount: post.comments.length };
}
