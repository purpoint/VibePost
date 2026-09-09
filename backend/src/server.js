import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const PORT = process.env.PORT || 5000;

/**
 * Start the API. The database connection is attempted first, but a failure is
 * logged rather than fatal so the process stays up and Mongoose can reconnect.
 */
async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('[db] initial connection failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`[server] VibePost API listening on http://localhost:${PORT}`);
  });
}

start();
