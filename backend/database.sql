-- ==============================================================================
-- THE HARMONY PROJECT (SOULFIT) — DATABASE INITIALIZATION SCRIPT
-- PostgreSQL 14+ Relational Schema
-- ==============================================================================

-- Enable pgcrypto extension for UUID generation if needed (gen_random_uuid() is native in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS TABLE
-- Stores client & admin accounts, authenticated primarily via Google OAuth 2.0.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    role VARCHAR(20) DEFAULT 'USER' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Role-Based Access Control constraint
    CONSTRAINT chk_user_role CHECK (role IN ('USER', 'ADMIN'))
);

-- Optimize lookups on email and OAuth ID
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

COMMENT ON TABLE users IS 'User profiles and roles for The Harmony Project ecosystem';
COMMENT ON COLUMN users.google_id IS 'Immutable unique identifier supplied by Google Identity Services';
COMMENT ON COLUMN users.role IS 'Role authorization level (USER or ADMIN)';

-- ==============================================================================
-- 2. CONSULTATIONS TABLE
-- Records client consultation bookings across the 5 wellness pillars:
-- Soulfit, Astrology, Vastu, Food as Medicine, and Corporate Wellbeing.
-- ==============================================================================
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

    -- Permitted booking lifecycle statuses
    CONSTRAINT chk_consultation_status CHECK (
        status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
    ),

    -- Time validation: slot end must be after slot start when slots are scheduled
    CONSTRAINT chk_consultation_slot_range CHECK (
        (slot_start IS NULL AND slot_end IS NULL) OR (slot_end > slot_start)
    )
);

-- Indexes for frequent queries: user booking history, calendar scheduling, status filtering
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_slot_start ON consultations(slot_start);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_pillar ON consultations(pillar_interest);

COMMENT ON TABLE consultations IS 'Consultation appointments booked by clients';
COMMENT ON COLUMN consultations.pillar_interest IS 'Target wellness pillar (Soulfit, Astrology, Vastu, Food as Medicine, Corporate Wellbeing)';
COMMENT ON COLUMN consultations.status IS 'Consultation lifecycle: PENDING, CONFIRMED, CANCELLED, COMPLETED';

-- ==============================================================================
-- 3. SUBSCRIBERS TABLE
-- Tracks newsletter subscribers and explicit consent records.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    consent BOOLEAN DEFAULT FALSE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(subscribed_at) WHERE unsubscribed_at IS NULL;

COMMENT ON TABLE subscribers IS 'Newsletter subscriber registry with consent tracking';

-- ==============================================================================
-- 4. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- Automatically updates updated_at timestamps on record modification
-- ==============================================================================
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
