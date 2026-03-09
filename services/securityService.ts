import { AuditService } from './auditService';

export interface SecurityConfig {
    officeIp: string;
    workStartTime: string;
    workEndTime: string;
    blockSundays: boolean;
}

export interface ActiveSession {
    id: string;
    userId: string;
    userName: string;
    ip: string;
    userAgent: string;
    location: string;
    lastActive: number;
    status: 'active' | 'revoked';
}

const API_BASE = 'http://localhost:3001/api';

export const SecurityService = {
    getConfig: async (): Promise<SecurityConfig> => {
        try {
            // Assuming our backend uses JWT stored in localStorage
            const token = localStorage.getItem('globalworkforce_auth_token') || 'mock-jwt-token';

            const response = await fetch(`${API_BASE}/security/config`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch security config');
            }

            return await response.json();
        } catch (e) {
            console.error('Error fetching security config', e);
            // Fallback defaults
            return {
                officeIp: '192.168.1.1',
                workStartTime: '08:00',
                workEndTime: '18:00',
                blockSundays: true
            };
        }
    },

    saveConfig: async (config: Partial<SecurityConfig>): Promise<SecurityConfig> => {
        try {
            const token = localStorage.getItem('globalworkforce_auth_token') || 'mock-jwt-token';

            const response = await fetch(`${API_BASE}/security/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error('Failed to save security config');
            }

            const data = await response.json();

            // Log the change
            const auditUserId = await AuditService.getCurrentUserId();
            AuditService.log('SYSTEM_SECURITY_CONFIG_UPDATED', {
                updates: config
            }, auditUserId);

            return data.config;
        } catch (e) {
            console.error('Error saving security config', e);
            throw e;
        }
    },

    getActiveSessions: async (): Promise<ActiveSession[]> => {
        try {
            const token = localStorage.getItem('globalworkforce_auth_token') || 'mock-jwt-token';
            const response = await fetch(`${API_BASE}/security/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch active sessions');
            return await response.json();
        } catch (e) {
            console.error('Error fetching active sessions', e);
            return [];
        }
    },

    revokeSession: async (sessionId: string): Promise<boolean> => {
        try {
            const token = localStorage.getItem('globalworkforce_auth_token') || 'mock-jwt-token';
            const response = await fetch(`${API_BASE}/security/sessions/${sessionId}/revoke`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok;
        } catch (e) {
            console.error('Error revoking session', e);
            return false;
        }
    }
};
