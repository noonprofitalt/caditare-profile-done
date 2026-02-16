/// <reference types="node" />
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatChannel, ChatMessage, TypingIndicator } from '../types';
import ChatService from '../services/chatService';

/**
 * Hook for managing chat channels
 */
export const useChannels = () => {
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChannels = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ChatService.getChannels();
            setChannels(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch channels');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    return { channels, loading, error, refetch: fetchChannels };
};

/**
 * Hook for managing messages in a channel
 */
export const useMessages = (channelId: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = useCallback(async (offset = 0) => {
        if (!channelId) return;

        try {
            setLoading(true);
            const data = await ChatService.getMessages(channelId, { limit: 50, offset });

            if (offset === 0) {
                setMessages(data.messages);
            } else {
                setMessages(prev => [...data.messages, ...prev]);
            }

            setHasMore(data.hasMore);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    // Load initial messages when channel changes
    useEffect(() => {
        if (channelId) {
            setMessages([]);
            setHasMore(true);
            fetchMessages(0);
        }
    }, [channelId, fetchMessages]);

    // Subscribe to real-time message events
    useEffect(() => {
        if (!channelId) return;

        const handleNewMessage = (message: ChatMessage) => {
            if (message.channelId === channelId) {
                setMessages(prev => [...prev, message]);
            }
        };

        const handleMessageUpdated = (data: { id: string; text: string; editedAt: string }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === data.id ? { ...msg, text: data.text, editedAt: data.editedAt } : msg
                )
            );
        };

        const handleMessageDeleted = (data: { messageId: string; channelId: string }) => {
            if (data.channelId === channelId) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === data.messageId ? { ...msg, isDeleted: true, text: '[Message deleted]' } : msg
                    )
                );
            }
        };

        const handleReactionAdded = (data: { messageId: string; reaction: any }) => {
            setMessages(prev =>
                prev.map(msg => {
                    if (msg.id === data.messageId) {
                        const reactions = msg.reactions || [];
                        const existingIndex = reactions.findIndex(r => r.emoji === data.reaction.emoji);
                        const newReactions = [...reactions];

                        if (existingIndex >= 0) {
                            newReactions[existingIndex] = data.reaction;
                        } else {
                            newReactions.push(data.reaction);
                        }
                        return { ...msg, reactions: newReactions };
                    }
                    return msg;
                })
            );
        };

        const handleReactionRemoved = (data: { messageId: string; emoji: string; userId: string }) => {
            setMessages(prev =>
                prev.map(msg => {
                    if (msg.id === data.messageId && msg.reactions) {
                        const newReactions = msg.reactions.map(r => {
                            if (r.emoji === data.emoji) {
                                const users = r.users.filter(u => u.id !== data.userId);
                                return { ...r, count: users.length, users };
                            }
                            return r;
                        }).filter(r => r.count > 0);
                        return { ...msg, reactions: newReactions };
                    }
                    return msg;
                })
            );
        };

        ChatService.on('message:new', handleNewMessage);
        ChatService.on('message:updated', handleMessageUpdated);
        ChatService.on('message:deleted', handleMessageDeleted);
        ChatService.on('reaction:added', handleReactionAdded);
        ChatService.on('reaction:removed', handleReactionRemoved);

        return () => {
            ChatService.off('message:new', handleNewMessage);
            ChatService.off('message:updated', handleMessageUpdated);
            ChatService.off('message:deleted', handleMessageDeleted);
            ChatService.off('reaction:added', handleReactionAdded);
            ChatService.off('reaction:removed', handleReactionRemoved);
        };
    }, [channelId]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchMessages(messages.length);
        }
    }, [loading, hasMore, messages.length, fetchMessages]);

    return { messages, loading, hasMore, error, loadMore, refetch: () => fetchMessages(0) };
};

/**
 * Hook for managing typing indicators
 */
export const useTypingIndicators = (channelId: string | null) => {
    const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!channelId) return;

        const handleTypingUpdate = (data: TypingIndicator[]) => {
            setTypingUsers(data);
        };

        ChatService.on('typing:update', handleTypingUpdate);

        return () => {
            ChatService.off('typing:update', handleTypingUpdate);
        };
    }, [channelId]);

    const startTyping = useCallback(() => {
        if (!channelId) return;

        ChatService.startTyping(channelId);

        // Auto-stop typing after 3 seconds
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            ChatService.stopTyping(channelId);
        }, 3000);
    }, [channelId]);

    const stopTyping = useCallback(() => {
        if (!channelId) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        ChatService.stopTyping(channelId);
    }, [channelId]);

    return { typingUsers, startTyping, stopTyping };
};

/**
 * Hook for managing Socket.IO connection
 */
export const useSocketConnection = () => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleConnectionStatus = (data: { connected: boolean; reason?: string }) => {
            setConnected(data.connected);
            if (!data.connected && data.reason) {
                setError(`Disconnected: ${data.reason}`);
            } else {
                setError(null);
            }
        };

        const handleConnectionError = (data: { error: string }) => {
            setError(data.error);
        };

        ChatService.on('connection:status', handleConnectionStatus);
        ChatService.on('connection:error', handleConnectionError);

        // Check initial connection status
        setConnected(ChatService.isConnected());

        return () => {
            ChatService.off('connection:status', handleConnectionStatus);
            ChatService.off('connection:error', handleConnectionError);
        };
    }, []);

    return { connected, error };
};

/**
 * Hook for managing message reactions
 */
export const useReactions = () => {
    const [messages, setMessages] = useState<Map<string, ChatMessage>>(new Map());

    useEffect(() => {
        const handleReactionAdded = (data: { messageId: string; reaction: any }) => {
            setMessages(prev => {
                const newMap = new Map(prev);
                const message = newMap.get(data.messageId);
                if (message) {
                    const reactions = message.reactions || [];
                    const existingIndex = reactions.findIndex(r => r.emoji === data.reaction.emoji);

                    if (existingIndex >= 0) {
                        reactions[existingIndex] = data.reaction;
                    } else {
                        reactions.push(data.reaction);
                    }

                    newMap.set(data.messageId, { ...message, reactions });
                }
                return newMap;
            });
        };

        const handleReactionRemoved = (data: { messageId: string; emoji: string; userId: string }) => {
            setMessages(prev => {
                const newMap = new Map(prev);
                const message = newMap.get(data.messageId);
                if (message && message.reactions) {
                    const reactions = message.reactions.map(r => {
                        if (r.emoji === data.emoji) {
                            const users = r.users.filter(u => u.id !== data.userId);
                            return { ...r, count: users.length, users };
                        }
                        return r;
                    }).filter(r => r.count > 0);

                    newMap.set(data.messageId, { ...message, reactions });
                }
                return newMap;
            });
        };

        ChatService.on('reaction:added', handleReactionAdded);
        ChatService.on('reaction:removed', handleReactionRemoved);

        return () => {
            ChatService.off('reaction:added', handleReactionAdded);
            ChatService.off('reaction:removed', handleReactionRemoved);
        };
    }, []);

    const addReaction = useCallback((messageId: string, emoji: string) => {
        ChatService.addReaction(messageId, emoji);
    }, []);

    const removeReaction = useCallback((messageId: string, emoji: string) => {
        ChatService.removeReaction(messageId, emoji);
    }, []);

    return { addReaction, removeReaction };
};

/**
 * Hook for debouncing typing indicators
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook for managing channel join/leave
 */
export const useChannelSubscription = (channelId: string | null) => {
    useEffect(() => {
        if (channelId) {
            ChatService.joinChannel(channelId);
            ChatService.markChannelAsRead(channelId);

            return () => {
                ChatService.leaveChannel(channelId);
            };
        }
    }, [channelId]);
};
