const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});


async function rateLimit(userId, action, maxAttempts = 2, windowSeconds = 30) {
  const key = `ratelimit:${action}:${userId}`;

  try {
    const attempts = await redis.incr(key);

    if (attempts === 1) {
      // First time? Set expiration
      await redis.expire(key, windowSeconds);
    }

    if (attempts > maxAttempts) {
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Rate limit error for ${key}:`, err);
    return true; // Fail open to avoid blocking user due to Redis failure
  }
};

(async () => {
  try {
    await redis.ping();
  } catch (err) {
    console.error('Redis ping failed:', err);
  }
})();



module.exports = { redis, rateLimit };