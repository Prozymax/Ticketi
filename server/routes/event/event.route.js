const express = require('express');
const router = express.Router();
const EventController = require('../../controllers/event.controller');
const TicketController = require('../../controllers/ticket.controller');
const PurchaseController = require('../../controllers/purchase.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { uploadSingle } = require('../../middleware/upload.middleware');

// Event routes
router.post('/', authenticateToken, uploadSingle('eventImage'), EventController.createEvent);
router.get('/', EventController.getAllEvents);
router.get('/my', authenticateToken, EventController.getMyEvents);
router.get('/near', EventController.getEventsNearLocation);
router.get('/trending', EventController.getTrendingEvents);
router.get('/world', EventController.getEventsAroundWorld);
router.get('/:eventId', EventController.getEventById);
router.put('/:eventId', authenticateToken, uploadSingle('eventImage'), EventController.updateEvent);
router.delete('/:eventId', authenticateToken, EventController.deleteEvent);
router.post('/:eventId/publish', authenticateToken, EventController.publishEvent);
router.post('/admin/check-completions', authenticateToken, EventController.checkEventCompletions);

// Ticket routes
router.post('/:eventId/tickets', authenticateToken, TicketController.createTickets);
router.get('/:eventId/tickets', authenticateToken, TicketController.getEventTickets);
router.get('/tickets/:ticketId/availability', authenticateToken, TicketController.checkAvailability);

// Purchase routes
router.post('/tickets/:ticketId/purchase', authenticateToken, PurchaseController.createPurchase);
router.patch('/purchases/:purchaseId/payment-status', authenticateToken, PurchaseController.updatePaymentStatus);
router.get('/:eventId/sales', authenticateToken, PurchaseController.getEventSales);

module.exports = { eventRouter: router };