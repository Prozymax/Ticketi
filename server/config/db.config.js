class DatabaseManager {
    constructor() {
        require('dotenv').config()
        this.Sequelize = require('sequelize').Sequelize;
        this.DataTypes = require('sequelize').DataTypes;
        this.os = require('os');
        this.environment = process.env.NODE_ENV || 'development';

        this.connectionVariables = () => {
            const variables = {
                devConnectionSetup: { database: process.env.DEV_DB, user: process.env.DEV_USER, password: process.env.DEV_PASSWORD, },
                testConnectionSetup: { database: process.env.TEST_DB, user: process.env.TEST_USER, password: process.env.TEST_PASSWORD, },
                productionConnectionSetup: { database: process.env.PROD_DB, user: process.env.PROD_USER, password: process.env.PROD_PASSWORD, }
            },

                expected_variable =
                    this.environment === 'development' ? variables?.devConnectionSetup :
                        this.environment === 'test' ? variables?.testConnectionSetup :
                            this.environment === 'production' ? variables?.productionConnectionSetup :
                                null;

            return {
                database: expected_variable?.database,
                password: expected_variable?.password,
                user: expected_variable?.user
            }
        }

        const { database, user, password } = this.connectionVariables()

        this.sequelize = new this.Sequelize(database, user, password,
            {
                host: process.env.NODE_ENV === 'production' ? process.env.PROD_HOST : process.env.DEV_HOST || process.env.TEST_HOST,
                dialect: process.env.DEV_DIALECT,
                logging: process.env.NODE_ENV === 'production' ? false : console.log,
                pool: {
                    max: process.env.NODE_ENV === 'production' ? 20 : 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },

                // Additional Optimization Settings
                dialectOptions: {
                    connectTimeout: 10000, // 10 seconds connection timeout
                    // SSL options for secure connections
                    ssl: process.env.NODE_ENV === 'production' ? {
                        rejectUnauthorized: true
                    } : false
                },

                // Retry Strategy
                retry: {
                    max: 3, // Maximum number of connection retry attempts
                    backoffBase: 1000, // Initial backoff delay in ms
                    backoffExponent: 1.5 // Exponential backoff factor
                }
            });

        // Error Handling
        this.sequelize.addHook('afterConnect', this.logConnectionInfo.bind(this));
        this.sequelize.addHook('afterDisconnect', this.logDisconnectionInfo.bind(this));

        // Connection Monitoring
        this.connectionMonitor = null;
    }

    initialize = async (models) => {
        try {
            await this.connect();
            await this.preventConnectionOverflow();
            this.syncDatabase(models);
            console.log('Database connection initialized successfully.');
            return this.sequelize;
        } catch (error) {
            console.error('Error initializing database connection:', error);
            throw error;
        }
    }

    // Establish Connection
    async connect() {
        try {
            await this.sequelize.authenticate();
            console.log('Database connection established successfully.');
            this.startConnectionMonitoring();
            return this.sequelize;
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            this.handleConnectionError(error);
            throw error;
        }
    }

    // Log Connection Information
    logConnectionInfo(connection) {
        console.log(`New database connection established at ${new Date().toISOString()}`);
    }

    // Log Disconnection Information
    logDisconnectionInfo() {
        console.log(`Database connection closed at ${new Date().toISOString()}`);
    }

    // Handle Connection Errors
    handleConnectionError(error) {
        // Implement advanced error handling
        if (error.name === 'SequelizeConnectionError') {
            // Specific handling for connection errors
            console.error('Connection Error: Check network, credentials, or database availability');
        }
    }

    // Start Connection Monitoring - FIXED
    startConnectionMonitoring() {
        // Only enable monitoring in development
        if (this.environment !== 'development') return;

        this.connectionMonitor = setInterval(() => {
            try {
                const pool = this.sequelize.connectionManager.pool;
                if (pool) {
                    console.log('Connection Pool Status:', {
                        total: pool.size || 0,
                        idle: pool.available?.length || 0,
                        used: (pool.size || 0) - (pool.available?.length || 0),
                        pending: pool.pending || 0,
                        maxSize: pool.max || this.sequelize.options.pool.max
                    });
                }
            } catch (error) {
                console.error('Error monitoring connection pool:', error);
            }
        }, 300000); // Check every 5 minutes instead of 1 minute
    }

    // Graceful Shutdown
    async close() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
        }

        try {
            await this.sequelize.close();
            console.log('Database connection closed gracefully.');
        } catch (error) {
            console.error('Error during database connection closure:', error);
        }
    }

    async preventConnectionOverflow() {
        const maxConnections = Math.max(this.os.cpus().length * 2, 10);
        const IDLE_TIMEOUT_MS = 60000; // 1 minute in milliseconds

        try {
            const pool = this.sequelize.connectionManager.pool;
            if (!pool) {
                console.log('Connection pool not initialized yet');
                return { status: 200, success: true, message: 'Connection pool not initialized' };
            }

            // Use pool properties directly
            const currentConnections = pool.size || 0;

            if (currentConnections >= maxConnections * 0.9) {
                // Get idle connections
                const idleConnections = pool.available || [];

                // Close idle connections that exceed the timeout
                const currentTime = Date.now();
                let closedCount = 0;

                for (const conn of idleConnections) {
                    if (conn.lastIdle && (currentTime - conn.lastIdle >= IDLE_TIMEOUT_MS)) {
                        try {
                            await pool.destroy(conn);
                            closedCount++;
                        } catch (err) {
                            console.error('Error closing idle connection:', err);
                        }
                    }
                }

                console.log(`Closed ${closedCount} idle connections`);

                // Recheck connection count
                const updatedConnections = pool.size || 0;
                if (updatedConnections >= maxConnections * 0.9) {
                    return {
                        status: 503,
                        success: false,
                        message: 'Database is currently at capacity. Please try again later.',
                        shouldRetry: true,
                        retryAfter: 30
                    };
                }
            }

            return {
                status: 200,
                success: true,
                message: 'Connection available'
            };
        } catch (error) {
            console.error('Error in preventConnectionOverflow:', error);
            return {
                status: 500,
                success: false,
                message: 'Error checking connection availability',
                error: error.message
            };
        }
    }

    async syncDatabase(models) {
        let response = {
            status: null,
            error: null
        };

        try {
            // Import all models if not provided
            if (!models) {
                models = require('../models/index.model');
            }

            // Get all model table names
            const modelTableNames = Object.values(models)
                .filter(model => typeof model.getTableName === 'function')
                .map(model => model.getTableName());

            const tables = await this.sequelize.getQueryInterface().showAllTables();

            // Check if all model tables exist
            const tablesExist = modelTableNames.every((tableName) => tables.includes(tableName));

            if (tablesExist) {
                console.log('All tables exist. Syncing with force: false.');
                // await this.sequelize.sync({ alter: true });
                response.status = false; // Indicates soft sync  
                response.error = 'Database is up-to-date';
                console.log('Database already synced');
            } else {
                console.log('Some tables are missing. Syncing with force: true.');
                await this.sequelize.sync({ force: true });
                response.status = true; // Indicates force sync  
                console.log('Database forcefully synced');
            }
        } catch (error) {
            console.log('Error syncing Database:', error.message);
            console.error(error)
            response.error = error.message; // Store the error message  
        }

        return response; // Return the response object with status and error  
    }
}

// Singleton export
const dbManager = new DatabaseManager();
const sequelize = dbManager.sequelize;

module.exports = { sequelize, dbManager };