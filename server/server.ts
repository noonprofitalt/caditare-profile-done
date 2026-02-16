import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { closePool } from './database';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Security Middleware
app.use(helmet());

// Performance Middleware
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Socket.IO setup with CORS
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Make io available in routes
app.set('io', io);

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
import channelRoutes from './routes/channels';
import messageRoutes from './routes/messages';
import attachmentRoutes from './routes/attachments';
import notificationRoutes from './routes/notifications';
import { authMiddleware } from './middleware/auth';
import { setupChatSocket } from './socket/chatSocket';

// Apply auth middleware to all API routes
app.use('/api', authMiddleware);

// Register routes
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/notifications', notificationRoutes);

// Setup Socket.IO chat handlers
setupChatSocket(io);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    const statusCode = 'statusCode' in err ? (err as any).statusCode : 500;
    res.status(statusCode).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    // Close Socket.IO connections
    io.close(() => {
        console.log('Socket.IO server closed');
    });

    // Close HTTP server
    httpServer.close(() => {
        console.log('HTTP server closed');
    });

    // Close database pool
    try {
        await closePool();
        console.log('Database pool closed');
    } catch (err) {
        console.error('Error closing database pool:', err);
    }

    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3001;

// Run migrations before listening
import { runMigrations } from './database';
runMigrations().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`
    ╔════════════════════════════════════════════════════════════╗
    ║  🚀 Chat Server Running                                    ║
    ║  📡 Port: ${PORT}                                             ║
    ║  🌐 Environment: ${process.env.NODE_ENV || 'development'}                          ║
    ║  🔒 Security: Enabled (Helmet, RateLimit)                  ║
    ║  🔌 Socket.IO: Enabled                                     ║
    ║  ✅ DB Migrations: Checked                                 ║
    ╚════════════════════════════════════════════════════════════╝
      `);
    });
});

export { app, io, httpServer };
