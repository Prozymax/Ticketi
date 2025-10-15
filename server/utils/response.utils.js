const { logger } = require('./logger');

/**
 * Standardized API response utility
 */
class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200, extra) {
        const response = {
            success: true,
            status: statusCode,
            message,
            data,
            [extra]: extra,
            timestamp: new Date().toISOString()
        };

        logger.info('API Success Response', {
            status: statusCode,
            message,
            path: res.req?.path,
            method: res.req?.method
        });

        return res.status(statusCode).json(response);
    }

    static error(res, message = 'Internal Server Error', statusCode = 500, errors = null, extra) {
        const response = {
            success: false,
            status: statusCode,
            message,
            errors,
            [extra]: extra,
            timestamp: new Date().toISOString()
        };

        logger.error('API Error Response', {
            status: statusCode,
            message,
            errors,
            path: res.req?.path,
            method: res.req?.method
        });

        return res.status(statusCode).json(response);
    }

    static validation(res, errors, message = 'Validation failed') {
        return this.error(res, message, 400, errors);
    }

    static unauthorized(res, message = 'Unauthorized access') {
        return this.error(res, message, 401);
    }

    static forbidden(res, message = 'Access forbidden') {
        return this.error(res, message, 403);
    }

    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    static conflict(res, message = 'Resource conflict') {
        return this.error(res, message, 409);
    }

    static tooManyRequests(res, message = 'Too many requests') {
        return this.error(res, message, 429);
    }

    static serverError(res, message = 'Internal server error') {
        return this.error(res, message, 500);
    }
}

module.exports = { ApiResponse };