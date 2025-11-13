const PurchaseService = require('../services/purchase.service');
const piNetworkService = require('../services/pi_network.service');
const { logger } = require('../utils/logger');

class PaymentController {
    /**
     * DEPRECATED: This method is not used anymore
     * Payments are created directly on the frontend using Pi SDK (via usePiNetwork hook)
     * The frontend calls createPayment() which uses Pi.createPayment() directly
     * Backend only handles the payment callbacks (approval, completion, cancellation)
     * 
     * This approach is consistent with event creation payments and avoids duplicate payment creation
     */
    // static async createPayment(req, res) {
    //     // NOT USED - Frontend creates payments directly via Pi SDK
    // }

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

            // Debug logging
            console.log('=== Payment Completion Debug ===');
            console.log('Result success:', result.success);
            console.log('Result payment:', JSON.stringify(result.payment, null, 2));
            console.log('Payment metadata:', result.payment?.metadata);
            console.log('Payment eventId:', result.payment?.eventId);
            console.log('Payment userId:', result.payment?.userId);

            // Store payment data in database after successful completion
            if (result.success && result.payment) {
                const Payment = require('../models/payment/payment.model');
                const PurchaseService = require('../services/purchase.service');
                const BlockchainTransaction = require('../models/blockchain/blockchain_transaction.model');

                console.log('=== Storing Payment Record ===');
                // Create or update payment record
                const paymentRecord = {
                    id: result.payment.identifier || paymentId,
                    userId: result.payment.user_uid, // Use user_uid from Pi Network
                    eventId: result.payment.eventId || null,
                    purchaseId: result.payment.purchaseId || null,
                    amount: result.payment.amount,
                    currency: 'PI',
                    status: 'completed',
                    paymentMethod: 'pi_network',
                    piPaymentId: result.payment.identifier || paymentId,
                    transactionHash: result.payment.txid || transactionHash,
                    memo: result.payment.memo,
                    metadata: result.payment.metadata,
                    completedAt: new Date()
                };

                console.log('Payment record to store:', JSON.stringify(paymentRecord, null, 2));
                await Payment.upsert(paymentRecord);
                console.log('Payment record stored successfully');

                console.log('=== Storing Blockchain Transaction ===');
                // Create or update blockchain transaction record
                const blockchainRecord = {
                    transactionHash: result.payment.txid || transactionHash || paymentId,
                    fromAddress: result.payment.from_address || 'unknown',
                    toAddress: result.payment.to_address || 'app',
                    amount: result.payment.amount,
                    status: 'confirmed',
                    transactionType: 'payment',
                    relatedId: result.payment.eventId || result.payment.purchaseId || null
                };

                console.log('Blockchain record to store:', JSON.stringify(blockchainRecord, null, 2));
                await BlockchainTransaction.upsert(blockchainRecord);
                console.log('Blockchain transaction stored successfully');

                // Handle different payment types
                console.log('=== Checking Payment Type ===');
                console.log('Has metadata:', !!result.payment.metadata);
                console.log('Payment type:', result.payment.metadata?.paymentType);
                console.log('Has eventId:', !!result.payment.eventId);
                console.log('Has purchaseId:', !!result.payment.purchaseId);

                const paymentType = result.payment.metadata?.paymentType;
                const userId = result.payment.user_uid; // Use user_uid from Pi Network

                if (paymentType === 'ticket_purchase' && result.payment.purchaseId) {
                    console.log('=== Processing Ticket Purchase ===');
                    // Update purchase status for ticket purchases
                    await PurchaseService.updatePaymentStatus(result.payment.purchaseId, 'completed', result.payment.txid || transactionHash);
                    logger.info('Purchase status updated to completed:', { purchaseId: result.payment.purchaseId });

                    // Create NFT tickets for the purchase
                    try {
                        await PaymentController.createNFTTickets(result.payment.purchaseId, userId, result.payment.txid || transactionHash);
                        console.log('✅ NFT tickets created successfully');
                    } catch (nftError) {
                        console.error('❌ Failed to create NFT tickets:', nftError);
                        logger.error('Failed to create NFT tickets:', { error: nftError, purchaseId: result.payment.purchaseId });
                    }

                } else if (paymentType === 'event_creation' && result.payment.eventId) {
                    console.log('=== Processing Event Creation Payment ===');
                    console.log('EventId:', result.payment.eventId);
                    console.log('UserId:', userId);

                    // Publish event after successful payment
                    const eventService = require('../services/event.service');
                    const publishResult = await eventService.publishEvent(result.payment.eventId, userId);

                    console.log('Publish result:', JSON.stringify(publishResult, null, 2));

                    if (publishResult.error) {
                        logger.error('Failed to publish event after payment:', {
                            eventId: result.payment.eventId,
                            userId: userId,
                            error: publishResult.message
                        });
                        console.error('=== Event Publishing Failed ===');
                        console.error('Error:', publishResult.message);
                    } else {
                        logger.info('Event published successfully after payment:', {
                            eventId: result.payment.eventId,
                            userId: userId
                        });
                        console.log('=== Event Published Successfully ===');
                    }
                } else {
                    console.log('=== Payment type not matched ===');
                    console.log('Conditions check:');
                    console.log('- Has metadata:', !!result.payment.metadata);
                    console.log('- Payment type is event_creation:', result.payment.metadata?.paymentType === 'event_creation');
                    console.log('- Has eventId:', !!result.payment.eventId);
                }

                logger.info('Payment data stored successfully:', { paymentId });
            }

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

            const piNetworkService = require('../services/pi_network.service');
            const Payment = require('../models/payment/payment.model');
            const PurchaseService = require('../services/purchase.service');
            const TicketService = require('../services/ticket.service');

            // Find the payment to get associated purchase info
            const payment = await Payment.findOne({
                where: { piPaymentId: paymentId }
            });

            if (payment && payment.metadata && payment.metadata.paymentType === 'ticket_purchase') {
                // Cancel the purchase and release tickets
                if (payment.purchaseId) {
                    await PurchaseService.updatePaymentStatus(payment.purchaseId, 'cancelled');
                }

                // Release reserved tickets
                if (payment.metadata.ticketId && payment.metadata.quantity) {
                    await TicketService.releaseTickets(payment.metadata.ticketId, payment.metadata.quantity);
                }
            }

            // Update payment status
            if (payment) {
                await payment.update({ status: 'cancelled' });
            }

            res.status(200).json({
                success: true,
                message: 'Payment cancellation handled',
                data: { paymentId }
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

            // Store payment data in database after successful completion
            if (result.success && result.payment) {
                const Payment = require('../models/payment/payment.model');
                const PurchaseService = require('../services/purchase.service');
                const BlockchainTransaction = require('../models/blockchain/blockchain_transaction.model');
                const userId = req.user.id; // Get authenticated user ID from middleware

                console.log('=== Complete Payment - Storing Data ===');
                console.log('Authenticated userId:', userId);
                console.log('Payment metadata:', result.payment.metadata);
                console.log('Payment eventId:', result.payment.eventId);

                // Create or update payment record
                await Payment.upsert({
                    id: result.payment.id || paymentId,
                    userId: userId, // Use authenticated user ID
                    eventId: result.payment.eventId,
                    purchaseId: result.payment.purchaseId,
                    amount: result.payment.amount,
                    currency: 'PI',
                    status: 'completed',
                    paymentMethod: 'pi_network',
                    piPaymentId: paymentId,
                    transactionHash: transactionHash,
                    memo: result.payment.memo,
                    metadata: result.payment.metadata,
                    completedAt: new Date()
                });

                // Create or update blockchain transaction record
                await BlockchainTransaction.upsert({
                    transactionHash: transactionHash || paymentId,
                    fromAddress: result.payment.from_address || result.payment.user_uid || 'unknown',
                    toAddress: result.payment.to_address || 'app',
                    amount: result.payment.amount,
                    status: 'confirmed',
                    transactionType: 'payment',
                    relatedId: result.payment.eventId || result.payment.purchaseId
                });

                // Handle different payment types
                if (result.payment.metadata && result.payment.metadata.paymentType === 'ticket_purchase' && result.payment.purchaseId) {
                    console.log('Processing ticket purchase...');
                    await PurchaseService.updatePaymentStatus(result.payment.purchaseId, 'completed', transactionHash);
                    logger.info('Purchase status updated to completed:', { purchaseId: result.payment.purchaseId });

                    // Create NFT tickets for the purchase
                    try {
                        await PaymentController.createNFTTickets(result.payment.purchaseId, userId, transactionHash);
                        console.log('✅ NFT tickets created successfully');
                    } catch (nftError) {
                        console.error('❌ Failed to create NFT tickets:', nftError);
                        logger.error('Failed to create NFT tickets:', { error: nftError, purchaseId: result.payment.purchaseId });
                    }
                } else if (result.payment.metadata && result.payment.metadata.paymentType === 'event_creation' && result.payment.eventId) {
                    console.log('=== Processing Event Creation Payment ===');
                    console.log('EventId:', result.payment.eventId);
                    console.log('UserId:', userId);

                    // Publish event after successful payment
                    const eventService = require('../services/event.service');
                    const publishResult = await eventService.publishEvent(result.payment.eventId, userId);

                    console.log('Publish result:', publishResult);

                    if (publishResult.error) {
                        logger.error('Failed to publish event after payment:', {
                            eventId: result.payment.eventId,
                            error: publishResult.message
                        });
                    } else {
                        logger.info('Event published successfully after payment:', {
                            eventId: result.payment.eventId
                        });
                    }
                } else {
                    console.log('=== Payment type not matched ===');
                    console.log('Payment type:', result.payment.metadata?.paymentType);
                    console.log('Has eventId:', !!result.payment.eventId);
                }

                logger.info('Payment data stored successfully:', { paymentId });
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
     * Create NFT tickets for a completed purchase
     */
    static async createNFTTickets(purchaseId, userId, transactionHash) {
        try {
            console.log('=== Creating NFT Tickets ===');
            console.log('Purchase ID:', purchaseId);
            console.log('User ID:', userId);
            console.log('Transaction Hash:', transactionHash);

            const Purchase = require('../models/purchase/purchase.model');
            const NFTTicket = require('../models/nft_ticket/nft_ticket.model');
            const { User } = require('../models/index.model');
            const crypto = require('crypto');

            // Get purchase details with user info
            const purchase = await Purchase.findByPk(purchaseId, {
                include: [
                    {
                        model: User,
                        as: 'buyer',
                        attributes: ['id', 'username', 'firstName', 'lastName']
                    }
                ]
            });

            console.log('Purchase found:', !!purchase);
            if (purchase) {
                console.log('Purchase details:', {
                    id: purchase.id,
                    userId: purchase.userId,
                    quantity: purchase.quantity,
                    eventId: purchase.eventId,
                    hasBuyer: !!purchase.buyer
                });
            }

            if (!purchase) {
                logger.error('Purchase not found for NFT creation:', { purchaseId });
                throw new Error(`Purchase not found: ${purchaseId}`);
            }

            if (!purchase.buyer) {
                logger.error('Buyer not found for purchase:', { purchaseId });
                throw new Error(`Buyer not found for purchase: ${purchaseId}`);
            }

            const user = purchase.buyer;
            const displayName = user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username;

            console.log('Creating NFT tickets for user:', {
                username: user.username,
                displayName: displayName,
                quantity: purchase.quantity
            });

            // Create NFT tickets based on quantity purchased
            const nftTickets = [];
            for (let i = 0; i < purchase.quantity; i++) {
                const tokenId = crypto.randomUUID();
                const qrCodeData = JSON.stringify({
                    ticketId: tokenId,
                    purchaseId: purchaseId,
                    eventId: purchase.eventId,
                    owner: user.username,
                    transactionHash: transactionHash
                });

                console.log(`Creating NFT ticket ${i + 1}/${purchase.quantity}...`);

                const nftTicket = await NFTTicket.create({
                    purchaseId: purchaseId,
                    tokenId: tokenId,
                    metadata: {
                        owner: user.username,
                        ownerDisplayName: displayName,
                        purchaseId: purchaseId,
                        eventId: purchase.eventId,
                        ticketNumber: i + 1,
                        totalTickets: purchase.quantity,
                        transactionHash: transactionHash,
                        createdAt: new Date().toISOString()
                    },
                    qrCode: Buffer.from(qrCodeData).toString('base64'),
                    isUsed: false,
                    isTransferable: true
                });

                console.log(`NFT ticket ${i + 1} created with ID:`, nftTicket.id);
                nftTickets.push(nftTicket);
            }

            console.log(`=== Successfully created ${nftTickets.length} NFT tickets ===`);
            logger.info(`Created ${nftTickets.length} NFT tickets for purchase:`, {
                purchaseId,
                userId,
                owner: user.username,
                ticketIds: nftTickets.map(t => t.id)
            });

            return nftTickets;
        } catch (error) {
            console.error('=== ERROR Creating NFT Tickets ===');
            console.error('Error details:', error);
            logger.error('Error creating NFT tickets:', error);
            throw error; // Re-throw to ensure calling code knows it failed
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