const paymentComponentsServices = require("./payment_components.services")

class PaymentComponentsControllers {

    async paymentComponentsStatus(req, res) {
        try {
            const {nis, kdrombel, idComponent} = req.params;
            const paymentStatus = await paymentComponentsServices.paymentComponentsStatus(nis, kdrombel, idComponent);
            res.status(200).json(paymentStatus);
        } catch (error) {
            res.status(400).json(error);
        }
        
    }

}

module.exports = new PaymentComponentsControllers();