import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { databaseState } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { authRateLimiter } from './middleware/rateLimitMiddleware.js';
import { ApiError } from './utils/ApiError.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

const app = express();

// Render and similar platforms put the app behind a proxy; without this
// req.ip reports the proxy's address and rate limiting would treat every
// visitor as the same client.
app.set('trust proxy', 1);

/**
 * Allowed browser origins. CLIENT_URL accepts a comma-separated list so the
 * deployed frontend and a local dev server can both be permitted.
 */
const allowedOrigins = (process.env.CLIENT_URL ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, health checks) are allowed.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // A plain Error here would surface as a 500. A blocked origin is a
      // refusal, not a server fault.
      return callback(ApiError.forbidden('This origin is not allowed to use the API.'));
    },
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'vibepost-api',
      database: databaseState(),
      uptime: Math.round(process.uptime()),
    },
  });
});

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/posts', postRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
