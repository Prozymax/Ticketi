const { Event, Ticket, Purchase, User } = require('../models/index.model');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

class EventService {
    /**
     * Create a new event
     */
    static async createEvent(eventData, userId) {
        try {
            const event = await Event.create({
                ...eventData,
                createdBy: userId,
                status: 'draft'
            });

            logger.info(`Event created successfully: ${event.id}`);
            return { success: true, event };
        } catch (error) {
            logger.error('Error creating event:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all events with pagination
     */
    static async getAllEvents(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const whereClause = { isActive: true };

            // Add filters
            if (filters.status) {
                whereClause.status = filters.status;
            }
            if (filters.search) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${filters.search}%` } },
                    { description: { [Op.like]: `%${filters.search}%` } }
                ];
            }

            const { count, rows: events } = await Event.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'username']
                    },
                    {
                        model: Ticket,
                        as: 'tickets',
                        attributes: ['id', 'ticketType', 'price', 'availableQuantity', 'totalQuantity']
                    }
                ],
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            return {
                success: true,
                events,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching events:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get event by ID
     */
    static async getEventById(eventId) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'username']
                    },
                    {
                        model: Ticket,
                        as: 'tickets'
                    }
                ]
            });

            if (!event) {
                return { success: false, error: 'Event not found' };
            }

            return { success: true, event };
        } catch (error) {
            logger.error('Error fetching event:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update event
     */
    static async updateEvent(eventId, updateData, userId) {
        try {
            const event = await Event.findByPk(eventId);

            if (!event) {
                return { success: false, error: 'Event not found' };
            }

            // Check if user is the creator
            if (event.createdBy !== userId) {
                return { success: false, error: 'Unauthorized to update this event' };
            }

            await event.update(updateData);

            return { success: true, event };
        } catch (error) {
            logger.error('Error updating event:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete event
     */
    static async deleteEvent(eventId, userId) {
        try {
            const event = await Event.findByPk(eventId);

            if (!event) {
                return { success: false, error: 'Event not found' };
            }

            // Check if user is the creator
            if (event.createdBy !== userId) {
                return { success: false, error: 'Unauthorized to delete this event' };
            }

            await event.update({ isActive: false });

            return { success: true, message: 'Event deleted successfully' };
        } catch (error) {
            logger.error('Error deleting event:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Publish event
     */
    static async publishEvent(eventId, userId) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [{ model: Ticket, as: 'tickets' }]
            });

            if (!event) {
                return { success: false, error: 'Event not found' };
            }

            if (event.createdBy !== userId) {
                return { success: false, error: 'Unauthorized to publish this event' };
            }

            // Check if event has tickets
            if (!event.tickets || event.tickets.length === 0) {
                return { success: false, error: 'Event must have at least one ticket type before publishing' };
            }

            await event.update({ status: 'published' });

            return { success: true, event };
        } catch (error) {
            logger.error('Error publishing event:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EventService;