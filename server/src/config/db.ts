import mongoose from 'mongoose';
import { config } from './index';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database');
  });
};
