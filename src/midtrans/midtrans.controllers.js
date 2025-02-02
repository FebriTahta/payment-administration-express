const midtransServices = require('./midtrans.services');

class MidtransControllers {

    async paymentMethods(req, res) {
        try {
            const availablePaymentMethods = [
                { method: 'promo', description: 'Promo', details: 'Promo khusus BNI dan Mandiri' },
                { method: 'bank_transfer', bank: 'bni', description: 'BNI (Bank Transfer)' },
                { method: 'bank_transfer', bank: 'bri', description: 'BRI (Bank Transfer)' },
                { method: 'gopay', description: 'GoPay (E-Wallet)' },
                { method: 'bank_transfer', bank: 'mandiri', description: 'Bank Mandiri (Bank Transfer)' },
                { method: 'bank_transfer', bank: 'permata', description: 'PermataBank (Bank Transfer)' }
            ];
            res.status(200).json(availablePaymentMethods);
        } catch (error) {
            res.status(500).json({
                status: 500,
                message: 'Error',
                error: error.message || 'Unknown error occurred',
            });
        }
    }

    async createTransaction(req, res) {
        const { grossAmount, paymentType, bank, customerDetails, components, expiry_time} = req.body;
        const time = new Date().getTime();
        const orderId  = customerDetails.nis+''+time;

        // Validasi input
        if (!orderId || !grossAmount || !customerDetails || !paymentType) {
            return {
                status: 400,
                message: 'Missing required fields: orderId, grossAmount, customerDetails, or paymentType',
            };
        }

        try {
            const checkEPaymentCore = await midtransServices.createTransaction(
                orderId, grossAmount, paymentType, bank, customerDetails, components, expiry_time
            );
            
            return res.status(checkEPaymentCore.status).json(checkEPaymentCore);
            
        } catch (error) {
            res.status(500).json({
                status: 500,
                message: 'Error creating transaction',
                error: error.message || 'Unknown error occurred',
            });
        }
    }

    async callbakPaymentNotification(req, res) {
        try {
            
            const { order_id, status_code, gross_amount,transaction_status,signature_key } = req.body;

            const result = await midtransServices.callBackPayment(order_id, status_code, gross_amount,transaction_status,signature_key,res);
            return res.status(200).json(result);

        } catch (error) {

            res.status(500).json({
                status: 500,
                message: 'Error handling callback',
                error: error.message || 'Unknown error occurred',
            });

        }
    }
    
    async activePayment(req, res) {
        const {nis, kdrombel} = req.params;
        try {
            const result = await midtransServices.activePayment(nis, kdrombel);
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Unexpected error occurred in activePayment',
                error: error.message,
            });
        }
    }
    
    async transactionStatus(req, res) {
        const { orderId } = req.params;
    
        try {
            const serviceResponse = await midtransServices.getTransactionStatus(orderId);
    
            if (!serviceResponse) {
                return res.status(404).json({
                    status: 404,
                    message: 'Transaction status not available',
                    error: `Order ID ${orderId} tidak ditemukan.`,
                });
            }
            return res.status(serviceResponse.status).json(serviceResponse);
            
        } catch (error) {
            if (error.ApiResponse && error.ApiResponse.status_code === 404) {
                return res.status(404).json({
                    status: 404,
                    message: 'Transaction status not available',
                    error: `Order ID ${orderId} belum pernah digunakan, melanjutkan transaksi.`,
                });
            }
    
            return res.status(500).json({
                status: 500,
                message: 'Unexpected error occurred in getTransactionStatus',
                error: error.message,
            });
        }
    }

    async searchOnlineTransactionByOrderIdOrKdTrans(req, res) {
        try {
            const {orderIdOrKdTrans} = req.body;
            const result = await midtransServices.searchOnlineTransactionByOrderIdOrKdTrans(orderIdOrKdTrans, res);
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Unexpected error occurred in search detail online transaction',
                error: error.message,
            });
        }
    }

    async cancelPaymentByOrderId(req, res) {
        try {
            const {orderId} = req.body;
            const result = await midtransServices.cancelPaymentByOrderId(orderId, res);
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Unexpected error occurred in cancel online transaction',
                error: error.message,
            });
        }
    }
    
}

module.exports = new MidtransControllers();