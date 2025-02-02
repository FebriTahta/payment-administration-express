const recapRepositories = require("./recap.repositories");
const cache = require("../redis");

class RecapServices {

    async recap_monthly_payment(nis, month, year, res) {
        // Cek cache
        const cached = await cache.get(`recap_monthly_payment:${nis}`);
        if (cached) {
            console.log(`cache: recap_monthly_payment:${nis} is HIT`);
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Data-Access', 'CACHE_REDIS');
            return {
                status: 200,
                message: "showing monthly recap from cache",
                data: JSON.parse(cached),
            };
        }

        // Jika cache kosong, ambil dari repository(DB)
        const result = await recapRepositories.recap_monthly_payment(nis, month, year);
        if (!result) {
            return {
                status: 404,
                message: "monthly recap not found",
                data: null,
            };
        }

        // Simpan cache baru
        try {
            await cache.set(`recap_monthly_payment:${nis}`, JSON.stringify(result), 300);
            res.setHeader('X-Cache', 'NO');
            res.setHeader('X-Data-Access', 'DB');
            console.log('cache tersimpan');
        } catch (error) {
            console.log(error);
        }
       
        return {
            status: 200,
            message: "showing monthly recap",
            data: result,
        };
    }

}

module.exports = new RecapServices();
