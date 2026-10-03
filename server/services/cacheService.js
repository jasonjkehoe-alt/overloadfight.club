import Redis from 'ioredis';

class CacheService {
    constructor() {
        this.useRedis = false;
        this.memoryCache = new Map();
        this.client = null;
        this.defaultTTL = 300; // 5 minutes

        // Try to initialize Redis
        // We use lazyConnect: true to not fail immediately if Redis is down
        this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            lazyConnect: true,
            retryStrategy: (times) => {
                // If we can't connect after 3 tries, stop trying and use memory
                if (times > 3) {
                    console.warn('[Cache] Redis connection failed too many times. Switching to in-memory cache.');
                    this.useRedis = false;
                    return null; // Stop retrying
                }
                return Math.min(times * 50, 2000);
            }
        });

        this.client.connect().then(() => {
            console.log('[Cache] Connected to Redis');
            this.useRedis = true;
        }).catch((err) => {
            console.warn('[Cache] Failed to connect to Redis, using in-memory cache:', err.message);
            this.useRedis = false;
        });

        this.client.on('error', (err) => {
            // Suppress further errors if we've already decided to use memory
            if (this.useRedis) {
                console.warn('[Cache] Redis error:', err.message);
            }
        });
    }

    async get(key) {
        if (this.useRedis) {
            try {
                const data = await this.client.get(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.warn('[Cache] Redis get error, falling back to memory:', e.message);
                return this.getFromMemory(key);
            }
        }
        return this.getFromMemory(key);
    }

    async set(key, value, ttlSeconds = this.defaultTTL) {
        if (this.useRedis) {
            try {
                await this.client.setex(key, ttlSeconds, JSON.stringify(value));
                return;
            } catch (e) {
                console.warn('[Cache] Redis set error, falling back to memory:', e.message);
            }
        }
        this.setInMemory(key, value, ttlSeconds);
    }

    getFromMemory(key) {
        const item = this.memoryCache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.memoryCache.delete(key);
            return null;
        }
        return item.value;
    }

    setInMemory(key, value, ttlSeconds) {
        this.memoryCache.set(key, {
            value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
    }

    async del(key) {
        if (this.useRedis) {
            try {
                await this.client.del(key);
            } catch (e) { }
        }
        this.memoryCache.delete(key);
    }

    async flush() {
        if (this.useRedis) {
            try {
                await this.client.flushall();
            } catch (e) { }
        }
        this.memoryCache.clear();
    }
}

export default new CacheService();
