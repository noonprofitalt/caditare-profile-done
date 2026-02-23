import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Server } from 'http';
import { app } from '../../server/server';

describe('Integration Tests - Chat Flow', () => {
    let server: Server;
    let authToken: string;
    let channelId: string;
    let messageId: string;

    beforeAll(async () => {
        // Start server
        server = app.listen(0);

        // Mock authentication - in real tests, you'd authenticate properly
        authToken = 'mock-jwt-token';
    });

    afterAll(async () => {
        await new Promise<void>((resolve) => {
            server.close(() => resolve());
        });
    });

    describe('Complete Chat Flow', () => {
        it('should create a channel', async () => {
            const response = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Integration Test Channel',
                    type: 'public',
                    description: 'Test channel for integration tests',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            channelId = response.body.id;
        });

        it('should send a message to the channel', async () => {
            const response = await request(app)
                .post(`/api/channels/${channelId}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    text: 'Hello from integration test!',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            messageId = response.body.id;
        });

        it('should add a reaction to the message', async () => {
            const response = await request(app)
                .post(`/api/messages/${messageId}/reactions`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    emoji: '👍',
                });

            expect(response.status).toBe(201);
        });

        it('should retrieve messages with reactions', async () => {
            const response = await request(app)
                .get(`/api/channels/${channelId}/messages`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.messages).toBeInstanceOf(Array);
            expect(response.body.messages[0]).toHaveProperty('reactions');
        });

        it('should edit the message', async () => {
            const response = await request(app)
                .put(`/api/messages/${messageId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    text: 'Updated message text',
                });

            expect(response.status).toBe(200);
            expect(response.body.text).toBe('Updated message text');
        });

        it('should create a threaded reply', async () => {
            const response = await request(app)
                .post(`/api/channels/${channelId}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    text: 'This is a reply',
                    parentMessageId: messageId,
                });

            expect(response.status).toBe(201);
            expect(response.body.parentMessageId).toBe(messageId);
        });

        it('should delete the message', async () => {
            const response = await request(app)
                .delete(`/api/messages/${messageId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });

        it('should archive the channel', async () => {
            const response = await request(app)
                .delete(`/api/channels/${channelId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('System Channel Flow', () => {
        it('should create a system channel for a candidate', async () => {
            const response = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Candidate: John Doe',
                    type: 'system',
                    contextType: 'candidate',
                    contextId: 'candidate-123',
                });

            expect(response.status).toBe(201);
            expect(response.body.contextType).toBe('candidate');
            expect(response.body.contextId).toBe('candidate-123');
        });

        it('should return existing system channel on duplicate creation', async () => {
            const response = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Candidate: John Doe',
                    type: 'system',
                    contextType: 'candidate',
                    contextId: 'candidate-123',
                });

            expect(response.status).toBe(200);
            expect(response.body.contextType).toBe('candidate');
        });
    });

    describe('File Upload Flow', () => {
        it('should upload a file attachment', async () => {
            const response = await request(app)
                .post('/api/attachments/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .field('messageId', messageId)
                .attach('file', Buffer.from('test file content'), 'test.txt');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
        });
    });

    describe('Mention and Notification Flow', () => {
        it('should create notification for mentioned user', async () => {
            const response = await request(app)
                .post(`/api/channels/${channelId}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    text: 'Hey @testuser, check this out!',
                });

            expect(response.status).toBe(201);

            // Check notifications
            const notifResponse = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`);

            expect(notifResponse.status).toBe(200);
        });
    });
});
