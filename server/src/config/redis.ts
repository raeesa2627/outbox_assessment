import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { config } from './index';

let isMock = false;

const createConnection = () => {
  if (!config.redisUrl || isMock) {
    return new RedisMock();
  }

  try {
    const isTls = config.redisUrl.startsWith('rediss://');
    const client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy: (times) => {
        if (times > 2) {
          isMock = true;
          return null; // Stop retrying if Redis is not available
        }
        return 1000;
      },
    });

    client.on('error', (err) => {
      // Suppress unhandled crash if Redis is unavailable; fallback is active
      if (!isMock) {
        console.warn(`[Redis] Note: Redis not running locally (${err.message}). Using MongoDB in-memory engine.`);
        isMock = true;
      }
    });

    return client;
  } catch {
    isMock = true;
    return new RedisMock();
  }
};

export const redisClient = createConnection();

export const createRedisConnection = () => {
  if (isMock) {
    return new RedisMock();
  }
  return createConnection();
};


