import { Router, Request, Response } from 'express';
import { query, transaction } from '../database';
import { ChatMessage } from '../../types';
import { sendNotificationEmail } from '../services/emailService';
import { validate, validateUuidParam, messageSchema, reactionSchema } from '../middleware/validation';
import { messageLimiter, searchLimiter } from '../middleware/rateLimiting';
import { sanitizeMessage } from '../../utils/sanitization';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

// GET /api/channels/:channelId/messages - Get messages for a channel (paginated)
router.get('/:channelId/messages',
  validateUuidParam('channelId'),
  async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { limit = '50', offset = '0', parentMessageId } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      /*
      // Check if user has access to this channel
      const accessCheck = await query(`
      SELECT 1 FROM chat_channels c
      LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
      WHERE c.id = $1 AND (c.type = 'public' OR cm.user_id IS NOT NULL)
    `, [channelId, userId]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this channel' });
      }
      */

      // Build query based on whether we're fetching thread replies or main messages
      const whereClause = parentMessageId
        ? 'AND m.parent_message_id = $3'
        : 'AND m.parent_message_id IS NULL';

      const params = parentMessageId
        ? [channelId, parseInt(limit as string), parseInt(offset as string), parentMessageId]
        : [channelId, parseInt(limit as string), parseInt(offset as string)];

      const result = await query(`
      SELECT 
        m.id,
        m.channel_id as "channelId",
        m.text,
        m.sender_id as "senderId",
        m.sender_name as "senderName",
        m.sender_avatar as "senderAvatar",
        m.parent_message_id as "parentMessageId",
        m.mentions,
        m.created_at as "timestamp",
        m.edited_at as "editedAt",
        m.is_deleted as "isDeleted",
        m.is_system as "isSystem",
        
        -- Reactions
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'emoji', r.emoji,
                'count', r.count,
                'users', r.users
              )
            )
            FROM (
              SELECT 
                emoji,
                COUNT(*) as count,
                json_agg(
                  json_build_object('id', user_id, 'name', user_name)
                ) as users
              FROM chat_message_reactions
              WHERE message_id = m.id
              GROUP BY emoji
            ) r
          ),
          '[]'::json
        ) AS reactions,
        
        -- Attachments
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'fileName', a.file_name,
                'fileSize', a.file_size,
                'fileType', a.file_type,
                'mimeType', a.mime_type,
                'uploadedBy', a.uploaded_by,
                'uploadedAt', a.uploaded_at
              )
            )
            FROM chat_message_attachments a
            WHERE a.message_id = m.id
          ),
          '[]'::json
        ) AS attachments,
        
        -- Reply count
        (
          SELECT COUNT(*)
          FROM chat_messages replies
          WHERE replies.parent_message_id = m.id AND replies.is_deleted = FALSE
        ) AS "replyCount"
        
      FROM chat_messages m
      WHERE m.channel_id = $1 ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, params);

      // Mark messages as read
      if (result.rows.length > 0) {
        await query('SELECT mark_channel_read($1, $2)', [channelId, userId]);
      }

      res.json({
        messages: result.rows.reverse(), // Return in chronological order
        hasMore: result.rows.length === parseInt(limit as string),
      });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        error: 'Failed to fetch messages',
        message: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  });

// POST /api/channels/:channelId/messages - Send a new message
router.post('/:channelId/messages',
  validateUuidParam('channelId'),
  validate(messageSchema),
  messageLimiter,
  async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { text, parentMessageId } = req.body;
      const userId = req.user?.id;
      const userName = req.user?.name;
      const userAvatar = req.user?.avatar;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      /*
      // Check if user has access to this channel
      const accessCheck = await query(`
      SELECT 1 FROM chat_channels c
      LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
      WHERE c.id = $1 AND (c.type = 'public' OR cm.user_id IS NOT NULL)
    `, [channelId, userId]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this channel' });
      }
      */

      // Extract mentions from text (@username)
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]);
      }

      const result = await query(`
      INSERT INTO chat_messages (
        channel_id, text, sender_id, sender_name, sender_avatar, parent_message_id, mentions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [channelId, text, userId, userName, userAvatar, parentMessageId, JSON.stringify(mentions)]);

      const message = result.rows[0];

      // Create notifications for mentions
      if (mentions.length > 0) {
        const io = req.app.get('io');

        for (const mention of mentions) {
          // 1. Check if it's a direct user mention
          const userResult = await query(`
          SELECT user_id, user_name
          FROM chat_channel_members
          WHERE channel_id = $1 
          AND LOWER(user_name) = LOWER($2)
        `, [channelId, mention]);

          let targets: { user_id: string, user_name?: string }[] = [];

          if (userResult.rows.length > 0) {
            targets = [userResult.rows[0]];
          } else {
            // 2. Check if it's a role mention (e.g. @admin)
            const roleResult = await query(`
            SELECT user_id, user_name
            FROM chat_channel_members
            WHERE channel_id = $1 
            AND LOWER(role) = LOWER($2)
          `, [channelId, mention]);

            if (roleResult.rows.length > 0) {
              targets = roleResult.rows;
            }
          }

          // Send notifications to all targets
          for (const target of targets) {
            // Don't notify self
            if (target.user_id === userId) continue;

            // Create notification
            const notifResult = await query(`
             SELECT create_mention_notification($1, $2, $3, $4) as id
           `, [target.user_id, channelId, message.id, userName]);

            const notificationId = notifResult.rows[0].id;

            // Emit real-time notification
            if (io) {
              io.to(`user:${target.user_id}`).emit('notification:new', {
                id: notificationId,
                type: 'mention',
                title: 'You were mentioned',
                message: `${userName} mentioned you in a message`,
                channelId,
                messageId: message.id,
                isRead: false,
                createdAt: new Date().toISOString()
              });
            }

            // Send Email Notification (Mock)
            try {
              // In a real app involving users table join would be better
              const userEmailResult = await query('SELECT email FROM users WHERE id = $1', [target.user_id]);
              if (userEmailResult.rows.length > 0) {
                await sendNotificationEmail(
                  userEmailResult.rows[0].email,
                  target.user_name || 'User',
                  userName || 'User',
                  text,
                  channelId
                );
              }
            } catch (err) {
              console.error('Failed to send email notification', err);
            }
          }
        }
      }

      res.status(201).json({
        id: message.id,
        channelId: message.channel_id,
        text: message.text,
        senderId: message.sender_id,
        senderName: message.sender_name,
        senderAvatar: message.sender_avatar,
        parentMessageId: message.parent_message_id,
        mentions: message.mentions,
        timestamp: message.created_at,
        reactions: [],
        attachments: [],
        isSystem: false,
        isDeleted: false,
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        message: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  });

// PUT /api/messages/:id - Edit a message
router.put('/:id',
  validateUuidParam('id'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      // Check if user owns this message
      const ownerCheck = await query(`
      SELECT sender_id FROM chat_messages WHERE id = $1
    `, [id]);

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (ownerCheck.rows[0].sender_id !== userId) {
        return res.status(403).json({ error: 'You can only edit your own messages' });
      }

      const result = await query(`
      UPDATE chat_messages
      SET text = $2, edited_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, text]);

      res.json({
        id: result.rows[0].id,
        text: result.rows[0].text,
        editedAt: result.rows[0].edited_at,
      });
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({ error: 'Failed to edit message' });
    }
  });

// DELETE /api/messages/:id - Delete a message
router.delete('/:id',
  validateUuidParam('id'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user owns this message or is channel admin
      const ownerCheck = await query(`
      SELECT m.sender_id, m.channel_id, cm.role
      FROM chat_messages m
      LEFT JOIN chat_channel_members cm ON cm.channel_id = m.channel_id AND cm.user_id = $2
      WHERE m.id = $1
    `, [id, userId]);

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const isOwner = ownerCheck.rows[0].sender_id === userId;
      const isAdmin = ownerCheck.rows[0].role && ['owner', 'admin'].includes(ownerCheck.rows[0].role);

      // Bypass access restrictions to let everyone delete anything
      /*
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'You can only delete your own messages or be a channel admin' });
      }
      */

      // Soft delete
      await query(`
      UPDATE chat_messages
      SET is_deleted = TRUE, text = '[Message deleted]'
      WHERE id = $1
    `, [id]);

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

// POST /api/messages/:id/reactions - Add a reaction to a message
router.post('/:id/reactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    await query(`
      INSERT INTO chat_message_reactions (message_id, emoji, user_id, user_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (message_id, emoji, user_id) DO NOTHING
    `, [id, emoji, userId, userName]);

    // Get updated reactions
    const result = await query(`
      SELECT 
        emoji,
        COUNT(*) as count,
        json_agg(
          json_build_object('id', user_id, 'name', user_name)
        ) as users
      FROM chat_message_reactions
      WHERE message_id = $1
      GROUP BY emoji
    `, [id]);

    res.json({ reactions: result.rows });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// DELETE /api/messages/:id/reactions/:emoji - Remove a reaction
router.delete('/:id/reactions/:emoji',
  validateUuidParam('id'),
  async (req: Request, res: Response) => {
    try {
      const { id, emoji } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await query(`
      DELETE FROM chat_message_reactions
      WHERE message_id = $1 AND emoji = $2 AND user_id = $3
    `, [id, decodeURIComponent(emoji), userId]);

      res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ error: 'Failed to remove reaction' });
    }
  });

export default router;
