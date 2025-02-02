class KDROMBEL {
    static async processKDROMBEL (kdrombel) {
        const data = kdrombel.split("-"); // Pisahkan berdasarkan tanda "-"
        
        if (data.length >= 2) {
            const kelas = data[0]; // Ambil kelas
            const jurusan = [data[1], "ALL"]; // Ambil jurusan dan tambahkan "ALL"
            
            return { kelas, jurusan };
        } else {
            throw new Error("Invalid KDROMBEL format: " + kdrombel);
        }
    }
}

module.exports = KDROMBEL;