const { hash } = require("bcryptjs");
const midtransRepositories = require("./midtrans.repositories");
const midtransClient = require('midtrans-client');
const fcm = require('../fcm/fcm.services');
const crypto = require('crypto');
const CacheHelper = require("../helper/cache.helper");


// Mengambil nilai dari .env
const isProduction = process.env.MIDTRANS_ISPRODUCTION === 'true';
const serverKey = isProduction
    ? process.env.MIDTRANS_SERVERKEY_PROD
    : process.env.MIDTRANS_SERVERKEY_SANDBOX;
const clientKey = isProduction
    ? process.env.MIDTRANS_CLIENTKEY_PROD
    : process.env.MIDTRANS_CLIENTKEY_SANDBOX;


// Konfigurasi Midtrans Core API
const coreApi = new midtransClient.CoreApi({
    isProduction, // Menggunakan mode dari .env
    serverKey,
    clientKey,
});

class MidtransServices {

    // halaman pembayaran aktif tempat menunggu notifikasi
    async activePayment(nis, kdrombel) {
        const result = await midtransRepositories.activePayment(nis, kdrombel);
        if (!result) {
            return {
                status: 404,
                message: 'No Active Payment',
                data: null,
            };
        }
    
        const updateStatusPayment = await this.getTransactionStatus(result.order_id);

        if (!updateStatusPayment || !updateStatusPayment.data) {
            return {
                status: 404,
                message: 'Failed to retrieve transaction status',
                data: null,
            };
        }
    
        const isPending = updateStatusPayment.data.transaction_status === 'pending';
    
        return {
            status: isPending ? 200 : 404,
            message: isPending ? 'Existing pending transaction found' : 'No Active Payment',
            data: isPending ? updateStatusPayment.data : null,
        };
    }
    

    async createTransaction(orderId, grossAmount, paymentType, bank, customerDetails, components, expiry_time) {
        // Periksa apakah ada pembayaran aktif
        const activePayment = await this.activePayment(customerDetails.nis, customerDetails.kdrombel);
        
        // Jika ada pembayaran aktif, langsung kembalikan detailnya
        if (activePayment.status === 200) {
            return {
                status: 200,
                message: 'Existing pending transaction found',
                data: activePayment.data, // Kembalikan data transaksi yang sudah ada
            };
        }
    
        // Buat transaksi baru jika tidak ada pembayaran aktif
        const transactionParameters = await this.createTransactionParameters(
            orderId,
            grossAmount,
            paymentType,
            bank,
            customerDetails,
            expiry_time
        );
    
        try {
            // Proses transaksi baru menggunakan API Midtrans
            const transaction = await coreApi.charge(transactionParameters);
    
            // Generate kode transaksi baru
            const transactionCode = await this.generateTransactionCode();
    
            // Simpan data transaksi baru ke dalam database
            const createNewEPaymentCore = await midtransRepositories.createEpaymentCoreData(
                customerDetails,
                components,
                transactionCode,
                transaction
            );
    
            // Tambahkan kode transaksi dan detail epayment_core ke response
            transaction.kd_trans = transactionCode;
            transaction.epayment_core_details = createNewEPaymentCore.epayment_core_details;
    
            // Format data untuk response
            const data = await this.dataFormat(
                transaction.status_code,
                transaction.status_message,
                transaction.transaction_id,
                transaction.order_id,
                transaction.gross_amount,
                transaction.payment_type,
                transaction.transaction_time,
                transaction.transaction_status,
                transaction.expiry_time,
                transaction.kd_trans,
                transaction.nis,
                transaction.permata_va_number ? [{ bank: "permata", va_number: transaction.permata_va_number }] : transaction.va_numbers,
                transaction.actions,
                transaction.epayment_core_details
            );
    
            return {
                status: 201,
                message: 'New payment process generated successfully',
                data: data,
            };
        } catch (error) {
            console.error('Error during transaction creation:', error);
            return {
                status: 500,
                message: 'Error creating transaction',
                error: await this.parseErrorMessage(error.message),
            };
        }
    }
    

    async getTransactionStatus(orderId) {
        const result = await coreApi.transaction.status(orderId);

        if (!result || !["pending", "expired", "cancel", "failure", "settlement", "expire"].includes(result.transaction_status)) {
            return null;
        }
    
        const update = await midtransRepositories.updateStatusTransactionEPayCore(orderId, result.transaction_status);
    
        const parsedVa = update.va ? JSON.parse(update.va) : null;
        const parseAction = update.action ? JSON.parse(update.action) : null;
    
        const data = await this.dataFormat(
            200,
            `Transaction with order_id ${orderId} is ${result.transaction_status}`,
            result.transaction_id,
            result.order_id,
            result.gross_amount,
            result.payment_type,
            result.transaction_time,
            result.transaction_status,
            result.expiry_time,
            update.kd_trans,
            update.nis,
            parsedVa,
            parseAction,
            update.epayment_core_details
        );
    
        return {
            status: 200,
            message: 'Transaction status retrieved successfully',
            data: data,
        };
    }
    
    
    async createTransactionParameters(orderId, grossAmount, paymentType, bank, customerDetails, expiry_time) {
        // Pastikan expiry_time dalam format ISO 8601
        const expiryDate = expiry_time || new Date();
        if (!expiry_time) {
            expiryDate.setMinutes(expiryDate.getMinutes() + 60); // Default ke 60 menit
        }
        const formattedExpiryTime = expiryDate.toISOString();
    
        const transactionParameters = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
            customer_details: customerDetails,
            expiry: {
                start_time: formattedExpiryTime,
                unit: 'minutes',
                duration: 60, // Default ke 60 menit
            },
        };
    
        if (paymentType === 'bank_transfer') {
            transactionParameters.payment_type = 'bank_transfer';
            transactionParameters.bank_transfer = { bank };
        } else if (paymentType === 'gopay') {
            transactionParameters.payment_type = 'gopay';
        } else {
            console.error('Invalid payment type:', paymentType);
            throw new Error('Invalid payment type. Allowed types: bank_transfer, gopay.');
        }
    
        return transactionParameters;
    }
    

    async generateTransactionCode() {
        const currentYear = new Date().getFullYear(); // Tahun sekarang
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0'); // Bulan sekarang (dengan leading zero)

        const lastTransaction = await midtransRepositories.lastTransactionPaymentCore(currentYear);
        const lastTransaction2 = await midtransRepositories.lastTransactionEPaymentCore(currentYear);

        let lastNumber = 0;
        let lastNumber2 = 0;

        if (lastTransaction && lastTransaction.kd_trans) {
            lastNumber = parseInt(lastTransaction.kd_trans.slice(-5)) || 0;
        }
        if (lastTransaction2 && lastTransaction2.kd_trans) {
            lastNumber2 = parseInt(lastTransaction2.kd_trans.slice(-5)) || 0;
        }

        const maxLastNumber = Math.max(lastNumber, lastNumber2);
        const newNumber = maxLastNumber + 1;
        const paddedNumber = String(newNumber).padStart(5, '0');
        const newCode = `ONL/${currentYear}${currentMonth}/BB/A${paddedNumber}`;

        return newCode;
    }

    // hooks otomatis yang dikirim midtrans saat pembayaran dilakukan
    async callBackPayment(order_id, status_code, gross_amount,transaction_status,signature_key,res) {
        // validasi signature key dari request yang dikirim oleh midtrans
        const hashed    = crypto.createHash('sha512')
                        .update(order_id + status_code + gross_amount + serverKey)
                        .digest('hex');
        
        if (hashed !== signature_key) {
            return {
                status_code: status_code,
                status_message: 'signature key tidak tepat',
                data: null
            };
        }

        if (transaction_status == 'capture' || transaction_status == 'settlement') {
                
            const updateTransaction =  await midtransRepositories.updateStatusTransactionEPayCore(order_id, transaction_status)
            
            // set status
            const status_message = `Pembayaran dengan orderId: ${order_id} : ${transaction_status}`;
            
            // send notif
            const findWebToken = await fcm.findFirebaseWebToken(updateTransaction.nis, res);
            if (findWebToken.status == 200 || findWebToken.status == 202) {
                await fcm.sendNotification(
                    findWebToken.data.token,
                    "Pembayaran Berhasil",
                    status_message
                );
            }

            return {
                status_code: 200,
                status_message: status_message,
                data: updateTransaction
            }
        }
        
        return {
            status_code: status_code,
            status_message: 'Payment ' + transaction_status,
            data: null
        }
    }

    async findActivePaymentByOrderId(orderId, res) {
        const order_id = String(orderId);
        const cacheKey = `find_online_transaction_by_orderId:${order_id}`;
        const cachedData = await CacheHelper.getCache(res, cacheKey);
        
        if (cachedData) {
            return cachedData;
        }

        const findData = await midtransRepositories.findActivePaymentByOrderId(order_id);

        if (!findData) {
            // simpan cache saat not found
            const notFound =  {
                status: 404,
                message: `Pencarian detail transaksi online: ${order_id} tidak ditemukan`,
                data: order_id
            };
            await CacheHelper.setCache(res, cacheKey, notFound);
            
            return notFound
        }

        return {
            status: 200,
            message: 'Pencarian detail transaksi online ditemukan',
            data: findData
        };
    }
    
    async cancelPaymentByOrderId(orderId, res) {
        
        const exist = await this.findActivePaymentByOrderId(orderId, res);
        if (exist.status === 404) {
            return {
                status: exist.status,
                message: exist.message,
                data: exist.data
            };
        }
    
        // If transaction is not settled, attempt to cancel the payment
        if (exist.status === 200 && exist.data.transaction_status !== 'settlement') {
            const cacheKey = `Your request orderId: ${orderId} has been canceled`;
            const cachedData = await CacheHelper.getCache(res, cacheKey);
            if (cachedData) {
                return cachedData;
            }
            await midtransRepositories.cancelPaymentByOrderId(orderId);  // Call your cancel payment method here
            
            const canceledData = {
                status: 200,
                status_message: `Your request orderId: ${orderId} has been canceled`,
                data: exist.data
            };
            await CacheHelper.setCache(res, cacheKey, canceledData);
            return canceledData;

        } else {
            // Handle case when the transaction is already settled
            const cacheKey = 'Tidak dapat membatalkan pembayaran yang sukses';
            const cachedData = await CacheHelper.getCache(res, cacheKey);
            if (cachedData) {
                return cachedData;
            }
            const throwData = {
                status: 400,
                status_message: 'Tidak dapat membatalkan pembayaran yang sukses',
                data: exist.data
            };
            await CacheHelper.setCache(res, cacheKey, throwData);
            return throwData;
        }
    }

    async searchOnlineTransactionByOrderIdOrKdTrans(orderIdOrKdTrans, res)
    {
        const cacheKey = `detail_online_transaction :${orderIdOrKdTrans}`;
        const cachedData = await CacheHelper.getCache(res, cacheKey);
        
        if (cachedData) {
            return {
                status: 200,
                message: "showing detail transaksi online from cache",
                data: cachedData,
            };
        }

        const result = await midtransRepositories.searchOnlineTransactionByOrderIdOrKdTrans(orderIdOrKdTrans);
        if (!result) {
            return {
                status: 404,
                message: "Permintaan detail transaksi online tidak ditemukan",
                data: null
            }
        }

        const parsedVa = result.va ? JSON.parse(result.va) : null;
        const parseAction = result.action ? JSON.parse(result.action) : null;

        const data = await this.dataFormat(
            200,
            `Transaction with : ${orderIdOrKdTrans}`,
            result.transaction_id,
            result.order_id,
            result.gross_amount,
            result.payment_type,
            result.transaction_time,
            result.transaction_status,
            result.expiry_time,
            result.kd_trans,
            result.nis,
            parsedVa,
            parseAction,
            result.epayment_core_details
        );

        await CacheHelper.setCache(res, cacheKey, data);
    
        return {
            status: 200,
            message: "Permintaan detail transaksi ditemukan",
            data: data,
        };
    }

    async parseErrorMessage(errorMessage) {
        const regex = /API response: (.*)$/;
        const match = errorMessage.match(regex);
        
        if (match) {
            const jsonString = match[1];
            try {
                const jsonData = JSON.parse(jsonString);
                return {
                    message: errorMessage.replace(regex, '').trim(),
                    data: jsonData
                };
            } catch (error) {
                console.error("JSON parsing error:", error);
            }
        }
        
        return { message: errorMessage, data: null };
    }

    async dataFormat(
        status_code,
        status_message,
        transaction_id,
        order_id,
        gross_amount,
        payment_type,
        transaction_time,
        transaction_status,
        expiry_time,
        kd_trans,
        nis,
        va,
        actions,
        details
    ) {
        return {
            status_code: status_code,
            status_message: status_message,
            transaction_id: transaction_id,
            order_id: order_id,
            gross_amount: gross_amount,
            payment_type: payment_type,
            transaction_time: transaction_time,
            transaction_status: transaction_status,
            expiry_time: expiry_time,
            kd_trans: kd_trans,
            nis:nis,
            va: va,
            actions: actions,
            details: details 
        }
    }
    
}

module.exports = new MidtransServices();