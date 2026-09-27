import Redis, { RedisOptions } from 'ioredis';
import { config } from './index';

const getRedisOptions = (): RedisOptions => {
  const isTls = config.redisUrl.startsWith('rediss://');
  return {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: false,
    tls: isTls ? { rejectUnauthorized: false } : undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  };
};

// Dedicated Redis connection for general caching and rate limiting
export const redisClient = new Redis(config.redisUrl, getRedisOptions());

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Redis instance');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

// Helper to create duplicate connections for BullMQ Queue & Worker
export const createRedisConnection = () => {
  return new Redis(config.redisUrl, getRedisOptions());
};

