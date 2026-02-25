import { Router, Request, Response } from 'express';
import { query, transaction } from '../database';
import { ChatChannel, ChannelMember } from '../../types';
import { validate, validateUuidParam, channelSchema, channelUpdateSchema, addMembersSchema } from '../middleware/validation';
import { channelCreationLimiter } from '../middleware/rateLimiting';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

// GET /api/channels - List all accessible channels for the current user
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.type,
        c.context_type as "contextType",
        c.context_id as "contextId",
        c.created_by as "createdBy",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        c.is_archived as "isArchived",
        (
          SELECT json_agg(json_build_object(
            'userId', cm.user_id,
            'userName', cm.user_name,
            'userAvatar', cm.user_avatar,
            'role', cm.role,
            'joinedAt', cm.joined_at,
            'lastReadAt', cm.last_read_at
          ))
          FROM chat_channel_members cm
          WHERE cm.channel_id = c.id
        ) as members,
        get_unread_count(c.id, $1) as "unreadCount",
        (
          SELECT json_build_object(
            'id', m.id,
            'text', m.text,
            'senderName', m.sender_name,
            'timestamp', m.created_at
          )
          FROM chat_messages m
          WHERE m.channel_id = c.id AND m.is_deleted = FALSE
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as "lastMessage"
      FROM chat_channels c
      LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $1
      WHERE c.is_archived = FALSE
      ORDER BY c.created_at DESC
    `, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

// GET /api/channels/:id - Get a specific channel
router.get('/:id',
    validateUuidParam('id'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const result = await query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.type,
        c.context_type as "contextType",
        c.context_id as "contextId",
        c.created_by as "createdBy",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        (
          SELECT json_agg(json_build_object(
            'userId', cm.user_id,
            'userName', cm.user_name,
            'userAvatar', cm.user_avatar,
            'role', cm.role,
            'joinedAt', cm.joined_at,
            'lastReadAt', cm.last_read_at
          ))
          FROM chat_channel_members cm
          WHERE cm.channel_id = c.id
        ) as members
      FROM chat_channels c
      LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
      WHERE c.id = $1
        AND c.is_archived = FALSE
    `, [id, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching channel:', error);
            res.status(500).json({ error: 'Failed to fetch channel' });
        }
    });

// GET /api/channels/context/:contextType/:contextId - Get channel by context
router.get('/context/:contextType/:contextId', async (req: Request, res: Response) => {
    try {
        const { contextType, contextId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await query(`
            SELECT 
                c.id,
                c.name,
                c.description,
                c.type,
                c.context_type as "contextType",
                c.context_id as "contextId",
                c.created_by as "createdBy",
                c.created_at as "createdAt",
                c.updated_at as "updatedAt",
                (
                    SELECT json_agg(json_build_object(
                        'userId', cm.user_id,
                        'userName', cm.user_name,
                        'userAvatar', cm.user_avatar,
                        'role', cm.role,
                        'joinedAt', cm.joined_at,
                        'lastReadAt', cm.last_read_at
                    ))
                    FROM chat_channel_members cm
                    WHERE cm.channel_id = c.id
            ) as members
            FROM chat_channels c
            JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $3
            WHERE c.context_type = $1 
              AND c.context_id = $2
              AND c.is_archived = FALSE
            LIMIT 1
                `, [contextType, contextId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching channel by context:', error);
        res.status(500).json({ error: 'Failed to fetch channel' });
    }
});

// POST /api/channels - Create a new channel
router.post('/',
    validate(channelSchema),
    channelCreationLimiter,
    async (req: Request, res: Response) => {
        try {
            const { name, description, type, contextType, contextId } = req.body;
            const userId = req.user?.id;
            const userName = req.user?.name;
            const userAvatar = req.user?.avatar;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!name || !type) {
                return res.status(400).json({ error: 'Name and type are required' });
            }

            // Check if channel already exists for this context
            if (contextType && contextId) {
                const existing = await query(`
                SELECT id FROM chat_channels 
                WHERE context_type = $1 AND context_id = $2 AND is_archived = FALSE
                `, [contextType, contextId]);

                if (existing.rows.length > 0) {
                    // Return the existing one (fetching full details in a real app, but here id is enough 
                    // or we can redirect to GET /:id logic, but simpler to return the id to frontend)
                    // Let's fetch the full object to be consistent
                    const fullExisting = await query(`
            SELECT
            c.id, c.name, c.description, c.type,
                c.context_type as "contextType", c.context_id as "contextId",
                c.created_by as "createdBy", c.created_at as "createdAt"
                    FROM chat_channels c WHERE id = $1
                `, [existing.rows[0].id]);

                    // Ensure current user is a member, if not add them?
                    // For system channels, we probably want to ensure membership.
                    await query(`
                    INSERT INTO chat_channel_members(channel_id, user_id, user_name, user_avatar, role)
            VALUES($1, $2, $3, $4, 'member')
                    ON CONFLICT(channel_id, user_id) DO NOTHING
                `, [existing.rows[0].id, userId, userName, userAvatar]);

                    return res.status(200).json(fullExisting.rows[0]);
                }
            }

            const result = await transaction(async (client) => {
                // Create channel
                const channelResult = await client.query(`
        INSERT INTO chat_channels(name, description, type, context_type, context_id, created_by)
            VALUES($1, $2, $3, $4, $5, $6)
            RETURNING *
                `, [name, description, type, contextType, contextId, userId]);

                const channel = channelResult.rows[0];

                // Add creator as owner
                await client.query(`
        INSERT INTO chat_channel_members(channel_id, user_id, user_name, user_avatar, role)
            VALUES($1, $2, $3, $4, 'owner')
                `, [channel.id, userId, userName, userAvatar]);

                return channel;
            });

            res.status(201).json({
                id: result.id,
                name: result.name,
                description: result.description,
                type: result.type,
                contextType: result.context_type,
                contextId: result.context_id,
                createdBy: result.created_by,
                createdAt: result.created_at,
            });
        } catch (error: any) {
            console.error('Error creating channel:', error);
            res.status(500).json({
                error: 'Failed to create channel',
                message: process.env.NODE_ENV !== 'production' ? error.message : undefined
            });
        }
    });

// PUT /api/channels/:id - Update a channel
router.put('/:id',
    validateUuidParam('id'),
    validate(channelUpdateSchema),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Check if user is owner or admin
            const memberCheck = await query(`
      SELECT role FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2 AND role IN('owner', 'admin')
                `, [id, userId]);

            if (memberCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Forbidden: Only channel owners/admins can update' });
            }

            const result = await query(`
      UPDATE chat_channels
      SET name = COALESCE($2, name),
                description = COALESCE($3, description),
                updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
            RETURNING *
                `, [id, name, description]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Channel not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating channel:', error);
            res.status(500).json({ error: 'Failed to update channel' });
        }
    });

// DELETE /api/channels/:id - Delete/archive a channel
router.delete('/:id',
    validateUuidParam('id'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Check if user is owner
            const memberCheck = await query(`
      SELECT role FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2 AND role = 'owner'
                `, [id, userId]);

            if (memberCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Forbidden: Only channel owner can delete' });
            }

            // Archive instead of delete
            await query(`
      UPDATE chat_channels
      SET is_archived = TRUE
      WHERE id = $1
                `, [id]);

            res.json({ message: 'Channel archived successfully' });
        } catch (error) {
            console.error('Error deleting channel:', error);
            res.status(500).json({ error: 'Failed to delete channel' });
        }
    });

// POST /api/channels/:id/members - Add members to a channel
router.post('/:id/members',
    validateUuidParam('id'),
    validate(addMembersSchema),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { userIds } = req.body; // Array of user IDs to add
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({ error: 'userIds array is required' });
            }

            // Check if current user is owner or admin
            const memberCheck = await query(`
      SELECT role FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2 AND role IN('owner', 'admin')
                `, [id, userId]);

            if (memberCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Forbidden: Only channel owners/admins can add members' });
            }

            // Add members (you'd need to fetch user details from your user service)
            const addedMembers = [];
            for (const newUserId of userIds) {
                try {
                    // Fetch actual user details from profiles table
                    const userResult = await query('SELECT full_name, avatar_url FROM profiles WHERE id = $1', [newUserId]);
                    const fullName = userResult.rows[0]?.full_name || 'Anonymous User';
                    const avatarUrl = userResult.rows[0]?.avatar_url || '';

                    const result = await query(`
                        INSERT INTO chat_channel_members(channel_id, user_id, user_name, user_avatar, role)
            VALUES($1, $2, $3, $4, 'member')
                        ON CONFLICT(channel_id, user_id) DO NOTHING
            RETURNING *
                `, [id, newUserId, fullName, avatarUrl]);

                    if (result.rows.length > 0) {
                        addedMembers.push(result.rows[0]);
                    }
                } catch (err) {
                    console.error(`Error adding user ${newUserId}: `, err);
                }
            }

            res.json({ addedMembers });
        } catch (error) {
            console.error('Error adding members:', error);
            res.status(500).json({ error: 'Failed to add members' });
        }
    });

// DELETE /api/channels/:id/members/:userId - Remove a member from a channel
router.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if current user is owner or admin, or removing themselves
        const memberCheck = await query(`
      SELECT role FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2
                `, [id, userId]);

        const isOwnerOrAdmin = memberCheck.rows.length > 0 && ['owner', 'admin'].includes(memberCheck.rows[0].role);
        const isSelf = userId === memberId;

        if (!isOwnerOrAdmin && !isSelf) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await query(`
      DELETE FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2
                `, [id, memberId]);

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// POST /api/channels/:id/read - Mark channel as read
router.post('/:id/read', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await query('SELECT mark_channel_read($1, $2)', [id, userId]);

        res.json({ message: 'Channel marked as read' });
    } catch (error) {
        console.error('Error marking channel as read:', error);
        res.status(500).json({ error: 'Failed to mark channel as read' });
    }
});

export default router;
