const { serverUrl } = require('../config/url.config');
const Event = require('../models/event/event.model');
const { User } = require('../models/index.model');
const { Op } = require('sequelize');
const cacheService = require('./cache.service');

class EventService {
    /**
     * Create a new event
     * @param {Object} eventData 
     * @param {string} organizerId 
     * @returns {Object} created event
     */
    createEvent = async (eventData, organizerId, fileBuffer, filename, mimetype) => {
        try {
            console.log('Creating event with data:', eventData);

            // Process and combine date and time fields
            const startDateTime = this.combineDateAndTime(eventData.startDate, eventData.startTime);
            const endDateTime = this.combineDateAndTime(eventData.endDate, eventData.endTime);

            // Extract ticket information from ticketTypes array
            let ticketInfo = { price: 0, totalQuantity: 0 };
            if (eventData.ticketTypes) {
                try {
                    const ticketTypes = typeof eventData.ticketTypes === 'string'
                        ? JSON.parse(eventData.ticketTypes)
                        : eventData.ticketTypes;

                    if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
                        ticketInfo = ticketTypes[0];
                    }
                } catch (error) {
                    console.error('Error parsing ticketTypes:', error);
                }
            }

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

            // Upload event image to Filestack if provided
            if (fileBuffer && filename && mimetype) {
                const filestackService = require('./filestack.service');

                const uploadResult = await filestackService.uploadFile(
                    fileBuffer,
                    `event-${event.id}-${filename}`,
                    mimetype
                );

                if (uploadResult.success) {
                    await event.update({
                        eventImage: uploadResult.url
                    });
                } else {
                    console.error('Failed to upload event image to Filestack:', uploadResult.error);
                }
            }

            // Invalidate user event lists cache when user creates an event
            await cacheService.deletePattern(`events:organizer:${organizerId}:*`);
            console.log('Invalidated user event lists cache for organizer:', organizerId);

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

            // Parse the date string (handles both "YYYY-MM-DD" and "Sept 12, 2025" formats)
            const date = new Date(dateStr);

            // If timeStr is provided, parse and combine with date
            if (timeStr) {
                // Handle time formats like "09:00", "12:00", "09:00GMT", "12:00GMT", etc.
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
            // Cache key pattern: events:published:page:{page}
            const cacheKey = `events:published:page:${page}`;

            // Check cache first
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                console.log(`Cache hit for published events page ${page}`);
                return cachedData;
            }

            console.log(`Cache miss for published events page ${page}, fetching from database`);

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

            const result = {
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

            // Store in cache with 300 second TTL (5 minutes)
            await cacheService.set(cacheKey, result, 300);

            return result;
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
            // Cache key pattern: event:{eventId}
            const cacheKey = `event:${eventId}`;

            // Check cache first (cache-aside pattern)
            const cachedEvent = await cacheService.get(cacheKey);
            if (cachedEvent) {
                console.log(`Cache hit for event ${eventId}`);
                return {
                    error: false,
                    message: 'Event retrieved successfully',
                    event: cachedEvent
                };
            }

            console.log(`Cache miss for event ${eventId}, fetching from database`);

            const Ticket = require('../models/ticket/ticket.model');

            const event = await Event.findByPk(eventId, {
                include: [
                    {
                        model: User,
                        as: 'organizer',
                        attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'isVerified']
                    },
                    {
                        model: Ticket,
                        as: 'tickets',
                        where: { isActive: true },
                        required: false
                    }
                ]
            });

            if (!event) {
                return {
                    error: true,
                    message: 'Event not found',
                    event: null
                };
            }

            let currentView = event.dataValues.views == 'string' ? Number(event.dataValues.views) : event.dataValues.views || 0;
            let views = currentView + 1
            console.log('currentView', currentView)
            await event.update({ views })

            const eventData = event.toJSON();

            // Store in cache with 1800 second TTL (30 minutes)
            await cacheService.set(cacheKey, eventData, 1800);

            return {
                error: false,
                message: 'Event retrieved successfully',
                event: eventData
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
            if (updateData.ticketTypes) {
                try {
                    const ticketTypes = typeof updateData.ticketTypes === 'string'
                        ? JSON.parse(updateData.ticketTypes)
                        : updateData.ticketTypes;

                    if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
                        const ticketInfo = ticketTypes[0];
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
                } catch (error) {
                    console.error('Error parsing ticketTypes in update:', error);
                }
            }

            // If a new image is uploaded, include it in the update
            if (filename) {
                processedUpdateData.eventImage = `${serverUrl}/${filename}`;
            }

            console.log('Processed update data for DB:', processedUpdateData);

            await event.update(processedUpdateData);

            // Invalidate cache for specific event
            const eventCacheKey = `event:${eventId}`;
            await cacheService.del(eventCacheKey);
            console.log(`Cache invalidated for event ${eventId}`);

            // Invalidate user event lists cache when user updates an event
            await cacheService.deletePattern(`events:organizer:${organizerId}:*`);
            console.log('Invalidated user event lists cache for organizer:', organizerId);

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
     * Publish event (only if payment is completed)
     * @param {string} eventId 
     * @param {string} organizerId 
     * @returns {Object} published event
     */
    publishEvent = async (eventId, organizerId) => {
        try {
            console.log('=== PublishEvent Called ===');
            console.log('EventId:', eventId);
            console.log('OrganizerId:', organizerId);

            const Ticket = require('../models/ticket/ticket.model');

            const event = await Event.findOne({
                where: { id: eventId, organizerId }
            });

            console.log('Event found:', !!event);
            console.log('Event details:', event ? { id: event.id, title: event.title, status: event.status } : null);

            if (!event) {
                return {
                    error: true,
                    message: 'Event not found or unauthorized',
                    event: null
                };
            }

            // Note: Payment verification is not needed here because this method
            // is only called from the payment completion callback after Pi Network
            // has already verified the payment. The payment record is created
            // in the controller BEFORE this method is called.

            console.log('=== Publishing event ===');
            // Update event status to published (don't create duplicate)
            await event.update({
                isPublished: true,
                status: 'published'
            });

            console.log('Event updated, creating tickets...');
            // Create ticket entries for the event
            await this.createEventTickets(event);

            // Invalidate event cache and related list caches
            const eventCacheKey = `event:${eventId}`;
            await cacheService.del(eventCacheKey);

            // Invalidate all event list caches (published, trending, location-based)
            await cacheService.deletePattern('events:published:*');
            await cacheService.deletePattern('events:trending:*');
            await cacheService.deletePattern('events:location:*');

            console.log(`Cache invalidated for event ${eventId} and related list caches`);

            console.log('=== Event published successfully ===');
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
     * Create ticket entries for published event
     * @param {Object} event 
     */
    createEventTickets = async (event) => {
        try {
            const Ticket = require('../models/ticket/ticket.model');

            // Create ticket entry based on event data
            await Ticket.create({
                eventId: event.id,
                ticketType: 'regular',
                price: event.ticketPrice,
                currency: 'PI',
                totalQuantity: event.regularTickets,
                availableQuantity: event.regularTickets,
                soldQuantity: 0,
                isActive: true,
                saleStartDate: new Date(),
                saleEndDate: event.startDate
            });

            console.log(`Tickets created for event ${event.id}`);
        } catch (error) {
            console.error('Error creating event tickets:', error);
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

            // Invalidate all related cache entries
            const eventCacheKey = `event:${eventId}`;
            await cacheService.del(eventCacheKey);

            // Invalidate all event list caches
            await cacheService.deletePattern('events:published:*');
            await cacheService.deletePattern('events:trending:*');
            await cacheService.deletePattern('events:location:*');

            console.log(`Cache invalidated for deleted event ${eventId} and related list caches`);

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

            // Cache key pattern: events:location:{location}:page:{page}
            const cacheKey = `events:location:${cleanLocation}:page:${page}`;

            // Check cache first
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                console.log(`Cache hit for events near ${cleanLocation} page ${page}`);
                return cachedData;
            }

            console.log(`Cache miss for events near ${cleanLocation} page ${page}, fetching from database`);

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

            const result = {
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

            // Store in cache with 300 second TTL (5 minutes)
            await cacheService.set(cacheKey, result, 300);

            return result;
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
            // Cache key pattern: events:trending:page:{page}
            const cacheKey = `events:trending:page:${page}`;

            // Check cache first
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                console.log(`Cache hit for trending events page ${page}`);
                return cachedData;
            }

            console.log(`Cache miss for trending events page ${page}, fetching from database`);

            const offset = (page - 1) * limit;

            const { count, rows } = await Event.findAndCountAll({
                where: {
                    isPublished: true,
                    status: 'published'
                },
                include: [{
                    model: User,
                    as: 'organizer',
                    attributes: ['id', 'profileImage', 'username']
                }],
                order: [['views', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const result = {
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

            // Store in cache with 600 second TTL (10 minutes)
            await cacheService.set(cacheKey, result, 600);

            return result;
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