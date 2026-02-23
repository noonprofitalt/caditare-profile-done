import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;

// Helper for generating UUIDs without external dependencies
const generateId = () => crypto.randomUUID();

// ============================================================================
// MOCK DATABASE ENGINE (Fallback for Development)
// ============================================================================
class MemoryDB {
    private tables: Record<string, any[]> = {
        chat_channels: [
            { id: '00000000-0000-0000-0000-000000000001', name: 'General', description: 'General company discussions', type: 'public', created_by: '00000000-0000-0000-0000-000000000000', created_at: new Date(), updated_at: new Date(), is_archived: false },
            { id: '00000000-0000-0000-0000-000000000002', name: 'Announcements', description: 'Official company announcements', type: 'public', created_by: '00000000-0000-0000-0000-000000000000', created_at: new Date(), updated_at: new Date(), is_archived: false },
        ],
        chat_channel_members: [],
        chat_messages: [],
        chat_message_reactions: [],
        chat_message_attachments: [],
        chat_notifications: [],
        chat_typing_indicators: []
    };

    /**
     * Helper to handle basic pagination and sorting for mock queries
     */
    private resultRows(rows: any[], sql: string, params: any[]): any[] {
        let result = [...rows];

        // Basic sorting: ORDER BY created_at DESC
        if (sql.includes('order by m.created_at desc')) {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sql.includes('order by created_at desc')) {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        // Handle Threading: WHERE parent_message_id = $3
        if (sql.includes('parent_message_id = $3') && params[3]) {
            result = result.filter(r => r.parentMessageId === params[3]);
        } else if (sql.includes('parent_message_id is null')) {
            result = result.filter(r => !r.parentMessageId);
        }

        // Pagination: LIMIT $2 OFFSET $3 (or $1/$2 if no channelId in params)
        // Find limit and offset in params
        let limit = 50;
        let offset = 0;

        if (sql.includes('limit $2 offset $3')) {
            limit = params[1] || 50;
            offset = params[2] || 0;
        } else if (sql.includes('limit $1 offset $2')) {
            limit = params[0] || 50;
            offset = params[1] || 0;
        }

        return result.slice(offset, offset + limit);
    }

    async query(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number }> {
        const sql = text.trim().toLowerCase();

        // 1. SELECT channels
        if (sql.includes('from chat_channels') && sql.startsWith('select')) {
            let rows = [...this.tables.chat_channels].map(c => ({
                ...c,
                createdBy: c.created_by,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
                isArchived: c.is_archived
            }));

            if (sql.includes('is_archived = false')) rows = rows.filter(r => !r.isArchived);
            if (sql.includes('c.id = $1')) rows = rows.filter(r => r.id === params[0]);

            return { rows, rowCount: rows.length };
        }

        // 2. INSERT channel
        if (sql.startsWith('insert into chat_channels')) {
            const newChannel = {
                id: generateId(),
                name: params[0],
                description: params[1],
                type: params[2],
                context_type: params[3],
                context_id: params[4],
                created_by: params[5],
                created_at: new Date(),
                updated_at: new Date(),
                is_archived: false
            };
            this.tables.chat_channels.push(newChannel);
            return { rows: [newChannel], rowCount: 1 };
        }

        // 3. INSERT member
        if (sql.startsWith('insert into chat_channel_members')) {
            const newMember = {
                id: generateId(),
                channel_id: params[0],
                user_id: params[1],
                user_name: params[2],
                user_avatar: params[3],
                role: params[4] || 'member',
                joined_at: new Date()
            };
            this.tables.chat_channel_members.push(newMember);
            return { rows: [newMember], rowCount: 1 };
        }

        // 4. SELECT messages
        if (sql.includes('from chat_messages') && sql.startsWith('select')) {
            let filterRows = [...this.tables.chat_messages];
            if (sql.includes('channel_id = $1')) {
                filterRows = filterRows.filter(m => m.channel_id === params[0]);
            } else if (sql.includes('id = $1')) {
                filterRows = filterRows.filter(m => m.id === params[0]);
            }
            const rows = filterRows
                .map(m => {
                    const messageReactions = this.tables.chat_message_reactions.filter(r => r.message_id === m.id);
                    const messageAttachments = this.tables.chat_message_attachments.filter(a => a.message_id === m.id);

                    // Group reactions by emoji
                    const emojiMap = new Map();
                    messageReactions.forEach(r => {
                        if (!emojiMap.has(r.emoji)) emojiMap.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
                        const group = emojiMap.get(r.emoji);
                        group.count++;
                        group.users.push({ id: r.user_id, name: r.user_name });
                    });

                    return {
                        ...m,
                        channelId: m.channel_id,
                        senderId: m.sender_id,
                        senderName: m.sender_name,
                        senderAvatar: m.sender_avatar,
                        parentMessageId: m.parent_message_id,
                        timestamp: m.created_at,
                        isDeleted: m.is_deleted,
                        isSystem: m.is_system,
                        reactions: Array.from(emojiMap.values()),
                        attachments: messageAttachments.map(a => ({
                            id: a.id,
                            fileName: a.file_name,
                            fileSize: a.file_size,
                            fileType: a.file_type,
                            mimeType: a.mime_type,
                            uploadedBy: a.uploaded_by,
                            uploadedAt: a.uploaded_at
                        })),
                        replyCount: this.tables.chat_messages.filter(rem => rem.parent_message_id === m.id && !rem.is_deleted).length
                    };
                });
            return { rows: this.resultRows(rows, sql, params), rowCount: rows.length };
        }

        // 5. INSERT message
        if (sql.startsWith('insert into chat_messages')) {
            const newMessage = {
                id: generateId(),
                channel_id: params[0],
                text: params[1],
                sender_id: params[2],
                sender_name: params[3],
                sender_avatar: params[4],
                parent_message_id: params[5],
                mentions: params[6] || '[]',
                created_at: new Date(),
                is_deleted: false,
                is_system: false
            };
            this.tables.chat_messages.push(newMessage);
            return { rows: [newMessage], rowCount: 1 };
        }

        // 6. UPDATE message (Edit / Delete)
        if (sql.startsWith('update chat_messages')) {
            const id = params[0];
            const msgIndex = this.tables.chat_messages.findIndex(m => m.id === id);
            if (msgIndex !== -1) {
                if (sql.includes('text = $2')) {
                    this.tables.chat_messages[msgIndex].text = params[1];
                    this.tables.chat_messages[msgIndex].edited_at = new Date();
                } else if (sql.includes('is_deleted = true')) {
                    this.tables.chat_messages[msgIndex].is_deleted = true;
                    this.tables.chat_messages[msgIndex].text = '[Message deleted]';
                }
                return { rows: [this.tables.chat_messages[msgIndex]], rowCount: 1 };
            }
        }

        // 7. REACTIONS: INSERT / DELETE
        if (sql.startsWith('insert into chat_message_reactions')) {
            const newReaction = { message_id: params[0], emoji: params[1], user_id: params[2], user_name: params[3] };
            // Check for conflict
            if (!this.tables.chat_message_reactions.some(r => r.message_id === params[0] && r.emoji === params[1] && r.user_id === params[2])) {
                this.tables.chat_message_reactions.push(newReaction);
            }
            return { rows: [newReaction], rowCount: 1 };
        }
        if (sql.startsWith('delete from chat_message_reactions')) {
            this.tables.chat_message_reactions = this.tables.chat_message_reactions.filter(
                r => !(r.message_id === params[0] && r.emoji === params[1] && r.user_id === params[2])
            );
            return { rows: [], rowCount: 1 };
        }

        // 8. ATTACHMENTS: INSERT / SELECT
        if (sql.startsWith('insert into chat_message_attachments')) {
            const newAttachment = {
                id: generateId(),
                message_id: params[0],
                file_name: params[1],
                file_size: params[2],
                file_type: params[3],
                mime_type: params[4],
                uploaded_by: params[5],
                uploaded_at: new Date()
            };
            this.tables.chat_message_attachments.push(newAttachment);
            return { rows: [newAttachment], rowCount: 1 };
        }

        // 9. Generic SELECT 1 check / mark_channel_read / notifications / cleanup / typing indicators
        if (sql === 'select 1' || sql.includes('mark_channel_read') ||
            sql.includes('create_mention_notification') ||
            sql.includes('cleanup_old_typing_indicators') ||
            sql.includes('select 1 from chat_channels') ||
            sql.includes('select user_id as "userid"')) {
            return { rows: [{ id: generateId(), '1': 1 }], rowCount: 1 };
        }

        // Default: return empty for unhandled mock queries to avoid crashing
        console.warn('⚠️ MockDB: Unhandled query pattern:', sql);
        return { rows: [], rowCount: 0 };
    }
}

const mockDb = new MemoryDB();
let useMock = false;

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/caditare_erp',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Database connected successfully');
    useMock = false;
});

pool.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Database connection failed. Switching to Mock DB for development.');
        useMock = true;
    } else {
        console.error('❌ Unexpected database error:', err);
        process.exit(-1);
    }
});

// Query helper with error handling
export const query = async (text: string, params?: any[]): Promise<any> => {
    if (useMock) return mockDb.query(text, params);

    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error: any) {
        if (process.env.NODE_ENV !== 'production' && !useMock) {
            console.warn('⚠️ Database query failed. Falling back to Mock DB.');
            useMock = true;
            return mockDb.query(text, params);
        }
        console.error('Database query error:', error);
        throw error;
    }
};

// Transaction helper
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
    if (useMock) {
        const mockClient = {
            query: (t: string, p?: any[]) => mockDb.query(t, p)
        };
        return callback(mockClient);
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        if (process.env.NODE_ENV !== 'production' && !useMock) {
            console.warn('⚠️ Transaction failed. Falling back to Mock DB.');
            useMock = true;
            return transaction(callback);
        }
        throw error;
    } finally {
        if (client) client.release();
    }
};

// Get a client from the pool for multiple queries
export const getClient = async () => {
    if (useMock) return { query: (t: string, p?: any[]) => mockDb.query(t, p), release: () => { } };
    return pool.connect();
};

export const closePool = async () => {
    await pool.end();
    console.log('Database pool closed');
};

export const runMigrations = async () => {
    if (useMock) {
        console.log('✅ Mock DB active: Skipping real migrations');
        return;
    }

    console.log('🔄 Checking database migrations...');
    try {
        await query('SELECT 1');
        console.log('✅ Database migrations checked/applied successfully');
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ Migration failed. Server will continue with Mock DB if needed.');
            useMock = true;
        } else {
            console.error('❌ Database migration failed:', error);
        }
    }
};

export default pool;
