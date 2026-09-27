import Redis from 'ioredis';
import { config } from './index';

// Dedicated Redis connection for general caching and rate limiting
export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Redis instance');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

// Helper to create duplicate connections for BullMQ Queue & Worker
export const createRedisConnection = () => {
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};
