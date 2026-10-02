import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  // Note: sanitizeFilter is intentionally NOT enabled globally — it wraps
  // legitimate { $gt, $in } operator queries written in trusted service code.
  // NoSQL-injection defense is handled by express-mongo-sanitize at the HTTP
  // boundary, which strips $/. keys from user-supplied body/query params.

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
