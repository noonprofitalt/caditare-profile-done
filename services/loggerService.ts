/**
 * Logger Service
 * provides a structured way to handle logs and errors across the application.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetaData {
    [key: string]: any;
}

class LoggerService {
    private static isDev = typeof import.meta.env !== 'undefined' ? import.meta.env.DEV : true;

    static log(level: LogLevel, message: string, meta?: LogMetaData) {
        if (!this.isDev && level === 'debug') return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };

        switch (level) {
            case 'error':
                console.error(`[${timestamp}] ERROR: ${message}`, meta || '');
                break;
            case 'warn':
                console.warn(`[${timestamp}] WARN: ${message}`, meta || '');
                break;
            case 'info':
                console.info(`[${timestamp}] INFO: ${message}`, meta || '');
                break;
            default:
                console.log(`[${timestamp}] DEBUG: ${message}`, meta || '');
        }

        // Potential for remote logging integration here
    }

    static error(message: string, error?: any, meta?: LogMetaData) {
        this.log('error', message, { ...meta, error: error instanceof Error ? error.message : error, stack: error?.stack });
    }

    static warn(message: string, meta?: LogMetaData) {
        this.log('warn', message, meta);
    }

    static info(message: string, meta?: LogMetaData) {
        this.log('info', message, meta);
    }

    static debug(message: string, meta?: LogMetaData) {
        this.log('debug', message, meta);
    }
}

export const logger = LoggerService;
