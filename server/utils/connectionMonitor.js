const logger = require('./logger');

class ConnectionMonitor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.monitorInterval = null;
    this.healthCheckInterval = 30000; // 30 seconds
    this.metrics = {
      totalQueries: 0,
      failedQueries: 0,
      avgResponseTime: 0,
      connectionErrors: 0,
      lastHealthCheck: null,
      uptime: Date.now()
    };
  }

  start() {
    logger.info('Starting database connection monitoring...');
    
    // Set up periodic health checks
    this.monitorInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);

    // Monitor query events
    this.setupQueryMonitoring();
    
    logger.info(`Connection monitoring started (interval: ${this.healthCheckInterval}ms)`);
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      logger.info('Connection monitoring stopped');
    }
  }

  async performHealthCheck() {
    const startTime = Date.now();
    
    try {
      await this.sequelize.authenticate();
      const responseTime = Date.now() - startTime;
      
      this.metrics.lastHealthCheck = new Date();
      this.updateAvgResponseTime(responseTime);
      
      // Log slow queries
      if (responseTime > 1000) {
        logger.warn(`Slow health check detected: ${responseTime}ms`);
      }
      
      // Get connection pool stats
      const poolStats = await this.getPoolStats();
      if (poolStats) {
        this.logPoolStats(poolStats);
      }
      
    } catch (error) {
      this.metrics.connectionErrors++;
      logger.error('Database health check failed:', error.message);
      
      // Attempt to reconnect if connection is lost
      this.handleConnectionError(error);
    }
  }

  setupQueryMonitoring() {
    // Monitor successful queries
    this.sequelize.addHook('afterQuery', (options, query) => {
      this.metrics.totalQueries++;
      
      // Log slow queries in production
      if (process.env.NODE_ENV === 'production' && query.executionTime > 5000) {
        logger.warn(`Slow query detected (${query.executionTime}ms):`, {
          sql: options.sql,
          bind: options.bind
        });
      }
    });

    // Monitor failed queries
    this.sequelize.addHook('afterQueryError', (error, options) => {
      this.metrics.failedQueries++;
      logger.error('Query failed:', {
        error: error.message,
        sql: options.sql,
        bind: options.bind
      });
    });
  }

  async getPoolStats() {
    try {
      const pool = this.sequelize.connectionManager.pool;
      return {
        total: pool.size,
        active: pool.used,
        idle: pool.available,
        pending: pool.pending,
        max: pool.options.max,
        min: pool.options.min
      };
    } catch (error) {
      logger.debug('Could not get pool stats:', error.message);
      return null;
    }
  }

  logPoolStats(stats) {
    const utilizationPercent = ((stats.active / stats.max) * 100).toFixed(1);
    
    // Log warning if pool utilization is high
    if (utilizationPercent > 80) {
      logger.warn(`High database pool utilization: ${utilizationPercent}%`, stats);
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Pool stats:', stats);
    }
  }

  updateAvgResponseTime(responseTime) {
    if (this.metrics.avgResponseTime === 0) {
      this.metrics.avgResponseTime = responseTime;
    } else {
      // Simple moving average
      this.metrics.avgResponseTime = (this.metrics.avgResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  handleConnectionError(error) {
    // Check if it's a connection-related error
    const connectionErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'ER_ACCESS_DENIED_ERROR'
    ];

    const isConnectionError = connectionErrors.some(errCode => 
      error.message.includes(errCode) || error.code === errCode
    );

    if (isConnectionError) {
      logger.error('Connection error detected, attempting to reconnect...');
      // Sequelize will handle reconnection automatically with retry configuration
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
      errorRate: this.metrics.totalQueries > 0 
        ? (this.metrics.failedQueries / this.metrics.totalQueries * 100).toFixed(2)
        : 0
    };
  }

  // Method for health check endpoint
  async getHealthStatus() {
    try {
      const startTime = Date.now();
      await this.sequelize.authenticate();
      const responseTime = Date.now() - startTime;
      
      const poolStats = await this.getPoolStats();
      const metrics = this.getMetrics();
      
      return {
        status: 'healthy',
        database: {
          connected: true,
          responseTime: `${responseTime}ms`,
          pool: poolStats,
          metrics
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error.message,
          metrics: this.getMetrics()
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = ConnectionMonitor;