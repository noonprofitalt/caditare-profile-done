import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../database';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
}

export const setupChatSocket = (io: SocketIOServer) => {
    // Authentication middleware for Socket.IO
    io.use((socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;

            // Dev mode bypass for mock tokens
            if (process.env.NODE_ENV !== 'production' && token === 'mock-jwt-token') {
                socket.userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Standard test UUID
                socket.userName = 'Test Admin';
                return next();
            }

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
            const decoded = jwt.verify(token, secret) as any;

            socket.userId = decoded.id || decoded.userId;
            socket.userName = decoded.name;

            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`✅ User connected: ${socket.userName} (${socket.userId})`);

        // Join user's personal room for direct notifications
        socket.join(`user:${socket.userId}`);

        // Broadcast user online status
        io.emit('user:online', { userId: socket.userId });

        // ========================================================================
        // CHANNEL EVENTS
        // ========================================================================

        // Join a channel room
        socket.on('channel:join', async (data: { channelId: string }) => {
            try {
                const { channelId } = data;

                // Verify user has access to this channel
                const accessCheck = await query(`
          SELECT 1 FROM chat_channels c
          LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
          WHERE c.id = $1 AND (c.type = 'public' OR cm.user_id IS NOT NULL)
        `, [channelId, socket.userId]);

                if (accessCheck.rows.length > 0) {
                    socket.join(`channel:${channelId}`);
                    console.log(`User ${socket.userName} joined channel ${channelId}`);
                }
            } catch (error) {
                console.error('Error joining channel:', error);
            }
        });

        // Leave a channel room
        socket.on('channel:leave', (data: { channelId: string }) => {
            const { channelId } = data;
            socket.leave(`channel:${channelId}`);
            console.log(`User ${socket.userName} left channel ${channelId}`);
        });

        // ========================================================================
        // MESSAGE EVENTS
        // ========================================================================

        // Send a message
        socket.on('message:send', async (data: { channelId: string; text: string; parentMessageId?: string }) => {
            try {
                const { channelId, text, parentMessageId } = data;

                // Verify access
                const accessCheck = await query(`
          SELECT 1 FROM chat_channels c
          LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
          WHERE c.id = $1 AND (c.type = 'public' OR cm.user_id IS NOT NULL)
        `, [channelId, socket.userId]);

                if (accessCheck.rows.length === 0) {
                    socket.emit('error', { message: 'Access denied to this channel' });
                    return;
                }

                // Extract mentions
                const mentionRegex = /@(\w+)/g;
                const mentions: string[] = [];
                let match;
                while ((match = mentionRegex.exec(text)) !== null) {
                    mentions.push(match[1]);
                }

                // Insert message
                const result = await query(`
          INSERT INTO chat_messages (
            channel_id, text, sender_id, sender_name, parent_message_id, mentions
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [channelId, text, socket.userId, socket.userName, parentMessageId, JSON.stringify(mentions)]);

                const message = result.rows[0];

                // Broadcast to channel
                io.to(`channel:${channelId}`).emit('message:new', {
                    id: message.id,
                    channelId: message.channel_id,
                    text: message.text,
                    senderId: message.sender_id,
                    senderName: message.sender_name,
                    parentMessageId: message.parent_message_id,
                    mentions: message.mentions,
                    timestamp: message.created_at,
                    reactions: [],
                    attachments: [],
                    isSystem: false,
                    isDeleted: false,
                });

                // Create notifications for mentions
                if (mentions.length > 0) {
                    // TODO: Resolve mentions to user IDs and send notifications
                }
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Edit a message
        socket.on('message:edit', async (data: { messageId: string; text: string }) => {
            try {
                const { messageId, text } = data;

                // Verify ownership
                const ownerCheck = await query(`
          SELECT sender_id, channel_id FROM chat_messages WHERE id = $1
        `, [messageId]);

                if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].sender_id !== socket.userId) {
                    socket.emit('error', { message: 'You can only edit your own messages' });
                    return;
                }

                // Update message
                const result = await query(`
          UPDATE chat_messages
          SET text = $2, edited_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `, [messageId, text]);

                const message = result.rows[0];

                // Broadcast to channel
                io.to(`channel:${message.channel_id}`).emit('message:updated', {
                    id: message.id,
                    text: message.text,
                    editedAt: message.edited_at,
                });
            } catch (error) {
                console.error('Error editing message:', error);
                socket.emit('error', { message: 'Failed to edit message' });
            }
        });

        // Delete a message
        socket.on('message:delete', async (data: { messageId: string }) => {
            try {
                const { messageId } = data;

                // Verify ownership or admin
                const ownerCheck = await query(`
          SELECT m.sender_id, m.channel_id, cm.role
          FROM chat_messages m
          LEFT JOIN chat_channel_members cm ON cm.channel_id = m.channel_id AND cm.user_id = $2
          WHERE m.id = $1
        `, [messageId, socket.userId]);

                if (ownerCheck.rows.length === 0) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }

                const isOwner = ownerCheck.rows[0].sender_id === socket.userId;
                const isAdmin = ownerCheck.rows[0].role && ['owner', 'admin'].includes(ownerCheck.rows[0].role);

                if (!isOwner && !isAdmin) {
                    socket.emit('error', { message: 'You can only delete your own messages or be a channel admin' });
                    return;
                }

                // Soft delete
                await query(`
          UPDATE chat_messages
          SET is_deleted = TRUE, text = '[Message deleted]'
          WHERE id = $1
        `, [messageId]);

                // Broadcast to channel
                io.to(`channel:${ownerCheck.rows[0].channel_id}`).emit('message:deleted', {
                    messageId,
                    channelId: ownerCheck.rows[0].channel_id,
                });
            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('error', { message: 'Failed to delete message' });
            }
        });

        // ========================================================================
        // REACTION EVENTS
        // ========================================================================

        // Add reaction
        socket.on('reaction:add', async (data: { messageId: string; emoji: string }) => {
            try {
                const { messageId, emoji } = data;

                // Get message channel
                const messageCheck = await query(`
          SELECT channel_id FROM chat_messages WHERE id = $1
        `, [messageId]);

                if (messageCheck.rows.length === 0) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }

                const channelId = messageCheck.rows[0].channel_id;

                // Add reaction
                await query(`
          INSERT INTO chat_message_reactions (message_id, emoji, user_id, user_name)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (message_id, emoji, user_id) DO NOTHING
        `, [messageId, emoji, socket.userId, socket.userName]);

                // Get updated reactions
                const result = await query(`
          SELECT 
            emoji,
            COUNT(*) as count,
            json_agg(
              json_build_object('id', user_id, 'name', user_name)
            ) as users
          FROM chat_message_reactions
          WHERE message_id = $1 AND emoji = $2
          GROUP BY emoji
        `, [messageId, emoji]);

                // Broadcast to channel
                io.to(`channel:${channelId}`).emit('reaction:added', {
                    messageId,
                    reaction: result.rows[0],
                });
            } catch (error) {
                console.error('Error adding reaction:', error);
                socket.emit('error', { message: 'Failed to add reaction' });
            }
        });

        // Remove reaction
        socket.on('reaction:remove', async (data: { messageId: string; emoji: string }) => {
            try {
                const { messageId, emoji } = data;

                // Get message channel
                const messageCheck = await query(`
          SELECT channel_id FROM chat_messages WHERE id = $1
        `, [messageId]);

                if (messageCheck.rows.length === 0) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }

                const channelId = messageCheck.rows[0].channel_id;

                // Remove reaction
                await query(`
          DELETE FROM chat_message_reactions
          WHERE message_id = $1 AND emoji = $2 AND user_id = $3
        `, [messageId, emoji, socket.userId]);

                // Broadcast to channel
                io.to(`channel:${channelId}`).emit('reaction:removed', {
                    messageId,
                    emoji,
                    userId: socket.userId,
                });
            } catch (error) {
                console.error('Error removing reaction:', error);
                socket.emit('error', { message: 'Failed to remove reaction' });
            }
        });

        // ========================================================================
        // TYPING INDICATORS
        // ========================================================================

        // User started typing
        socket.on('typing:start', async (data: { channelId: string }) => {
            try {
                const { channelId } = data;

                // Insert/update typing indicator
                await query(`
          INSERT INTO chat_typing_indicators (channel_id, user_id, user_name)
          VALUES ($1, $2, $3)
          ON CONFLICT (channel_id, user_id) 
          DO UPDATE SET started_at = CURRENT_TIMESTAMP
        `, [channelId, socket.userId, socket.userName]);

                // Get all typing users for this channel
                const result = await query(`
          SELECT user_id as "userId", user_name as "userName", started_at as "startedAt"
          FROM chat_typing_indicators
          WHERE channel_id = $1 AND user_id != $2
        `, [channelId, socket.userId]);

                // Broadcast to others in channel
                socket.to(`channel:${channelId}`).emit('typing:update', result.rows);
            } catch (error) {
                console.error('Error updating typing indicator:', error);
            }
        });

        // User stopped typing
        socket.on('typing:stop', async (data: { channelId: string }) => {
            try {
                const { channelId } = data;

                // Remove typing indicator
                await query(`
          DELETE FROM chat_typing_indicators
          WHERE channel_id = $1 AND user_id = $2
        `, [channelId, socket.userId]);

                // Get remaining typing users
                const result = await query(`
          SELECT user_id as "userId", user_name as "userName", started_at as "startedAt"
          FROM chat_typing_indicators
          WHERE channel_id = $1
        `, [channelId]);

                // Broadcast to channel
                io.to(`channel:${channelId}`).emit('typing:update', result.rows);
            } catch (error) {
                console.error('Error removing typing indicator:', error);
            }
        });

        // ========================================================================
        // DISCONNECT
        // ========================================================================

        socket.on('disconnect', async () => {
            console.log(`❌ User disconnected: ${socket.userName} (${socket.userId})`);

            // Clean up typing indicators
            await query(`
        DELETE FROM chat_typing_indicators WHERE user_id = $1
      `, [socket.userId]);

            // Broadcast user offline status
            io.emit('user:offline', { userId: socket.userId });
        });
    });

    // Periodic cleanup of old typing indicators
    setInterval(async () => {
        try {
            await query('SELECT cleanup_old_typing_indicators()');
        } catch (error) {
            console.error('Error cleaning up typing indicators:', error);
        }
    }, 5000); // Every 5 seconds
};
