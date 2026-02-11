import { AppNotification } from '../types';

const STORAGE_KEY = 'globalworkforce_notifications';

export class NotificationService {
    static getNotifications(): AppNotification[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    static saveNotifications(notifications: AppNotification[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        // Trigger storage event for cross-tab or same-tab detection if needed
        window.dispatchEvent(new Event('storage'));
    }

    static addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): void {
        const newNotification: AppNotification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            isRead: false
        };

        const current = this.getNotifications();
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
