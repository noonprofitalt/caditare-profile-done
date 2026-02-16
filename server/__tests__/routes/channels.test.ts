import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import * as database from '../../database';

// Mock database
vi.mock('../../database', () => ({
    query: vi.fn(),
    transaction: vi.fn((callback) => callback({ query: vi.fn() })),
    closePool: vi.fn(),
}));

// Hardcoded user ID for consistency
const TEST_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// Mock authentication middleware
vi.mock('../../middleware/auth', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Test User', email: 'test@example.com', role: 'user' };
        next();
    },
    requireRole: () => (req: any, res: any, next: any) => next(),
    optionalAuth: (req: any, res: any, next: any) => {
        req.user = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Test User', email: 'test@example.com', role: 'user' };
        next();
    }
}));

// Mock rate limiting middleware
vi.mock('../../middleware/rateLimiting', () => ({
    apiLimiter: (req: any, res: any, next: any) => next(),
    authLimiter: (req: any, res: any, next: any) => next(),
    messageLimiter: (req: any, res: any, next: any) => next(),
    uploadLimiter: (req: any, res: any, next: any) => next(),
    channelCreationLimiter: (req: any, res: any, next: any) => next(),
    searchLimiter: (req: any, res: any, next: any) => next(),
}));

describe('Channels API', () => {
    let app: Express;
    let channelsRouter: any;

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        const module = await import('../../routes/channels');
        channelsRouter = module.default;
        app.use('/api/channels', channelsRouter);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('GET /api/channels', () => {
        it('should return all accessible channels', async () => {
            const mockChannels = [
                {
                    id: 'channel-1',
                    name: 'General',
                    type: 'public',
                    created_at: new Date().toISOString(),
                },
            ];

            (database.query as any).mockResolvedValue({ rows: mockChannels });

            const response = await request(app).get('/api/channels');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockChannels);
        });
    });

    describe('POST /api/channels', () => {
        it('should create a new public channel', async () => {
            const newChannel = {
                name: 'New Channel',
                type: 'public',
                description: 'Test channel',
            };

            const mockResult = { id: 'new-id', ...newChannel, created_by: TEST_USER_ID, created_at: new Date() };

            // Mock transaction to return the result
            (database.transaction as any).mockImplementationOnce(async (callback: any) => {
                return callback({ query: vi.fn().mockResolvedValue({ rows: [mockResult] }) });
            });

            // Mock the subsequent member list query if any (though POST creates its own list)
            (database.query as any).mockResolvedValue({ rows: [mockResult] });

            const response = await request(app)
                .post('/api/channels')
                .send(newChannel);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(newChannel.name);
        });
    });

    describe('PUT /api/channels/:id', () => {
        it('should update channel if user is admin', async () => {
            const updates = { name: 'Updated Name' };

            (database.query as any)
                .mockResolvedValueOnce({ rows: [{ role: 'admin' }] }) // Member check
                .mockResolvedValueOnce({ rows: [{ id: TEST_USER_ID, name: 'Updated Name' }] }); // Update result

            const response = await request(app)
                .put(`/api/channels/${TEST_USER_ID}`)
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Name');
        });

        it('should return 403 if user is not admin', async () => {
            (database.query as any).mockResolvedValueOnce({ rows: [] }); // Member check fails

            const response = await request(app)
                .put(`/api/channels/${TEST_USER_ID}`)
                .send({ name: 'New' });

            expect(response.status).toBe(403);
        });
    });
});
