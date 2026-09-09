import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas.
 *
 * Mongoose buffers queries and reconnects on its own once a connection has been
 * established, so the caller is free to start the HTTP server even if the first
 * attempt fails — requests that need the database will simply report an error
 * until the connection recovers.
 */
export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[db] reconnected to MongoDB');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
}

export function databaseState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}
