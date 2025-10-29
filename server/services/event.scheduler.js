const cron = require('node-cron');
const { Op } = require('sequelize');
const Event = require('../models/event/event.model');
const { logger } = require('../utils/logger');

class EventScheduler {
    /**
     * Initialize the event scheduler
     */
    static init() {
        // Run daily at midnight (00:00)
        cron.schedule('0 0 * * *', async () => {
            logger.info('Running daily event status check...');
            await this.checkAndCompleteEvents();
        });

        // Also run on startup to catch any missed events
        this.checkAndCompleteEvents();
        
        logger.info('Event scheduler initialized');
    }

    /**
     * Check for events that should be marked as completed
     */
    static async checkAndCompleteEvents() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

            // Find published events whose start date is today or in the past
            const eventsToComplete = await Event.findAll({
                where: {
                    status: 'published',
                    isPublished: true,
                    startDate: {
                        [Op.lt]: tomorrow // Less than tomorrow (today or earlier)
                    }
                }
            });

            if (eventsToComplete.length === 0) {
                logger.info('No events to mark as completed');
                return;
            }

            // Update events to completed status
            const eventIds = eventsToComplete.map(event => event.id);
            
            await Event.update(
                { status: 'completed' },
                {
                    where: {
                        id: {
                            [Op.in]: eventIds
                        }
                    }
                }
            );

            logger.info(`Marked ${eventsToComplete.length} events as completed:`, {
                eventIds: eventIds,
                eventTitles: eventsToComplete.map(e => e.title)
            });

            return {
                success: true,
                completedCount: eventsToComplete.length,
                events: eventsToComplete.map(e => ({
                    id: e.id,
                    title: e.title,
                    startDate: e.startDate
                }))
            };

        } catch (error) {
            logger.error('Error in checkAndCompleteEvents:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Manually trigger event completion check (for testing)
     */
    static async manualCheck() {
        logger.info('Manual event completion check triggered');
        return await this.checkAndCompleteEvents();
    }
}

module.exports = EventScheduler;