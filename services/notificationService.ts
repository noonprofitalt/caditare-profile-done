import { AppNotification } from '../types';
import { supabase, getCurrentUser } from './supabase';
import { logger } from './loggerService';

export class NotificationService {
    static async getNotifications(): Promise<AppNotification[]> {
        try {
            const user = await getCurrentUser();
            // If no user, return empty or global notifications? 
            // Policy allows "user_id IS NULL" for global.
            // But we can only filter by what the policy allows.

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .in('type', ['INFO', 'WARNING', 'SUCCESS', 'DELAY', 'ERROR'])
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                logger.error('Failed to fetch notifications', error);
                return [];
            }

            return data.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                timestamp: n.created_at,
                isRead: n.is_read,
                link: n.link
            }));
        } catch (err) {
            logger.error('Error in getNotifications', err);
            return [];
        }
    }

    static async addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
        try {
            const user = await getCurrentUser();
            const userId = user?.id || null;

            // Duplicate Check (Same type and title within last 5 minutes) is harder with DB, 
            // skipping for now or we can query DB. 
            // Let's implement a simple DB check if needed, but for performance maybe skip.
            // Actually, let's keep it simple for now.

            const newNotification = {
                user_id: userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
                is_read: false,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('notifications')
                .insert(newNotification);

            if (error) {
                logger.error('Failed to add notification', error);
            }
        } catch (err) {
            logger.error('Error adding notification', err);
        }
    }

    static async markAsRead(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) logger.error('Failed to mark notification as read', error);
        } catch (err) {
            logger.error('Error in markAsRead', err);
        }
    }

    static async markAllAsRead(): Promise<void> {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            // Mark user-specific notifications as read
            const { error: userError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (userError) logger.error('Failed to mark user notifications as read', userError);

            // Also mark global notifications (user_id IS NULL) as read
            // Note: This requires policy to allow updates on global notifications
            // If policy blocks this, it will silently fail which is acceptable
            const { error: globalError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .is('user_id', null)
                .eq('is_read', false);

            if (globalError) {
                // Expected if RLS policy doesn't allow updates on global notifications
                logger.warn('Could not mark global notifications as read (expected if RLS blocks)', { error: globalError });
            }
        } catch (err) {
            logger.error('Error in markAllAsRead', err);
        }
    }

    static async clearOld(): Promise<void> {
        // cleanup logic typically handled by backend job, but we can do it here if needed
    }
}
