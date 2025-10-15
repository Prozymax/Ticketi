const PurchaseService = require('../services/purchase.service');
const { logger } = require('../utils/logger');

class PurchaseController {
    /**
     * Get user purchases
     */
    static async getUserPurchases(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await PurchaseService.getUserPurchases(userId, page, limit);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result.purchases,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getUserPurchases controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get purchase by ID
     */
    static async getPurchaseById(req, res) {
        try {
            const { purchaseId } = req.params;
            const userId = req.user.id;

            const result = await PurchaseService.getPurchaseById(purchaseId, userId);

            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result.purchase
            });
        } catch (error) {
            logger.error('Error in getPurchaseById controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Cancel purchase
     */
    static async cancelPurchase(req, res) {
        try {
            const { purchaseId } = req.params;
            const userId = req.user.id;

            const result = await PurchaseService.cancelPurchase(purchaseId, userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            logger.error('Error in cancelPurchase controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Create purchase (for ticket buying)
     */
    static async createPurchase(req, res) {
        try {
            const userId = req.user.id;
            const { eventId, ticketId, quantity } = req.body;

            if (!eventId || !ticketId || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Event ID, ticket ID, and quantity are required'
                });
            }

            const result = await PurchaseService.createPurchase({
                userId,
                eventId,
                ticketId,
                quantity
            });

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(201).json({
                success: true,
                data: result.purchase,
                message: 'Purchase created successfully'
            });
        } catch (error) {
            logger.error('Error in createPurchase controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Update payment status (for payment processing)
     */
    static async updatePaymentStatus(req, res) {
        try {
            const { purchaseId } = req.params;
            const { paymentStatus, transactionHash } = req.body;

            if (!paymentStatus) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment status is required'
                });
            }

            const result = await PurchaseService.updatePaymentStatus(
                purchaseId,
                paymentStatus,
                transactionHash
            );

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result.purchase,
                message: 'Payment status updated successfully'
            });
        } catch (error) {
            logger.error('Error in updatePaymentStatus controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get purchase statistics
     */
    static async getPurchaseStats(req, res) {
        try {
            const userId = req.user.id;
            const result = await PurchaseService.getPurchaseStats(userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result.stats
            });
        } catch (error) {
            logger.error('Error in getPurchaseStats controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get event sales (for event creators)
     */
    static async getEventSales(req, res) {
        try {
            const { eventId } = req.params;
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await PurchaseService.getEventSales(eventId, userId, page, limit);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result.sales,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getEventSales controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = PurchaseController;