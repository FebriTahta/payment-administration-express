const paymentListServices = require('./payment_list.services')

class PaymentListControllers {
    async paymentList(req, res) {
        try {
            const requestBody = req.params;
            const response = await paymentListServices.paymentList(res,requestBody.nis, requestBody.kdrombel);
            res.status(200).json(response);
        } catch (error) {
            res.status(400).json(error);
        }
        
    }

    async getInsufficientPayments(req, res) {
        try {
            const requestBody = req.params;
            const response = await paymentListServices.getInsufficientPayments(res,requestBody.nis, requestBody.kdrombel);
            res.status(200).json(response);
        } catch (error) {
            res.status(400).json(error);
        }
    }
}

module.exports = new PaymentListControllers();