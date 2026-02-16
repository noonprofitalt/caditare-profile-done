import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import { setupChatSocket } from '../../socket/chatSocket';

describe('Chat Socket Events', () => {
    let io: Server;
    let serverSocket: any;
    let clientSocket: ClientSocket;
    let httpServer: any;

    beforeAll((done) => {
        httpServer = createServer();
        io = new Server(httpServer);

        httpServer.listen(() => {
            const port = (httpServer.address() as any).port;

            // Set up socket handlers
            setupChatSocket(io);

            // Connect client
            clientSocket = ioClient(`http://localhost:${port}`, {
                auth: { token: 'test-token' },
            });

            io.on('connection', (socket) => {
                serverSocket = socket;
            });

            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket.close();
        httpServer.close();
    });

    describe('Channel Events', () => {
        it('should join a channel', (done) => {
            clientSocket.emit('channel:join', { channelId: 'test-channel' });

            setTimeout(() => {
                expect(serverSocket.rooms.has('channel:test-channel')).toBe(true);
                done();
            }, 100);
        });

        it('should leave a channel', (done) => {
            clientSocket.emit('channel:join', { channelId: 'test-channel' });

            setTimeout(() => {
                clientSocket.emit('channel:leave', { channelId: 'test-channel' });

                setTimeout(() => {
                    expect(serverSocket.rooms.has('channel:test-channel')).toBe(false);
                    done();
                }, 100);
            }, 100);
        });
    });

    describe('Message Events', () => {
        it('should broadcast new message to channel', (done) => {
            const testMessage = {
                channelId: 'test-channel',
                text: 'Hello, world!',
            };

            clientSocket.on('message:new', (message) => {
                expect(message.text).toBe(testMessage.text);
                done();
            });

            clientSocket.emit('channel:join', { channelId: 'test-channel' });

            setTimeout(() => {
                clientSocket.emit('message:send', testMessage);
            }, 100);
        });

        it('should broadcast message edit', (done) => {
            clientSocket.on('message:updated', (data) => {
                expect(data.text).toBe('Updated text');
                done();
            });

            clientSocket.emit('message:edit', {
                messageId: 'msg-1',
                text: 'Updated text',
            });
        });

        it('should broadcast message deletion', (done) => {
            clientSocket.on('message:deleted', (data) => {
                expect(data.messageId).toBe('msg-1');
                done();
            });

            clientSocket.emit('message:delete', { messageId: 'msg-1' });
        });
    });

    describe('Typing Indicators', () => {
        it('should broadcast typing start', (done) => {
            clientSocket.on('typing:update', (users) => {
                expect(users).toBeInstanceOf(Array);
                done();
            });

            clientSocket.emit('typing:start', { channelId: 'test-channel' });
        });

        it('should broadcast typing stop', (done) => {
            clientSocket.emit('typing:start', { channelId: 'test-channel' });

            setTimeout(() => {
                clientSocket.emit('typing:stop', { channelId: 'test-channel' });
                done();
            }, 100);
        });
    });

    describe('Reaction Events', () => {
        it('should broadcast reaction add', (done) => {
            clientSocket.on('reaction:added', (data) => {
                expect(data.reaction.emoji).toBe('👍');
                done();
            });

            clientSocket.emit('reaction:add', {
                messageId: 'msg-1',
                emoji: '👍',
            });
        });

        it('should broadcast reaction remove', (done) => {
            clientSocket.on('reaction:removed', (data) => {
                expect(data.emoji).toBe('👍');
                done();
            });

            clientSocket.emit('reaction:remove', {
                messageId: 'msg-1',
                emoji: '👍',
            });
        });
    });

    describe('Connection Handling', () => {
        it('should handle disconnection', (done) => {
            clientSocket.on('disconnect', () => {
                done();
            });

            clientSocket.disconnect();
        });

        it('should handle reconnection', (done) => {
            clientSocket.connect();

            clientSocket.on('connect', () => {
                expect(clientSocket.connected).toBe(true);
                done();
            });
        });
    });
});
