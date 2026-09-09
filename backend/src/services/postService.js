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
