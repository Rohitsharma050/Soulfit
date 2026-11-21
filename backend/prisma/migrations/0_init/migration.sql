-- Extension: pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "category" VARCHAR(100),
    "author_name" VARCHAR(150),
    "reading_time" INTEGER DEFAULT 5,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_overrides" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consultation_type_id" UUID,
    "override_date" DATE NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consultation_type_id" UUID,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "break_start" TIME(6),
    "break_end" TIME(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(150) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "buffer_minutes" INTEGER NOT NULL DEFAULT 15,
    "price_display" VARCHAR(50) DEFAULT 'Complimentary Sanctuary Guidance',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "pillar_interest" VARCHAR(100) NOT NULL,
    "goals" TEXT,
    "slot_start" TIMESTAMPTZ(6),
    "slot_end" TIMESTAMPTZ(6),
    "timezone" VARCHAR(100) DEFAULT 'UTC',
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consultation_type_id" UUID,
    "booking_reference" VARCHAR(32),
    "idempotency_key" VARCHAR(64),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancellation_reason" TEXT,
    "rescheduled_from_id" UUID,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "subject" VARCHAR(200),
    "message" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(150) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100),
    "short_description" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "icon_name" VARCHAR(100),
    "offerings" JSONB DEFAULT '[]',
    "is_featured" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "subscribed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMPTZ(6),
    "unsubscribe_token_hash" VARCHAR(255),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "google_id" VARCHAR(255),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "avatar" TEXT,
    "role" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password_hash" VARCHAR(255),
    "auth_provider" VARCHAR(50) NOT NULL DEFAULT 'local',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "idx_articles_category" ON "articles"("category");

-- CreateIndex
CREATE INDEX "idx_articles_slug" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "idx_articles_status" ON "articles"("status");

-- CreateIndex
CREATE INDEX "idx_availability_overrides_date" ON "availability_overrides"("override_date");

-- CreateIndex
CREATE INDEX "idx_availability_overrides_type" ON "availability_overrides"("consultation_type_id");

-- CreateIndex
CREATE INDEX "idx_availability_rules_active" ON "availability_rules"("is_active");

-- CreateIndex
CREATE INDEX "idx_availability_rules_day" ON "availability_rules"("day_of_week");

-- CreateIndex
CREATE INDEX "idx_availability_rules_type" ON "availability_rules"("consultation_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_types_slug_key" ON "consultation_types"("slug");

-- CreateIndex
CREATE INDEX "idx_consultation_types_active" ON "consultation_types"("is_active");

-- CreateIndex
CREATE INDEX "idx_consultation_types_order" ON "consultation_types"("display_order");

-- CreateIndex
CREATE INDEX "idx_consultation_types_slug" ON "consultation_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_booking_reference_key" ON "consultations"("booking_reference");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_idempotency_key_key" ON "consultations"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_consultations_booking_ref" ON "consultations"("booking_reference");

-- CreateIndex
CREATE INDEX "idx_consultations_idempotency" ON "consultations"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_consultations_pillar" ON "consultations"("pillar_interest");

-- CreateIndex
CREATE INDEX "idx_consultations_slot_start" ON "consultations"("slot_start");

-- CreateIndex
CREATE INDEX "idx_consultations_status" ON "consultations"("status");

-- CreateIndex
CREATE INDEX "idx_consultations_type_id" ON "consultations"("consultation_type_id");

-- CreateIndex
CREATE INDEX "idx_consultations_user_id" ON "consultations"("user_id");

-- CreateIndex
CREATE INDEX "idx_consultations_user_status" ON "consultations"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_contact_messages_created_at" ON "contact_messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_contact_messages_email" ON "contact_messages"("email");

-- CreateIndex
CREATE INDEX "idx_contact_messages_status" ON "contact_messages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "schema_migrations_name_key" ON "schema_migrations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "idx_services_active" ON "services"("is_active");

-- CreateIndex
CREATE INDEX "idx_services_category" ON "services"("category");

-- CreateIndex
CREATE INDEX "idx_services_order" ON "services"("display_order");

-- CreateIndex
CREATE INDEX "idx_services_slug" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE INDEX "idx_subscribers_email" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_auth_provider" ON "users"("auth_provider");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_google_id" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- AddForeignKey
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_consultation_type_id_fkey" FOREIGN KEY ("consultation_type_id") REFERENCES "consultation_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_consultation_type_id_fkey" FOREIGN KEY ("consultation_type_id") REFERENCES "consultation_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_consultation_type_id_fkey" FOREIGN KEY ("consultation_type_id") REFERENCES "consultation_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_rescheduled_from_id_fkey" FOREIGN KEY ("rescheduled_from_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;


-- ==============================================================================
-- POSTGRESQL-SPECIFIC FEATURES: CHECK CONSTRAINTS
-- ==============================================================================

-- CheckConstraint: chk_article_status
ALTER TABLE "articles" ADD CONSTRAINT "chk_article_status" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));

-- CheckConstraint: chk_override_hours
ALTER TABLE "availability_overrides" ADD CONSTRAINT "chk_override_hours" CHECK ("is_available" = FALSE OR ("start_time" IS NOT NULL AND "end_time" IS NOT NULL AND "end_time" > "start_time"));

-- CheckConstraint: availability_rules_day_of_week_check
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_day_of_week_check" CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6);

-- CheckConstraint: chk_availability_times
ALTER TABLE "availability_rules" ADD CONSTRAINT "chk_availability_times" CHECK ("end_time" > "start_time");

-- CheckConstraint: chk_break_times
ALTER TABLE "availability_rules" ADD CONSTRAINT "chk_break_times" CHECK (("break_start" IS NULL AND "break_end" IS NULL) OR ("break_start" IS NOT NULL AND "break_end" IS NOT NULL AND "break_end" > "break_start" AND "break_start" >= "start_time" AND "break_end" <= "end_time"));

-- CheckConstraint: chk_buffer_non_negative
ALTER TABLE "consultation_types" ADD CONSTRAINT "chk_buffer_non_negative" CHECK ("buffer_minutes" >= 0);

-- CheckConstraint: chk_duration_positive
ALTER TABLE "consultation_types" ADD CONSTRAINT "chk_duration_positive" CHECK ("duration_minutes" > 0);

-- CheckConstraint: chk_consultation_slot_range
ALTER TABLE "consultations" ADD CONSTRAINT "chk_consultation_slot_range" CHECK (("slot_start" IS NULL AND "slot_end" IS NULL) OR ("slot_end" > "slot_start"));

-- CheckConstraint: chk_consultation_status
ALTER TABLE "consultations" ADD CONSTRAINT "chk_consultation_status" CHECK ("status" IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED'));

-- CheckConstraint: chk_contact_status
ALTER TABLE "contact_messages" ADD CONSTRAINT "chk_contact_status" CHECK ("status" IN ('NEW', 'READ', 'RESOLVED', 'ARCHIVED'));

-- CheckConstraint: chk_user_role
ALTER TABLE "users" ADD CONSTRAINT "chk_user_role" CHECK ("role" IN ('USER', 'ADMIN'));

-- ==============================================================================
-- POSTGRESQL-SPECIFIC FEATURES: PARTIAL INDEXES
-- ==============================================================================

-- PartialIndex: idx_articles_published_at
CREATE INDEX IF NOT EXISTS "idx_articles_published_at" ON "articles"("published_at" DESC) WHERE "status" = 'PUBLISHED';

-- PartialIndex: idx_consultations_active_range
CREATE INDEX IF NOT EXISTS "idx_consultations_active_range" ON "consultations"("slot_start", "slot_end") WHERE ("status" IN ('CONFIRMED', 'PENDING'));

-- PartialIndex: idx_subscribers_active
CREATE INDEX IF NOT EXISTS "idx_subscribers_active" ON "subscribers"("subscribed_at") WHERE "unsubscribed_at" IS NULL;

-- ==============================================================================
-- POSTGRESQL-SPECIFIC FEATURES: TIMESTAMP FUNCTION & TRIGGERS
-- ==============================================================================

-- Function: update_timestamp_column
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$ LANGUAGE 'plpgsql';

-- Triggers: trg_*_updated_at
DROP TRIGGER IF EXISTS "trg_articles_updated_at" ON "articles";
CREATE TRIGGER "trg_articles_updated_at"
    BEFORE UPDATE ON "articles"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_availability_overrides_updated_at" ON "availability_overrides";
CREATE TRIGGER "trg_availability_overrides_updated_at"
    BEFORE UPDATE ON "availability_overrides"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_availability_rules_updated_at" ON "availability_rules";
CREATE TRIGGER "trg_availability_rules_updated_at"
    BEFORE UPDATE ON "availability_rules"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_consultation_types_updated_at" ON "consultation_types";
CREATE TRIGGER "trg_consultation_types_updated_at"
    BEFORE UPDATE ON "consultation_types"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_consultations_updated_at" ON "consultations";
CREATE TRIGGER "trg_consultations_updated_at"
    BEFORE UPDATE ON "consultations"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_contact_messages_updated_at" ON "contact_messages";
CREATE TRIGGER "trg_contact_messages_updated_at"
    BEFORE UPDATE ON "contact_messages"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_services_updated_at" ON "services";
CREATE TRIGGER "trg_services_updated_at"
    BEFORE UPDATE ON "services"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_subscribers_updated_at" ON "subscribers";
CREATE TRIGGER "trg_subscribers_updated_at"
    BEFORE UPDATE ON "subscribers"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS "trg_users_updated_at" ON "users";
CREATE TRIGGER "trg_users_updated_at"
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();