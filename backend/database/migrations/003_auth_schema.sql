-- ==============================================================================
-- Migration 003: Authentication & User Identity Management (Phase 4)
-- Alterations: users table (password_hash, auth_provider, is_active, last_login_at)
-- ==============================================================================

-- 1. ADD PASSWORD HASH & AUTH PROVIDER TO USERS TABLE
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. CREATE INDEX FOR AUTH LOOKUPS
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 3. COMMENTS
COMMENT ON COLUMN users.password_hash IS 'Bcrypt salted password hash for local credentials';
COMMENT ON COLUMN users.auth_provider IS 'Identity provider: local, google, or comma-separated hybrid';
COMMENT ON COLUMN users.is_active IS 'Account activation status for access revocation';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the most recent successful login';
