import { supabase } from './supabase';

export class AuditService {
    /**
     * Logs an action to the audit_logs table for tracking user activity.
     */
    static async log(action: string, details?: any, userIdOverride?: string) {
        try {
            let user_id = userIdOverride;

            if (!user_id) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    user_id = user.id;
                }
            }

            // Since this runs client-side mostly, getting the real IP requires an external service.
            // Marking as 'Client-Side' for now.
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
