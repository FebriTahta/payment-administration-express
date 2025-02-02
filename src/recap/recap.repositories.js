const { prisma } = require("../db");
const dayjs = require("dayjs");

class RecapRepositories {
    
    async recap_monthly_payment(nis, month, year) {

        const currentMonth = month || dayjs().month() + 1; // Months are 0-indexed in dayjs
        const currentYear = year || dayjs().year();
        // Hitung awal dan akhir bulan menggunakan dayjs
        const startOfMonth = dayjs(`${currentYear}-${currentMonth}-01`).startOf('month').toDate();
        const endOfMonth = dayjs(`${currentYear}-${currentMonth}-01`).endOf('month').toDate();

        const results = await prisma.payment_detail.findMany({
            orderBy: {
                id: 'desc'
            },
            where: {
                status: 1,
                payment_core: {
                    status: {
                        not: 0
                    },
                    nis: nis,
                    tanggal_bayar: {
                        gte: startOfMonth, // Awal bulan (greater than or equal) Memastikan bahwa tanggal_bayar lebih besar atau sama dengan awal bulan.
                        lt: endOfMonth     // (less than): Memastikan bahwa tanggal_bayar kurang dari hari pertama bulan berikutnya, sehingga rentang waktu mencakup satu bulan penuh.
                    }
                }
            },
            include: {
                payment_core: {
                    include: {
                        siswa: {
                            select: {
                                NAMASISWA: true,
                                KDROMBEL: true
                            }
                        }
                    }
                },
                payment_comp: true
            }
        })

        // Calculate total bayar
        const totalBayar = results.reduce((sum, payment) => sum + payment.nominal_bayar, 0);

        // Create daftar_bayar with status
        const daftar_bayar = results.map(result => this.mapPaymentDetail(result));

        return {
            payment_list: daftar_bayar,
            total_payment: totalBayar
        };
    }

    mapPaymentDetail(result) {
        const remaining = result.payment_comp.total_bayar - result.nominal_bayar;
        const status = this.getPaymentStatus(remaining, result.payment_core.tanggal_bayar, result.payment_comp.jatuh_tempo);
        const isLate = dayjs(result.payment_core.tanggal_bayar).isAfter(dayjs(result.payment_comp.jatuh_tempo));
        
        // Menentukan nilai ontime dan paidoff
        const ontime = isLate ? 0 : 1; // Tepat waktu = 1, Telat = 0
        const paidoff = remaining === 0 ? 1 : 2; // Lunas = 1, Belum lunas = 2
        
        return {
            tra_bayar_dtl_id: result.id,
            kd_trans: result.payment_core.kd_trans,
            tanggal_bayar: result.payment_core.tanggal_bayar,
            metode_bayar: result.payment_core.metode_bayar,
            nis: result.payment_core.nis,
            nama_siswa: result.payment_core.siswa.NAMASISWA,
            kd_rombel: result.payment_core.siswa.KDROMBEL,
            kode_komponen: result.payment_comp.id,
            nama_komponen: result.payment_comp.nama_komponen,
            jatuh_tempo: result.payment_comp.jatuh_tempo,
            nominal_bayar: result.payment_comp.total_bayar,
            terbayar: result.nominal_bayar,
            sisa: remaining,
            status: status,
            ontime: ontime,
            paidoff: paidoff,
            created_at: result.created_at,
            updated_at: result.updated_at
        };
    }

    getPaymentStatus(remaining, tanggalBayar, jatuhTempo) {
        const isLate = dayjs(tanggalBayar).isAfter(dayjs(jatuhTempo));
        
        if (remaining > 0) {
            return isLate ? 'TELAT BAYAR DAN BELUM LUNAS' : 'BELUM LUNAS';
        }
        if (remaining === 0) {
            return isLate ? 'LUNAS DAN TELAT BAYAR' : 'LUNAS';
        }
        if (remaining < 0) {
            return isLate ? 'LEBIH DAN TELAT BAYAR' : 'LEBIH';
        }
        return 'ERROR';
    }

    
}

module.exports = new RecapRepositories();