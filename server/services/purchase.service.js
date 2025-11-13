const { Purchase, Event, Ticket, User, NFTTicket } = require('../models/index.model');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');

class PurchaseService {
    /**
     * Create a new purchase
     */
    static async createPurchase(purchaseData) {
        const transaction = await sequelize.transaction();

        try {
            const { userId, eventId, ticketId, quantity } = purchaseData;

            // Verify ticket exists and has enough quantity
            const ticket = await Ticket.findByPk(ticketId, {
                include: [{ model: Event, as: 'event' }],
                transaction
            });

            if (!ticket) {
                await transaction.rollback();
                return { success: false, error: 'Ticket not found' };
            }

            if (!ticket.isActive) {
                await transaction.rollback();
                return { success: false, error: 'Ticket is not available for sale' };
            }

            if (ticket.event.status !== 'published') {
                await transaction.rollback();
                return { success: false, error: 'Event is not published' };
            }

            if (ticket.availableQuantity < quantity) {
                await transaction.rollback();
                return { success: false, error: 'Insufficient ticket quantity available' };
            }

            // Check sale dates if set
            const now = new Date();
            if (ticket.saleStartDate && now < ticket.saleStartDate) {
                await transaction.rollback();
                return { success: false, error: 'Ticket sale has not started yet' };
            }

            if (ticket.saleEndDate && now > ticket.saleEndDate) {
                await transaction.rollback();
                return { success: false, error: 'Ticket sale has ended' };
            }

            // Calculate total amount
            const totalAmount = ticket.price * quantity;

            // Create purchase
            const purchase = await Purchase.create({
                userId,
                eventId,
                ticketId,
                quantity,
                totalAmount,
                currency: 'PI',
                paymentStatus: 'pending'
            }, { transaction });

            // Reserve tickets (reduce available quantity)
            await ticket.update({
                availableQuantity: ticket.availableQuantity - quantity,
                soldQuantity: ticket.soldQuantity + quantity
            }, { transaction });

            await transaction.commit();

            logger.info(`Purchase created successfully: ${purchase.id}`);
            return { success: true, purchase };
        } catch (error) {
            await transaction.rollback();
            logger.error('Error creating purchase:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user purchases with pagination
     */
    static async getUserPurchases(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { count, rows: purchases } = await Purchase.findAndCountAll({
                where: { userId },
                include: [
                    {
                        model: Event,
                        as: 'event',
                        attributes: ['id', 'title', 'description', 'startDate', 'endDate', 'location', 'eventImage', 'organizerId'],
                        include: [
                            {
                                model: User,
                                as: 'organizer',
                                attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
                            }
                        ]
                    },
                    {
                        model: Ticket,
                        as: 'ticket',
                        attributes: ['id', 'ticketType', 'price']
                    },
                    {
                        model: NFTTicket,
                        as: 'nftTickets',
                        attributes: ['id', 'tokenId', 'qrCode', 'isUsed', 'metadata', 'createdAt']
                    }
                ],
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            return {
                success: true,
                purchases,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching user purchases:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get purchase by ID
     */
    static async getPurchaseById(purchaseId, userId = null) {
        try {
            const whereClause = { id: purchaseId };
            if (userId) {
                whereClause.userId = userId;
            }

            const purchase = await Purchase.findOne({
                where: whereClause,
                include: [
                    {
                        model: Event,
                        as: 'event',
                        attributes: ['id', 'title', 'description', 'eventDate', 'location', 'eventImage']
                    },
                    {
                        model: Ticket,
                        as: 'ticket',
                        attributes: ['id', 'ticketType', 'price']
                    },
                    {
                        model: User,
                        as: 'buyer',
                        attributes: ['id', 'username', 'email']
                    },
                    {
                        model: NFTTicket,
                        as: 'nftTickets',
                        attributes: ['id', 'tokenId', 'qrCode', 'isUsed', 'metadata', 'createdAt']
                    }
                ]
            });

            if (!purchase) {
                return { success: false, error: 'Purchase not found' };
            }

            return { success: true, purchase };
        } catch (error) {
            logger.error('Error fetching purchase:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update purchase payment status
     */
    static async updatePaymentStatus(purchaseId, paymentStatus, transactionHash = null) {
        try {
            const purchase = await Purchase.findByPk(purchaseId);

            if (!purchase) {
                return { success: false, error: 'Purchase not found' };
            }

            const updateData = { paymentStatus };
            if (transactionHash) {
                updateData.transactionHash = transactionHash;
            }

            await purchase.update(updateData);

            logger.info(`Purchase payment status updated: ${purchaseId} -> ${paymentStatus}`);
            return { success: true, purchase };
        } catch (error) {
            logger.error('Error updating purchase payment status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cancel purchase
     */
    static async cancelPurchase(purchaseId, userId = null) {
        const transaction = await sequelize.transaction();

        try {
            const whereClause = { id: purchaseId };
            if (userId) {
                whereClause.userId = userId;
            }

            const purchase = await Purchase.findOne({
                where: whereClause,
                include: [{ model: Ticket, as: 'ticket' }],
                transaction
            });

            if (!purchase) {
                await transaction.rollback();
                return { success: false, error: 'Purchase not found' };
            }

            if (purchase.paymentStatus === 'completed') {
                await transaction.rollback();
                return { success: false, error: 'Cannot cancel completed purchase' };
            }

            if (purchase.paymentStatus === 'cancelled' || purchase.paymentStatus === 'refunded') {
                await transaction.rollback();
                return { success: false, error: 'Purchase already cancelled' };
            }

            // Update purchase status
            await purchase.update({ paymentStatus: 'cancelled' }, { transaction });

            // Restore ticket availability
            if (purchase.ticket) {
                await purchase.ticket.update({
                    availableQuantity: purchase.ticket.availableQuantity + purchase.quantity,
                    soldQuantity: Math.max(0, purchase.ticket.soldQuantity - purchase.quantity)
                }, { transaction });
            }

            await transaction.commit();

            logger.info(`Purchase cancelled successfully: ${purchaseId}`);
            return { success: true, message: 'Purchase cancelled successfully' };
        } catch (error) {
            await transaction.rollback();
            logger.error('Error cancelling purchase:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get purchase statistics
     */
    static async getPurchaseStats(userId = null) {
        try {
            const whereClause = userId ? { userId } : {};

            const stats = await Purchase.findAll({
                where: whereClause,
                attributes: [
                    'paymentStatus',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount']
                ],
                group: ['paymentStatus'],
                raw: true
            });

            return { success: true, stats };
        } catch (error) {
            logger.error('Error fetching purchase stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get event sales (for event creators)
     */
    static async getEventSales(eventId, creatorUserId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            // First verify the user is the event creator
            const event = await Event.findByPk(eventId);
            if (!event) {
                return { success: false, error: 'Event not found' };
            }

            if (event.organizerId !== creatorUserId) {
                return { success: false, error: 'Unauthorized to view event sales' };
            }

            const { count, rows: sales } = await Purchase.findAndCountAll({
                where: { eventId },
                include: [
                    {
                        model: User,
                        as: 'buyer',
                        attributes: ['id', 'username', 'email']
                    },
                    {
                        model: Ticket,
                        as: 'ticket',
                        attributes: ['id', 'ticketType', 'price']
                    }
                ],
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            return {
                success: true,
                sales,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching event sales:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = PurchaseService;