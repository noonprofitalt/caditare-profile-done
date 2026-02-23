import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChatService } from '../services/chatService';
import { useAuth } from './AuthContext';
import { ChatChannel, ChatMessage, ChatUser, ChatMessageContext, ChatAttachment } from '../types';

interface ChatState {
    channels: ChatChannel[];
    users: ChatUser[];
    activeChannelId: string | null;
    messages: ChatMessage[];
    isTyping: boolean;
    searchQuery: string;
    filterType: 'all' | 'channels' | 'dms';
    isLoading: boolean;
    isMobileSidebarOpen: boolean;
}

interface ChatContextType extends ChatState {
    setActiveChannelId: (id: string | null) => void;
    sendMessage: (text: string, context?: ChatMessageContext, attachments?: ChatAttachment[]) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setFilterType: (type: 'all' | 'channels' | 'dms') => void;
    toggleMobileSidebar: () => void;
    refreshData: () => Promise<void>;
    createChannel: (name: string, type: 'public' | 'private') => Promise<void>;
    deleteChannel: (id: string) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    removeReaction: (messageId: string, emoji: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [state, setState] = useState<ChatState>({
        channels: [],
        users: [],
        activeChannelId: 'c1', // Default to General
        messages: [],
        isTyping: false,
        searchQuery: '',
        filterType: 'all',
        isLoading: true,
        isMobileSidebarOpen: true
    });

    const refreshData = useCallback(async () => {
        try {
            const [channelsData, usersData] = await Promise.all([
                ChatService.getChannels(),
                ChatService.getUsers()
            ]);
            setState(prev => ({ ...prev, channels: channelsData, users: usersData, isLoading: false }));
        } catch (error) {
            console.error("Failed to refresh chat data", error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    // Initial Load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Message Fetching when Active Channel Changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (state.activeChannelId) {
                const data = await ChatService.getMessages(state.activeChannelId);
                setState(prev => ({ ...prev, messages: data.messages }));

                // On mobile, close sidebar when selecting a channel
                if (window.innerWidth < 768) {
                    setState(prev => ({ ...prev, isMobileSidebarOpen: false }));
                }
            }
        };
        fetchMessages();
    }, [state.activeChannelId]);

    // Real-time Listener (Supabase)
    useEffect(() => {
        if (!state.activeChannelId) return;

        console.log(`[Chat] Subscribing to channel: ${state.activeChannelId}`);
        const unsubscribe = ChatService.subscribeToMessages(state.activeChannelId, (newMsg) => {
            const msg: ChatMessage = {
                id: newMsg.id,
                channelId: newMsg.channel_id,
                text: newMsg.text,
                senderId: newMsg.sender_id,
                senderName: newMsg.sender_name,
                timestamp: newMsg.timestamp,
                attachments: newMsg.attachments || [],
                context: newMsg.context,
                isMe: newMsg.sender_id === currentUser?.id,
                isSystem: newMsg.sender_id === 'system'
            };

            setState(prev => {
                // Avoid duplicates
                if (prev.messages.some(m => m.id === msg.id)) return prev;
                return { ...prev, messages: [...prev.messages, msg] };
            });
        });

        return () => {
            console.log(`[Chat] Unsubscribing from channel: ${state.activeChannelId}`);
            unsubscribe();
        };
    }, [state.activeChannelId, currentUser?.id]);

    const sendMessage = async (text: string, context?: ChatMessageContext, attachments?: ChatAttachment[]) => {
        if (!state.activeChannelId || !currentUser) return;

        // 🚀 Optimistic update for zero-delay user experience
        const tempId = `temp_${Date.now()}`;
        const optimisticMsg: ChatMessage = {
            id: tempId,
            channelId: state.activeChannelId,
            text,
            senderId: currentUser.id,
            senderName: currentUser.name || 'Me',
            timestamp: new Date().toISOString(),
            attachments: attachments || [],
            context,
            isMe: true,
            isSystem: false
        };

        // Add to UI immediately before server computes
        setState(prev => ({ ...prev, messages: [...prev.messages, optimisticMsg] }));

        try {
            await ChatService.sendMessage(
                state.activeChannelId,
                text,
                currentUser.id,
                currentUser.name,
                context,
                attachments
            );
            // The real-time listener will pull the verified message, we can optionally clean up tempId here
            // but the listener usually avoids duplicates gracefully.
        } catch (error) {
            console.error("Failed to send message", error);
            // Revert on failure
            setState(prev => ({
                ...prev,
                messages: prev.messages.filter(m => m.id !== tempId)
            }));
        }
    };

    const addReaction = async (messageId: string, emoji: string) => {
        if (!state.activeChannelId) return;
        await ChatService.addReaction(state.activeChannelId, messageId, emoji);
    };

    const removeReaction = async (messageId: string, emoji: string) => {
        if (!state.activeChannelId) return;
        await ChatService.removeReaction(state.activeChannelId, messageId, emoji);
    };

    const createChannel = async (name: string, type: 'public' | 'private') => {
        const newChannel = await ChatService.createChannel(name, type);
        await refreshData();
        setState(prev => ({ ...prev, activeChannelId: newChannel.id }));
    };

    const deleteChannel = async (id: string) => {
        const success = await ChatService.deleteChannel(id);
        if (success) {
            await refreshData();
            if (state.activeChannelId === id) {
                setState(prev => ({ ...prev, activeChannelId: 'c1' }));
            }
        }
    };

    const setActiveChannelId = (id: string | null) => {
        setState(prev => ({ ...prev, activeChannelId: id }));
    };

    const setSearchQuery = (query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }));
    };

    const setFilterType = (type: 'all' | 'channels' | 'dms') => {
        setState(prev => ({ ...prev, filterType: type }));
    };

    const toggleMobileSidebar = () => {
        setState(prev => ({ ...prev, isMobileSidebarOpen: !prev.isMobileSidebarOpen }));
    };

    return (
        <ChatContext.Provider value={{
            ...state,
            setActiveChannelId,
            sendMessage,
            setSearchQuery,
            setFilterType,
            toggleMobileSidebar,
            refreshData,
            createChannel,
            deleteChannel,
            addReaction,
            removeReaction
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
