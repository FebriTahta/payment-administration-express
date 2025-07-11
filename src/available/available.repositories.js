const { prisma } = require("../db");

class AvailableRepositories {
    async available_and_unpaid_component( nis, kdrombel, tahun_ajaran, komponen) {

        // Proses KDROMBEL untuk mendapatkan kelas dan jurusan
        const { kelas, jurusan } = this.processKDROMBEL(kdrombel);
        // List menu , dibuat daftar menu yang menjadi blacklisted key untuk etc
        // karena etc menampilkan daftar data kecuali yang ada pada menu
        const listComponentReguler = [
            "spp",
            "usp",
            "uas",
            "lks",
            "kegiatan",
            "daftar ulang",
        ];

        const results = await prisma.payment_comp.findMany({
            orderBy: {
                id: "asc",
            },
            where: {
                AND: [
                    komponen && komponen.trim() !== ""
                        ? komponen === "etc"
                            ? {
                                // Filter untuk komponen "etc"
                                nama_komponen: {
                                    not: {
                                        contains: "subsidi",
                                    },
                                },
                                AND: listComponentReguler.map((item) => ({
                                    nama_komponen: {
                                        not: {
                                            contains: item,
                                        },
                                    },
                                })),
                            }
                            : listComponentReguler.includes(komponen)
                            ? {
                                // Filter untuk komponen reguler
                                nama_komponen: {
                                    contains: komponen,
                                },
                            }
                            : {
                                // Default filter (jika tidak ada kecocokan)
                                nama_komponen: {
                                    not: {
                                        contains: "subsidi",
                                    },
                                },
                            }
                        : {
                            // Filter default jika `komponen` kosong
                            nama_komponen: {
                                not: {
                                    contains: "subsidi",
                                },
                            },
                        },
                ],
                status: 1, // Hanya komponen dengan status aktif
                tahun_ajaran: tahun_ajaran,
                kelas: kelas, // Filter berdasarkan kelas
                jurusan: {
                    in: jurusan, // Filter jurusan, bisa berupa array ["TITL", "ALL"]
                },
                OR: [
                    // Komponen tanpa pembayaran oleh siswa tertentu
                    {
                        payment_details: {
                            none: {
                                payment_core: {
                                    nis: nis, // Filter berdasarkan NIS siswa
                                },
                                tahun_ajaran: tahun_ajaran, // <-- Filter tahun ajaran di payment_details
                            },
                        },
                    },
                    // Komponen dengan pembayaran belum lunas oleh siswa tertentu
                    {
                        payment_details: {
                            some: {
                                payment_core: {
                                    nis: nis, // Filter berdasarkan NIS siswa
                                },
                                nominal_bayar: {
                                    gt: 0, // Nominal pembayaran sebagian
                                },
                                tahun_ajaran: tahun_ajaran, // <-- Filter tahun ajaran di payment_details
                            },
                        },
                    },
                ],
            },
            include: {
                payment_details: {
                    where: {
                        payment_core: {
                            nis: nis, // Filter pembayaran untuk siswa tertentu
                        },
                        status: 1, // Hanya detail dengan status aktif
                        tahun_ajaran: tahun_ajaran, // <-- Filter tahun ajaran di payment_details
                    },
                    include: {
                        payment_core: {
                            where: {
                                status: 1,
                            },
                            select: {
                                kd_trans: true,
                                tanggal_bayar: true,
                                metode_bayar: true,
                                siswa: {
                                    select: {
                                        NAMASISWA: true,
                                        KDROMBEL: true,
                                        NIS: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });


        // Transformasi hasil menjadi format yang diinginkan
        const unpaidPayments = results.map((comp) => {
        const totalPaid = comp.payment_details.reduce((sum, detail) => sum + detail.nominal_bayar, 0) || 0;
        const remaining = comp.total_bayar - totalPaid;

            return {
                kode_komponen: comp.id,
                tahun_ajaran: comp.tahun_ajaran,
                kode_rombel: comp.kdrombel,
                nama_komponen: comp.nama_komponen,
                jatuh_tempo: comp.jatuh_tempo,
                total_bayar: comp.total_bayar,
                terbayar: totalPaid,
                sisa: remaining,
                status:
                    remaining === comp.total_bayar
                        ? "BELUM DIBAYAR"
                        : remaining > 0
                        ? "BELUM LUNAS"
                        : "LUNAS",
                details: comp.payment_details
            };
        });

        // Filter hanya yang "BELUM DIBAYAR" atau "BELUM LUNAS"
        const available_and_unpaid = unpaidPayments.filter(
            (payment) => payment.status === "BELUM DIBAYAR" || payment.status === "BELUM LUNAS"
        );

        return {
            component_list: available_and_unpaid
        }   
    }

    async available_and_unpaid_all( nis, kdrombel, tahun_ajaran) {

        // Proses KDROMBEL untuk mendapatkan kelas dan jurusan
        const { kelas, jurusan } = this.processKDROMBEL(kdrombel);

        const results = await prisma.payment_comp.findMany({
            orderBy: {
                nama_komponen: 'asc'
            },
            where: {
                nama_komponen: {
                    not: {
                        contains: "subsidi", // Tidak menyertakan komponen dengan nama subsidi
                    },
                },
                status: 1, // Hanya komponen dengan status aktif,
                kelas: kelas, // Filter berdasarkan kelas
                jurusan: {
                    in: jurusan, // Filter jurusan, bisa berupa array ["TITL", "ALL"]
                },
                tahun_ajaran: tahun_ajaran, // <-- Tambahkan filter tahun ajaran di payment_comp
                OR: [
                    // Komponen tanpa pembayaran oleh siswa tertentu
                    {
                        payment_details: {
                            none: {
                                payment_core: {
                                    nis: nis, // Filter berdasarkan NIS siswa
                                },
                                tahun_ajaran: tahun_ajaran, // <-- Filter tahun ajaran di payment_details
                            },
                        },
                    },
                    // Komponen dengan pembayaran belum lunas oleh siswa tertentu
                    {
                        payment_details: {
                            some: {
                                payment_core: {
                                    nis: nis, // Filter berdasarkan NIS siswa
                                },
                                nominal_bayar: {
                                    gt: 0, // Nominal pembayaran sebagian
                                },
                                tahun_ajaran: tahun_ajaran, // <-- Filter tahun ajaran di payment_details
                            },
                        },
                    },
                ],
            },
            include: {
                payment_details: {
                    where: {
                        payment_core: {
                            nis: nis, // Filter pembayaran untuk siswa tertentu
                        },
                        status: 1, // Hanya detail dengan status aktif
                        tahun_ajaran: tahun_ajaran, // <-- Filter tahun ajaran di payment_details
                    },
                    include: {
                        payment_core: {
                            where: {
                                status: 1
                            },
                            select: {
                                kd_trans: true,
                                tanggal_bayar: true,
                                metode_bayar: true,
                                siswa: {
                                    select: {
                                        NAMASISWA: true,
                                        KDROMBEL: true,
                                        NIS: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Transformasi hasil menjadi format yang diinginkan
        const unpaidPayments = results.map((comp) => {
        const totalPaid = comp.payment_details.reduce((sum, detail) => sum + detail.nominal_bayar, 0) || 0;
        const remaining = comp.total_bayar - totalPaid;

            return {
                kode_komponen: comp.id,
                nama_komponen: comp.nama_komponen,
                jatuh_tempo: comp.jatuh_tempo,
                total_bayar: comp.total_bayar,
                terbayar: totalPaid,
                sisa: remaining,
                status:
                    remaining === comp.total_bayar
                        ? "BELUM DIBAYAR"
                        : remaining > 0
                        ? "BELUM LUNAS"
                        : "LUNAS",
                details: comp.payment_details
            };
        });

        // Filter hanya yang "BELUM DIBAYAR" atau "BELUM LUNAS"
        const available_and_unpaid = unpaidPayments.filter(
            (payment) => payment.status === "BELUM DIBAYAR" || payment.status === "BELUM LUNAS"
        );

        return {
            component_list: available_and_unpaid
        }   
    }

    processKDROMBEL(kdrombel) {
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

module.exports = new AvailableRepositories();
