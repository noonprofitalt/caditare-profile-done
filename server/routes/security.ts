import { Router } from 'express';
import { SecurityConfigService } from '../services/securityConfigService';
import { SessionService } from '../services/sessionService';
import { requireRole } from '../middleware/auth';

const router = Router();

// Only Admins should be able to access the security configuration
router.get('/config', requireRole('Admin'), (req, res) => {
    try {
        const config = SecurityConfigService.getConfig();
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: 'Failed to retrieve configuration' });
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
