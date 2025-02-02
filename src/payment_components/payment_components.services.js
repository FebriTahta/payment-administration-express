const paymentComponentsRepositories = require("./payment_components.repositories");

class PaymentComponentsServices {

    async paymentComponentsStatus(nis, kdrombel, idComponent) {
        const paymentStatus = await paymentComponentsRepositories.paymentComponentsStatus(nis, kdrombel, idComponent);
        return paymentStatus;
    } 

}

module.exports = new PaymentComponentsServices();