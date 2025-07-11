// memutuskan untuk mentiadakan cache karena data ini diperlukan untuk up to date

const availableRepositories = require("./available.repositories");
// const cache = require("../redis");
// const CacheHelper = require("../helper/cache.helper"); // penerapan helper

class AvailableServices {

    async available_payment_component( nis, kdrombel,tahun_ajaran,komponen, res) {
        // Cek cache
        // const cached = await cache.get(`available_payment_component:${nis}_${kdrombel}_${komponen}`);
        // if (cached) {
        //     console.log(`cache: available_payment_component:${nis} is HIT`);
        //     res.setHeader('X-Cache', 'HIT');
        //     res.setHeader('X-Data-Access', 'CACHE_REDIS');
        //     return {
        //         status: 200,
        //         message: "showing available payment component base on component name from cache",
        //         data: JSON.parse(cached),
        //     };
        // }

        // Jika cache kosong, ambil dari repository(DB)
        const result = await availableRepositories.available_and_unpaid_component( nis, kdrombel,tahun_ajaran,komponen);
        if (!result) {
            return {
                status: 404,
                message: "available payment component base on component name not found",
                data: null,
            };
        }

        // Simpan cache baru
        // try {
        //     await cache.set(`available_payment_component:${nis}_${kdrombel}_${komponen}`, JSON.stringify(result), 300);
        //     res.setHeader('X-Cache', 'NO');
        //     res.setHeader('X-Data-Access', 'DB');
        //     console.log('cache tersimpan');
        // } catch (error) {
        //     console.log(error);
        // }
        
        return {
            status: 200,
            message: "showing available payment component base on component name",
            data: result,
        };
    }

    async available_payment_all( nis, kdrombel,tahun_ajaran, res) {

        // const cacheKey = `available_payment_all:${nis}_${kdrombel}`;
        // const cachedData = await CacheHelper.getCache(res, cacheKey);

        // if (cachedData) {
        //     return {
        //         status: 200,
        //         message: "showing available all payment from cache",
        //         data: cachedData,
        //     };
        // }

        const response = await availableRepositories.available_and_unpaid_all(nis, kdrombel, tahun_ajaran);

        if (!response) {
            return {
                status: 404,
                message: "available all payment not found",
                data: null,
            };
        }

        // await CacheHelper.setCache(res, cacheKey, response);
        
        return {
            status: 200,
            message: "showing available all payment from DB",
            data: response,
        };
    }

}

module.exports = new AvailableServices();