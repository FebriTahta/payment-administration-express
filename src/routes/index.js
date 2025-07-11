const express = require("express");
const router = express.Router();
const VerifControllers = require("../verif/verif.controllers");
const RecapControllers = require("../recap/recap.controllers");
const AvailableControllers = require("../available/available.controllers");
const PaymentComponentsControllers = require("../payment_components/payment_components.controllers");
const PaymentListControllers = require("../payment_list/payment_list.controllers");
const MidtransControllers = require("../midtrans/midtrans.controllers");
const NotificationControllers = require("../fcm/fcm.controllers");
const SiswaController = require("../siswa/siswa.controller");
const VerifyToken = require("../middleware");


router.post('/verification', VerifControllers.verification);
router.get('/monthly-recap-payment/:nis/:month?/:year?', VerifyToken(['SISWA']), RecapControllers.recap_monthly_payment);
router.get('/available-payment-comppnent/:nis/:kdrombel?/:tahun_ajaran?/:komponen?', VerifyToken(['SISWA']), AvailableControllers.available_payment_component); // pembayaran yang tersedia berdasarkan komponen (yang siap dibayar)
router.get('/available-payment-all/:nis/:kdrombel?/:tahun_ajaran?', VerifyToken(['SISWA']), AvailableControllers.available_payment_all)
router.get('/detail-payment-components/:nis/:kdrombel/:idComponent', VerifyToken(['SISWA']), PaymentComponentsControllers.paymentComponentsStatus);
router.get('/payment-list/:nis/:kdrombel', VerifyToken(['SISWA']), PaymentListControllers.paymentList);
router.get('/insufficient-payment/:nis/:kdrombel', VerifyToken(['SISWA']), PaymentListControllers.getInsufficientPayments); // tunggakan pembayaran yang belum lunas

// midtrans
router.get('/payment-methods', VerifyToken(['SISWA']), MidtransControllers.paymentMethods);
router.get('/active-payment/:nis/:kdrombel', VerifyToken(['SISWA']), MidtransControllers.activePayment);
router.get('/transaction-status/:orderId', VerifyToken(['SISWA'], 5000), MidtransControllers.transactionStatus);
router.post('/create-transaction', VerifyToken(['SISWA'], 5000), MidtransControllers.createTransaction);
router.post('/callback-payment-notification', MidtransControllers.callbakPaymentNotification);
router.post('/search-detail-online-transaction',VerifyToken(['SISWA']), MidtransControllers.searchOnlineTransactionByOrderIdOrKdTrans);
router.post('/cancel-transaction-by-order-id',VerifyToken(['SISWA']), MidtransControllers.cancelPaymentByOrderId);

// fcm
router.post('/store-firebase-web-token', VerifyToken(['SISWA']), NotificationControllers.storeFirebaseWebToken);
router.post('/find-firebase-web-token', NotificationControllers.findFirebaseWebToken);

// tester notification api
router.post('/test-send-notification',NotificationControllers.sendNotification);

// detail riwayat (kelas & tahun ajaran) siswa 
router.post('/detail-siswa', SiswaController.detailSiswa);

module.exports = router;