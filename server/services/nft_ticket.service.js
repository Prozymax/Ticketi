const { NFTTicket, Purchase, Event, User } = require('../models/index.model');
const { logger } = require('../utils/logger');

class NFTTicketService {
    /**
     * Get NFT tickets for a user
     */
    static async getUserNFTTickets(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { count, rows: nftTickets } = await NFTTicket.findAndCountAll({
                include: [
                    {
                        model: Purchase,
                        as: 'purchase',
                        where: { userId },
                        include: [
                            {
                                model: Event,
                                as: 'event',
                                attributes: ['id', 'title', 'startDate', 'endDate', 'location', 'eventImage']
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                success: true,
                nftTickets,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching user NFT tickets:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get NFT ticket by ID
     */
    static async getNFTTicketById(ticketId, userId = null) {
        try {
            const nftTicket = await NFTTicket.findOne({
                where: { id: ticketId },
                include: [
                    {
                        model: Purchase,
                        as: 'purchase',
                        include: [
                            {
                                model: Event,
                                as: 'event'
                            }
                        ]
                    }
                ]
            });

            if (!nftTicket) {
                return { success: false, error: 'NFT ticket not found' };
            }

            if (userId && nftTicket.purchase.userId !== userId) {
                return { success: false, error: 'Unauthorized access' };
            }

            return { success: true, nftTicket };
        } catch (error) {
            logger.error('Error fetching NFT ticket:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = NFTTicketService;