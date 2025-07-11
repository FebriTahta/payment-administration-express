const detailSIswaRepositories = require("./siswa.repositories");

class DetailSiswaServices {
    async detailSiswa (nis) {
        const result = await detailSIswaRepositories.detailSiswa(nis)
        if (!result) {
            return {
                status: 404,
                message: "monthly recap not found",
                data: null,
            };
        }

        return {
            status: 200,
            message: "showing list riwayat tahun ajaran",
            data: result,
        };
    }
}

module.exports = new DetailSiswaServices();
