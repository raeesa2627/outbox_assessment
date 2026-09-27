import { redisClient } from '../config/redis';

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  nextAvailableWindow: Date;
  delayMs: number;
}

const CHECK_AND_INCREMENT_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = redis.call('get', key)
if current and tonumber(current) >= limit then
  return { 0, tonumber(current) }
else
  local newval = redis.call('incr', key)
  if newval == 1 then
    redis.call('expire', key, ttl)
  end
  return { 1, newval }
end
`;

const inMemoryCounters = new Map<string, { count: number; expiresAt: number }>();

/**
 * Atomically checks and increments the hourly email rate limit counter for a sender.
 * Uses Redis Lua atomic script if available, with automatic in-memory sliding window fallback.
 */
export const checkAndIncrementRateLimit = async (
  senderEmail: string,
  limit: number
): Promise<RateLimitCheckResult> => {
  const normalizedEmail = senderEmail.trim().toLowerCase();
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;
  
  // Fixed 1-hour window bucket
  const windowId = Math.floor(now / ONE_HOUR_MS);
  const key = `ratelimit:hourly:${normalizedEmail}:${windowId}`;
  const nextWindowStartMs = (windowId + 1) * ONE_HOUR_MS;
  const remainingWindowSeconds = Math.max(Math.ceil((nextWindowStartMs - now) / 1000), 60);

  try {
    // Try executing atomic Lua script in Redis
    const result = (await redisClient.eval(
      CHECK_AND_INCREMENT_LUA,
      1,
      key,
      limit.toString(),
      remainingWindowSeconds.toString()
    )) as [number, number];

    if (result && Array.isArray(result)) {
      const allowed = result[0] === 1;
      const currentCount = result[1];
      const delayMs = Math.max(nextWindowStartMs - now + 1500, 2000);

      return {
        allowed,
        currentCount,
        limit,
        nextAvailableWindow: new Date(nextWindowStartMs),
        delayMs,
      };
    }
  } catch {
    // Fallback to in-memory sliding window
  }

  // In-Memory Engine Fallback (Zero-Redis / Standalone Mode)
  const entry = inMemoryCounters.get(key) || { count: 0, expiresAt: nextWindowStartMs };
  if (entry.count >= limit) {
    return {
      allowed: false,
      currentCount: entry.count,
      limit,
      nextAvailableWindow: new Date(nextWindowStartMs),
      delayMs: Math.max(nextWindowStartMs - now + 1500, 2000),
    };
  }

  entry.count += 1;
  inMemoryCounters.set(key, entry);

  return {
    allowed: true,
    currentCount: entry.count,
    limit,
    nextAvailableWindow: new Date(nextWindowStartMs),
    delayMs: Math.max(nextWindowStartMs - now + 1500, 2000),
  };
};

/**
 * Retrieves the current hourly send count for a sender without incrementing.
 */
export const getSenderHourlyCount = async (senderEmail: string): Promise<number> => {
  const normalizedEmail = senderEmail.trim().toLowerCase();
  const windowId = Math.floor(Date.now() / (60 * 60 * 1000));
  const key = `ratelimit:hourly:${normalizedEmail}:${windowId}`;
  try {
    const count = await redisClient.get(key);
    if (count) return parseInt(count, 10);
  } catch {}
  const entry = inMemoryCounters.get(key);
  return entry ? entry.count : 0;
};

