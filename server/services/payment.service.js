const { Payment, Purchase, Event, Ticket } = require('../models/index.model');
const { logger } = require('../utils/logger');
const { sequelize } = require('../config/db.config');

const PaymentService = {
    // Create a new payment
    async createPayment(userId, paymentData) {
        try {
            const { amount, memo, metadata, purchaseId, eventId } = paymentData;
            
            // Validate required fields
            if (!amount || amount <= 0) {
                return {
                    error: true,
                    message: 'Invalid payment amount'
                };
            }

            // Create payment record
            const payment = await Payment.create({
                userId,
                amount: parseFloat(amount),
                memo: memo || '',
                metadata: metadata || {},
                purchaseId: purchaseId || null,
                eventId: eventId || null,
                status: 'pending',
                paymentMethod: 'pi_network',
                createdAt: new Date()
            });

            logger.info(`Payment created successfully: ${payment.id}`);
            return {
                error: false,
                message: 'Payment created successfully',
                payment
            };
        } catch (error) {
            logger.error('Payment creation error:', error);
            return {
                error: true,
                message: 'Failed to create payment: ' + error.message
            };
        }
    },

    // Get payment by ID
    async getPaymentById(paymentId, userId = null) {
        try {
            const whereClause = { id: paymentId };
            if (userId) {
                whereClause.userId = userId;
            }

            const payment = await Payment.findOne({
                where: whereClause,
                include: [
                    {
                        model: Purchase,
                        as: 'purchase',
                        include: [
                            {
                                model: Event,
                                as: 'event',
                                attributes: ['id', 'title', 'description']
                            },
                            {
                                model: Ticket,
                                as: 'ticket',
                                attributes: ['id', 'type', 'price']
                            }
                        ]
                    }
                ]
            });

            if (!payment) {
                return {
                    error: true,
                    message: 'Payment not found'
                };
            }

            return {
                error: false,
                message: 'Payment retrieved successfully',
                payment
            };
        } catch (error) {
            logger.error('Get payment error:', error);
            return {
                error: true,
                message: 'Failed to retrieve payment: ' + error.message
            };
        }
    },

    // Update payment status
    async updatePaymentStatus(paymentId, status, transactionHash = null, piPaymentId = null) {
        try {
            const payment = await Payment.findByPk(paymentId);
            if (!payment) {
                return {
                    error: true,
                    message: 'Payment not found'
                };
            }

            const updateData = { status };
            if (transactionHash) {
                updateData.transactionHash = transactionHash;
            }
            if (piPaymentId) {
                updateData.piPaymentId = piPaymentId;
            }
            if (status === 'completed') {
                updateData.completedAt = new Date();
                
                // If payment is completed and linked to a purchase, update purchase status
                if (payment.purchaseId) {
                    const PurchaseService = require('./purchase.service');
                    await PurchaseService.updatePaymentStatus(payment.purchaseId, 'completed', paymentId);
                }
            }

            await payment.update(updateData);

            // Get updated payment with related data
            const updatedPayment = await Payment.findByPk(paymentId, {
                include: [
                    {
                        model: Purchase,
                        as: 'purchase',
                        include: [
                            {
                                model: Event,
                                as: 'event',
                                attributes: ['id', 'title', 'description']
                            },
                            {
                                model: Ticket,
                                as: 'ticket',
                                attributes: ['id', 'type', 'price']
                            }
                        ]
                    }
                ]
            });

            logger.info(`Payment status updated: ${paymentId} -> ${status}`);
            return {
                error: false,
                message: 'Payment status updated successfully',
                payment: updatedPayment
            };
        } catch (error) {
            logger.error('Update payment status error:', error);
            return {
                error: true,
                message: 'Failed to update payment status: ' + error.message
            };
        }
    },

    // Get user payments
    async getUserPayments(userId) {
        try {
            const payments = await Payment.findAll({
                where: { userId },
                include: [
                    {
                        model: Purchase,
                        as: 'purchase',
                        include: [
                            {
                                model: Event,
                                as: 'event',
                                attributes: ['id', 'title', 'description', 'startDate', 'endDate']
                            },
                            {
                                model: Ticket,
                                as: 'ticket',
                                attributes: ['id', 'type', 'price']
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            return {
                error: false,
                message: 'Payments retrieved successfully',
                payments
            };
        } catch (error) {
            logger.error('Get user payments error:', error);
            return {
                error: true,
                message: 'Failed to retrieve payments: ' + error.message
            };
        }
    },

    // Process Pi Network payment completion
    async processPiPaymentCompletion(piPaymentId, transactionHash) {
        try {
            // Find payment by Pi payment ID
            const payment = await Payment.findOne({
                where: { piPaymentId }
            });

            if (!payment) {
                return {
                    error: true,
                    message: 'Payment not found for Pi payment ID'
                };
            }

            // Update payment status
            const result = await this.updatePaymentStatus(
                payment.id,
                'completed',
                transactionHash,
                piPaymentId
            );

            return result;
        } catch (error) {
            logger.error('Process Pi payment completion error:', error);
            return {
                error: true,
                message: 'Failed to process Pi payment completion: ' + error.message
            };
        }
    }
};

module.exports = PaymentService;