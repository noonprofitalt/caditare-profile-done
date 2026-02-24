import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { query } from '../database';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads/chat';
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const dir = path.join(uploadDir, 'attachments', String(year), month);

        try {
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
        } catch (error) {
            cb(error as Error, dir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${uniqueSuffix}-${basename}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});

// POST /api/attachments/upload - Upload file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { messageId } = req.body;

        if (!messageId) {
            return res.status(400).json({ error: 'Message ID is required' });
        }

        // Save attachment record to database
        const result = await query(`
      INSERT INTO chat_message_attachments (
        message_id, file_name, file_size, file_type, mime_type, file_path, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
            messageId,
            req.file.originalname,
            req.file.size,
            path.extname(req.file.originalname).substring(1),
            req.file.mimetype,
            req.file.path,
            userId
        ]);

        const attachment = result.rows[0];

        res.status(201).json({
            id: attachment.id,
            fileName: attachment.file_name,
            fileSize: attachment.file_size,
            fileType: attachment.file_type,
            mimeType: attachment.mime_type,
            uploadedBy: attachment.uploaded_by,
            uploadedAt: attachment.uploaded_at,
        });

        // Emit socket event to update clients
        const io = req.app.get('io');
        if (io) {
            // Fetch updated message with attachments
            const messageResult = await query(`
                SELECT 
                    m.id,
                    m.channel_id,
                    m.text,
                    m.sender_id,
                    m.sender_name,
                    m.sender_avatar,
                    m.parent_message_id,
                    m.mentions,
                    m.created_at,
                    m.edited_at,
                    m.is_deleted,
                    m.is_system,
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
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', a.id,
                                    'file_name', a.file_name,
                                    'file_size', a.file_size,
                                    'file_type', a.file_type,
                                    'mime_type', a.mime_type,
                                    'uploaded_at', a.uploaded_at
                                )
                            )
                            FROM chat_message_attachments a
                            WHERE a.message_id = m.id
                        ),
                        '[]'::json
                    ) AS attachments,
                    (
                        SELECT COUNT(*)
                        FROM chat_messages replies
                        WHERE replies.parent_message_id = m.id AND replies.is_deleted = FALSE
                    ) AS reply_count
                FROM chat_messages m
                WHERE m.id = $1
            `, [messageId]);

            if (messageResult.rows.length > 0) {
                const fullMessage = messageResult.rows[0];
                // camelCase keys for frontend
                const formattedMessage = {
                    id: fullMessage.id,
                    channelId: fullMessage.channel_id,
                    text: fullMessage.text,
                    senderId: fullMessage.sender_id,
                    senderName: fullMessage.sender_name,
                    senderAvatar: fullMessage.sender_avatar,
                    timestamp: fullMessage.created_at,
                    editedAt: fullMessage.edited_at,
                    parentMessageId: fullMessage.parent_message_id,
                    reactions: fullMessage.reactions,
                    attachments: fullMessage.attachments.map((a: any) => ({
                        id: a.id,
                        fileName: a.file_name,
                        fileSize: a.file_size,
                        fileType: a.file_type,
                        mimeType: a.mime_type,
                        uploadedAt: a.uploaded_at
                    })),
                    mentions: fullMessage.mentions,
                    isSystem: fullMessage.is_system,
                    isDeleted: fullMessage.is_deleted,
                    replyCount: fullMessage.reply_count
                };

                io.to(fullMessage.channel_id).emit('message:updated', formattedMessage);
            }
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// GET /api/attachments/:id - Download file
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get attachment details
        const result = await query(`
      SELECT a.*, m.channel_id
      FROM chat_message_attachments a
      JOIN chat_messages m ON m.id = a.message_id
      WHERE a.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const attachment = result.rows[0];

        /*
        // Check if user has access to the channel
        const accessCheck = await query(`
      SELECT 1 FROM chat_channels c
      LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
      WHERE c.id = $1 AND (c.type = 'public' OR cm.user_id IS NOT NULL)
    `, [attachment.channel_id, userId]);

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        */

        // Send file
        res.download(attachment.file_path, attachment.file_name);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// GET /api/attachments/:id/preview - Preview image or PDF
router.get('/:id/preview', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get attachment details
        const result = await query(`
      SELECT a.*, m.channel_id
      FROM chat_message_attachments a
      JOIN chat_messages m ON m.id = a.message_id
      WHERE a.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const attachment = result.rows[0];

        /*
        // Check if user has access to the channel
        const accessCheck = await query(`
      SELECT 1 FROM chat_channels c
      LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = $2
      WHERE c.id = $1 AND (c.type = 'public' OR cm.user_id IS NOT NULL)
    `, [attachment.channel_id, userId]);

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        */

        // Check if file type is previewable
        const previewableTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!previewableTypes.includes(attachment.mime_type)) {
            return res.status(400).json({ error: 'File type not previewable' });
        }

        // Send file with appropriate content type
        res.setHeader('Content-Type', attachment.mime_type);
        res.sendFile(path.resolve(attachment.file_path));
    } catch (error) {
        console.error('Error previewing file:', error);
        res.status(500).json({ error: 'Failed to preview file' });
    }
});

// DELETE /api/attachments/:id - Delete file
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get attachment details
        const result = await query(`
      SELECT a.*, m.sender_id, m.channel_id
      FROM chat_message_attachments a
      JOIN chat_messages m ON m.id = a.message_id
      WHERE a.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const attachment = result.rows[0];

        // FRICTIONLESS: Bypassed ownership/admin check — anyone can delete any attachment
        /*
        const isOwner = attachment.sender_id === userId;

        const adminCheck = await query(`
      SELECT role FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
    `, [attachment.channel_id, userId]);

        const isAdmin = adminCheck.rows.length > 0;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'You can only delete your own attachments or be a channel admin' });
        }
        */

        // Delete file from filesystem
        try {
            await fs.unlink(attachment.file_path);
        } catch (error) {
            console.error('Error deleting file from filesystem:', error);
        }

        // Delete from database
        await query('DELETE FROM chat_message_attachments WHERE id = $1', [id]);

        res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

export default router;
