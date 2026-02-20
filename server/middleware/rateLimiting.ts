import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiting middleware configurations
 * All limiters skip enforcement in development mode to avoid strict validation errors and facilitate testing.
 */

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests', message: 'Please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || req.path === '/api/health' || process.env.NODE_ENV !== 'production',
});

// Strict rate limiter for authentication
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts', message: 'Please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
});

// Message sending rate limiter
export const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Too many messages', message: 'Please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
    validate: { ip: false }
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Too many file uploads', message: 'Please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
    validate: { ip: false }
});

// Channel creation rate limiter
export const channelCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Too many channels created', message: 'Please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
    validate: { ip: false }
});

// Search rate limiter
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many search requests', message: 'Please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
    validate: { ip: false }
});
