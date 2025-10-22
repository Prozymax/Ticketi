const { serverUrl } = require('../config/url.config');
const Event = require('../models/event/event.model');
const { User } = require('../models/index.model');
const { Op } = require('sequelize');

class EventService {
    /**
     * Create a new event
     * @param {Object} eventData 
     * @param {string} organizerId 
     * @returns {Object} created event
     */
    createEvent = async (eventData, organizerId, filename) => {
        try {
            console.log('Creating event with data:', eventData);
            
            // Process and combine date and time fields
            const startDateTime = this.combineDateAndTime(eventData.startDate, eventData.startTime);
            const endDateTime = this.combineDateAndTime(eventData.endDate, eventData.endTime);
            
            // Extract ticket information from ticketTypes array
            const ticketInfo = eventData.ticketTypes && eventData.ticketTypes.length > 0 
                ? eventData.ticketTypes[0] 
                : { price: 0, totalQuantity: 0 };
            
            // Parse price to ensure it's a valid number
            let parsedPrice = 0;
            if (ticketInfo.price !== undefined && ticketInfo.price !== null) {
                if (typeof ticketInfo.price === 'string') {
                    // Remove any non-numeric characters except decimal point
                    const cleanPrice = ticketInfo.price.replace(/[^\d.]/g, '');
                    parsedPrice = parseFloat(cleanPrice) || 0;
                } else {
                    parsedPrice = parseFloat(ticketInfo.price) || 0;
                }
            }
            
            console.log('Parsed ticket info:', { 
                originalPrice: ticketInfo.price, 
                parsedPrice, 
                totalQuantity: ticketInfo.totalQuantity 
            });
            
            // Prepare event data for database
            const dbEventData = {
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                startDate: startDateTime,
                endDate: endDateTime,
                regularTickets: ticketInfo.totalQuantity || 0,
                ticketPrice: parsedPrice,
                organizerId,
                status: 'draft'
            };
            
            console.log('Processed event data for DB:', dbEventData);
            
            const event = await Event.create(dbEventData);

            // Only update eventImage if filename is provided
            if (filename) {
                await event.update({
                    eventImage: `${serverUrl}/uploads/events/${filename}`
                });
            }

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

    // Helper method to combine date and time
    combineDateAndTime = (dateStr, timeStr) => {
        try {
            console.log('Combining date and time:', { dateStr, timeStr });
            
            if (!dateStr) return new Date();
            
            // Parse the date string (handles formats like "Sept 12, 2025")
            const date = new Date(dateStr);
            
            // If timeStr is provided, parse and combine with date
            if (timeStr) {
                // Handle time formats like "09:00GMT", "12:00GMT", etc.
                const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    date.setHours(hours, minutes, 0, 0);
                    console.log('Combined date/time result:', date);
                    return date;
                }
            }
            
            // If no valid time provided, use the date as is
            console.log('Using date as is:', date);
            return date;
        } catch (error) {
            console.error('Error combining date and time:', error);
            return new Date();
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
     * @param {string} filename 
     * @returns {Object} updated event
     */
    updateEvent = async (eventId, updateData, organizerId, filename) => {
        try {
            console.log('Updating event with data:', updateData);
            
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

            // Process the update data similar to create
            const processedUpdateData = {};
            
            // Handle basic fields
            if (updateData.title) processedUpdateData.title = updateData.title;
            if (updateData.description) processedUpdateData.description = updateData.description;
            if (updateData.location) processedUpdateData.location = updateData.location;
            
            // Handle date and time fields
            if (updateData.startDate) {
                processedUpdateData.startDate = this.combineDateAndTime(updateData.startDate, updateData.startTime);
            }
            if (updateData.endDate) {
                processedUpdateData.endDate = this.combineDateAndTime(updateData.endDate, updateData.endTime);
            }
            
            // Handle ticket information
            if (updateData.ticketTypes && updateData.ticketTypes.length > 0) {
                const ticketInfo = updateData.ticketTypes[0];
                processedUpdateData.regularTickets = ticketInfo.totalQuantity || 0;
                
                // Parse price similar to create method
                let parsedPrice = 0;
                if (ticketInfo.price !== undefined && ticketInfo.price !== null) {
                    if (typeof ticketInfo.price === 'string') {
                        const cleanPrice = ticketInfo.price.replace(/[^\d.]/g, '');
                        parsedPrice = parseFloat(cleanPrice) || 0;
                    } else {
                        parsedPrice = parseFloat(ticketInfo.price) || 0;
                    }
                }
                processedUpdateData.ticketPrice = parsedPrice;
            }
            
            // If a new image is uploaded, include it in the update
            if (filename) {
                processedUpdateData.eventImage = `${serverUrl}/${filename}`;
            }

            console.log('Processed update data for DB:', processedUpdateData);
            
            await event.update(processedUpdateData);

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

    /**
     * Get events near a specific location
     * @param {string} userLocation - User's location to search near
     * @param {number} page 
     * @param {number} limit 
     * @returns {Object} events near location
     */
    getEventsNearLocation = async (userLocation, page = 1, limit = 10) => {
        try {
            console.log('Searching for events near location:', userLocation);

            // Clean and validate the location parameter
            const cleanLocation = userLocation ? userLocation.trim() : '';
            if (!cleanLocation || cleanLocation === 'Unknown') {
                console.log('Invalid location, falling back to all events');
                return await this.getPublishedEvents(page, limit);
            }

            const offset = (page - 1) * limit;

            const { count, rows } = await Event.findAndCountAll({
                where: {
                    isPublished: true,
                    status: 'published',
                    location: {
                        [Op.like]: `%${cleanLocation}%`
                    }
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
                message: 'Events near location retrieved successfully',
                events: rows.map(event => event.toJSON()),
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching events near location:', error);

            // Fallback: return all published events if location search fails
            try {
                console.log('Falling back to all published events');
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
                    message: 'Events retrieved successfully (fallback)',
                    events: rows.map(event => event.toJSON()),
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / limit)
                    }
                };
            } catch (fallbackError) {
                console.error('Fallback query also failed:', fallbackError);
                return {
                    error: true,
                    message: 'Failed to fetch events near location',
                    events: [],
                    pagination: null
                };
            }
        }
    }

    /**
     * Get trending events (most tickets sold)
     * @param {number} page 
     * @param {number} limit 
     * @returns {Object} trending events
     */
    getTrendingEvents = async (page = 1, limit = 10) => {
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
                order: [['ticketsSold', 'DESC'], ['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                error: false,
                message: 'Trending events retrieved successfully',
                events: rows.map(event => event.toJSON()),
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching trending events:', error);
            return {
                error: true,
                message: 'Failed to fetch trending events',
                events: [],
                pagination: null
            };
        }
    }

    /**
     * Get events around the world (all published events)
     * @param {number} page 
     * @param {number} limit 
     * @returns {Object} events around the world
     */
    getEventsAroundWorld = async (page = 1, limit = 10) => {
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
                message: 'Events around the world retrieved successfully',
                events: rows.map(event => event.toJSON()),
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching events around the world:', error);
            return {
                error: true,
                message: 'Failed to fetch events around the world',
                events: [],
                pagination: null
            };
        }
    }
}

module.exports = new EventService();