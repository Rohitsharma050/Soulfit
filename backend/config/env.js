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
  const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    throw new Error(`[CONFIG ERROR] Invalid PORT specified: "${process.env.PORT}". Must be between 1 and 65535.`);
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'the_harmony_project_jwt_secret_dev_key_2026';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';

  // Google OAuth credentials
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/v1/auth/google/callback`;

  return {
    isProduction: NODE_ENV === 'production',
    isDevelopment: NODE_ENV === 'development',
    isTest: NODE_ENV === 'test',
    env: NODE_ENV,
    port: PORT,
    databaseUrl: DATABASE_URL,
    frontendUrl: FRONTEND_URL,
    backendUrl: BACKEND_URL,
    jwt: {
      secret: JWT_SECRET,
      expiresIn: JWT_EXPIRES_IN,
    },
    cookie: {
      name: COOKIE_NAME,
      maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    },
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackUrl: GOOGLE_CALLBACK_URL,
      isConfigured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    },
    db: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MILLIS || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MILLIS || '5000', 10),
    },
  };
}

export const config = validateConfig();
export default config;
