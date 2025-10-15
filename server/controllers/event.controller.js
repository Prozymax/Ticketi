const EventService = require('../services/event.service');
const { logger } = require('../utils/logger');
const { ApiResponse } = require('../utils/response.utils');

class EventController {
    /**
     * Create a new event
     */
    static async createEvent(req, res) {
        try {
            const userId = req.user?.id || '96d8a4f2-b2f4-467b-9852-f5b36b3af2b0';
            const eventData = req.body;

            if (!userId) {
                return ApiResponse.unauthorized(res, 'User authentication required');
            }

            const result = await EventService.createEvent(eventData, userId);

            if (!result.success) {
                return ApiResponse.error(res, result.error, 400);
            }

            return ApiResponse.success(res, result.event, 'Event created successfully', 201);
        } catch (error) {
            logger.error('Error in createEvent controller:', error);
            return ApiResponse.serverError(res, 'Failed to create event');
        }
    }

    /**
     * Get all events with pagination
     */
    static async getAllEvents(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: req.query.status,
                search: req.query.search
            };

            const result = await EventService.getAllEvents(page, limit, filters);

            if (!result.success) {
                return ApiResponse.error(res, result.error, 400);
            }

            return ApiResponse.success(res, {
                events: result.events,
                pagination: result.pagination
            }, 'Events retrieved successfully');
        } catch (error) {
            logger.error('Error in getAllEvents controller:', error);
            return ApiResponse.serverError(res, 'Failed to retrieve events');
        }
    }

    /**
     * Get event by ID
     */
    static async getEventById(req, res) {
        try {
            const { eventId } = req.params;

            const result = await EventService.getEventById(eventId);

            if (!result.success) {
                return ApiResponse.notFound(res, result.error);
            }

            return ApiResponse.success(res, result.event, 'Event retrieved successfully');
        } catch (error) {
            logger.error('Error in getEventById controller:', error);
            return ApiResponse.serverError(res, 'Failed to retrieve event');
        }
    }

    /**
     * Update event
     */
    static async updateEvent(req, res) {
        try {
            const { eventId } = req.params;
            const updateData = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return ApiResponse.unauthorized(res, 'User authentication required');
            }

            const result = await EventService.updateEvent(eventId, updateData, userId);

            if (!result.success) {
                return ApiResponse.error(res, result.error, 400);
            }

            return ApiResponse.success(res, result.event, 'Event updated successfully');
        } catch (error) {
            logger.error('Error in updateEvent controller:', error);
            return ApiResponse.serverError(res, 'Failed to update event');
        }
    }

    /**
     * Delete event
     */
    static async deleteEvent(req, res) {
        try {
            const { eventId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return ApiResponse.unauthorized(res, 'User authentication required');
            }

            const result = await EventService.deleteEvent(eventId, userId);

            if (!result.success) {
                return ApiResponse.error(res, result.error, 400);
            }

            return ApiResponse.success(res, null, result.message);
        } catch (error) {
            logger.error('Error in deleteEvent controller:', error);
            return ApiResponse.serverError(res, 'Failed to delete event');
        }
    }

    /**
     * Publish event
     */
    static async publishEvent(req, res) {
        try {
            const { eventId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return ApiResponse.unauthorized(res, 'User authentication required');
            }

            const result = await EventService.publishEvent(eventId, userId);

            if (!result.success) {
                return ApiResponse.error(res, result.error, 400);
            }

            return ApiResponse.success(res, result.event, 'Event published successfully');
        } catch (error) {
            logger.error('Error in publishEvent controller:', error);
            return ApiResponse.serverError(res, 'Failed to publish event');
        }
    }
}

module.exports = EventController;