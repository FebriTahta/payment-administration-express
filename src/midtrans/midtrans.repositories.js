const { prisma } = require("../db");

class MidtransRepositories {
    
    // cek pembayaran dengan status pending / aktif belum dilakukan pembayaran
    async activePayment (nis, kdrombel) {
        const result = prisma.epayment_core.findFirst({
            where: {
                nis: nis,
                kdrombel: kdrombel,
                transaction_status: {
                    equals: "pending"
                }
            },
            include: {
                epayment_core_details: true
            }
        });
        return result;
    }

    // cek existing transaction status
    async existingTransactionStatus(kd_trans) {
        const result = prisma.epayment_core.findFirst({
            kd_trans: {kd_trans},
            include: {
                epayment_core_details: true
            }
        })
        return result;
    }

    // update status berdasarkan check status core api
    async updateStatusTransactionEPayCore(orderId, transactionStatus) {
        const existingPayment = await prisma.epayment_core.findFirst({
            where: { order_id: orderId },
        });
        if (!existingPayment) {
            throw new Error(`Transaction with order_id ${orderId} not found`);
        }
        const result = prisma.epayment_core.update({
            where: { order_id: orderId },
            data: { transaction_status: transactionStatus },
            include: { epayment_core_details: true }
        })
        return result;
    }


    // create epayment core
    async createEpaymentCoreData (customerDetails, components, transactionCode, transaction) {
        const result = await prisma.epayment_core.create({
            data: {
                kd_trans: transactionCode,
                transaction_id: transaction.transaction_id,
                order_id: transaction.order_id,
                gross_amount: parseInt(transaction.gross_amount),
                transaction_status: transaction.transaction_status,
                transaction_time: transaction.transaction_time,
                payment_type: transaction.payment_type,
                nis: customerDetails.nis,
                name: customerDetails.name,
                kdrombel: customerDetails.kdrombel,
                components: JSON.stringify(components), // Konversi menjadi JSON string
                expiry_time: transaction.expiry_time,
                va: JSON.stringify(transaction.permata_va_number ? [{ bank: "permata", va_number: transaction.permata_va_number }] : transaction.va_numbers),
                action: JSON.stringify(transaction.actions)
                
            },
            include: {
                epayment_core_details: true
            }
        });
        // trigger : after_insert_epayment_core
        // procedure : AddPaymentDetails
        return result;
    }
    
    // last transaction dari payment
    async lastTransactionPaymentCore(currentYear) {

        const result = await prisma.payment_core.findFirst({
            where: {
                tanggal_bayar: {
                    gte: new Date(`${currentYear}-01-01`), // Dari awal tahun
                    lte: new Date(`${currentYear}-12-31`), // Hingga akhir tahun
                },
            },
            orderBy: {
                id: 'desc', // Urutkan berdasarkan kd_trans secara menurun
            },
            select: {
                kd_trans: true, // Hanya ambil kolom kd_trans
            },
        });

        return result;
    }

    // last transaction dari e payment (pembayaran online)
    async lastTransactionEPaymentCore(currentYear) {
        // Pastikan currentYear adalah angka
        if (!currentYear || typeof currentYear !== 'number') {
            throw new Error('Invalid currentYear. Must be a valid year number.');
        }
    
        // Buat tanggal awal dan akhir tahun dalam format ISO 8601
        const startOfYear = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0)).toISOString(); // Awal tahun
        const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999)).toISOString(); // Akhir tahun
    
        const result = await prisma.epayment_core.findFirst({
            where: {
                transaction_time: {
                    gte: startOfYear, // Format ISO 8601
                    lte: endOfYear,   // Format ISO 8601
                },
            },
            orderBy: {
                id: 'desc', // Urutkan berdasarkan kd_trans secara menurun
            },
            select: {
                kd_trans: true, // Hanya ambil kolom kd_trans
            },
        });
    
        return result;
    }    

    async findActivePaymentByOrderId(order_id) {

        const result = await prisma.epayment_core.findFirst({
            where: {
                order_id: order_id
            },
            include:{
                epayment_core_details: true
            }
        });
        return result;
    }

    async cancelPaymentByOrderId(orderId) {
        await prisma.epayment_core.deleteMany({
            where: {
                order_id: orderId
            }
        });
        return 'Active payment canceled and removed';
    }

    async searchOnlineTransactionByOrderIdOrKdTrans(orderIdOrKdTrans) {
        const result = await prisma.epayment_core.findFirst({
            where: {
                OR: [
                    { order_id: orderIdOrKdTrans },
                    { kd_trans: orderIdOrKdTrans }
                ]
            },
            include: {
                epayment_core_details: true
            }
        });
        return result;
    }    
    
}

module.exports = new MidtransRepositories();