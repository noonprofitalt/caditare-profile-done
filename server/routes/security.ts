import { Router } from 'express';
import { SecurityConfigService } from '../services/securityConfigService';
import { SessionService } from '../services/sessionService';
import { requireRole, authMiddleware as requireAuth } from '../middleware/auth';

const router = Router();

// Any authenticated user should be able to read the config to apply client-side lockdown
router.get('/config', requireAuth, (req, res) => {
    try {
        const config = SecurityConfigService.getConfig();
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: 'Failed to retrieve configuration' });
    }
});

// New endpoint for clients to verify their full connection status
router.get('/status', requireAuth, (req, res) => {
    try {
        const config = SecurityConfigService.getConfig();
        const incomingIp = req.ip?.replace('::ffff:', '') || 'unknown';
        const isRevoked = SessionService.isRevoked(req);

        res.json({
            config,
            clientIp: incomingIp,
            sessionRevoked: isRevoked
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to retrieve status' });
    }
});

router.post('/config', requireRole('Admin'), (req, res) => {
    try {
        const updatedConfig = SecurityConfigService.saveConfig(req.body);
        res.json({ success: true, config: updatedConfig });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Get active sessions
router.get('/sessions', requireRole('Admin'), (req, res) => {
    try {
        const sessions = SessionService.getActiveSessions();
        res.json(sessions);
    } catch (e) {
        res.status(500).json({ error: 'Failed to retrieve sessions' });
    }
});

// Revoke a session
router.post('/sessions/:id/revoke', requireRole('Admin'), (req, res) => {
    try {
        const id = req.params.id as string;
        SessionService.revokeSession(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to revoke session' });
    }
});

export default router;
