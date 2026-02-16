import React, { useState, useEffect } from 'react';
import { Bell, X, Check, MessageSquare, Users, AtSign } from 'lucide-react';
import { ChatNotification } from '../types';
import { formatRelativeTime } from '../utils/chatUtils';

interface ChatNotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onNotificationClick?: (notification: ChatNotification) => void;
}

export const ChatNotificationCenter: React.FC<ChatNotificationCenterProps> = ({
    isOpen,
    onClose,
    onNotificationClick,
}) => {
    const [notifications, setNotifications] = useState<ChatNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Mock notifications - replace with actual API call
    useEffect(() => {
        // TODO: Fetch notifications from API
        const mockNotifications: ChatNotification[] = [
            {
                id: '1',
                userId: 'current-user-id',
                type: 'mention',
                title: 'You were mentioned',
                message: 'John mentioned you in #general',
                channelId: 'c1',
                messageId: 'm1',
                isRead: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
            },
            {
                id: '2',
                userId: 'current-user-id',
                type: 'reply',
                title: 'New reply',
                message: 'Sarah replied to your message',
                channelId: 'c2',
                messageId: 'm2',
                isRead: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            },
            {
                id: '3',
                userId: 'current-user-id',
                type: 'channel_invite',
                title: 'Channel invitation',
                message: 'You were added to #operations',
                channelId: 'c3',
                isRead: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            },
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const handleNotificationClick = (notification: ChatNotification) => {
        markAsRead(notification.id);
        onNotificationClick?.(notification);
    };

    const getNotificationIcon = (type: ChatNotification['type']) => {
        switch (type) {
            case 'mention':
                return <AtSign size={16} className="text-blue-600" />;
            case 'reply':
                return <MessageSquare size={16} className="text-green-600" />;
            case 'channel_invite':
                return <Users size={16} className="text-purple-600" />;
            default:
                return <Bell size={16} className="text-slate-600" />;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={onClose}
            />

            {/* Notification Panel */}
            <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-slate-700" />
                        <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Actions */}
                {unreadCount > 0 && (
                    <div className="p-3 border-b border-slate-100">
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            <Check size={14} />
                            Mark all as read
                        </button>
                    </div>
                )}

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Bell size={48} className="mb-4 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    {notification.title}
                                                </h3>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatNotificationCenter;
