const PurchaseService = require('../services/purchase.service');
const piNetworkService = require('../services/pi_network.service');
const { logger } = require('../utils/logger');

class PaymentController {
    /**
     * Create a new payment for ticket purchase
     */
    static async createPayment(req, res) {
        try {
            const userId = req.user.id;
            const { ticketId, quantity, eventId, amount, memo, metadata } = req.body;

            if (!ticketId || !quantity || !eventId || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Ticket ID, quantity, event ID, and amount are required'
                });
            }

            // Create purchase first
            const purchaseResult = await PurchaseService.createPurchase({
                userId,
                ticketId,
                quantity,
                eventId
            });

            if (!purchaseResult.success) {
                return res.status(400).json({
                    success: false,
                    message: purchaseResult.error
                });
            }

            const purchase = purchaseResult.purchase;

            // Submit payment to Pi Network
            const paymentResult = await piNetworkService.submitPayment({
                amount,
                memo: memo || `Ticket purchase for ${quantity} ticket(s)`,
                metadata: {
                    ...metadata,
                    purchaseId: purchase.id,
                    userId,
                    eventId,
                    ticketId,
                    quantity
                },
                userId,
                purchaseId: purchase.id
            });

            if (!paymentResult.success) {
                return res.status(400).json({
                    success: false,
                    message: paymentResult.error
                });
            }

            res.status(201).json({
                success: true,
                data: {
                    id: paymentResult.payment.id,
                    amount: paymentResult.payment.amount,
                    status: paymentResult.payment.status,
                    purchaseId: purchase.id,
                    createdAt: new Date().toISOString()
                },
                message: 'Payment created successfully'
            });
        } catch (error) {
            logger.error('Error in createPayment controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Handle server approval callback from Pi Network
     */
    static async onServerApproval(req, res) {
        try {
            const { paymentId } = req.body;
            console.log(paymentId)
            logger.info('Received server approval callback:', { paymentId });

            const result = await piNetworkService.approvePayment(paymentId);
            console.log(result)

            res.status(200).json({
                success: true,
                message: 'Payment approved on server',
                data: result
            });
        } catch (error) {
            console.log(error)
            logger.error('Error in onServerApproval controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Handle server completion callback from Pi Network
     */
    static async onServerCompletion(req, res) {
        try {
            const { paymentId, transactionHash } = req.body;
            logger.info('Received server completion callback:', { paymentId, transactionHash });

            const result = await piNetworkService.completePayment(paymentId, transactionHash);

            res.status(200).json({
                success: true,
                message: 'Payment completed on server',
                data: result
            });
        } catch (error) {
            logger.error('Error in onServerCompletion controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Handle server cancellation callback from Pi Network
     */
    static async onServerCancellation(req, res) {
        try {
            const { paymentId } = req.body;
            logger.info('Received server cancellation callback:', { paymentId });

            // Cancel the associated purchase
            const result = await PurchaseService.cancelPurchase(paymentId);

            res.status(200).json({
                success: true,
                message: 'Payment cancellation handled',
                data: result
            });
        } catch (error) {
            logger.error('Error in onServerCancellation controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Approve payment (called from client)
     */
    static async approvePayment(req, res) {
        try {
            const { paymentId } = req.params;
            const userId = req.user.id;

            // logger.info('Approving payment:', { paymentId, userId });

            const result = await piNetworkService.approvePayment(paymentId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Payment approved successfully'
            });
        } catch (error) {
            logger.error('Error in approvePayment controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Complete payment (called from client)
     */
    static async completePayment(req, res) {
        try {
            const { paymentId } = req.params;
            const { transactionHash } = req.body;

            logger.info('Completing payment:', { paymentId, transactionHash });

            const result = await piNetworkService.completePayment(paymentId, transactionHash);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Payment completed successfully'
            });
        } catch (error) {
            logger.error('Error in completePayment controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Cancel payment (called from client)
     */
    static async cancelPayment(req, res) {
        try {
            const { paymentId } = req.params;
            const userId = req.user.id;

            logger.info('Cancelling payment:', { paymentId, userId });

            // Find and cancel the associated purchase
            const result = await PurchaseService.cancelPurchase(paymentId, userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                message: 'Payment cancelled successfully'
            });
        } catch (error) {
            logger.error('Error in cancelPayment controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get payment status
     */
    static async getPaymentStatus(req, res) {
        try {
            const { paymentId } = req.params;
            const userId = req.user.id;

            logger.info('Getting payment status:', { paymentId, userId });

            // For now, return a mock status - you can implement actual status checking
            res.status(200).json({
                success: true,
                data: {
                    id: paymentId,
                    status: 'pending',
                    userId: userId,
                    createdAt: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Error in getPaymentStatus controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Handle incomplete payment callback from Pi Network
     */
    static async onIncompletePayment(req, res) {
        try {
            const { paymentId } = req.body;
            logger.info('Received incomplete payment callback:', { paymentId });

            // Handle incomplete payment logic here
            res.status(200).json({
                success: true,
                message: 'Incomplete payment handled',
                data: { paymentId }
            });
        } catch (error) {
            logger.error('Error in onIncompletePayment controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = PaymentController;