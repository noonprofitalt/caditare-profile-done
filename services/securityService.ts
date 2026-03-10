import { AuditService } from './auditService';
import { getAuthToken } from '../utils/authToken';

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

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const CONFIG_CACHE_KEY = 'gw_security_config_cache';

export const SecurityService = {
    getConfig: async (): Promise<SecurityConfig> => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/security/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch security config');
            const config = await response.json();
            try { localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config)); } catch { /* silently fail */ }
            return config;
        } catch (e) {
            console.error('Error fetching security config', e);
            try {
                const cached = localStorage.getItem(CONFIG_CACHE_KEY);
                if (cached) return JSON.parse(cached);
            } catch { /* silently fail */ }
            return { officeIp: '192.168.1.1', workStartTime: '08:00', workEndTime: '18:00', blockSundays: true };
        }
    },

    getStatus: async (): Promise<{ config: SecurityConfig; clientIp: string; sessionRevoked: boolean }> => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/security/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch security status');
            const data = await response.json();
            try { localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(data.config)); } catch { /* silently fail */ }
            return data;
        } catch (e) {
            console.error('Error fetching security status', e);
            // Fallback for offline or missing server
            const cachedConfig = await SecurityService.getConfig();
            return {
                config: cachedConfig,
                clientIp: '127.0.0.1', // Safe default fallback
                sessionRevoked: false
            };
        }
    },

    saveConfig: async (config: Partial<SecurityConfig>): Promise<SecurityConfig> => {
        // Always update local cache immediately for client-side guard
        try {
            const currentCached = localStorage.getItem(CONFIG_CACHE_KEY);
            const current = currentCached ? JSON.parse(currentCached) : {
                officeIp: '192.168.1.1',
                workStartTime: '08:00',
                workEndTime: '18:00',
                blockSundays: true
            };
            const merged = { ...current, ...config };
            localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(merged));
        } catch { /* silently fail */ }

        try {
            const token = getAuthToken();

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

            const savedConfig = data.config;
            // Update cache with server response
            try { localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(savedConfig)); } catch { /* silently fail */ }
            return savedConfig;
        } catch (e) {
            console.error('Error saving security config', e);
            // Even if server save fails, the local cache was already updated
            // so the client-side guard will still enforce the new settings
            const cached = localStorage.getItem(CONFIG_CACHE_KEY);
            if (cached) return JSON.parse(cached);
            throw e;
        }
    },

    getActiveSessions: async (): Promise<ActiveSession[]> => {
        try {
            const token = getAuthToken();
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
            const token = getAuthToken();
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
