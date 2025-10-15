const express = require('express');
const router = express.Router();
const EventController = require('../../controllers/event.controller');
const TicketController = require('../../controllers/ticket.controller');
const PurchaseController = require('../../controllers/purchase.controller');
const { authenticateToken, optionalAuth } = require('../../middleware/auth.middleware');

// Event routes
router.post('/', EventController.createEvent);
router.get('/', optionalAuth, EventController.getAllEvents);
router.get('/:eventId', optionalAuth, EventController.getEventById);
router.put('/:eventId', authenticateToken, EventController.updateEvent);
router.delete('/:eventId', authenticateToken, EventController.deleteEvent);
router.post('/:eventId/publish', authenticateToken, EventController.publishEvent);

// Ticket routes
router.post('/:eventId/tickets', authenticateToken, TicketController.createTickets);
router.get('/:eventId/tickets', optionalAuth, TicketController.getEventTickets);
router.get('/tickets/:ticketId/availability', optionalAuth, TicketController.checkAvailability);

// Purchase routes
router.post('/tickets/:ticketId/purchase', authenticateToken, PurchaseController.createPurchase);
router.patch('/purchases/:purchaseId/payment-status', authenticateToken, PurchaseController.updatePaymentStatus);
router.get('/:eventId/sales', authenticateToken, PurchaseController.getEventSales);

module.exports = { eventRouter: router };