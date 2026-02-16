import { io, Socket } from 'socket.io-client';
import { ChatMessage, TypingIndicator, ChatNotification, MessageReaction } from '../types';

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    // Event listeners
    private eventListeners: Map<string, Set<Function>> = new Map();

    /**
     * Initialize and connect to Socket.IO server
     */
    connect(token: string): void {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

        this.socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
        });

        this.setupEventHandlers();
    }

    /**
     * Disconnect from Socket.IO server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.eventListeners.clear();
        }
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Setup core Socket.IO event handlers
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);
            this.reconnectAttempts = 0;
            this.emit('connection:status', { connected: true });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            this.emit('connection:status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.emit('connection:error', { error: 'Failed to connect after multiple attempts' });
            }
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.emit('socket:error', error);
        });

        // Chat-specific events
        this.socket.on('message:new', (message: ChatMessage) => {
            this.emit('message:new', message);
        });

        this.socket.on('message:updated', (data: { id: string; text: string; editedAt: string }) => {
            this.emit('message:updated', data);
        });

        this.socket.on('message:deleted', (data: { messageId: string; channelId: string }) => {
            this.emit('message:deleted', data);
        });

        this.socket.on('reaction:added', (data: { messageId: string; reaction: MessageReaction }) => {
            this.emit('reaction:added', data);
        });

        this.socket.on('reaction:removed', (data: { messageId: string; emoji: string; userId: string }) => {
            this.emit('reaction:removed', data);
        });

        this.socket.on('typing:update', (data: TypingIndicator[]) => {
            this.emit('typing:update', data);
        });

        this.socket.on('user:online', (data: { userId: string }) => {
            this.emit('user:online', data);
        });

        this.socket.on('user:offline', (data: { userId: string }) => {
            this.emit('user:offline', data);
        });

        this.socket.on('notification:new', (notification: ChatNotification) => {
            this.emit('notification:new', notification);
        });
    }

    /**
     * Join a channel room
     */
    joinChannel(channelId: string): void {
        if (!this.socket?.connected) {
            console.error('Socket not connected');
            return;
        }
        this.socket.emit('channel:join', { channelId });
    }

    /**
     * Leave a channel room
     */
    leaveChannel(channelId: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit('channel:leave', { channelId });
    }

    /**
     * Send a message
     */
    sendMessage(channelId: string, text: string, parentMessageId?: string): void {
        if (!this.socket?.connected) {
            console.error('Socket not connected');
            return;
        }
        this.socket.emit('message:send', { channelId, text, parentMessageId });
    }

    /**
     * Edit a message
     */
    editMessage(messageId: string, text: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit('message:edit', { messageId, text });
    }

    /**
     * Delete a message
     */
    deleteMessage(messageId: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit('message:delete', { messageId });
    }

    /**
     * Add a reaction to a message
     */
    addReaction(messageId: string, emoji: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit('reaction:add', { messageId, emoji });
    }

    /**
     * Remove a reaction from a message
     */
    removeReaction(messageId: string, emoji: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit('reaction:remove', { messageId, emoji });
    }

    /**
     * Notify that user started typing
     */
    startTyping(channelId: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit('typing:start', { channelId });
    }

    /**
     * Notify that user stopped typing
     */
    stopTyping(channelId: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit('typing:stop', { channelId });
    }

    /**
     * Subscribe to an event
     */
    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    /**
     * Emit an event to all listeners
     */
    private emit(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get socket ID
     */
    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
