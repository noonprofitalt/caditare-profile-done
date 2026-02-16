import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, MessageSquare, AtSign } from 'lucide-react';
import { ChatNotification } from '../../types';
import ChatService from '../../services/chatService';
import { formatDistanceToNow } from 'date-fns';

interface ChatNotificationsProps {
    onClose: () => void;
    onNotificationClick: (notification: ChatNotification) => void;
}

export const ChatNotifications: React.FC<ChatNotificationsProps> = ({ onClose, onNotificationClick }) => {
    const [notifications, setNotifications] = useState<ChatNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await ChatService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Listen for new notifications
        const handleNewNotification = (notification: ChatNotification) => {
            setNotifications(prev => [notification, ...prev]);
        };

        ChatService.on('notification:new', handleNewNotification);

        return () => {
            ChatService.off('notification:new', handleNewNotification);
        };
    }, []);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await ChatService.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await ChatService.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'mention': return <AtSign size={16} className="text-blue-500" />;
            case 'reply': return <MessageSquare size={16} className="text-purple-500" />;
            default: return <Bell size={16} className="text-slate-500" />;
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                    Mark all read
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => onNotificationClick(notification)}
                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors relative group ${notification.isRead ? 'opacity-75' : 'bg-blue-50/50'
                                }`}
                        >
                            <div className="flex gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 mb-0.5">
                                        {notification.title}
                                    </p>
                                    <p className="text-sm text-slate-600 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-slate-400 mt-1 block">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                {!notification.isRead && (
                                    <div className="flex-shrink-0 self-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            {!notification.isRead && (
                                <button
                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600"
                                    title="Mark as read"
                                >
                                    <Check size={12} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
