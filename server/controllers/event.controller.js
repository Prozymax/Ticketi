const eventService = require('../services/event.service');
const { ApiResponse } = require('../utils/response.utils');

class EventController {
  createEvent = async (req, res) => {
    return ApiResponse.success(res, { message: 'Event created' }, 'Success', 201);
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
    const { id } = req.params;
    const eventResponse = await eventService.getEventById(id);

    if (!eventResponse || !eventResponse || eventResponse.error) {
      return ApiResponse.error(res, eventResponse.error || 'Error getting event', 500);
    }
    return ApiResponse.success(res, eventResponse.event, 'Success', 200);
  }

  updateEvent = async (req, res) => {
    try {
      const { eventId, organizerId, updateData } = request.body;
      const updatedEvent = await eventService.updateEvent(eventId, updateData, organizerId)

      if (!updatedEvent || updatedEvent.error) {
        return ApiResponse.error(res, 'Error updating event', 500);
      }
      return ApiResponse.success(res, updatedEvent.event, 'Success', 200);
    }
    catch(error) {
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
    const { eventId, organizerId } = req.params;
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
}

module.exports = new EventController();