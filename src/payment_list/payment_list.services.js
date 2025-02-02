const paymentListRepositories = require("./payment_list.repositories");
const CacheHelper = require("../helper/cache.helper");

class PaymentListServices {
    
    async paymentList(res, nis, kdrombel) {
        const cacheKey = `payment_list:${nis}_${kdrombel}`;
        const cachedData = await CacheHelper.getCache(res, cacheKey);
        
        if (cachedData) {
            return {
                status: 200,
                message: "showing payment list from cache",
                data: cachedData,
            };
        }

        const response = await paymentListRepositories.paymentList(nis, kdrombel);
        
        if (!response) {
            return {
                status: 404,
                message: "payment list not found",
                data: null,
            };
        }

        await CacheHelper.setCache(res, cacheKey, response);
        
        return {
            status: 200,
            message: "showing payment list from DB",
            data: response,
        };
    }

    async getInsufficientPayments(res, nis, kdrombel) {
        const cacheKey = `insufficient_payment:${nis}_${kdrombel}`;
        const cachedData = await CacheHelper.getCache(res, cacheKey);
        
        if (cachedData) {
            return {
                status: 200,
                message: "showing insufficient payment from cache",
                data: cachedData,
            };
        }

        const response = await paymentListRepositories.getInsufficientPayments(nis, kdrombel);

        if (!response) {
            return {
                status: 404,
                message: "insufficient payment not found",
                data: null,
            };
        }

        await CacheHelper.setCache(res, cacheKey, response);
        
        return {
            status: 200,
            message: "showing insufficient payment from DB",
            data: response,
        };
    }
}

module.exports = new PaymentListServices();
