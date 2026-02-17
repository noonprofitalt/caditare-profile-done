import { supabase } from './supabase';
import { ChatChannel, ChatMessage, ChatUser, ChatMessageContext, ChatNotification, ChatAttachment, MessageReaction } from '../types';
import { UserService } from './userService';

const STORAGE_KEY_CHANNELS = 'caditare_chat_channels_v2';

interface IChatService {
    getChannels: (currentUserRole?: string) => Promise<ChatChannel[]>;
    getUsers: () => Promise<ChatUser[]>;
    getMessages: (channelId: string, options?: { limit?: number; offset?: number }) => Promise<{ messages: ChatMessage[], hasMore: boolean }>;
    sendMessage: (channelId: string, text: string, senderId: string, senderName: string, context?: ChatMessageContext, attachments?: ChatAttachment[]) => Promise<ChatMessage>;
    systemPost: (channelId: string, text: string, context?: ChatMessageContext) => Promise<ChatMessage>;
    createChannel: (name: string, type: 'public' | 'private', allowedRoles?: string[]) => Promise<ChatChannel>;
    updateChannel: (channelId: string, updates: Partial<ChatChannel>) => Promise<ChatChannel | undefined>;
    deleteChannel: (channelId: string) => Promise<boolean>;
    getDmChannelId: (userId1: string, userId2?: string) => string;
    getChannelDisplay: (channelId: string, users: ChatUser[]) => { name: string; avatar?: string; isUser: boolean; status?: string };
    getNotifications: () => Promise<ChatNotification[]>;
    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;
    markChannelAsRead: (channelId: string) => void;
    addReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
    removeReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
    emit: (event: string, data?: any) => void;
    isConnected: () => boolean;
    startTyping: (channelId: string) => void;
    stopTyping: (channelId: string) => void;
    joinChannel: (channelId: string) => void;
    leaveChannel: (channelId: string) => void;
    subscribeToMessages: (channelId: string, callback: (payload: any) => void) => () => void;
}

// Add Socket.IO style event emitters to the service
const eventListeners: Map<string, Set<Function>> = new Map();

export const ChatService: IChatService = {
    getChannels: async (currentUserRole?: string): Promise<ChatChannel[]> => {
        const { data, error } = await supabase
            .from('chat_channels')
            .select('*');

        if (error) {
            console.error('Error fetching channels:', error);
            return [];
        }

        let channels: ChatChannel[] = data || [];

        // Fallback/Seed for dev if empty
        if (channels.length === 0) {
            const initialChannels = [
                { id: 'c1', name: 'General', type: 'public', unreadCount: 0 },
                { id: 'c2', name: 'Announcements', type: 'public', unreadCount: 0 },
                { id: 'c3', name: 'Visa Processing', type: 'public', unreadCount: 0 },
                { id: 'c4', name: 'Management', type: 'private', unreadCount: 0, allowed_roles: ['Admin', 'Manager', 'HR Manager'] },
            ];
            await supabase.from('chat_channels').insert(initialChannels);
            channels = initialChannels as any[];
        }

        // RBAC Filtering
        if (currentUserRole) {
            return channels.filter(c => !c.allowedRoles || (c.allowedRoles && c.allowedRoles.includes(currentUserRole)));
        }
        return (data || []).map(c => ({
            id: c.id,
            name: c.name,
            type: c.type || 'public',
            unreadCount: 0,
            allowedRoles: c.allowed_roles
        }));
    },

    getUsers: async (): Promise<ChatUser[]> => {
        try {
            const users = await UserService.getUsers();
            return users.map(u => ({
                id: u.id,
                name: u.name,
                avatar: u.avatar,
                role: u.role,
                status: u.status === 'Active' ? 'online' : 'offline'
            }));
        } catch (error) {
            console.error('Failed to fetch system users:', error);
            return [];
        }
    },

    getMessages: async (channelId: string, options: { limit?: number; offset?: number } = {}): Promise<{ messages: ChatMessage[], hasMore: boolean }> => {
        const { limit = 50, offset = 0 } = options;

        const { data, error, count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact' })
            .eq('channel_id', channelId)
            .order('timestamp', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching messages:', error);
            return { messages: [], hasMore: false };
        }

        const messages: ChatMessage[] = (data || []).map(m => ({
            id: m.id,
            channelId: m.channel_id,
            text: m.text,
            senderId: m.sender_id,
            senderName: m.sender_name,
            timestamp: m.timestamp,
            attachments: m.attachments || [],
            context: m.context,
            isMe: false, // Will be determined by component based on current user
            isSystem: m.sender_id === 'system'
        }));

        return {
            messages,
            hasMore: count ? (offset + limit < count) : false
        };
    },

    sendMessage: async (channelId: string, text: string, senderId: string, senderName: string, context?: ChatMessageContext, attachments?: ChatAttachment[]) => {
        // First ensure channel exists (for DMs)
        const { data: channel } = await supabase.from('chat_channels').select('id').eq('id', channelId).single();
        if (!channel) {
            await supabase.from('chat_channels').insert({
                id: channelId,
                name: channelId.startsWith('dm-') ? 'Direct Message' : channelId,
                type: channelId.startsWith('dm-') ? 'private' : 'public'
            });
        }

        const newMessageData = {
            channel_id: channelId,
            text,
            sender_id: senderId,
            sender_name: senderName,
            attachments: attachments || [],
            context: context || null
        };

        const { data, error } = await supabase
            .from('chat_messages')
            .insert(newMessageData)
            .select()
            .single();

        if (error) throw error;

        const message: ChatMessage = {
            id: data.id,
            channelId: data.channel_id,
            text: data.text,
            senderId: data.sender_id,
            senderName: data.sender_name,
            timestamp: data.timestamp,
            attachments: data.attachments || [],
            context: data.context,
            isMe: true
        };

        return message;
    },

    subscribeToMessages: (channelId: string, callback: (payload: any) => void) => {
        const channel = supabase
            .channel(`channel:${channelId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${channelId}`
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    // Automated System Post
    systemPost: async (channelId: string, text: string, context?: ChatMessageContext) => {
        return ChatService.sendMessage(channelId, text, '00000000-0000-0000-0000-000000000000', 'System Engine', context);
    },

    createChannel: async (name: string, type: 'public' | 'private', allowedRoles?: string[]) => {
        const id = `c-${Date.now()}`;
        const { data, error } = await supabase
            .from('chat_channels')
            .insert({
                id,
                name,
                type,
                allowed_roles: allowedRoles
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            type: data.type,
            unreadCount: 0,
            allowedRoles: data.allowed_roles
        };
    },

    updateChannel: async (channelId: string, updates: Partial<ChatChannel>) => {
        const { data, error } = await supabase
            .from('chat_channels')
            .update({
                name: updates.name,
                type: updates.type,
                allowed_roles: updates.allowedRoles
            })
            .eq('id', channelId)
            .select()
            .single();

        if (error) return undefined;
        return {
            id: data.id,
            name: data.name,
            type: data.type,
            unreadCount: 0,
            allowedRoles: data.allowed_roles
        };
    },

    deleteChannel: async (channelId: string) => {
        const { error } = await supabase
            .from('chat_channels')
            .delete()
            .eq('id', channelId);

        return !error;
    },

    getDmChannelId: (userId1: string, userId2?: string) => {
        if (!userId2) {
            // If only one user provided, get current user (this should ideally be passed in)
            // But usually we map logged in user to userId2 in getDmChannelId calls
            return `dm-${userId1}`;
        }
        const ids = [userId1, userId2].sort();
        return `dm-${ids[0]}-${ids[1]}`;
    },

    getChannelDisplay: (channelId: string, users: ChatUser[]) => {
        if (channelId.startsWith('dm-')) {
            const userIds = channelId.replace('dm-', '').split('-');
            const otherUserId = userIds.find(id => id !== 'current-user'); // This logic needs to be better if we have real IDs
            const user = users.find(u => u.id === otherUserId);
            return {
                name: user?.name || 'Direct Message',
                avatar: user?.avatar,
                isUser: true,
                status: user?.status
            };
        }
        return { name: channelId, isUser: false };
    },

    getNotifications: async () => [],
    markNotificationRead: async () => { },
    markAllNotificationsRead: async () => { },
    markChannelAsRead: () => { },
    addReaction: async () => { },
    removeReaction: async () => { },
    on: (event, callback) => {
        if (!eventListeners.has(event)) eventListeners.set(event, new Set());
        eventListeners.get(event)!.add(callback);
    },
    off: (event, callback) => {
        eventListeners.get(event)?.delete(callback);
    },
    emit: (event, data) => {
        eventListeners.get(event)?.forEach(cb => cb(data));
    },
    isConnected: () => true,
    startTyping: () => { },
    stopTyping: () => { },
    joinChannel: () => { },
    leaveChannel: () => { }
};

export default ChatService;
