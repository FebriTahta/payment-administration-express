const {prisma} = require('../db');

class VerifRepositories {

    async verification(req) {
        // // old
        // const verified = await prisma.siswa.findUnique({
        //     where: {NIS: String(req.body.nis)}
        // })
        // return verified;

        // update
        const result = await prisma.$queryRaw`
            select rk.*, s.NIS, s.NAMASISWA, r.TINGKAT, r.KODEROMBEL as KDROMBEL, r.KDJURUSAN from riwayat_kelas rk 
            join siswa s on s.id = rk.siswa_id
            join rombel r on r.id = rk.rombel_id
            where s.NIS = ${req.body.nis}
            order by rk.id desc
        `;
        return result
    }
}

module.exports = new VerifRepositories();