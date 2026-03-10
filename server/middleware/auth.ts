import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SessionService } from '../services/sessionService';

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
    // 1. Check for token in header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Test Environment Bypass
    if (process.env.NODE_ENV === 'test' && token === 'mock-jwt-token') {
        req.user = {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'Test Admin',
            email: 'admin@caditare.erp',
            role: 'Admin'
        };
        return next();
    }

    // 3. JWT Blacklisting Verification
    if (SessionService.isTokenBlacklisted(token)) {
        return res.status(401).json({ error: 'This authentication token has been permanently revoked.' });
    }

    // 3. Verify Token Signature
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('FATAL: JWT_SECRET environment variable is not set.');
            return res.status(500).json({ error: 'Server configuration error.' });
        }
        const decoded = jwt.verify(token, secret) as any;

        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            avatar: decoded.avatar,
        };

        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        // Test Environment Bypass
        if (process.env.NODE_ENV === 'test' && token === 'mock-jwt-token') {
            req.user = {
                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                name: 'Test Admin',
                email: 'admin@caditare.erp',
                role: 'Admin'
            };
            return next();
        }

        if (!SessionService.isTokenBlacklisted(token)) {
            try {
                const secret = process.env.JWT_SECRET;
                if (!secret) return next(); // Skip optional auth if not configured
                const decoded = jwt.verify(token, secret) as any;
                req.user = {
                    id: decoded.id,
                    name: decoded.name,
                    email: decoded.email,
                    role: decoded.role,
                    avatar: decoded.avatar,
                };
            } catch (e) {
                // Ignore errors since it's optional auth
            }
        }
    }
    next();
};

// Role-based access control middleware
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // 1. Ensure user is authenticated (req.user should be populated by authMiddleware)
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // 2. Check if the user's role is in the list of allowed roles
        // We also allow 'Admin' to bypass if they are not explicitly listed but need access
        // (Though usually you'd list 'Admin' if you want them to have access)
        const hasPermission = roles.includes(req.user.role) || req.user.role === 'Admin';

        if (!hasPermission) {
            console.warn(`Access denied for user ${req.user.email} (Role: ${req.user.role}). Required roles: ${roles.join(', ')}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have the required permissions to perform this action.'
            });
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
