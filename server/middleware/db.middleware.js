const { dbManager } = require("../config/db.config");
const { logger } = require("../utils/logger");

const handleDatabaseOverflow = async (err, req, res, next) => {
    try {
        const { status, success, message, error, shouldRetry, retryAfter } = await dbManager.preventConnectionOverflow();
        if (status == 503) {
            logger.error(`Database connection overflow: ${message}`);
            return res.status(503).json({
                success: false,
                message: `Database connection overflow. Please try again later in ${retryAfter} seconds`,
                error: error,
            });
        }
        if (!success) {
            logger.error(`Database connection overflow: ${message}`);
            return res.status(503).json({
                success: false,
                message: "Database connection overflow. Please try again later",
            });
        }
    }
    catch (error) {
        logger.error(`Database connection overflow: ${error.message}`);
        return res.status(503).json({
            success: false,
            message: "Database connection overflow. Please try again later",
            error: error.message
        });
    }
    next();
}

module.exports = {
    handleDatabaseOverflow
};