import { Router } from 'express';
import { createPost, getFeed, getPost, deletePost } from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// The feed is readable without an account; optionalAuth still identifies a
// logged-in visitor so their own like state can be reported.
router.get('/', optionalAuth, getFeed);
router.get('/:id', optionalAuth, getPost);

router.post('/', protect, createPost);
router.delete('/:id', protect, deletePost);

export default router;
