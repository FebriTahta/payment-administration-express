const detailSiswaServices = require("./siswa.services");

function convertBigIntToString(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
}

class DetailSiswaController {
    async detailSiswa(req, res) {
        try {
            const { nis } = req.body;
            const result = await detailSiswaServices.detailSiswa(nis);

            const safeData = convertBigIntToString(result);

            res.status(result.status).json(safeData);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
}

module.exports = new DetailSiswaController();
