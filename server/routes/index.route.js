const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// Correct imports
const { authRouter } = require('./auth/auth.route');
const { eventRouter } = require('./event/event.route');
const { purchaseRouter } = require('./purchase/purchase.route');
const { profileRouter } = require('./profile/profile.route');
const { followRouter } = require('./follow/follow.route');
const { errorHandler } = require('../middleware/error.middleware');
const { handleDatabaseOverflow } = require('../middleware/db.middleware');
const { healthRouter } = require('./health.route');
const { mediaRouter } = require('./media.route');

// Import payment router
const { paymentRouter } = require('./payment/payment.route');

// Import rate limiters
const { createApiLimiter, createAuthLimiter, createPaymentLimiter } = require('../middleware/rate-limit.middleware');

// Create rate limiter instances
const apiLimiter = createApiLimiter();
const authLimiter = createAuthLimiter();
const paymentLimiter = createPaymentLimiter();

// Mount each route (with /api prefix here)
const apiRoutes = [
    { routes: 'auth', handlers: authRouter, limiter: authLimiter },
    { routes: 'events', handlers: eventRouter, limiter: apiLimiter },
    { routes: 'purchases', handlers: purchaseRouter, limiter: apiLimiter },
    { routes: 'payment', handlers: paymentRouter, limiter: paymentLimiter },
    { routes: 'profile', handlers: profileRouter, limiter: apiLimiter },
    { routes: 'follow', handlers: followRouter, limiter: apiLimiter },
    { routes: 'health', handlers: healthRouter, limiter: null }, // No rate limiting for health checks
    { routes: 'media', handlers: mediaRouter, limiter: null } // No rate limiting for media proxy (cached)
]

// Health check endpoint (no rate limiting - bypassed in rate limiter middleware)
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

logger.info('Mounting routes with rate limiting............')
apiRoutes.forEach(route => {
    // Apply rate limiter before the route handler (if limiter is provided)
    if (route.limiter) {
        router.use(`/api/${route.routes}`, route.limiter, route.handlers);
        logger.info(`Mounted route: /api/${route.routes} with rate limiting`);
    } else {
        router.use(`/api/${route.routes}`, route.handlers);
        logger.info(`Mounted route: /api/${route.routes} without rate limiting`);
    }
})

// Global error handlers
router.use(errorHandler);
router.use(handleDatabaseOverflow);

module.exports = router;