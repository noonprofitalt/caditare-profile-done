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

    beforeAll(() => {
        return new Promise<void>((resolve) => {
            httpServer = createServer();
            io = new Server(httpServer);

            httpServer.listen(() => {
                const port = (httpServer.address() as any).port;

                // Set up socket handlers
                setupChatSocket(io);

                // Connect client
                clientSocket = ioClient(`http://localhost:${port}`, {
                    auth: { token: 'mock-jwt-token' },
                });

                io.on('connection', (socket) => {
                    serverSocket = socket;
                });

                clientSocket.on('connect', () => resolve());
            });
        });
    });

    afterAll(() => {
        if (io) io.close();
        if (clientSocket) clientSocket.close();
        if (httpServer) httpServer.close();
    });

    describe('Channel Events', () => {
        it('should join a channel', () => {
            return new Promise<void>((resolve) => {
                clientSocket.emit('channel:join', { channelId: 'test-channel' });

                setTimeout(() => {
                    expect(serverSocket.rooms.has('channel:test-channel')).toBe(true);
                    resolve();
                }, 100);
            });
        });

        it('should leave a channel', () => {
            return new Promise<void>((resolve) => {
                clientSocket.emit('channel:join', { channelId: 'test-channel' });

                setTimeout(() => {
                    clientSocket.emit('channel:leave', { channelId: 'test-channel' });

                    setTimeout(() => {
                        expect(serverSocket.rooms.has('channel:test-channel')).toBe(false);
                        resolve();
                    }, 100);
                }, 100);
            });
        });
    });

    describe('Message Events', () => {
        it('should broadcast new message to channel', () => {
            return new Promise<void>((resolve) => {
                const testMessage = {
                    channelId: 'test-channel',
                    text: 'Hello, world!',
                };

                clientSocket.once('message:new', (message) => {
                    expect(message.text).toBe(testMessage.text);
                    resolve();
                });

                clientSocket.emit('channel:join', { channelId: 'test-channel' });

                setTimeout(() => {
                    clientSocket.emit('message:send', testMessage);
                }, 100);
            });
        });

        it('should broadcast message edit', () => {
            return new Promise<void>((resolve) => {
                clientSocket.once('message:updated', (data) => {
                    expect(data.text).toBe('Updated text');
                    resolve();
                });

                clientSocket.emit('message:edit', {
                    messageId: 'msg-1',
                    text: 'Updated text',
                });
            });
        });

        it('should broadcast message deletion', () => {
            return new Promise<void>((resolve) => {
                clientSocket.once('message:deleted', (data) => {
                    expect(data.messageId).toBe('msg-1');
                    resolve();
                });

                clientSocket.emit('message:delete', { messageId: 'msg-1' });
            });
        });
    });

    describe('Typing Indicators', () => {
        it('should broadcast typing start', () => {
            return new Promise<void>((resolve) => {
                clientSocket.once('typing:update', (users) => {
                    expect(users).toBeInstanceOf(Array);
                    resolve();
                });

                clientSocket.emit('typing:start', { channelId: 'test-channel' });
            });
        });

        it('should broadcast typing stop', () => {
            return new Promise<void>((resolve) => {
                clientSocket.emit('typing:start', { channelId: 'test-channel' });

                setTimeout(() => {
                    clientSocket.emit('typing:stop', { channelId: 'test-channel' });
                    resolve();
                }, 100);
            });
        });
    });

    describe('Reaction Events', () => {
        it('should broadcast reaction add', () => {
            return new Promise<void>((resolve) => {
                clientSocket.once('reaction:added', (data) => {
                    expect(data.reaction.emoji).toBe('👍');
                    resolve();
                });

                clientSocket.emit('reaction:add', {
                    messageId: 'msg-1',
                    emoji: '👍',
                });
            });
        });

        it('should broadcast reaction remove', () => {
            return new Promise<void>((resolve) => {
                clientSocket.once('reaction:removed', (data) => {
                    expect(data.emoji).toBe('👍');
                    resolve();
                });

                clientSocket.emit('reaction:remove', {
                    messageId: 'msg-1',
                    emoji: '👍',
                });
            });
        });
    });

    describe('Connection Handling', () => {
        it('should handle disconnection', () => {
            return new Promise<void>((resolve) => {
                clientSocket.once('disconnect', () => {
                    resolve();
                });

                clientSocket.disconnect();
            });
        });

        it('should handle reconnection', () => {
            return new Promise<void>((resolve) => {
                clientSocket.connect();

                clientSocket.once('connect', () => {
                    expect(clientSocket.connected).toBe(true);
                    resolve();
                });
            });
        });
    });
});
