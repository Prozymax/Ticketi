const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/payment.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Payment routes
router.post('/create', authenticateToken, PaymentController.createPayment);
router.post('/approve/:paymentId', PaymentController.approvePayment);
router.post('/complete/:paymentId', PaymentController.completePayment);
router.post('/cancel/:paymentId', PaymentController.cancelPayment);
router.get('/status/:paymentId', PaymentController.getPaymentStatus);

// Pi Network webhook callbacks
router.post('/on-incomplete', PaymentController.onIncompletePayment);
router.post('/on-server-approval', PaymentController.onServerApproval);
router.post('/on-server-completion', PaymentController.onServerCompletion);
router.post('/on-server-cancellation', PaymentController.onServerCancellation);

module.exports = { paymentRouter: router };