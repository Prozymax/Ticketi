const TicketService = require('../services/ticket.service');
const { logger } = require('../utils/logger');

class TicketController {
    /**
     * Create tickets for an event
     */
    static async createTickets(req, res) {
        try {
            const { eventId } = req.params;
            const ticketData = req.body;
            const userId = req.user.id;

            const result = await TicketService.createTickets(eventId, ticketData, userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(201).json({
                success: true,
                data: result.tickets,
                message: 'Tickets created successfully'
            });
        } catch (error) {
            logger.error('Error in createTickets controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get tickets for an event
     */
    static async getEventTickets(req, res) {
        try {
            const { eventId } = req.params;

            const result = await TicketService.getEventTickets(eventId);

            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result.tickets
            });
        } catch (error) {
            logger.error('Error in getEventTickets controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Check ticket availability
     */
    static async checkAvailability(req, res) {
        try {
            const { ticketId } = req.params;
            const { quantity = 1 } = req.query;

            const result = await TicketService.checkAvailability(ticketId, parseInt(quantity));

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.status(200).json({
                success: true,
                data: result.availability
            });
        } catch (error) {
            logger.error('Error in checkAvailability controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = TicketController;