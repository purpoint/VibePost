import { Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';

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

/**
 * Returns the most recent posts.
 * Pagination, sorting and search are layered on in the next step.
 */
export async function listPosts() {
  return Post.find().sort({ createdAt: -1 }).limit(10);
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
