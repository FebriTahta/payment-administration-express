const { prisma } = require("../db");

class PaymentComponentsRepositories {
    async paymentComponentsStatus(nis, kdrombel, compBayarId) {
        const id = parseInt(compBayarId);
        const result = await prisma.payment_comp.findMany({
            orderBy: {
                id: 'desc'
            },
            where: {
                status: 1,  // Hanya yang aktif
                id: id
            },
            include: {
                payment_details: {
                    where: {
                        status: 1,  // Hanya yang aktif
                    },
                    include: {
                        payment_core: {
                            where: {
                                status: 1  // Hanya yang aktif
                            },
                            include: {
                                siswa: {
                                    select: {
                                        NIS: true,
                                        NAMASISWA: true,
                                        GENDER: true,
                                        TINGKAT: true,
                                        KDROMBEL: true,
                                        STATUSAKADEMIK: true
                                    }
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!result || result.length === 0) {
            return {
                message: "No components found",
                payment: [],
            };
        }

        // Filter payment details for matching NIS and KDROMBEL
        const filteredDetails = result.flatMap((component) => {
            return component.payment_details.filter((detail) => {
                return (
                    detail.payment_core?.siswa?.NIS === nis &&
                    detail.payment_core?.siswa?.KDROMBEL === kdrombel
                );
            });
        });

        // Group by `kd_trans` and aggregate the total paid amount for each transaction
        const paymentGroups = filteredDetails.reduce((acc, detail) => {
            if (!acc[detail.kd_trans]) {
                acc[detail.kd_trans] = {
                    kdTrans: detail.kd_trans,
                    totalPaid: 0,
                    installments: [],
                    paymentStatus: detail.status,  // capture the payment status
                };
            }
            acc[detail.kd_trans].totalPaid += detail.nominal_bayar;
            acc[detail.kd_trans].installments.push(detail);
            return acc;
        }, {});

        // Extract paid installments
        const paidInstallments = Object.values(paymentGroups).flatMap(group => group.installments);

        // Aggregate total paid amount
        const totalPaid = paidInstallments.reduce((sum, detail) => sum + detail.nominal_bayar, 0);

        // Calculate the remaining amount
        const remainingAmount = result.reduce((sum, component) => sum + component.total_bayar, 0) - totalPaid;

        // Check if payment is complete
        const paymentStatus = totalPaid >= result.reduce((sum, component) => sum + component.total_bayar, 0)
            ? "Paid"
            : "Pending";

        return {
          totalPaid,
          paymentStatus,  // Include payment status
          remainingAmount: remainingAmount > 0 ? remainingAmount : 0,  // Ensure no negative remaining amount
          payments: result.map(component => ({
              namaKomponen: component.nama_komponen,
              jatuhTempo: component.jatuh_tempo,
              totalBayar: component.total_bayar,
              kelas: component.kelas,
              jurusan: component.jurusan,
              paymentGroups: Object.values(paymentGroups),
          })),
        };
    }
}

module.exports = new PaymentComponentsRepositories();
