import * as postService from '../services/postService.js';
import {
  validatePostInput,
  parseFeedQuery,
  validateCommentInput,
} from '../utils/validators.js';
import { uploadImage, destroyImage } from '../config/cloudinary.js';
import { assertIsRealImage } from '../utils/imageInspector.js';

/**
 * POST /api/posts — create a post containing text, an image, or both.
 *
 * Accepts multipart/form-data with an optional `image` file, or plain JSON for
 * a text-only post. The request is fully validated before anything is
 * uploaded, so a rejected post never leaves a file behind at the provider.
 */
export async function createPost(req, res) {
  const { text } = validatePostInput(req.body, { hasImage: Boolean(req.file) });

  let imageUrl = '';
  let publicId = '';

  if (req.file) {
    // The declared content type came from the client; check the bytes.
    assertIsRealImage(req.file.buffer);
    ({ url: imageUrl, publicId } = await uploadImage(req.file.buffer));
  }

  try {
    const post = await postService.createPost({ author: req.user, text, imageUrl });
    res.status(201).json({ success: true, data: { post } });
  } catch (error) {
    // The image is already hosted but has no post pointing at it — remove it
    // rather than leaving an orphan behind.
    await destroyImage(publicId);
    throw error;
  }
}

/**
 * GET /api/posts — the public feed.
 * Supports ?page, ?limit, ?sort (latest | liked | commented) and ?search.
 */
export async function getFeed(req, res) {
  const { page, limit, sort, search } = parseFeedQuery(req.query);

  const { posts, pagination } = await postService.listPosts({
    page,
    limit,
    sort,
    search,
    currentUserId: req.user?._id,
  });

  res.json({ success: true, data: { posts, pagination } });
}

/**
 * GET /api/posts/:id — a single post, including its comments.
 */
export async function getPost(req, res) {
  const post = await postService.getPostById(req.params.id);

  res.json({ success: true, data: { post } });
}

/**
 * DELETE /api/posts/:id — author only.
 */
export async function deletePost(req, res) {
  await postService.deletePost({ postId: req.params.id, user: req.user });

  res.json({ success: true, data: { id: req.params.id } });
}

/**
 * POST /api/posts/:id/like — toggles the current user's like.
 */
export async function toggleLike(req, res) {
  const result = await postService.toggleLike({ postId: req.params.id, user: req.user });

  res.json({ success: true, data: result });
}

/**
 * GET /api/posts/:id/comments — newest first.
 */
export async function getComments(req, res) {
  const result = await postService.listComments(req.params.id);

  res.json({ success: true, data: result });
}

/**
 * POST /api/posts/:id/comments
 */
export async function addComment(req, res) {
  const { text } = validateCommentInput(req.body);

  const result = await postService.addComment({
    postId: req.params.id,
    user: req.user,
    text,
  });

  res.status(201).json({ success: true, data: result });
}
