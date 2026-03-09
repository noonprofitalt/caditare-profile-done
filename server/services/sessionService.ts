import { Request } from 'express';
// @ts-ignore
import geoip from 'geoip-lite';
import { SessionStore, ActiveSession } from './sessionStore';
import { getIO } from '../socket/chatSocket';
import { query } from '../database';
import { SecurityConfigService } from './securityConfigService';

let activeSessions = SessionStore.loadSessions();
let blacklistedTokens = new Set<string>();

export const SessionService = {
    trackRequest: (req: Request) => {
        if (!req.user) return;

        const userId = req.user.id;
        const userName = req.user.name;
        // Clean up proxy IP formats
        const ip = req.ip?.replace('::ffff:', '') || req.socket?.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
        const userAgentRaw = req.headers?.['user-agent'] || 'Unknown Browser';

        // Detailed Device Parsing
        let os = 'Unknown OS';
        if (userAgentRaw.includes('Windows')) os = 'Windows';
        else if (userAgentRaw.includes('Macintosh') || userAgentRaw.includes('Mac OS X')) os = 'macOS';
        else if (userAgentRaw.includes('Linux')) os = 'Linux';
        else if (userAgentRaw.includes('iPhone')) os = 'iPhone';
        else if (userAgentRaw.includes('Android')) os = 'Android';

        let browser = 'Unknown Browser';
        if (userAgentRaw.includes('Chrome') && !userAgentRaw.includes('Edg')) browser = 'Chrome';
        else if (userAgentRaw.includes('Safari') && !userAgentRaw.includes('Chrome')) browser = 'Safari';
        else if (userAgentRaw.includes('Firefox')) browser = 'Firefox';
        else if (userAgentRaw.includes('Edg')) browser = 'Edge';

        const userAgent = `${browser} on ${os}`;

        // 3. GeoIP Mapping
        let location = 'Remote Connection';
        const config = SecurityConfigService.getConfig();
        const officeIp = config.officeIp || process.env.OFFICE_ROUTER_IP || '192.168.1.1';

        if (ip === officeIp) {
            location = 'Office Network';
        } else if (ip === '127.0.0.1' || ip === '::1') {
            location = 'Localhost';
        } else {
            const geo = geoip.lookup(ip);
            if (geo) {
                location = `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}`;
            }
        }

        const sessionId = `${userId}-${ip}-${userAgent}`;

        // Keep session persistent if it's already revoked
        const existingSession = activeSessions.get(sessionId);
        if (existingSession && existingSession.status === 'revoked') {
            return;
        }

        activeSessions.set(sessionId, {
            id: sessionId,
            userId,
            userName,
            ip,
            userAgent,
            location,
            lastActive: Date.now(),
            status: 'active'
        });

        // Save on intervals naturally (we debounce in production, but here we can save direct)
        SessionStore.saveSessions(activeSessions);
    },

    getActiveSessions: () => {
        const now = Date.now();
        // 1. Persistence & Housekeeping
        let changed = false;
        for (const [key, session] of activeSessions.entries()) {
            if (now - session.lastActive > 24 * 60 * 60 * 1000) {
                activeSessions.delete(key);
                changed = true;
            }
        }
        if (changed) SessionStore.saveSessions(activeSessions);

        return Array.from(activeSessions.values()).sort((a, b) => b.lastActive - a.lastActive);
    },

    revokeSession: async (sessionId: string) => {
        const session = activeSessions.get(sessionId);
        if (session) {
            session.status = 'revoked';
            activeSessions.set(sessionId, session);
            SessionStore.saveSessions(activeSessions);

            // 1. JWT Blacklist
            const tokenIdentifier = `blacklisted-${session.userId}`;
            blacklistedTokens.add(tokenIdentifier);

            // 2. Real-Time WebSocket Kick
            const io = getIO();
            if (io) {
                // We emit a special direct event to this user's personal room
                io.to(`user:${session.userId}`).emit('session:revoked', {
                    message: 'Your session has been terminated by an Administrator.'
                });
            }

            // 3. Automated Admin Notification (assuming 'system-admin' is the main admin id, or we log universally)
            try {
                // This alerts the admin interface that a forced revocation occurred.
                await query(`
                    INSERT INTO chat_notifications (id, user_id, type, title, message, is_read, created_at)
                    VALUES (gen_random_uuid(), 'system-admin', 'security_alert', 'Session Revoked', 
                    'A session for ${session.userName} from ${session.ip} was forcefully revoked.', false, NOW())
                `);
            } catch (e) {
                console.error('Pushed security notification to Mock DB (or query failed)');
            }
        }
    },

    // JWT Blacklisting Helper
    blacklistToken: (token: string) => {
        blacklistedTokens.add(token);
    },

    isTokenBlacklisted: (token: string): boolean => {
        return blacklistedTokens.has(token);
    },

    isRevoked: (req: Request): boolean => {
        if (!req.user) return false;
        const ip = req.ip?.replace('::ffff:', '') || req.socket?.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
        const userAgentRaw = req.headers?.['user-agent'] || '';

        let os = 'Unknown OS';
        if (userAgentRaw.includes('Windows')) os = 'Windows';
        else if (userAgentRaw.includes('Mac OS X') || userAgentRaw.includes('Macintosh')) os = 'macOS';
        else if (userAgentRaw.includes('Linux')) os = 'Linux';
        else if (userAgentRaw.includes('iPhone')) os = 'iPhone';
        else if (userAgentRaw.includes('Android')) os = 'Android';

        let browser = 'Unknown Browser';
        if (userAgentRaw.includes('Chrome') && !userAgentRaw.includes('Edg')) browser = 'Chrome';
        else if (userAgentRaw.includes('Safari') && !userAgentRaw.includes('Chrome')) browser = 'Safari';
        else if (userAgentRaw.includes('Firefox')) browser = 'Firefox';
        else if (userAgentRaw.includes('Edg')) browser = 'Edge';

        const userAgent = `${browser} on ${os}`;

        const sessionId = `${req.user.id}-${ip}-${userAgent}`;
        const session = activeSessions.get(sessionId);
        return session?.status === 'revoked';
    },

    // Used for tests so we can clear states
    _clearState: () => {
        activeSessions = new Map();
        blacklistedTokens = new Set();
    }
};
