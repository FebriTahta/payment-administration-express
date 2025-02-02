const { prisma } = require("../db");

class FcmRepositories{
    async findFirebaseWebToken(nis) {
        const result = await prisma.web_token.findFirst({
            where: {
                nis
            },
            include: {
                web_token_siswa: true
            }
        });
        return result;
    }

    async storeFirebaseWebToken(nis, web_token) {
        const result = await prisma.web_token.create({
            data: {
                nis: nis,
                token: web_token
            },
            include: {
                web_token_siswa: true
            }
        });
        return result;
    }

    async updateFirebaseWebToken(nis, web_token) {
        const result = await prisma.web_token.update({
            where: {
                nis: nis
            },
            data: {
                nis: nis,
                token: web_token
            },
            include: {
                web_token_siswa: true
            }
        });
        return result;
    }
}

module.exports = new FcmRepositories();