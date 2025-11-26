const { Payment, Purchase, Event, Ticket } = require('../models/index.model');
const { logger } = require('../utils/logger');
const { sequelize } = require('../config/db.config');
const cacheService = require('./cache.service');

const PaymentService = {
    // Sanitize payment data to ensure no sensitive card data is cached
    _sanitizePaymentForCache(payment) {
        const sanitized = typeof payment.toJSON === 'function' ? payment.toJSON() : { ...payment };
        
        // List of sensitive fields that should never be cached
        const sensitiveFields = [
            'cardNumber',
            'cvv',
            'cvc',
            'cardCvv',
            'cardCvc',
            'securityCode',
            'pin',
            'password',
            'privateKey',
            'secret'
        ];
        
        // Remove sensitive fields from top level
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                delete sanitized[field];
                logger.warn(`Removed sensitive field '${field}' from payment cache data`);
            }
        });
        
        // Remove sensitive fields from metadata if present
        if (sanitized.metadata && typeof sanitized.metadata === 'object') {
            sensitiveFields.forEach(field => {
                if (sanitized.metadata[field]) {
                    delete sanitized.metadata[field];
                    logger.warn(`Removed sensitive field '${field}' from payment metadata cache`);
                }
            });
        }
        
        return sanitized;
    },
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

            // Cache initiated payment with 1800 second TTL (sanitized to exclude sensitive data)
            const cacheKey = `payment:transaction:${payment.id}`;
            const sanitizedPayment = this._sanitizePaymentForCache({
                id: payment.id,
                userId: payment.userId,
                amount: payment.amount,
                status: payment.status,
                purchaseId: payment.purchaseId,
                eventId: payment.eventId,
                createdAt: payment.createdAt
            });
            await cacheService.set(cacheKey, sanitizedPayment, 1800);

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
            // Try to get from cache first
            const cacheKey = `payment:transaction:${paymentId}`;
            const cachedPayment = await cacheService.get(cacheKey);
            
            if (cachedPayment) {
                // If userId is provided, verify it matches
                if (userId && cachedPayment.userId !== userId) {
                    return {
                        error: true,
                        message: 'Payment not found'
                    };
                }
                
                logger.debug(`Payment ${paymentId} retrieved from cache`);
                return {
                    error: false,
                    message: 'Payment retrieved successfully',
                    payment: cachedPayment
                };
            }

            // Cache miss - fetch from database
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

            // Cache the payment data (1800 second TTL, sanitized to exclude sensitive data)
            const sanitizedPayment = this._sanitizePaymentForCache(payment);
            await cacheService.set(cacheKey, sanitizedPayment, 1800);

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

    // Verify payment (cache verification results)
    async verifyPayment(paymentId, verificationData) {
        try {
            // Check cache for recent verification result
            const verifyCacheKey = `payment:verification:${paymentId}`;
            const cachedVerification = await cacheService.get(verifyCacheKey);
            
            if (cachedVerification) {
                logger.debug(`Payment verification ${paymentId} retrieved from cache`);
                return cachedVerification;
            }

            // Perform actual verification (this would call payment gateway)
            const payment = await Payment.findByPk(paymentId);
            if (!payment) {
                return {
                    error: true,
                    message: 'Payment not found'
                };
            }

            // Simulate verification logic
            const verificationResult = {
                error: false,
                verified: payment.status === 'completed',
                paymentId: payment.id,
                status: payment.status,
                transactionHash: payment.transactionHash,
                timestamp: new Date()
            };

            // Cache verification result with 300 second TTL
            await cacheService.set(verifyCacheKey, verificationResult, 300);

            return verificationResult;
        } catch (error) {
            logger.error('Payment verification error:', error);
            return {
                error: true,
                message: 'Failed to verify payment: ' + error.message
            };
        }
    },

    // Get or cache payment gateway token
    async getPaymentGatewayToken(userId) {
        try {
            // Check cache for existing token
            const tokenCacheKey = `payment:token:${userId}`;
            const cachedToken = await cacheService.get(tokenCacheKey);
            
            if (cachedToken) {
                logger.debug(`Payment gateway token for user ${userId} retrieved from cache`);
                return {
                    error: false,
                    token: cachedToken
                };
            }

            // Generate new token (this would call payment gateway API)
            const newToken = {
                token: `token_${userId}_${Date.now()}`,
                userId: userId,
                expiresAt: new Date(Date.now() + 3000 * 1000), // 3000 seconds from now
                createdAt: new Date()
            };

            // Cache token with 3000 second TTL
            await cacheService.set(tokenCacheKey, newToken, 3000);

            logger.info(`Payment gateway token generated for user ${userId}`);
            return {
                error: false,
                token: newToken
            };
        } catch (error) {
            logger.error('Get payment gateway token error:', error);
            return {
                error: true,
                message: 'Failed to get payment gateway token: ' + error.message
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

            // Invalidate transaction cache immediately when payment is confirmed
            if (status === 'completed') {
                const cacheKey = `payment:transaction:${paymentId}`;
                await cacheService.del(cacheKey);
                logger.info(`Payment transaction cache invalidated for completed payment: ${paymentId}`);
            }

            // Invalidate verification cache on any status change
            const verifyCacheKey = `payment:verification:${paymentId}`;
            await cacheService.del(verifyCacheKey);
            
            // Invalidate payment gateway token cache for the user to force refresh
            if (status === 'completed' || status === 'failed') {
                const tokenCacheKey = `payment:token:${payment.userId}`;
                await cacheService.del(tokenCacheKey);
                logger.info(`Payment token cache invalidated for user: ${payment.userId}`);
            }

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
    },

    // Handle payment failure
    async handlePaymentFailure(paymentId, reason) {
        try {
            const payment = await Payment.findByPk(paymentId);
            if (!payment) {
                return {
                    error: true,
                    message: 'Payment not found'
                };
            }

            // Update payment status to failed
            await payment.update({
                status: 'failed',
                metadata: {
                    ...payment.metadata,
                    failureReason: reason,
                    failedAt: new Date()
                }
            });

            // Invalidate all related caches on payment failure
            const cacheKey = `payment:transaction:${paymentId}`;
            const verifyCacheKey = `payment:verification:${paymentId}`;
            const tokenCacheKey = `payment:token:${payment.userId}`;
            
            await Promise.all([
                cacheService.del(cacheKey),
                cacheService.del(verifyCacheKey),
                cacheService.del(tokenCacheKey)
            ]);

            logger.info(`Payment failed and all related caches invalidated: ${paymentId}`);
            return {
                error: false,
                message: 'Payment failure handled successfully',
                payment
            };
        } catch (error) {
            logger.error('Handle payment failure error:', error);
            return {
                error: true,
                message: 'Failed to handle payment failure: ' + error.message
            };
        }
    },

    // Handle payment timeout
    async handlePaymentTimeout(paymentId) {
        try {
            const payment = await Payment.findByPk(paymentId);
            if (!payment) {
                return {
                    error: true,
                    message: 'Payment not found'
                };
            }

            // Only timeout pending payments
            if (payment.status !== 'pending') {
                return {
                    error: false,
                    message: 'Payment is not in pending status',
                    payment
                };
            }

            // Update payment status to timeout
            await payment.update({
                status: 'timeout',
                metadata: {
                    ...payment.metadata,
                    timedOutAt: new Date()
                }
            });

            // Invalidate all related caches on payment timeout
            const cacheKey = `payment:transaction:${paymentId}`;
            const verifyCacheKey = `payment:verification:${paymentId}`;
            const tokenCacheKey = `payment:token:${payment.userId}`;
            
            await Promise.all([
                cacheService.del(cacheKey),
                cacheService.del(verifyCacheKey),
                cacheService.del(tokenCacheKey)
            ]);

            logger.info(`Payment timed out and all related caches invalidated: ${paymentId}`);
            return {
                error: false,
                message: 'Payment timeout handled successfully',
                payment
            };
        } catch (error) {
            logger.error('Handle payment timeout error:', error);
            return {
                error: true,
                message: 'Failed to handle payment timeout: ' + error.message
            };
        }
    }
};

module.exports = PaymentService;
