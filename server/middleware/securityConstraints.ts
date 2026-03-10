import { Request, Response, NextFunction } from 'express';
import { SecurityConfigService } from '../services/securityConfigService';
import { SessionService } from '../services/sessionService';

export const securityConstraints = (req: Request, res: Response, next: NextFunction) => {
    // 0. Check if session has been forcefully revoked by an admin
    if (SessionService.isRevoked(req)) {
        res.status(401).json({ error: 'Your session has been revoked by an administrator.' });
        return;
    }

    // Passively track the request for the Active Sessions dashboard
    SessionService.trackRequest(req);

    // 1. Admin Exception: Admins bypass all restrictions
    if (req.user && req.user.role === 'Admin') {
        return next();
    }

    // --- The following checks only apply to standard Staff ---

    const config = SecurityConfigService.getConfig();
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentHour = now.getHours(); // 0 to 23
    const currentMinute = now.getMinutes();

    // Convert current time to a comparable number like 8.5 for 8:30
    const currentTimeVal = currentHour + (currentMinute / 60);

    // Parse start and end times dynamically
    const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h + (m / 60);
    };

    const startVal = parseTime(config.workStartTime);
    const endVal = parseTime(config.workEndTime);

    // 2. IP Restriction: Ensure they are on the office network
    const officeIp = config.officeIp;
    const incomingIp = req.ip?.replace('::ffff:', '') || 'unknown';

    // If an Office IP is explicitly configured, enforce it
    if (officeIp && officeIp.trim() !== '') {
        // Special developer allowance to prevent bricking localhost
        if (incomingIp !== '127.0.0.1' && incomingIp !== '::1' && incomingIp !== 'localhost') {
            if (incomingIp !== officeIp) {
                res.status(403).json({ error: 'System is only accessible from the authorized office network.' });
                return;
            }
        }
    }

    // 3. Block if it's Sunday (0) and Sunday blocking is enabled
    if (dayOfWeek === 0 && config.blockSundays) {
        res.status(403).json({ error: 'System is not accessible on Sundays.' });
        return;
    }

    // 4. Block if time is outside of operational hours
    if (currentTimeVal < startVal || currentTimeVal >= endVal) {
        res.status(403).json({ error: `System is only accessible between ${config.workStartTime} and ${config.workEndTime}.` });
        return;
    }

    // If they pass all checks, let them proceed!
    next();
};
