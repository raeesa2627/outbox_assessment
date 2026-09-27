import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database & Cache
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/outbox_scheduler',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'outbox-secret-key-super-secure-production-jwt-token-2026',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  // Rate Limiting & Queue Defaults
  maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '10', 10),
  defaultDelayBetweenEmailsMs: parseInt(process.env.DEFAULT_DELAY_BETWEEN_EMAILS_MS || '2000', 10),
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),

  // Slack Notification
  defaultSlackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // Ethereal / Custom SMTP
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  }
};
