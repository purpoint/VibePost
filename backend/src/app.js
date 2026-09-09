import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { databaseState } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

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
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
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

// Feature routes are mounted in later milestones.

app.use(notFound);
app.use(errorHandler);

export default app;
