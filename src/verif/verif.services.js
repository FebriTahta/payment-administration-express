const VerifRepositories = require('./verif.repositories');
const DetailSiswaRepositories = require('../siswa/siswa.repositories');
const jwt = require('jsonwebtoken');

class VerifServices {

    async verification(req) {
        const results   = await VerifRepositories.verification(req);
        const verified  = results[0]; 

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
        const TAHUN_AJARAN = verified.tahun_ajaran;
        const ROLES = 'SISWA';

        const token = jwt.sign(
            { data: NIS, NAMASISWA, KDROMBEL, ROLES, TAHUN_AJARAN}, // Payload
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