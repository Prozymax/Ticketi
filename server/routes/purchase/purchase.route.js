const express = require('express');
const router = express.Router();
const PurchaseController = require('../../controllers/purchase.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Purchase routes
router.get('/', authenticateToken, PurchaseController.getUserPurchases);
router.get('/stats', authenticateToken, PurchaseController.getPurchaseStats);
router.get('/:purchaseId', authenticateToken, PurchaseController.getPurchaseById);
router.post('/', authenticateToken, PurchaseController.createPurchase);
router.post('/:purchaseId/cancel', authenticateToken, PurchaseController.cancelPurchase);
router.patch('/:purchaseId/payment-status', authenticateToken, PurchaseController.updatePaymentStatus);

module.exports = { purchaseRouter: router };