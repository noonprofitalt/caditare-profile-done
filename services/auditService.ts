import { supabase } from './supabase';

// Cache the user ID to avoid repeated async lookups
let _cachedUserId: string | null = null;

export class AuditService {
    /**
     * Set the current user ID (call this on login/auth state change)
     * This ensures audit logs are always attributed correctly.
     */
    static setCurrentUser(userId: string | null) {
        _cachedUserId = userId;
    }

    /**
     * Get the current cached user ID, with a fallback to supabase.auth.getUser()
     */
    static async getCurrentUserId(): Promise<string | undefined> {
        if (_cachedUserId) return _cachedUserId;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                _cachedUserId = user.id;
                return user.id;
            }
        } catch { /* ignore */ }
        return undefined;
    }

    /**
     * Logs an action to the audit_logs table for tracking user activity.
     */
    static async log(action: string, details?: any, userIdOverride?: string) {
        try {
            // Priority: explicit override > cached ID > live lookup
            let user_id = userIdOverride || _cachedUserId;

            if (!user_id) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        user_id = user.id;
                        _cachedUserId = user.id; // Cache for future calls
                    }
                } catch { /* ignore */ }
            }

            const ip_address = 'Client-Side';

            const payload: any = {
                action,
                ip_address
            };

            if (details) payload.details = details;
            if (user_id) payload.user_id = user_id;

            const { error } = await supabase.from('audit_logs').insert([payload]);

            if (error) {
                console.warn('Failed to insert audit log:', error);
            }
        } catch (e) {
            console.error('Audit log error:', e);
        }
    }
}
