-- ==============================================================================
-- Migration 004 Down: Revert Consultation Booking System (Phase 5)
-- ==============================================================================

-- Drop added constraints and columns from consultations
DROP INDEX IF EXISTS idx_consultations_active_range;
DROP INDEX IF EXISTS idx_consultations_user_status;
DROP INDEX IF EXISTS idx_consultations_type_id;
DROP INDEX IF EXISTS idx_consultations_idempotency;
DROP INDEX IF EXISTS idx_consultations_booking_ref;

ALTER TABLE consultations DROP CONSTRAINT IF EXISTS chk_consultation_status;
ALTER TABLE consultations ADD CONSTRAINT chk_consultation_status CHECK (
    status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
);

ALTER TABLE consultations DROP COLUMN IF EXISTS rescheduled_from_id;
ALTER TABLE consultations DROP COLUMN IF EXISTS cancellation_reason;
ALTER TABLE consultations DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE consultations DROP COLUMN IF EXISTS idempotency_key;
ALTER TABLE consultations DROP COLUMN IF EXISTS booking_reference;
ALTER TABLE consultations DROP COLUMN IF EXISTS consultation_type_id;

-- Drop new tables
DROP TABLE IF EXISTS availability_overrides CASCADE;
DROP TABLE IF EXISTS availability_rules CASCADE;
DROP TABLE IF EXISTS consultation_types CASCADE;
