const cache = require("../redis");

class CacheHelper {
    static async getCache(res, key) {
        try {
            const data = await cache.get(key);
            if (data) {
                console.log(`cache: ${key} is HIT`);
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Data-Access', 'CACHE_REDIS');
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error(`Error getting cache for key: ${key}`, error);
            return null;
        }
    }

    static async setCache(res, key, value, expiration = 300) {
        try {
            await cache.set(key, JSON.stringify(value), expiration);
            res.setHeader('X-Cache', 'NO');
            res.setHeader('X-Data-Access', 'DB');
            console.log(`cache: ${key} is SAVED`);
        } catch (error) {
            console.error(`Error setting cache for key: ${key}`, error);
        }
    }
}

module.exports = CacheHelper;
