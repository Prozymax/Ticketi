const Event = require('../models/event/event.model');
const { User } = require('../models/index.model');

class EventService {
    /**
     * Create a new event
     * @param {Object} eventData 
     * @param {string} organizerId 
     * @returns {Object} created event
     */
    createEvent = async (eventData, organizerId) => {
        try {
            const event = await Event.create({
                ...eventData,
                organizerId,
                status: 'draft'
            });

            return {
                error: false,
                message: 'Event created successfully',
                event: event.toJSON()
            };
        } catch (error) {
            console.error('Error creating event:', error);
            return {
                error: true,
                message: 'Failed to create event',
                event: null
            };
        }
    }

    /**
     * Get all published events
     * @param {number} page 
     * @param {number} limit 
     * @returns {Object} events list
     */
    getPublishedEvents = async (page = 1, limit = 10) => {
        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await Event.findAndCountAll({
                where: {
                    isPublished: true,
                    status: 'published'
                },
                include: [{
                    model: User,
                    as: 'organizer',
                    attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                error: false,
                message: 'Events retrieved successfully',
                events: rows.map(event => event.toJSON()),
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching published events:', error);
            return {
                error: true,
                message: 'Failed to fetch events',
                events: [],
                pagination: null
            };
        }
    }

    /**
     * Get event by ID
     * @param {string} eventId 
     * @returns {Object} event details
     */
    getEventById = async (eventId) => {
        try {
            const event = await Event.findByPk(eventId, {
                include: [{
                    model: User,
                    as: 'organizer',
                    attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'isVerified']
                }]
            });

            if (!event) {
                return {
                    error: true,
                    message: 'Event not found',
                    event: null
                };
            }

            return {
                error: false,
                message: 'Event retrieved successfully',
                event: event.toJSON()
            };
        } catch (error) {
            console.error('Error fetching event:', error);
            return {
                error: true,
                message: 'Failed to fetch event',
                event: null
            };
        }
    }

    /**
     * Get events by organizer
     * @param {string} organizerId 
     * @param {number} page 
     * @param {number} limit 
     * @returns {Object} organizer events
     */
    getEventsByOrganizer = async (organizerId, page = 1, limit = 10) => {
        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await Event.findAndCountAll({
                where: { organizerId },
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                error: false,
                message: 'Organizer events retrieved successfully',
                events: rows.map(event => event.toJSON()),
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching organizer events:', error);
            return {
                error: true,
                message: 'Failed to fetch organizer events',
                events: [],
                pagination: null
            };
        }
    }

    /**
     * Update event
     * @param {string} eventId 
     * @param {Object} updateData 
     * @param {string} organizerId 
     * @returns {Object} updated event
     */
    updateEvent = async (eventId, updateData, organizerId) => {
        try {
            const event = await Event.findOne({
                where: { id: eventId, organizerId }
            });

            if (!event) {
                return {
                    error: true,
                    message: 'Event not found or unauthorized',
                    event: null
                };
            }

            await event.update(updateData);

            return {
                error: false,
                message: 'Event updated successfully',
                event: event.toJSON()
            };
        } catch (error) {
            console.error('Error updating event:', error);
            return {
                error: true,
                message: 'Failed to update event',
                event: null
            };
        }
    }

    /**
     * Publish event
     * @param {string} eventId 
     * @param {string} organizerId 
     * @returns {Object} published event
     */
    publishEvent = async (eventId, organizerId) => {
        try {
            const event = await Event.findOne({
                where: { id: eventId, organizerId }
            });

            if (!event) {
                return {
                    error: true,
                    message: 'Event not found or unauthorized',
                    event: null
                };
            }

            await event.update({
                isPublished: true,
                status: 'published'
            });

            return {
                error: false,
                message: 'Event published successfully',
                event: event.toJSON()
            };
        } catch (error) {
            console.error('Error publishing event:', error);
            return {
                error: true,
                message: 'Failed to publish event',
                event: null
            };
        }
    }

    /**
     * Delete event
     * @param {string} eventId 
     * @param {string} organizerId 
     * @returns {Object} deletion result
     */
    deleteEvent = async (eventId, organizerId) => {
        try {
            const event = await Event.findOne({
                where: { id: eventId, organizerId }
            });

            if (!event) {
                return {
                    error: true,
                    message: 'Event not found or unauthorized'
                };
            }

            await event.destroy();

            return {
                error: false,
                message: 'Event deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting event:', error);
            return {
                error: true,
                message: 'Failed to delete event'
            };
        }
    }

    getMyEvents = async (userId) => {
        try {
            const events = await Event.findAll({
                where: { organizerId: userId },
                order: [['createdAt', 'DESC']]
            });

            return {
                error: false,
                message: 'My events retrieved successfully',
                events: events.map(event => event.toJSON())
            };
        } catch (error) {
            console.error('Error fetching my events:', error);
            return {
                error: true,
                message: 'Failed to fetch my events',
                events: []
            };
        }
    }
}

module.exports = new EventService();