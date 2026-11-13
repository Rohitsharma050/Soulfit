import { Router } from 'express';
import authRoutes from './auth.routes.js';
import consultationRoutes from './consultation.routes.js';
import { testDbConnection } from '../config/db.js';

const router = Router();

/**
 * Database health check endpoint
 * GET /api/v1/health/db
 */
router.get('/health/db', async (req, res) => {
  const dbHealth = await testDbConnection();
  if (dbHealth.ok) {
    return res.status(200).json({
      status: 'healthy',
      database: 'PostgreSQL',
      connected: true,
      latencyMs: dbHealth.latencyMs,
      serverTime: dbHealth.timestamp,
      version: dbHealth.version,
    });
  }

  return res.status(503).json({
    status: 'unhealthy',
    database: 'PostgreSQL',
    connected: false,
    latencyMs: dbHealth.latencyMs,
    message: 'PostgreSQL connection failed or database is not running.',
    error: dbHealth.error,
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/consultations', consultationRoutes);

export default router;
