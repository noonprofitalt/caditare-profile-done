import { supabase, getCurrentUser } from './supabase';
import { ChatChannel, ChatMessage, ChatUser, ChatMessageContext, ChatNotification, ChatAttachment, MessageReaction } from '../types';
import { UserService } from './userService';
import { AuditService } from './auditService';

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
    initialize: () => void;
}

// Add Socket.IO style event emitters to the service
const eventListeners: Map<string, Set<Function>> = new Map();

// Helper to map DB row to ChatMessage
const mapRowToMessage = (row: any): ChatMessage => ({
    id: row.id,
    channelId: row.channel_id,
    text: row.text,
    senderId: row.sender_id,
    senderName: row.sender_name,
    timestamp: row.timestamp,
    attachments: row.attachments || [],
    context: row.context,
    isMe: false, // determined at call time if needed, or by component
    isSystem: row.sender_id === 'system' || row.sender_id === '00000000-0000-0000-0000-000000000000',
    reactions: [] // Reactions logic would go here if persisted
});

let isInitialized = false;

export const ChatService: IChatService = {
    initialize: () => {
        if (isInitialized) return;
        isInitialized = true;

        // Subscribe to global notifications for the current user
        // We can't easily filter by auth.uidIn realtime unless we use RLS and row level changes.
        // Assuming RLS is on, we receive what we are allowed to see.
        supabase
            .channel('global_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const n = payload.new;
                    // Check if it's a chat notification type
                    if (['mention', 'reply', 'channel_invite', 'system'].includes(n.type)) {
                        const chatNotif: ChatNotification = {
                            id: n.id,
                            userId: n.user_id,
                            channelId: n.metadata?.channelId || '',
                            messageId: n.metadata?.messageId,
                            title: n.title,
                            message: n.message,
                            type: n.type as any,
                            isRead: n.is_read,
                            createdAt: n.created_at
                        };
                        ChatService.emit('notification:new', chatNotif);
                    }
                }
            )
            .subscribe();
    },

    getChannels: async (currentUserRole?: string): Promise<ChatChannel[]> => {
        const { data, error } = await supabase
            .from('chat_channels')
            .select('*');

        if (error) {
            console.error('Error fetching channels:', error);
            return [];
        }

        let channels: ChatChannel[] = (data || []).map(c => ({
            id: c.id,
            name: c.name,
            type: c.type || 'public',
            unreadCount: 0, // Simplified for now, real unread count requires joining chat_reads
            allowedRoles: c.allowed_roles
        }));

        // Fallback/Seed for dev if empty
        if (channels.length === 0) {
            const seedRows = [
                { id: 'c1', name: 'General', type: 'public' },
                { id: 'c2', name: 'Announcements', type: 'public' },
                { id: 'c3', name: 'Visa Processing', type: 'public' },
                { id: 'c4', name: 'Management', type: 'private', allowed_roles: ['Admin', 'Manager', 'HR Manager'] },
            ];
            await supabase.from('chat_channels').insert(seedRows);
            channels = seedRows.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type as 'public' | 'private',
                unreadCount: 0,
                allowedRoles: (c as any).allowed_roles
            }));
        }

        // FRICTIONLESS: RBAC channel filtering bypassed — all channels visible to all users
        return channels;
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
            .order('timestamp', { ascending: false }) // Fetch NEWEST first
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching messages:', error);
            return { messages: [], hasMore: false };
        }

        const messages: ChatMessage[] = (data || []).map(mapRowToMessage).reverse(); // Reverse back to chronological

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

        const message = mapRowToMessage(data);
        message.isMe = true;

        // Skip logging system level messages to avoid bloating the audit log excessively,
        // but log actual human team chat.
        if (senderId !== 'system' && senderId !== '00000000-0000-0000-0000-000000000000') {
            AuditService.log('TEAM_CHAT_MESSAGE_SENT', {
                channelId,
                messageId: message.id,
                hasAttachments: (attachments && attachments.length > 0)
            }, senderId);
        }

        return message;
    },

    subscribeToMessages: (channelId: string, callback: (payload: any) => void) => {
        // Ensure initialized
        ChatService.initialize();

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
                    // Start async process to fetch sender details if needed, 
                    // but for now we map what we have.
                    // IMPORTANT: The callback likely expects a ChatMessage object, not raw row.
                    const message = mapRowToMessage(payload.new);
                    callback(message);
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
            return `dm-${userId1}`;
        }
        const ids = [userId1, userId2].sort();
        return `dm-${ids[0]}-${ids[1]}`;
    },

    getChannelDisplay: (channelId: string, users: ChatUser[]) => {
        if (channelId.startsWith('dm-')) {
            const userIds = channelId.replace('dm-', '').split('-');
            const otherUserId = userIds.find(id => id !== 'current-user'); // Logic needs actual current user ID
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

    getNotifications: async (): Promise<ChatNotification[]> => {
        ChatService.initialize();
        // Fetch from notifications table filtering by chat types
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .in('type', ['mention', 'reply', 'channel_invite', 'system'])
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map(n => ({
            id: n.id,
            userId: n.user_id,
            channelId: n.metadata?.channelId || '',
            messageId: n.metadata?.messageId,
            title: n.title,
            message: n.message,
            type: n.type as any,
            isRead: n.is_read,
            createdAt: n.created_at
        }));
    },

    markNotificationRead: async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },

    markAllNotificationsRead: async () => {
        const user = await getCurrentUser();
        if (user) {
            await supabase.from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .in('type', ['mention', 'reply', 'channel_invite', 'system']);
        }
    },

    markChannelAsRead: async (channelId: string) => {
        // Upsert chat_reads
        const user = await getCurrentUser();
        if (user) {
            await supabase.from('chat_reads').upsert({
                channel_id: channelId,
                user_id: user.id,
                last_read_at: new Date().toISOString()
            });
        }
    },

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

    isConnected: () => !!supabase.realtime.accessToken, // weak check but better than true
    startTyping: () => { },
    stopTyping: () => { },
    joinChannel: () => { },
    leaveChannel: () => { }
};

export default ChatService;
