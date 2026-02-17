import { ChatChannel, ChatMessage, ChatUser, ChatMessageContext, ChatNotification } from '../types';

// Mock Data
const MOCK_USERS: ChatUser[] = [];

const INITIAL_CHANNELS: ChatChannel[] = [
    { id: 'c1', name: 'General', type: 'public', unreadCount: 0 },
    { id: 'c2', name: 'Announcements', type: 'public', unreadCount: 2 },
    { id: 'c3', name: 'Visa Processing', type: 'public', unreadCount: 0 },
    { id: 'c4', name: 'Management', type: 'private', unreadCount: 5, allowedRoles: ['Admin', 'Manager', 'HR Manager'] },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

const STORAGE_KEY_MESSAGES = 'caditare_chat_messages';
const STORAGE_KEY_CHANNELS = 'caditare_chat_channels';

interface IChatService {
    getChannels: (currentUserRole?: string) => Promise<ChatChannel[]>;
    getUsers: () => Promise<ChatUser[]>;
    getMessages: (channelId: string, options?: { limit?: number; offset?: number }) => Promise<{ messages: ChatMessage[], hasMore: boolean }>;
    sendMessage: (channelId: string, text: string, context?: ChatMessageContext) => Promise<ChatMessage>;
    systemPost: (channelId: string, text: string, context?: ChatMessageContext) => Promise<ChatMessage>;
    createChannel: (name: string, type: 'public' | 'private', allowedRoles?: string[]) => Promise<ChatChannel>;
    updateChannel: (channelId: string, updates: Partial<ChatChannel>) => Promise<ChatChannel | undefined>;
    deleteChannel: (channelId: string) => Promise<boolean>;
    getDmChannelId: (userId: string) => string;
    getChannelDisplay: (channelId: string, users: ChatUser[]) => { name: string; avatar?: string; isUser: boolean; status?: string };
    getNotifications: () => Promise<ChatNotification[]>;
    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;
    markChannelAsRead: (channelId: string) => void;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    removeReaction: (messageId: string, emoji: string) => Promise<void>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
    emit: (event: string, data?: any) => void;
    isConnected: () => boolean;
    startTyping: (channelId: string) => void;
    stopTyping: (channelId: string) => void;
    joinChannel: (channelId: string) => void;
    leaveChannel: (channelId: string) => void;
}

// Add Socket.IO style event emitters to the service
const eventListeners: Map<string, Set<Function>> = new Map();

export const ChatService: IChatService = {
    getChannels: async (currentUserRole?: string): Promise<ChatChannel[]> => {
        const stored = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = stored ? JSON.parse(stored) : INITIAL_CHANNELS;

        // RBAC Filtering
        if (currentUserRole) {
            return channels.filter(c => !c.allowedRoles || (c.allowedRoles && c.allowedRoles.includes(currentUserRole)));
        }
        return channels;
    },

    getUsers: async (): Promise<ChatUser[]> => {
        return MOCK_USERS;
    },

    getMessages: async (channelId: string, options: { limit?: number; offset?: number } = {}): Promise<{ messages: ChatMessage[], hasMore: boolean }> => {
        const { limit = 50, offset = 0 } = options;
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const allMessages = stored ? JSON.parse(stored) : INITIAL_MESSAGES;
        const messages = allMessages[channelId] || [];

        const total = messages.length;
        const start = Math.max(0, total - offset - limit);
        const end = Math.max(0, total - offset);

        return {
            messages: messages.slice(start, end),
            hasMore: start > 0
        };
    },

    sendMessage: async (channelId: string, text: string, context?: ChatMessageContext) => {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const allMessages = stored ? JSON.parse(stored) : { ...INITIAL_MESSAGES };

        const newMessage: ChatMessage = {
            id: `m-${Date.now()}`,
            channelId,
            text,
            senderId: 'current-user', // Mock ID for "Me"
            senderName: 'You',
            timestamp: new Date().toISOString(),
            isMe: true,
            context
        };

        if (!allMessages[channelId]) {
            allMessages[channelId] = [];
        }
        allMessages[channelId].push(newMessage);
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));

        // Emit event for real-time update simulators
        ChatService.emit('message:new', newMessage);

        return newMessage;
    },

    // Automated System Post
    systemPost: async (channelId: string, text: string, context?: ChatMessageContext) => {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const allMessages = stored ? JSON.parse(stored) : { ...INITIAL_MESSAGES };

        const newMessage: ChatMessage = {
            id: `sys-${Date.now()}`,
            channelId,
            text,
            senderId: 'system',
            senderName: 'System Engine',
            timestamp: new Date().toISOString(),
            isSystem: true,
            context
        };

        if (!allMessages[channelId]) {
            allMessages[channelId] = [];
        }
        allMessages[channelId].push(newMessage);
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));

        ChatService.emit('message:new', newMessage);

        return newMessage;
    },

    createChannel: async (name: string, type: 'public' | 'private', allowedRoles?: string[]): Promise<ChatChannel> => {
        const stored = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = stored ? JSON.parse(stored) : [...INITIAL_CHANNELS];

        const newChannel: ChatChannel = {
            id: `c-${Date.now()}`,
            name,
            type,
            unreadCount: 0,
            allowedRoles
        };

        channels.push(newChannel);
        localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
        return newChannel;
    },

    updateChannel: async (channelId: string, updates: Partial<ChatChannel>): Promise<ChatChannel | undefined> => {
        const stored = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = stored ? JSON.parse(stored) : [...INITIAL_CHANNELS];

        const index = channels.findIndex(c => c.id === channelId);
        if (index === -1) return undefined;

        channels[index] = { ...channels[index], ...updates };
        localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
        return channels[index];
    },

    deleteChannel: async (channelId: string) => {
        // Protect critical channels
        if (['c1', 'c2', 'c3', 'c4'].includes(channelId)) return false;

        // Delete channel
        const storedChannels = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = storedChannels ? JSON.parse(storedChannels) : [...INITIAL_CHANNELS];
        const newChannels = channels.filter(c => c.id !== channelId);
        localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(newChannels));

        // Delete associated messages
        const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
        if (storedMessages) {
            const allMessages = JSON.parse(storedMessages);
            delete allMessages[channelId];
            localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));
        }
        return true;
    },

    // Helper to create a DM channel ID
    getDmChannelId: (userId: string) => `dm-${userId}`,

    // Helper to get channel name/avatar for UI
    getChannelDisplay: (channelId: string, users: ChatUser[]) => {
        if (channelId.startsWith('dm-')) {
            const userId = channelId.split('-')[1];
            const user = users.find(u => u.id === userId);
            return { name: user?.name || 'Unknown User', avatar: user?.avatar, isUser: true, status: user?.status };
        }

        const stored = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = stored ? JSON.parse(stored) : INITIAL_CHANNELS;
        const channel = channels.find(c => c.id === channelId);
        return { name: channel ? `# ${channel.name}` : 'Unknown Channel', isUser: false };
    },

    // --- NOTIFICATION METHODS ---
    getNotifications: async (): Promise<ChatNotification[]> => {
        const stored = localStorage.getItem('caditare_chat_notifications');
        return stored ? JSON.parse(stored) : [];
    },

    markNotificationRead: async (id: string): Promise<void> => {
        const stored = localStorage.getItem('caditare_chat_notifications');
        if (!stored) return;
        const notifications: ChatNotification[] = JSON.parse(stored);
        const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        localStorage.setItem('caditare_chat_notifications', JSON.stringify(updated));
    },

    markAllNotificationsRead: async (): Promise<void> => {
        const stored = localStorage.getItem('caditare_chat_notifications');
        if (!stored) return;
        const notifications: ChatNotification[] = JSON.parse(stored);
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        localStorage.setItem('caditare_chat_notifications', JSON.stringify(updated));
    },

    markChannelAsRead: (channelId: string): void => {
        const stored = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = stored ? JSON.parse(stored) : [...INITIAL_CHANNELS];
        const index = channels.findIndex(c => c.id === channelId);
        if (index !== -1) {
            channels[index].unreadCount = 0;
            localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
        }
    },

    addReaction: async (messageId: string, emoji: string) => { },
    removeReaction: async (messageId: string, emoji: string) => { },

    on: (event: string, callback: Function) => {
        if (!eventListeners.has(event)) {
            eventListeners.set(event, new Set());
        }
        eventListeners.get(event)!.add(callback);
    },

    off: (event: string, callback: Function) => {
        const listeners = eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    },

    emit: (event: string, data?: any) => {
        const listeners = eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    },

    isConnected: () => true,
    startTyping: (channelId: string) => { },
    stopTyping: (channelId: string) => { },
    joinChannel: (channelId: string) => { },
    leaveChannel: (channelId: string) => { },
};

export default ChatService;
