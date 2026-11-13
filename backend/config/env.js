import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config();

/**
 * Validates and normalizes application configuration from environment variables.
 */
function validateConfig() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const PORT = parseInt(process.env.PORT || '5000', 10);
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/harmony_project';
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    throw new Error(`[CONFIG ERROR] Invalid PORT specified: "${process.env.PORT}". Must be between 1 and 65535.`);
  }

  return {
    isProduction: NODE_ENV === 'production',
    isDevelopment: NODE_ENV === 'development',
    isTest: NODE_ENV === 'test',
    env: NODE_ENV,
    port: PORT,
    databaseUrl: DATABASE_URL,
    frontendUrl: FRONTEND_URL,
    db: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MILLIS || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MILLIS || '5000', 10),
    },
  };
}

export const config = validateConfig();
export default config;
