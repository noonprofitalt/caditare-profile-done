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
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        // Dev mode bypass for mock tokens
        if (process.env.NODE_ENV !== 'production' && authHeader === 'Bearer mock-jwt-token') {
            req.user = {
                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Standard test UUID
                name: 'Test Admin',
                email: 'admin@example.com',
                role: 'admin',
            };
            return next();
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
        const decoded = jwt.verify(token, secret) as any;

        // Attach user to request
        req.user = {
            id: decoded.id || decoded.userId,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            avatar: decoded.avatar,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(500).json({ error: 'Authentication error' });
    }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
            const decoded = jwt.verify(token, secret) as any;

            req.user = {
                id: decoded.id || decoded.userId,
                name: decoded.name,
                email: decoded.email,
                role: decoded.role,
                avatar: decoded.avatar,
            };
        }

        next();
    } catch (error) {
        // Ignore errors for optional auth
        next();
    }
};

// Role-based access control middleware
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

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
