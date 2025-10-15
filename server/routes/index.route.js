const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// Correct imports
const { authRouter } = require('./auth/auth.route');
const { eventRouter } = require('./event/event.route');
const { purchaseRouter } = require('./purchase/purchase.route');
const { profileRouter } = require('./profile/profile.route');
const { errorHandler } = require('../middleware/error.middleware');
const { handleDatabaseOverflow } = require('../middleware/db.middleware');
// const HealthRouter = require('./health/health.routes')

// Import payment router
const { paymentRouter } = require('./payment/payment.route');

// Mount each route (with /api prefix here)
const apiRoutes = [
    { routes: 'auth', handlers: authRouter },
    { routes: 'events', handlers: eventRouter },
    { routes: 'purchases', handlers: purchaseRouter },
    { routes: 'payment', handlers: paymentRouter },
    { routes: 'profile', handlers: profileRouter }
]

// Mount health routes at root level (not under /api)
// router.use('/health', HealthRouter);

logger.info('Mounting routes............')
apiRoutes.forEach(route => {
    router.use(`/api/${route.routes}`, route.handlers);
    logger.info(`Mounted route: /api/${route.routes}`);
})

// Health check endpoint
// router.get('/health', (req, res) => {
//     res.status(200).json({
//         status: 'healthy',
//         timestamp: new Date().toISOString(),
//         version: process.env.npm_package_version || '1.0.0',
//         environment: process.env.NODE_ENV || 'development'
//     });
// });

// Global error handlers
router.use(errorHandler);
router.use(handleDatabaseOverflow);

module.exports = router;