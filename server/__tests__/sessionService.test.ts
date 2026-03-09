import { describe, it, expect, beforeAll } from 'vitest';
import { SessionService } from '../services/sessionService';
import { Request } from 'express';

describe('SessionService', () => {
    // We have a global map, so we should try to clear or isolate it, 
    beforeAll(() => {
        SessionService._clearState();
    });

    it('should track a new session correctly', () => {
        const mockReq = {
            user: { id: 'u1', name: 'Alice', role: 'Staff' },
            ip: '192.168.1.1',
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.4896.75 Safari/537.36'
            }
        } as unknown as Request;

        SessionService.trackRequest(mockReq);

        const sessions = SessionService.getActiveSessions();
        const found = sessions.find(s => s.userId === 'u1');

        expect(found).toBeDefined();
        expect(found?.userName).toBe('Alice');
        expect(found?.userAgent).toBe('Chrome on Windows');
        expect(['Office Network', 'Remote Connection']).toContain(found?.location);
        expect(found?.status).toBe('active');
    });

    it('should successfully revoke an existing session', () => {
        // Find existing from the step above
        let sessions = SessionService.getActiveSessions();
        const found = sessions.find(s => s.userId === 'u1');
        expect(found).toBeDefined();

        if (found) {
            SessionService.revokeSession(found.id);
        }

        sessions = SessionService.getActiveSessions();
        const revokedSession = sessions.find(s => s.userId === 'u1');

        expect(revokedSession?.status).toBe('revoked');
    });

    it('should identify revoked request', () => {
        const mockReq = {
            user: { id: 'u1', name: 'Alice', role: 'Staff' },
            ip: '192.168.1.1',
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.4896.75 Safari/537.36'
            }
        } as unknown as Request;

        const isRevoked = SessionService.isRevoked(mockReq);
        expect(isRevoked).toBe(true);
    });

    it('should not update tracking for a revoked session', () => {
        const mockReq = {
            user: { id: 'u1', name: 'Alice', role: 'Staff' },
            ip: '192.168.1.1',
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.4896.75 Safari/537.36'
            }
        } as unknown as Request;

        SessionService.trackRequest(mockReq);
        const isRevokedAfterTrack = SessionService.isRevoked(mockReq);
        // Should STILL be revoked, not updated to active.
        expect(isRevokedAfterTrack).toBe(true);
    });
});
