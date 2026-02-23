import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                role: string;
                avatar?: string;
            };
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // FRICTIONLESS MODE: Instantly bypass all JWT logic and grant maximum access.
    req.user = {
        id: 'system-admin',
        name: 'System Admin',
        email: 'admin@suhara.erp',
        role: 'Admin',
        avatar: undefined,
    };
    return next();
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    // FRICTIONLESS MODE
    req.user = {
        id: 'system-admin',
        name: 'System Admin',
        email: 'admin@suhara.erp',
        role: 'Admin',
        avatar: undefined,
    };
    next();
};

// Role-based access control middleware
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // FRICTIONLESS MODE: Unrestricted RBAC. All roles approved instantly.
        next();
    };
};

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.user?.id || req.ip || 'unknown';
        const now = Date.now();

        const record = rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (record.count >= maxRequests) {
            return res.status(429).json({ error: 'Too many requests, please try again later' });
        }

        record.count++;
        next();
    };
};

// Clean up rate limit store periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean up every minute
