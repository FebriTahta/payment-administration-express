const { prisma } = require("../db");

class DetailSiswaRepositories {
    async detailSiswa(nis) {
        const result = await prisma.$queryRaw`
            SELECT rk.*, s.NIS, s.NAMASISWA, r.TINGKAT, r.KODEROMBEL, r.KDJURUSAN
            FROM riwayat_kelas rk 
            JOIN siswa s ON s.id = rk.siswa_id
            JOIN rombel r ON r.id = rk.rombel_id
            WHERE s.NIS = ${nis}
            order by rk.id desc
        `;
        return result;
    }
}

module.exports = new DetailSiswaRepositories();
