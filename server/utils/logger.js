require('dotenv').config();
const winston = require('winston');
const { format } = winston;
const kleur = require('kleur');
const fs = require('fs');
const path = require('path');

// Define log directory
const logDir = path.join(__dirname, '../../logs');

// Ensure the log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Create Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
        format.json()
    ),
    defaultMeta: {
        service: 'imx-api',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5
        })
    ]
});

// Add console logging only in development
// if (process.env.NODE_ENV === 'development') {
//     logger.add(new winston.transports.Console({
//         format: format.combine(
//             format.colorize(),
//             format.printf(({ timestamp, level, message, metadata }) => {
//                 const meta = metadata && Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
//                 return `${timestamp} [${level}]: ${message} ${meta}`;
//             })
//         )
//     }));
// }

function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, function (key, value) {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]";
            seen.add(value);
        }
        return value;
    }, 2);
}

if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        format: format.printf(({ timestamp, level, message, metadata }) => {
            let color;
            switch (level) {
                case 'error': color = kleur.red; break;
                case 'warn': color = kleur.yellow; break;
                case 'info': color = kleur.green; break;
                case 'debug': color = kleur.blue; break;
                default: color = kleur.white;
            }

            const meta = metadata && Object.keys(metadata).length
                ? kleur.gray(safeStringify(metadata))
                : '';

            return `${kleur.cyan(timestamp)} [${color(level)}]: ${color(message)}`;
            // return `${kleur.cyan(timestamp)} [${color(level)}]: ${color(message)} ${meta}`;
        })
    }));
}

module.exports = { logger, safeStringify };
