import Redis from 'ioredis';
import logger from '../utils/logger';

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
};

// Create Redis client
const redis = new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
  logger.info('✅ Redis client connected');
});

redis.on('ready', () => {
  logger.info('✅ Redis client ready');
});

redis.on('error', (err) => {
  logger.error('❌ Redis client error:', err);
});

redis.on('close', () => {
  logger.warn('⚠️  Redis client connection closed');
});

redis.on('reconnecting', () => {
  logger.info('🔄 Redis client reconnecting...');
});

// Redis helper functions
export const redisHelpers = {
  // Set value with expiration
  setEx: async (key: string, value: any, expireSeconds: number = 3600): Promise<void> => {
    try {
      await redis.setex(key, expireSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error(`Error setting Redis key ${key}:`, error);
      throw error;
    }
  },

  // Get value
  get: async (key: string): Promise<any> => {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting Redis key ${key}:`, error);
      return null;
    }
  },

  // Delete key
  del: async (key: string): Promise<void> => {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Error deleting Redis key ${key}:`, error);
      throw error;
    }
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking Redis key ${key}:`, error);
      return false;
    }
  },

  // Set hash field
  hset: async (key: string, field: string, value: any): Promise<void> => {
    try {
      await redis.hset(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error(`Error setting Redis hash ${key}:`, error);
      throw error;
    }
  },

  // Get hash field
  hget: async (key: string, field: string): Promise<any> => {
    try {
      const value = await redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting Redis hash ${key}:`, error);
      return null;
    }
  },

  // Get all hash fields
  hgetall: async (key: string): Promise<any> => {
    try {
      const values = await redis.hgetall(key);
      const parsed: any = {};
      for (const [field, value] of Object.entries(values)) {
        parsed[field] = JSON.parse(value);
      }
      return parsed;
    } catch (error) {
      logger.error(`Error getting all Redis hash ${key}:`, error);
      return {};
    }
  },

  // Add to sorted set
  zadd: async (key: string, score: number, member: string): Promise<void> => {
    try {
      await redis.zadd(key, score, member);
    } catch (error) {
      logger.error(`Error adding to Redis sorted set ${key}:`, error);
      throw error;
    }
  },

  // Get sorted set range
  zrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    try {
      return await redis.zrange(key, start, stop);
    } catch (error) {
      logger.error(`Error getting Redis sorted set range ${key}:`, error);
      return [];
    }
  },

  // Get sorted set with scores
  zrangeWithScores: async (key: string, start: number, stop: number): Promise<any[]> => {
    try {
      const results = await redis.zrange(key, start, stop, 'WITHSCORES');
      const parsed = [];
      for (let i = 0; i < results.length; i += 2) {
        parsed.push({
          member: results[i],
          score: parseFloat(results[i + 1])
        });
      }
      return parsed;
    } catch (error) {
      logger.error(`Error getting Redis sorted set with scores ${key}:`, error);
      return [];
    }
  },

  // Publish message to channel
  publish: async (channel: string, message: any): Promise<void> => {
    try {
      await redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error(`Error publishing to Redis channel ${channel}:`, error);
      throw error;
    }
  },

  // Increment counter
  incr: async (key: string): Promise<number> => {
    try {
      return await redis.incr(key);
    } catch (error) {
      logger.error(`Error incrementing Redis key ${key}:`, error);
      throw error;
    }
  },

  // Decrement counter
  decr: async (key: string): Promise<number> => {
    try {
      return await redis.decr(key);
    } catch (error) {
      logger.error(`Error decrementing Redis key ${key}:`, error);
      throw error;
    }
  },

  // Set expiration
  expire: async (key: string, seconds: number): Promise<void> => {
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      logger.error(`Error setting expiration for Redis key ${key}:`, error);
      throw error;
    }
  },

  // Get keys by pattern
  keys: async (pattern: string): Promise<string[]> => {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      logger.error(`Error getting Redis keys by pattern ${pattern}:`, error);
      return [];
    }
  },

  // Flush database (use with caution!)
  flushdb: async (): Promise<void> => {
    try {
      await redis.flushdb();
      logger.warn('⚠️  Redis database flushed');
    } catch (error) {
      logger.error('Error flushing Redis database:', error);
      throw error;
    }
  }
};

// Close Redis connection
export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info('👋 Redis connection closed');
  } catch (error) {
    logger.error('❌ Error closing Redis connection:', error);
    throw error;
  }
};

export { redis };
export default redis;