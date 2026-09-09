import * as postService from '../services/postService.js';
import { validatePostInput } from '../utils/validators.js';

/**
 * POST /api/posts — create a post containing text, an image, or both.
 */
export async function createPost(req, res) {
  const { text, imageUrl } = validatePostInput(req.body);

  const post = await postService.createPost({ author: req.user, text, imageUrl });

  res.status(201).json({ success: true, data: { post } });
}

/**
 * GET /api/posts — the public feed.
 */
export async function getFeed(req, res) {
  const posts = await postService.listPosts();

  res.json({ success: true, data: { posts } });
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
