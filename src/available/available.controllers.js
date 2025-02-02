const availableServices = require("./available.services");

class AvailableControllers {
    async available_payment_component(req, res) {
        try {
            const {nis, kdrombel, komponen} = req.params;
            const result = await availableServices.available_payment_component( nis, kdrombel,komponen, res);
            res.status(result.status).json(result);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }

    async available_payment_all(req, res) {
        try {
            const {nis, kdrombel} = req.params;
            const result = await availableServices.available_payment_all( nis, kdrombel, res);
            res.status(result.status).json(result);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
}

module.exports = new AvailableControllers();