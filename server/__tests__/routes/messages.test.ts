import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { query } from '../../database';

// Mock database
vi.mock('../../database');

// Mock email service
vi.mock('../services/emailService', () => ({
    sendNotificationEmail: vi.fn().mockResolvedValue(true),
}));

// Mock authentication middleware
vi.doMock('../../middleware/auth', () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Test User', email: 'test@example.com', role: 'user' };
        next();
    },
    requireRole: () => (req, res, next) => next(),
    optionalAuth: (req, res, next) => {
        req.user = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Test User', email: 'test@example.com', role: 'user' };
        next();
    }
}));

// Mock rate limiting middleware
vi.doMock('../../middleware/rateLimiting', () => ({
    apiLimiter: (req, res, next) => next(),
    authLimiter: (req, res, next) => next(),
    messageLimiter: (req, res, next) => next(),
    uploadLimiter: (req, res, next) => next(),
    channelCreationLimiter: (req, res, next) => next(),
    searchLimiter: (req, res, next) => next(),
}));

describe('Messages API', () => {
    let app: Express;
    let messagesRouter: any;
    const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const mockIo = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
    };

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        app.set('io', mockIo);
        const module = await import('../../routes/messages');
        messagesRouter = module.default;
        app.use('/api', messagesRouter);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    describe('GET /api/:channelId/messages', () => {
        it('should return messages for a channel', async () => {
            const mockMessages = [
                { id: VALID_UUID, text: 'Hello', sender_name: 'User 1' },
            ];

            (query as any)
                .mockResolvedValueOnce({ rows: [{ user_id: VALID_UUID }] }) // Access check
                .mockResolvedValueOnce({ rows: mockMessages }); // Messages query

            const response = await request(app).get(`/api/${VALID_UUID}/messages`);

            expect(response.status).toBe(200);
            expect(response.body.messages).toHaveLength(1);
        });
    });

    describe('POST /api/:channelId/messages', () => {
        it('should send a new message', async () => {
            const newMessage = { text: 'Test message' };
            const mockResult = { id: VALID_UUID, text: 'Test message', sender_id: VALID_UUID, created_at: new Date() };

            (query as any)
                .mockResolvedValueOnce({ rows: [{ user_id: VALID_UUID }] }) // Access check
                .mockResolvedValueOnce({ rows: [mockResult] }); // Insert query

            const response = await request(app)
                .post(`/api/${VALID_UUID}/messages`)
                .send(newMessage);

            expect(response.status).toBe(201);
            expect(response.body.text).toBe('Test message');
        });
    });

    describe('PUT /api/:id', () => {
        it('should edit a message if user is sender', async () => {
            (query as any)
                .mockResolvedValueOnce({ rows: [{ sender_id: VALID_UUID }] }) // Owner check
                .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, text: 'Edited', edited_at: new Date() }] }); // Update

            const response = await request(app)
                .put(`/api/${VALID_UUID}`)
                .send({ text: 'Edited' });

            expect(response.status).toBe(200);
            expect(response.body.text).toBe('Edited');
        });
    });
});
