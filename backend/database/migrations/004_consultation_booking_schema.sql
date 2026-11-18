-- ==============================================================================
-- Migration 004: Consultation Booking System (Phase 5)
-- Tables: consultation_types, availability_rules, availability_overrides
-- Alterations: consultations table (consultation_type_id, booking_reference,
--              idempotency_key, cancelled_at, cancellation_reason, rescheduled_from_id)
-- ==============================================================================

-- 1. CONSULTATION TYPES TABLE
CREATE TABLE IF NOT EXISTS consultation_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    buffer_minutes INTEGER DEFAULT 15 NOT NULL,
    price_display VARCHAR(50) DEFAULT 'Complimentary Sanctuary Guidance',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_buffer_non_negative CHECK (buffer_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_consultation_types_slug ON consultation_types(slug);
CREATE INDEX IF NOT EXISTS idx_consultation_types_active ON consultation_types(is_active);
CREATE INDEX IF NOT EXISTS idx_consultation_types_order ON consultation_types(display_order);

DROP TRIGGER IF EXISTS trg_consultation_types_updated_at ON consultation_types;
CREATE TRIGGER trg_consultation_types_updated_at
    BEFORE UPDATE ON consultation_types
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 2. AVAILABILITY RULES TABLE (Weekly recurring schedule)
CREATE TABLE IF NOT EXISTS availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_type_id UUID REFERENCES consultation_types(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_availability_times CHECK (end_time > start_time),
    CONSTRAINT chk_break_times CHECK (
        (break_start IS NULL AND break_end IS NULL) OR 
        (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start AND break_start >= start_time AND break_end <= end_time)
    )
);

CREATE INDEX IF NOT EXISTS idx_availability_rules_day ON availability_rules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_rules_type ON availability_rules(consultation_type_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_active ON availability_rules(is_active);

DROP TRIGGER IF EXISTS trg_availability_rules_updated_at ON availability_rules;
CREATE TRIGGER trg_availability_rules_updated_at
    BEFORE UPDATE ON availability_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 3. AVAILABILITY OVERRIDES TABLE (Holidays, blocked dates, special hours)
CREATE TABLE IF NOT EXISTS availability_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_type_id UUID REFERENCES consultation_types(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT FALSE NOT NULL,
    start_time TIME,
    end_time TIME,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_override_hours CHECK (
        is_available = FALSE OR 
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    )
);

CREATE INDEX IF NOT EXISTS idx_availability_overrides_date ON availability_overrides(override_date);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_type ON availability_overrides(consultation_type_id);

DROP TRIGGER IF EXISTS trg_availability_overrides_updated_at ON availability_overrides;
CREATE TRIGGER trg_availability_overrides_updated_at
    BEFORE UPDATE ON availability_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 4. EXPAND CONSULTATIONS TABLE SAFELY
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS consultation_type_id UUID REFERENCES consultation_types(id) ON DELETE RESTRICT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(32) UNIQUE;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64) UNIQUE;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS rescheduled_from_id UUID REFERENCES consultations(id) ON DELETE SET NULL;
ALTER TABLE consultations ALTER COLUMN phone DROP NOT NULL;

-- Expand status check constraint to include RESCHEDULED
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS chk_consultation_status;
ALTER TABLE consultations ADD CONSTRAINT chk_consultation_status CHECK (
    status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED')
);

CREATE INDEX IF NOT EXISTS idx_consultations_booking_ref ON consultations(booking_reference);
CREATE INDEX IF NOT EXISTS idx_consultations_idempotency ON consultations(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_consultations_type_id ON consultations(consultation_type_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user_status ON consultations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_consultations_active_range ON consultations(slot_start, slot_end) WHERE (status IN ('CONFIRMED', 'PENDING'));
