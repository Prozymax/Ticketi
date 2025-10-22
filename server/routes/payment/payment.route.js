const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/payment.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Payment routes
router.post('/create', authenticateToken, PaymentController.createPayment);
router.post('/approve/:paymentId', authenticateToken, PaymentController.approvePayment);
router.post('/complete/:paymentId', authenticateToken, PaymentController.completePayment);
router.post('/cancel/:paymentId', authenticateToken, PaymentController.cancelPayment);
router.get('/status/:paymentId', authenticateToken, PaymentController.getPaymentStatus);

// Pi Network webhook callbacks
router.post('/on-incomplete', authenticateToken, PaymentController.onIncompletePayment);
router.post('/on-server-approval', authenticateToken, PaymentController.onServerApproval);
router.post('/on-server-completion', authenticateToken, PaymentController.onServerCompletion);
router.post('/on-server-cancellation', authenticateToken, PaymentController.onServerCancellation);

module.exports = { paymentRouter: router };