import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Standardized log output
const customFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    return `${timestamp} [${level}]: ${stack || message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // Automatically capture stack traces
        process.env.NODE_ENV === 'production' ? json() : combine(colorize(), customFormat)
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// If you want to log to a file, uncomment this in production
/*
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
    logger.add(new winston.transports.File({ filename: 'combined.log' }));
}
*/
