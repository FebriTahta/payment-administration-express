const { createClient } = require('redis');

class Cache {
    constructor() {
        this.client = createClient({
            socket: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
            }
        });
        this.isConnected = false;
    }

    async connectRedis() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
                this.isConnected = true;
                console.log('Redis connected successfully.');
            } else {
                console.log('Redis connection already established.');
            }
        } catch (err) {
            console.error('Redis connection error:', err);
        }
    }

    async disconnectRedis() {
        try {
            if (this.isConnected) {
                await this.client.quit();
                this.isConnected = false;
                console.log('Redis disconnected successfully.');
            }
        } catch (err) {
            console.error('Redis disconnection error:', err);
        }
    }

    async set(key, value, expirationInSeconds = null) {
        try {
            if (expirationInSeconds) {
                await this.client.set(key, value, { EX: expirationInSeconds });
            } else {
                await this.client.set(key, value);
            }
            console.log(`Key "${key}" set successfully.`);
        } catch (err) {
            console.error('Error setting key in Redis:', err);
        }
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            console.log(`Key "${key}" retrieved successfully.`);
            return value;
        } catch (err) {
            console.error('Error getting key from Redis:', err);
            return null;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
            console.log(`Key "${key}" deleted successfully.`);
        } catch (err) {
            console.error('Error deleting key in Redis:', err);
        }
    }
}

module.exports = new Cache();
