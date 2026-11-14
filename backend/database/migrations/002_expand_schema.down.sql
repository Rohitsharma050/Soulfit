-- Rollback Migration 002
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS services CASCADE;

ALTER TABLE subscribers DROP COLUMN IF EXISTS unsubscribe_token_hash;
ALTER TABLE subscribers DROP COLUMN IF EXISTS updated_at;
DROP TRIGGER IF EXISTS trg_subscribers_updated_at ON subscribers;
