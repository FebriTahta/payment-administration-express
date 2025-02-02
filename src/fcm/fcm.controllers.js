const fcmServices = require('../fcm/fcm.services');

class testNotification {
    async sendNotification(req, res) {
        try {
            const { token, title, body } = req.body;
            const result = fcmServices.sendNotification(token, title, body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                status: 500,
                message: 'Error',
                error: error.message || 'Unknown error occurred',
            });
        }
    }

    async storeFirebaseWebToken(req, res) {
        try {
            let {nis, web_token} = req.body;
            // Pastikan `nis` adalah string
            nis = String(nis);
            const result = await fcmServices.storeFirebaseWebToken(nis, web_token, res);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                status: 500,
                message: 'Error',
                error: error.message || 'Unknown error occurred',
            });
        }
    }

    async findFirebaseWebToken(req, res) {
        try {
            let {nis} = req.body;
            // Pastikan `nis` adalah string
            nis = String(nis);
            const result = await fcmServices.findFirebaseWebToken(nis, res);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                status: 500,
                message: 'Error',
                error: error.message || 'Unknown error occurred',
            });
        }
    }
}

module.exports = new testNotification();