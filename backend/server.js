import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { closeDbPool } from './config/db.js';
import apiV1Routes from './routes/index.routes.js';
import notFoundHandler from './middleware/notFound.middleware.js';
import errorHandler from './middleware/error.middleware.js';

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS Configuration
const configuredOrigins = config.frontendUrl
  ? config.frontendUrl.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : [];

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const allowedOrigins = new Set([...configuredOrigins, ...defaultOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.has(normalizedOrigin) || normalizedOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Request Body Parsing with Strict Size Limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    statusCode: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// 5. Basic Application Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'The Harmony Project API',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// 6. Centralized API v1 Routes
app.use('/api/v1', apiV1Routes);

// 7. 404 Route Handler for undefined routes
app.use(notFoundHandler);

// 8. Centralized Application Error Handler
app.use(errorHandler);

// 9. Server Initialization
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`  The Harmony Project — Backend Server Running`);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Port:        ${config.port}`);
  console.log(`  Health:      http://localhost:${config.port}/health`);
  console.log(`  DB Health:   http://localhost:${config.port}/api/v1/health/db`);
  console.log(`=======================================================`);
});

// 10. Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Initiating graceful shutdown...`);
  
  // Stop accepting new HTTP connections
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP server closed.');
    
    // Close PostgreSQL pool
    await closeDbPool();
    
    console.log('[SHUTDOWN] All resources cleanly released. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after timeout if pending requests hang
  setTimeout(() => {
    console.error('[SHUTDOWN] Forcefully terminating process due to timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
