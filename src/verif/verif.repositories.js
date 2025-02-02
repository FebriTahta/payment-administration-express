const {prisma} = require('../db');

class VerifRepositories {

    async verification(req) {
        const verified = await prisma.siswa.findUnique({
            where: {NIS: String(req.body.nis)}
        })
        return verified;
    }
}

module.exports = new VerifRepositories();