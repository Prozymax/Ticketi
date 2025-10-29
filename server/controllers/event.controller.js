const eventService = require('../services/event.service');
const { ApiResponse } = require('../utils/response.utils');

class EventController {
  createEvent = async (req, res) => {
    try {
      console.log('Create Event - Request body:', JSON.stringify(req.body, null, 2));
      console.log('Create Event - Uploaded file:', req.uploadedFile);
      console.log('Create Event - File object:', req.file);

      const event = await eventService.createEvent(req.body, req.user.id, req.uploadedFile);
      console.log(event)
      if (!event) return ApiResponse.error(res, 'Error creating event', 500);
      if (event.error) {
        console.error(event.message);
        return ApiResponse.error(res, 'Error creating event', 500);
      }
      if (!event.event) {
        return ApiResponse.error(res, 'Error creating event', 500);
      }

      return ApiResponse.success(res, event, 'Success', 201);
    }
    catch (error) {
      console.error(error);
      return ApiResponse.error(res, 'Error creating event', 500);
    }
  }

  getAllEvents = async (req, res) => {
    const { page, limit } = req.query;
    let pageNumber = page || 1, limitNumber = limit || 10;
    const eventsResponse = await eventService.getPublishedEvents(pageNumber, limitNumber);

    if (!eventsResponse || !eventsResponse || eventsResponse.error) {
      return ApiResponse.error(res, eventsResponse.error || 'Error getting events', 500);
    }
    return ApiResponse.success(res, eventsResponse.events, 'Success', 200);
  }

  getEventById = async (req, res) => {
    const { eventId } = req.params; console.log(req.params)
    const eventResponse = await eventService.getEventById(eventId);

    if (!eventResponse || !eventResponse || eventResponse.error) {
      return ApiResponse.error(res, eventResponse.message || 'Error getting event', 500);
    }
    return ApiResponse.success(res, eventResponse.event, 'Success', 200);
  }

  updateEvent = async (req, res) => {
    try {
      const updateData = req.body, organizerId = req.user.id, eventId = req.params.eventId;
      const updatedEvent = await eventService.updateEvent(eventId, updateData, organizerId, req.uploadedFile)

      if (!updatedEvent || updatedEvent.error) {
        return ApiResponse.error(res, updatedEvent.message || 'Error updating event', 500);
      }
      return ApiResponse.success(res, updatedEvent.event, 'Success', 200);
    }
    catch (error) {
      console.error(error);
      return ApiResponse.error(res, 'Error updating event', 500);
    }
  }

  deleteEvent = async (req, res) => {
    const { eventId, organizerId } = req.params;
    const eventResponse = await eventService.deleteEvent(eventId, organizerId);

    if (!eventResponse || !eventResponse || eventResponse.error) {
      return ApiResponse.error(res, eventResponse.error || 'Error deleting event', 500);
    }
    return ApiResponse.success(res, eventResponse.event, 'Success', 200);
  }

  publishEvent = async (req, res) => {
    const { eventId } = req.params, organizerId = req.user.id;
    const eventResponse = await eventService.publishEvent(eventId, organizerId);

    if (!eventResponse || !eventResponse || eventResponse.error) {
      return ApiResponse.error(res, eventResponse.error || 'Error publishing event', 500);
    }
    return ApiResponse.success(res, eventResponse.event, 'Success', 200);
  }

  getMyEvents = async (req, res) => {
    const { id } = req.user;
    const eventsResponse = await eventService.getMyEvents(id);
    if (!eventsResponse || !eventsResponse || eventsResponse.error) {
      return ApiResponse.error(res, eventsResponse.error || 'Error getting events', 500);
    }
    return ApiResponse.success(res, eventsResponse.events, 'Success', 200);
  }

  getEventsNearLocation = async (req, res) => {
    const { location, page, limit } = req.query;
    let pageNumber = page || 1, limitNumber = limit || 10;

    console.log('Controller - Location parameter received:', location);

    if (!location) {
      return ApiResponse.error(res, 'Location parameter is required', 400);
    }

    const eventsResponse = await eventService.getEventsNearLocation(location, pageNumber, limitNumber);

    if (!eventsResponse || eventsResponse.error) {
      return ApiResponse.error(res, eventsResponse.error || 'Error getting events near location', 500);
    }
    return ApiResponse.success(res, eventsResponse.events, 'Success', 200);
  }

  getTrendingEvents = async (req, res) => {
    const { page, limit } = req.query;
    let pageNumber = page || 1, limitNumber = limit || 10;
    const eventsResponse = await eventService.getTrendingEvents(pageNumber, limitNumber);

    if (!eventsResponse || eventsResponse.error) {
      return ApiResponse.error(res, eventsResponse.error || 'Error getting trending events', 500);
    }
    return ApiResponse.success(res, eventsResponse.events, 'Success', 200);
  }

  getEventsAroundWorld = async (req, res) => {
    const { page, limit } = req.query;
    let pageNumber = page || 1, limitNumber = limit || 10;
    const eventsResponse = await eventService.getEventsAroundWorld(pageNumber, limitNumber);

    if (!eventsResponse || eventsResponse.error) {
      return ApiResponse.error(res, eventsResponse.error || 'Error getting events around world', 500);
    }
    return ApiResponse.success(res, eventsResponse.events, 'Success', 200);
  }

  checkEventCompletions = async (req, res) => {
    try {
      const EventScheduler = require('../services/event.scheduler');
      const result = await EventScheduler.manualCheck();

      if (result.success) {
        return ApiResponse.success(res, result, 'Event completion check completed successfully', 200);
      } else {
        return ApiResponse.error(res, result.error || 'Error checking event completions', 500);
      }
    } catch (error) {
      console.error('Error in checkEventCompletions:', error);
      return ApiResponse.error(res, 'Error checking event completions', 500);
    }
  }
}

module.exports = new EventController();