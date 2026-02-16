import { Router, Request, Response } from 'express';
import { query } from '../database';

const router = Router();

// GET /api/notifications - Get all notifications for the current user
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await query(`
            SELECT 
                n.id,
                n.type,
                n.title,
                n.message,
                n.channel_id as "channelId",
                n.message_id as "messageId",
                n.is_read as "isRead",
                n.created_at as "createdAt",
                c.name as "channelName"
            FROM chat_notifications n
            LEFT JOIN chat_channels c ON c.id = n.channel_id
            WHERE n.user_id = $1
            ORDER BY n.created_at DESC
            LIMIT 50
        `, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// POST /api/notifications/:id/read - Mark a notification as read
router.post('/:id/read', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await query(`
            UPDATE chat_notifications
            SET is_read = TRUE
            WHERE id = $1 AND user_id = $2
        `, [id, userId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await query(`
            UPDATE chat_notifications
            SET is_read = TRUE
            WHERE user_id = $1 AND is_read = FALSE
        `, [userId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

export default router;
