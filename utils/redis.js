const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        console.log('[redis] no REDIS_URL or REDIS_HOST set — skipping');
        return null;
      }

      let redisConfig;
      if (process.env.REDIS_URL) {
        redisConfig = { url: process.env.REDIS_URL };
      } else {
        redisConfig = {
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            connectTimeout: 5000
          },
          password: process.env.REDIS_PASSWORD || undefined
        };
      }

      this.client = redis.createClient({
        ...redisConfig,
        enableOfflineQueue: false,
        lazyConnect: true
      });

      this.client.on('error', (err) => {
        console.error('[redis] error:', err.message);
        this.isConnected = false;
      });
      this.client.on('connect', () => { this.isConnected = true; });
      this.client.on('disconnect', () => { this.isConnected = false; });

      const connectP = this.client.connect();
      const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error('timeout')), 10000)
      );
      await Promise.race([connectP, timeout]);
      return this.client;
    } catch (error) {
      console.error('[redis] connect failed:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  // --- Safe data operations (no-op when disconnected) ---

  async get(key) {
    if (!this.isConnected || !this.client) return null;
    try { return await this.client.get(key); } catch { return null; }
  }

  async set(key, value, expireInSeconds = 3600) {
    if (!this.isConnected || !this.client) return false;
    try { await this.client.setEx(key, expireInSeconds, value); return true; } catch { return false; }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;
    try { await this.client.del(key); return true; } catch { return false; }
  }

  async setJSON(key, obj, expireInSeconds = 3600) {
    return this.set(key, JSON.stringify(obj), expireInSeconds);
  }

  async getJSON(key) {
    const v = await this.get(key);
    if (!v) return null;
    try { return JSON.parse(v); } catch { return null; }
  }

  async disconnect() {
    try {
      if (this.client) await this.client.disconnect();
    } catch { /* ignore */ }
    this.isConnected = false;
  }
}

module.exports = new RedisClient();
