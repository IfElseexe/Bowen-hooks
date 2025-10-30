import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { Server as SocketServer } from 'socket.io';
import { sequelize } from './config/database.config';
import { initializeSocketHandlers } from './sockets';
import { startCronJobs } from './jobs';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000'),
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000')
});

// Make io accessible throughout the app
app.set('io', io);

// Initialize socket handlers
initializeSocketHandlers(io);

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');

    // Sync database (be careful in production - use migrations instead)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // Set to true only for dev
      logger.info('✅ Database synchronized');
    }

    // Start cron jobs
    if (process.env.ENABLE_CRON_JOBS === 'true') {
      startCronJobs();
      logger.info('✅ Cron jobs started');
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`
      ╔════════════════════════════════════════════╗
      ║                                            ║
      ║        🔥 BOWEN HOOKS SERVER 🔥           ║
      ║                                            ║
      ║  Server running on port ${PORT}            ║
      ║  Environment: ${process.env.NODE_ENV}      ║
      ║  API Version: ${process.env.API_VERSION}   ║
      ║                                            ║
      ║  🌐 API: http://localhost:${PORT}          ║
      ║  📡 Socket.IO: Connected                   ║
      ║  💾 Database: PostgreSQL                   ║
      ║  🔴 Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}      ║
      ║                                            ║
      ╚════════════════════════════════════════════╝
      `);
    });

    // Socket.IO connection logging
    io.on('connection', (socket) => {
      logger.info(`🔌 New socket connection: ${socket.id}`);
      
      socket.on('disconnect', () => {
        logger.info(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('❌ UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('❌ UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Process terminated');
  });
});

// Start the server
startServer();