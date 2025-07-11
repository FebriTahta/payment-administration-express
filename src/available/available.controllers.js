const availableServices = require("./available.services");

class AvailableControllers {
    async available_payment_component(req, res) {
        try {
            const { nis, kdrombel, tahun_ajaran, komponen } = req.params;
            // Decode tahun_ajaran dari base64
            const tahunAjaranDecoded = Buffer.from(tahun_ajaran, 'base64').toString('utf-8');
            // Gunakan tahunAjaranDecoded untuk proses selanjutnya
            const result = await availableServices.available_payment_component(
                nis,
                kdrombel,
                tahunAjaranDecoded,
                komponen,
                res
            );
            res.status(result.status).json(result);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }

    async available_payment_all(req, res) {
        try {
            const {nis, kdrombel, tahun_ajaran} = req.params;
            const tahunAjaranDecoded = Buffer.from(tahun_ajaran, 'base64').toString('utf-8');
            const result = await availableServices.available_payment_all( nis, kdrombel, tahunAjaranDecoded, res);
            res.status(result.status).json(result);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
}

module.exports = new AvailableControllers();