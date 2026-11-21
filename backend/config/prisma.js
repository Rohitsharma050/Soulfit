import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

/**
 * Shared singleton Prisma Client instance for The Harmony Project.
 * Configured with query logging in development mode and connection pooling via DATABASE_URL.
 */
export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['warn', 'error'] : ['error'],
});

/**
 * Gracefully disconnects Prisma Client during process shutdown.
 */
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('[PRISMA] Prisma Client disconnected successfully.');
  } catch (err) {
    console.error('[PRISMA ERROR] Error during Prisma disconnect:', err.message);
  }
}

export default prisma;
