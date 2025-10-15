const { Ticket, Event, Purchase } = require('../models/index.model');
const { logger } = require('../utils/logger');
const { sequelize } = require('../config/db.config');

class TicketService {
    /**
     * Create tickets for an event
     */
    static async createTickets(eventId, ticketsData, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            // Verify event exists and user owns it
            const event = await Event.findByPk(eventId);
            if (!event) {
                await transaction.rollback();
                return { success: false, error: 'Event not found' };
            }

            if (event.createdBy !== userId) {
                await transaction.rollback();
                return { success: false, error: 'Unauthorized to create tickets for this event' };
            }

            const tickets = [];
            
            for (const ticketData of ticketsData) {
                const ticket = await Ticket.create({
                    eventId,
                    ...ticketData,
                    availableQuantity: ticketData.totalQuantity,
                    soldQuantity: 0
                }, { transaction });
                
                tickets.push(ticket);
            }

            await transaction.commit();
            logger.info(`Created ${tickets.length} tickets for event ${eventId}`);
            
            return { success: true, tickets };
        } catch (error) {
            await transaction.rollback();
            logger.error('Error creating tickets:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get tickets for an event
     */
    static async getEventTickets(eventId) {
        try {
            const tickets = await Ticket.findAll({
                where: { 
                    eventId,
                    isActive: true 
                },
                include: [{
                    model: Event,
                    as: 'event',
                    attributes: ['id', 'title', 'status']
                }],
                order: [['price', 'ASC']]
            });

            return { success: true, tickets };
        } catch (error) {
            logger.error('Error fetching event tickets:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get ticket by ID
     */
    static async getTicketById(ticketId) {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [{
                    model: Event,
                    as: 'event'
                }]
            });

            if (!ticket) {
                return { success: false, error: 'Ticket not found' };
            }

            return { success: true, ticket };
        } catch (error) {
            logger.error('Error fetching ticket:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update ticket
     */
    static async updateTicket(ticketId, updateData, userId) {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [{
                    model: Event,
                    as: 'event'
                }]
            });

            if (!ticket) {
                return { success: false, error: 'Ticket not found' };
            }

            // Check if user owns the event
            if (ticket.event.createdBy !== userId) {
                return { success: false, error: 'Unauthorized to update this ticket' };
            }

            // Don't allow reducing total quantity below sold quantity
            if (updateData.totalQuantity && updateData.totalQuantity < ticket.soldQuantity) {
                return { 
                    success: false, 
                    error: 'Cannot reduce total quantity below sold quantity' 
                };
            }

            // Update available quantity if total quantity changes
            if (updateData.totalQuantity) {
                updateData.availableQuantity = updateData.totalQuantity - ticket.soldQuantity;
            }

            await ticket.update(updateData);
            
            return { success: true, ticket };
        } catch (error) {
            logger.error('Error updating ticket:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check ticket availability
     */
    static async checkAvailability(ticketId, quantity = 1) {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [{
                    model: Event,
                    as: 'event'
                }]
            });

            if (!ticket) {
                return { success: false, error: 'Ticket not found' };
            }

            if (!ticket.isActive) {
                return { success: false, error: 'Ticket is not available for sale' };
            }

            if (ticket.event.status !== 'published') {
                return { success: false, error: 'Event is not published' };
            }

            if (ticket.availableQuantity < quantity) {
                return { 
                    success: false, 
                    error: `Only ${ticket.availableQuantity} tickets available` 
                };
            }

            // Check sale dates if set
            const now = new Date();
            if (ticket.saleStartDate && now < ticket.saleStartDate) {
                return { success: false, error: 'Ticket sale has not started yet' };
            }

            if (ticket.saleEndDate && now > ticket.saleEndDate) {
                return { success: false, error: 'Ticket sale has ended' };
            }

            return { 
                success: true, 
                available: true,
                ticket,
                availableQuantity: ticket.availableQuantity
            };
        } catch (error) {
            logger.error('Error checking ticket availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reserve tickets (reduce available quantity)
     */
    static async reserveTickets(ticketId, quantity) {
        const transaction = await sequelize.transaction();
        
        try {
            const ticket = await Ticket.findByPk(ticketId, { transaction });

            if (!ticket) {
                await transaction.rollback();
                return { success: false, error: 'Ticket not found' };
            }

            if (ticket.availableQuantity < quantity) {
                await transaction.rollback();
                return { success: false, error: 'Insufficient tickets available' };
            }

            await ticket.update({
                availableQuantity: ticket.availableQuantity - quantity,
                soldQuantity: ticket.soldQuantity + quantity
            }, { transaction });

            await transaction.commit();
            
            return { success: true, ticket };
        } catch (error) {
            await transaction.rollback();
            logger.error('Error reserving tickets:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Release reserved tickets (in case of payment failure)
     */
    static async releaseTickets(ticketId, quantity) {
        const transaction = await sequelize.transaction();
        
        try {
            const ticket = await Ticket.findByPk(ticketId, { transaction });

            if (!ticket) {
                await transaction.rollback();
                return { success: false, error: 'Ticket not found' };
            }

            await ticket.update({
                availableQuantity: ticket.availableQuantity + quantity,
                soldQuantity: Math.max(0, ticket.soldQuantity - quantity)
            }, { transaction });

            await transaction.commit();
            
            return { success: true, ticket };
        } catch (error) {
            await transaction.rollback();
            logger.error('Error releasing tickets:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = TicketService;