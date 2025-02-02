const { prisma } = require("../db");

class PaymentListRepositories {
    async paymentList(nis, kdrombel) {
        const result = await prisma.payment_core.findMany({
            orderBy: {
                id: 'desc'
            },
            where: {
                status: 1, // Hanya payment_core yang aktif
                siswa: {
                    NIS: nis,
                    KDROMBEL: kdrombel,
                },
            },
            include: {
                siswa: {
                    select: {
                        NIS: true,
                        NAMASISWA: true,
                        GENDER: true,
                        TINGKAT: true,
                        KDROMBEL: true,
                        STATUSAKADEMIK: true,
                    },
                },
                payment_details: {
                    where: {
                        status: 1, // Hanya payment_details yang aktif
                    },
                    include: {
                        payment_comp: {
                            select: {
                                id: true,
                                nama_komponen: true,
                                total_bayar: true,
                                jatuh_tempo: true,
                            },
                        },
                    },
                },
            },
        });

        if (!result || result.length === 0) {
            return {
                message: "No payments found",
                data: null,
            };
        }

        // Format response
        const response = {
            siswa: {
                nis: result[0].siswa.NIS,
                namaSiswa: result[0].siswa.NAMASISWA,
                gender: result[0].siswa.GENDER,
                tingkat: result[0].siswa.TINGKAT,
                kdRombel: result[0].siswa.KDROMBEL,
                statusAkademik: result[0].siswa.STATUSAKADEMIK,
            },
            payments: result.map((core) => {
                const totalBayar = core.payment_details.reduce(
                    (sum, detail) => sum + detail.payment_comp.total_bayar,
                    0
                );
                const totalPaid = core.payment_details.reduce(
                    (sum, detail) => sum + detail.nominal_bayar,
                    0
                );
                const remainingAmount = totalBayar - totalPaid;

                return {
                    kdTrans: core.kd_trans,
                    tanggalPembayaran: core.tanggal_bayar, // Pastikan tanggal bayar tersedia di payment_core
                    totalBayar,
                    totalPaid,
                    remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
                    paymentStatus: totalPaid >= totalBayar ? "Paid" : "Remaining Installments",
                    details: core.payment_details.map((detail) => ({
                        kodeKomponen: detail.payment_comp.id,
                        namaKomponen: detail.payment_comp.nama_komponen,
                        jatuhTempo: detail.payment_comp.jatuh_tempo,
                        totalBayar: detail.payment_comp.total_bayar,
                        nominalBayar: detail.nominal_bayar,
                    })),
                };
            }),
        };

        return {
            message: "Payments retrieved successfully",
            data: response,
        };
    }

    async getInsufficientPayments(nis, kdrombel) {
        const result = await prisma.payment_core.findMany({
            orderBy: {
                id: 'desc',
            },
            where: {
                status: 1, // Hanya payment_core yang aktif
                siswa: {
                    NIS: nis,
                    KDROMBEL: kdrombel,
                },
            },
            include: {
                siswa: {
                    select: {
                        NIS: true,
                        NAMASISWA: true,
                        GENDER: true,
                        TINGKAT: true,
                        KDROMBEL: true,
                        STATUSAKADEMIK: true,
                    },
                },
                payment_details: {
                    where: {
                        status: 1, // Hanya payment_details yang aktif
                    },
                    include: {
                        payment_comp: {
                            where: {
                                status: 1, // Hanya payment_comp yang aktif
                            },
                            select: {
                                id: true,
                                nama_komponen: true,
                                total_bayar: true,
                                jatuh_tempo: true,
                            },
                        },
                    },
                },
            },
        });
    
        if (!result || result.length === 0) {
            return {
                message: "No Insufficient components found",
                data: null,
            };
        }
    
        // Aggregate unpaid components
        const componentsMap = new Map();
    
        result.forEach((core) => {
            core.payment_details.forEach((detail) => {
                const comp = detail.payment_comp;
                if (!comp) return; // Skip if no payment_comp
    
                const compId = comp.id;
                const totalPaid = detail.nominal_bayar || 0;
    
                if (!componentsMap.has(compId)) {
                    componentsMap.set(compId, {
                        kodeKomponen: comp.id,
                        namaKomponen: comp.nama_komponen,
                        jatuhTempo: comp.jatuh_tempo,
                        totalBayar: comp.total_bayar,
                        totalPaid: 0,
                        instalment: [],
                    });
                }
    
                // Update totalPaid and add installment details for the component
                const existing = componentsMap.get(compId);
                existing.totalPaid += totalPaid;
                existing.instalment.push({
                    kdTrans: core.kd_trans,
                    nominalinstalment: totalPaid,
                    paymentTime: core.tanggal_bayar
                });
            });
        });
    
        // Calculate remaining amounts and filter insufficient components
        const InsufficientComponents = Array.from(componentsMap.values())
            .filter((comp) => comp.totalPaid < comp.totalBayar)
            .map((comp) => ({
                ...comp,
                remainingAmount: comp.totalBayar - comp.totalPaid,
            }));
    
        if (InsufficientComponents.length === 0) {
            return {
                message: "All components are fully paid",
                data: [],
            };
        }
    
        // Format response
        return {
            message: "Insufficient components retrieved successfully",
            data: {
                siswa: {
                    nis: result[0].siswa.NIS,
                    namaSiswa: result[0].siswa.NAMASISWA,
                    gender: result[0].siswa.GENDER,
                    tingkat: result[0].siswa.TINGKAT,
                    kdRombel: result[0].siswa.KDROMBEL,
                    statusAkademik: result[0].siswa.STATUSAKADEMIK,
                },
                InsufficientComponents,
            },
        };
    }    
        
}

module.exports = new PaymentListRepositories();
