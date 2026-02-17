import { AppNotification } from '../types';
import { logger } from './loggerService';

const STORAGE_KEY = 'globalworkforce_notifications';

export class NotificationService {
    static getNotifications(): AppNotification[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            logger.error('Failed to parse notifications from storage', err);
            return [];
        }
    }

    static saveNotifications(notifications: AppNotification[]): void {
        if (!Array.isArray(notifications)) {
            logger.warn('Attempted to save non-array notifications', { notifications });
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        // Trigger storage event for cross-tab or same-tab detection if needed
        window.dispatchEvent(new Event('storage'));
    }

    static addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): void {
        const current = this.getNotifications();

        // Duplicate Check (Same type and title within last 5 minutes)
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        const isDuplicate = current.some(n =>
            n.type === notification.type &&
            n.title === notification.title &&
            n.message === notification.message &&
            new Date(n.timestamp) > fiveMinutesAgo
        );

        if (isDuplicate) return;

        const newNotification: AppNotification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            isRead: false
        };

        this.saveNotifications([newNotification, ...current].slice(0, 50)); // Keep last 50
    }

    static markAsRead(id: string): void {
        const current = this.getNotifications();
        const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
        this.saveNotifications(updated);
    }

    static markAllAsRead(): void {
        const current = this.getNotifications();
        const updated = current.map(n => ({ ...n, isRead: true }));
        this.saveNotifications(updated);
    }

    static clearOld(): void {
        const current = this.getNotifications();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const filtered = current.filter(n => new Date(n.timestamp) > thirtyDaysAgo);
        this.saveNotifications(filtered);
    }
}
