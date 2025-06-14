const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379,
                },
                password: process.env.REDIS_PASSWORD || undefined,
                retryDelayOnFailover: 100,
                enableOfflineQueue: false
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('✅ Connected to Redis');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                console.log('❌ Disconnected from Redis');
                this.isConnected = false;
            });

            await this.client.connect();
            return this.client;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            return null;
        }
    }

    async get(key) {
        if (!this.isConnected || !this.client) return null;
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }

    async set(key, value, expireInSeconds = 3600) {
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.setEx(key, expireInSeconds, value);
            return true;
        } catch (error) {
            console.error('Redis SET error:', error);
            return false;
        }
    }

    async del(key) {
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Redis DEL error:', error);
            return false;
        }
    }

    async exists(key) {
        if (!this.isConnected || !this.client) return false;
        try {
            return await this.client.exists(key);
        } catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    }

    async setJSON(key, obj, expireInSeconds = 3600) {
        return await this.set(key, JSON.stringify(obj), expireInSeconds);
    }

    async getJSON(key) {
        const value = await this.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (error) {
            console.error('Redis JSON parse error:', error);
            return null;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
            this.isConnected = false;
        }
    }
}

const redisClient = new RedisClient();

module.exports = redisClient;