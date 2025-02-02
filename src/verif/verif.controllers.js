const VerifServices = require("./verif.services");

class VerifControllers {

    async verification(req, res) {
        try {
            console.log('Received body:', req.body); // Log data yang diterima
            const verified = await VerifServices.verification(req);
            res.status(verified.status).json(verified);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }

}

module.exports = new VerifControllers();