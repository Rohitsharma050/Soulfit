-- ==============================================================================
-- Migration 001: Initial Schema (Phase 1 Foundation)
-- Tables: users, consultations, subscribers
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    role VARCHAR(20) DEFAULT 'USER' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_user_role CHECK (role IN ('USER', 'ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. CONSULTATIONS TABLE
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    pillar_interest VARCHAR(100) NOT NULL,
    goals TEXT,
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    timezone VARCHAR(100) DEFAULT 'UTC',
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_consultation_status CHECK (
        status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
    ),
    CONSTRAINT chk_consultation_slot_range CHECK (
        (slot_start IS NULL AND slot_end IS NULL) OR (slot_end > slot_start)
    )
);

CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_slot_start ON consultations(slot_start);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_pillar ON consultations(pillar_interest);

-- 3. SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    consent BOOLEAN DEFAULT FALSE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(subscribed_at) WHERE unsubscribed_at IS NULL;

-- 4. UPDATE TIMESTAMP FUNCTION & TRIGGERS
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_consultations_updated_at ON consultations;
CREATE TRIGGER trg_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();
