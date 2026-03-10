/**
 * Chat System Types
 */

export interface ChatUser {
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'busy' | 'offline' | 'away';
    role?: string;
}

export interface ChatChannel {
    id: string;
    name: string;
    type: 'public' | 'private';
    unreadCount: number;
    allowedRoles?: string[];
    lastMessage?: ChatMessage;
}

export interface MessageReaction {
    emoji: string;
    count: number;
    users: Array<{ id: string; name: string }>;
}

export interface ChatAttachment {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'video' | 'file';
    size?: string;
    mimeType?: string;
}

export interface ChatMessageContext {
    type: 'candidate' | 'job' | 'finance' | 'system' | 'CANDIDATE' | 'JOB' | 'SYSTEM_EVENT';
    id: string;
    title?: string;
    label?: string;
    icon?: string;
    metadata?: Record<string, unknown>;
}

export interface ChatMessage {
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
    timestamp: string;
    editedAt?: string;
    isMe?: boolean;
    isSystem?: boolean;
    isDeleted?: boolean;
    isEdited?: boolean;
    reactions?: MessageReaction[];
    attachments?: ChatAttachment[];
    parentMessageId?: string;
    replyCount?: number;
    context?: ChatMessageContext;
}

export interface TypingIndicator {
    userId: string;
    userName: string;
}

export interface ChannelMember {
    userId: string;
    userName: string;
    userAvatar?: string;
    role?: string;
    joinedAt: string;
}

export interface ChatNotification {
    id: string;
    userId: string;
    channelId: string;
    messageId?: string;
    title: string;
    message: string;
    type: 'mention' | 'reply' | 'channel_invite' | 'system';
    isRead: boolean;
    createdAt: string;
}
