import { Router } from 'express';
import serviceRoutes from './service.routes.js';
import contactRoutes from './contact.routes.js';
import newsletterRoutes from './newsletter.routes.js';
import articleRoutes from './article.routes.js';
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
      success: true,
      status: 'healthy',
      database: 'PostgreSQL',
      connected: true,
      latencyMs: dbHealth.latencyMs,
      serverTime: dbHealth.timestamp,
      version: dbHealth.version,
    });
  }

  return res.status(503).json({
    success: false,
    status: 'unhealthy',
    database: 'PostgreSQL',
    connected: false,
    latencyMs: dbHealth.latencyMs,
    message: 'PostgreSQL connection failed or database is not reachable.',
    error: dbHealth.error,
  });
});

// Mount Public REST APIs
router.use('/services', serviceRoutes);
router.use('/contact', contactRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/articles', articleRoutes);

// Retain Phase 1 scaffolding
router.use('/auth', authRoutes);
router.use('/consultations', consultationRoutes);

export default router;
