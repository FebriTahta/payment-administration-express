const admin = require("firebase-admin");
const fcmRepositories = require("./fcm.repositories");

class Fcm {
    initializeFCM() {
        if (!admin.apps.length) {
            const serviceAccount = require("../config/firebase-service-account.json");
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
    }

    async sendNotification(token, title, body) {
        if (!token || !title || !body) {
            return {
                status: 400,
                message: 'Token, title, and body are required for notification',
                data: null
            };
        }

        const message = {
            notification: { title, body },
            token,
        };

        const response = await admin.messaging().send(message);
        return {
            status: 200,
            message: 'Notification sent!',
            data: response
        };
    }

    async storeFirebaseWebToken(nis, web_token, res) {
        if (!web_token || !nis) {
            return {
                status: 400,
                message: 'Token and NIS are required',
                data: null
            };
        }

        const existingData = await this.findFirebaseWebToken(nis, res, false);

        if (existingData.status == 202) {
            return existingData; // exit web redis is set and ready to read
        }

        if (!existingData.data) {
            const response = await fcmRepositories.storeFirebaseWebToken(nis, web_token);
            return {
                status: 200,
                message: "Stored new Firebase web token successfully",
                data: response
            };
        }

        // Cek apakah token sudah sama, jika sama tidak perlu update
        if (existingData.data.web_token === web_token) {
            return {
                status: 200,
                message: "Token is unchanged, no update needed",
                data: existingData.data
            };
        }

        return await this.updateFirebaseWebToken(nis, web_token);
    }

    async findFirebaseWebToken(nis, res) {
       

        const response = await fcmRepositories.findFirebaseWebToken(nis);
        if (!response) {
            return {
                status: 404,
                message: `Firebase web token not found for NIS: ${nis}`,
                data: null,
            };
        }
        return {
            status: 200,
            message: `Firebase web token found from DB for NIS: ${nis}`,
            data: response,
        };
    }

    async updateFirebaseWebToken(nis, web_token) {
        const response = await fcmRepositories.updateFirebaseWebToken(nis, web_token);
        return {
            status: 200,
            message: `Updated Firebase web token for NIS: ${nis}`,
            data: response,
        };
    }
}

module.exports = new Fcm();