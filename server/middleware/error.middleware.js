const { logger } = require("../utils/logger");


const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
    });

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.details
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(403).json({
            error: 'Database Error',
            message: "Duplicate Email. Email already exists or user data already exists"
        })
    }

    if (err.name === 'ForbiddenError') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Insufficient permissions'
        });
    }

    if (err.name === 'MulterError') {
        return res.status(403).json({
            error: 'Upload Error',
            message: 'Upload limit exceeded'
        })
    }

    console.error('Unhandled error:', err);
    if (err.name === 'NotFoundError') {
        return res.status(404).json({
            error: 'Not Found',
            message: err.message || 'Resource not found'
        });
    }
    // Default error
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong'
    });
};

module.exports = { errorHandler } 