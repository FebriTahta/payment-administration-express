const VerifRepositories = require('./verif.repositories');
const jwt = require('jsonwebtoken');

class VerifServices {

    async verification(req) {
        const verified = await VerifRepositories.verification(req);
        if (!verified) {
            return {
                status: 404,
                message: "credential not found or miss match",
                data: null
            }
        }
        
        if (!verified.NIS) { throw new Error('Invalid data for token generation'); }

        const NIS = verified.NIS;
        const NAMASISWA = verified.NAMASISWA;
        const KDROMBEL = verified.KDROMBEL;
        const ROLES = 'SISWA';

        const token = jwt.sign(
            { data: NIS, NAMASISWA, KDROMBEL, ROLES}, // Payload
            process.env.JWT_SECRET, // Secret key
            { expiresIn: '1h' } // Token expiration
        );

        console.log('Creating JWT with:', { nis: verified.NIS });
        console.log('token: '+token);
        
        return {
            status: 200,
            message: "student credential match",
            data: token
        }
    }

}

module.exports = new VerifServices();