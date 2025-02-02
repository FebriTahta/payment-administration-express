const recapServices = require("./recap.services");

class RecapControllers {

    async recap_monthly_payment(req, res) {

        try {
            const {nis, month, year} = req.params;
            const result = await recapServices.recap_monthly_payment(nis, month, year, res);
            res.status(result.status).json(result);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }

}

module.exports = new RecapControllers();