import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

// Import routes
import routes from './routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimit.middleware';

// Import logger
import logger from './utils/logger';

const app: Application = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// Compression
app.use(compression());

// Morgan Logging (HTTP request logger)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Rate Limiting
app.use(rateLimiter);

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Bowen Hooks API is running! 🔥',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION
  });
});

// API Routes
app.use(`/api/${process.env.API_VERSION}`, routes);

// Welcome Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Bowen Hooks API 🔥',
    version: process.env.API_VERSION,
    docs: `/api/${process.env.API_VERSION}/docs`,
    health: '/health'
  });
});

// 404 Handler
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;