// src/app.ts

// IMPORTANT: Load environment config first
import './config/env';
import { config } from './config/env';

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { DatabaseManager } from './database/database';

// Create Express application
const app: Application = express();

// Trust proxy if behind reverse proxy (like nginx, AWS ALB, etc.)
app.set('trust proxy', 1);

/**
 * Security Middleware
 */
// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: config.nodeEnv === 'production' 
    ? [
        'https://steadyvitality.com',
        'https://www.steadyvitality.com',
        'https://app.steadyvitality.com'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173', // Vite default port
        'http://127.0.0.1:3000'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

/**
 * Rate Limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 100 : 1000, // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// More strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

/**
 * General Middleware
 */
// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * Health Check Endpoints
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealth = await DatabaseManager.healthCheck();
    const uptime = process.uptime();
    
    const healthStatus = {
      status: dbHealth.isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      version: '1.0.0',
      environment: config.nodeEnv,
      database: {
        connected: dbHealth.isConnected,
        host: dbHealth.details.host,
        database: dbHealth.details.database,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      }
    };

    res.status(dbHealth.isConnected ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check for monitoring systems
app.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const [dbHealth, dbStats] = await Promise.all([
      DatabaseManager.healthCheck(),
      DatabaseManager.getStatistics().catch(() => null)
    ]);

    const detailedHealth = {
      status: dbHealth.isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: config.nodeEnv,
      database: {
        connected: dbHealth.isConnected,
        details: dbHealth.details,
        statistics: dbStats
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      }
    };

    res.status(dbHealth.isConnected ? 200 : 503).json(detailedHealth);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Detailed health check failed'
    });
  }
});

/**
 * Welcome Endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Steady Vitality API',
    description: 'Health & Fitness Coaching Platform',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

/**
 * API Routes
 */
// Route imports
import authRoutes from './routes/auth.routes';

// Authentication routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Placeholder for API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Steady Vitality API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      health: '/health'
    },
    documentation: '/api/docs'
  });
});

/**
 * Error Handling Middleware
 */

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Unhandled error:', error);
  
  // Don't expose error details in production
  const isDevelopment = config.nodeEnv === 'development';
  
  const errorResponse = {
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
  };

  res.status(500).json(errorResponse);
});

// Handle async errors
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error);
  // Exit gracefully
  process.exit(1);
});

export default app;