import { Router } from 'express';
import {
  createPost,
  getFeed,
  getPost,
  deletePost,
  toggleLike,
  getComments,
  addComment,
} from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadPostImage } from '../middleware/uploadMiddleware.js';

const router = Router();

// The feed is readable without an account; optionalAuth still identifies a
// logged-in visitor so their own like state can be reported.
router.get('/', optionalAuth, getFeed);
router.get('/:id', optionalAuth, getPost);
router.get('/:id/comments', getComments);

router.post('/', protect, uploadPostImage, createPost);
router.delete('/:id', protect, deletePost);

// Engagement always requires an account.
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);

export default router;
