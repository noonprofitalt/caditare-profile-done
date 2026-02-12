import { ChatChannel, ChatMessage, ChatUser, ChatMessageContext } from '../types';

// Mock Data
const MOCK_USERS: ChatUser[] = [
    { id: 'u1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', status: 'online', role: 'HR Manager' },
    { id: 'u2', name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'busy', role: 'Compliance Officer' },
    { id: 'u3', name: 'Jessica Wong', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', status: 'offline', role: 'Recruiter' },
    { id: 'u4', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', status: 'online', role: 'Admin' },
];

const INITIAL_CHANNELS: ChatChannel[] = [
    { id: 'c1', name: 'General', type: 'public', unreadCount: 0 },
    { id: 'c2', name: 'Announcements', type: 'public', unreadCount: 2 },
    { id: 'c3', name: 'Visa Processing', type: 'public', unreadCount: 0 },
    { id: 'c4', name: 'Management', type: 'private', unreadCount: 5, allowedRoles: ['Admin', 'Manager', 'HR Manager'] },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
    'c1': [
        { id: 'm1', text: 'Has everyone reviewed the new compliance guidelines?', senderId: 'u1', senderName: 'Sarah Jenkins', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { id: 'm2', text: 'Yes, looking good. Will implement by Friday.', senderId: 'u2', senderName: 'Mike Chen', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString() },
    ],
    'c2': [
        { id: 'm3', text: 'Office will be closed next Monday for maintenance.', senderId: 'u4', senderName: 'David Kim', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ]
};

const STORAGE_KEY_MESSAGES = 'caditare_chat_messages';
const STORAGE_KEY_CHANNELS = 'caditare_chat_channels';

export const ChatService = {
    getChannels: (currentUserRole?: string): ChatChannel[] => {
        const stored = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = stored ? JSON.parse(stored) : INITIAL_CHANNELS;

        // RBAC Filtering
        if (currentUserRole) {
            return channels.filter(c => !c.allowedRoles || c.allowedRoles.includes(currentUserRole));
        }
        return channels;
    },

    getUsers: (): ChatUser[] => {
        return MOCK_USERS;
    },

    getMessages: (channelId: string): ChatMessage[] => {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const allMessages = stored ? JSON.parse(stored) : INITIAL_MESSAGES;
        return allMessages[channelId] || [];
    },

    sendMessage: (channelId: string, text: string, context?: ChatMessageContext) => {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const allMessages = stored ? JSON.parse(stored) : { ...INITIAL_MESSAGES };

        const newMessage: ChatMessage = {
            id: `m-${Date.now()}`,
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
        return newMessage;
    },

    // Automated System Post
    systemPost: (channelId: string, text: string, context?: ChatMessageContext) => {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const allMessages = stored ? JSON.parse(stored) : { ...INITIAL_MESSAGES };

        const newMessage: ChatMessage = {
            id: `sys-${Date.now()}`,
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
        return newMessage;
    },

    createChannel: (name: string, type: 'public' | 'private', allowedRoles?: string[]): ChatChannel => {
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

    updateChannel: (channelId: string, updates: Partial<ChatChannel>): ChatChannel | undefined => {
        const stored = localStorage.getItem(STORAGE_KEY_CHANNELS);
        const channels: ChatChannel[] = stored ? JSON.parse(stored) : [...INITIAL_CHANNELS];

        const index = channels.findIndex(c => c.id === channelId);
        if (index === -1) return undefined;

        channels[index] = { ...channels[index], ...updates };
        localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
        return channels[index];
    },

    deleteChannel: (channelId: string) => {
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
        const channel = INITIAL_CHANNELS.find(c => c.id === channelId);
        return { name: channel ? `# ${channel.name}` : 'Unknown Channel', isUser: false };
    }
};
