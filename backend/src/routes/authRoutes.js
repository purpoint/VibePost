import { Router } from 'express';
import { signup, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// Throttling belongs on the endpoints that accept credentials. /me is a
// session check that every page load makes, and rate limiting it would lock
// out ordinary users who share an outbound address behind NAT.
router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.get('/me', protect, me);

export default router;
