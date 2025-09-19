const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const logger = require('../utils/logger');

// Security middleware configuration
const securityMiddleware = {
  // Helmet configuration for security headers
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.minepi.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false, // Disable for Pi Network SDK compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // CORS configuration
  cors: cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'https://sandbox.minepi.com',
        'https://api.minepi.com'
      ];

      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Pi-User-Token'
    ],
    maxAge: 86400 // 24 hours
  }),

  // Compression middleware
  compression: compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }),

  // Request logging middleware
  requestLogger: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      if (res.statusCode >= 400) {
        logger.warn('Request completed with error:', logData);
      } else if (duration > 1000) {
        logger.warn('Slow request detected:', logData);
      } else {
        logger.http('Request completed:', logData);
      }
    });

    next();
  },

  // Error handling middleware
  errorHandler: (err, req, res, next) => {
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      error: {
        message: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
      }
    });
  },

  // 404 handler
  notFoundHandler: (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      error: {
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method
      }
    });
  },

  // Request size limiter
  requestSizeLimit: (req, res, next) => {
    const maxSize = process.env.MAX_REQUEST_SIZE || '10mb';
    
    if (req.headers['content-length']) {
      const size = parseInt(req.headers['content-length']);
      const maxBytes = parseSize(maxSize);
      
      if (size > maxBytes) {
        logger.warn(`Request too large: ${size} bytes (max: ${maxBytes})`);
        return res.status(413).json({
          error: {
            message: 'Request entity too large',
            maxSize: maxSize
          }
        });
      }
    }
    
    next();
  },

  // IP whitelist middleware (for admin endpoints)
  ipWhitelist: (whitelist = []) => {
    return (req, res, next) => {
      const clientIp = req.ip;
      
      if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
        logger.warn(`IP not whitelisted: ${clientIp}`);
        return res.status(403).json({
          error: {
            message: 'Access denied'
          }
        });
      }
      
      next();
    };
  }
};

// Helper function to parse size strings
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
}

module.exports = securityMiddleware;