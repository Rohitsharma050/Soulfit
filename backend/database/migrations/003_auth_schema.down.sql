-- ==============================================================================
-- Migration 003 Down: Revert Authentication & User Identity Columns
-- ==============================================================================

DROP INDEX IF EXISTS idx_users_is_active;
DROP INDEX IF EXISTS idx_users_auth_provider;

ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
