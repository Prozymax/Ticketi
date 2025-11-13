const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/payment.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

/**
 * Payment Flow:
 * 1. Frontend creates payment directly using Pi SDK (Pi.createPayment)
 * 2. Pi Network sends callbacks to backend for approval/completion/cancellation
 * 3. Backend processes the callbacks and updates database accordingly
 * 
 * This is the same flow used for both event creation and ticket purchase payments
 */

// Payment routes - payments are created on frontend via Pi SDK
// router.post('/create', authenticateToken, PaymentController.createPayment); // REMOVED: Frontend creates payments directly
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