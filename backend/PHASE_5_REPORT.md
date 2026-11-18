# Phase 5 Implementation Report — Consultation Booking System

**Project:** The Harmony Project — Soulfit  
**Phase:** 5 (Availability, Time Slots, Secure Booking Transactions, Concurrency Protection & User Dashboard)  
**Date:** November 17, 2026  
**Status:** Completed & Fully Verified  

---

## 1. Implemented Features

1. **Structured Consultation Types Catalog:**
   - 5 core wellness disciplines mapped to client's verified pillars:
     1. Restorative Yoga Therapy & Physical Alignment (60m duration, 15m buffer, complimentary initial guidance)
     2. Vastu & Five Elements Spatial Assessment (60m duration, 15m buffer, complimentary guidance)
     3. Cosmic Blueprint & Astrology Consultation (45m duration, 15m buffer, complimentary guidance)
     4. Corporate Wellbeing Strategy Session (45m duration, 15m buffer, tailored executive program)
     5. Holistic Nutrition & Food as Medicine (45m duration, 15m buffer, cellular vitality guidance)
   - Configuration-driven duration, buffer time, display price, and active status.
2. **Dynamic Availability Management Engine:**
   - Weekly recurring availability rules (`availability_rules`) with configurable weekdays (Monday–Saturday 09:00 to 18:00), lunch breaks (13:00 to 14:00), and inactive sanctuary days (Sunday).
   - Date-specific availability overrides (`availability_overrides`) for sanctuary holidays and custom working hours.
   - Slot generation strictly enforced in `Asia/Kolkata` timezone with 30-minute minimum advance notice, excluding past slots and break periods.
3. **Transactional Concurrency & Double-Booking Protection:**
   - PostgreSQL transaction blocks (`BEGIN; ... COMMIT;`).
   - Transactional advisory locking by date (`SELECT pg_advisory_xact_lock(...)`) to serialize concurrent bookings on the same calendar day while allowing other dates to book in parallel.
   - Row-level lock verification (`SELECT ... FOR UPDATE`) checking for overlapping active bookings (`status IN ('CONFIRMED', 'PENDING')`).
   - Rejection with `409 Conflict` if a slot is unavailable.
   - Idempotency key tracking preventing duplicate booking submissions on network retries.
   - Unique, secure booking reference generation (`HP-YYYY-XXXXXX`).
4. **Ownership Verification, Cancellation & Rescheduling:**
   - Strict multi-tenant authorization (`req.user.id`). Users cannot inspect, cancel, or reschedule bookings belonging to other members (`403 Forbidden`).
   - Configurable cancellation notice policy (minimum 2 hours notice).
   - Atomic rescheduling reserving the new slot and releasing the previous slot.
5. **Sanctuary Notification Service Abstraction:**
   - Provider-independent email notification interface with safe development preview logging.
   - Asynchronous and non-blocking: notification failures never abort or rollback an already committed database booking.
6. **Polished Frontend Booking & Member Dashboard Experience:**
   - Responsive multi-step booking flow at `/book` (Discipline &rarr; Date &rarr; Slot &rarr; Intentions &rarr; Review &rarr; Confirmation).
   - Member consultation dashboard at `/my-consultations` with tab filtering (Upcoming vs. Past/Cancelled), cancel confirmation dialog, and rescheduling slot picker modal.
   - Member Dashboard integration at `/dashboard` displaying upcoming session cards and quick scheduling shortcuts.
   - Sticky Header and Mobile Drawer navigation reflecting booking shortcuts and active session links.

---

## 2. Database Changes

### A. Up Migration (`004_consultation_booking_schema.sql`)
1. **`consultation_types` Table:**
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - `slug VARCHAR(150) UNIQUE NOT NULL`
   - `name VARCHAR(150) NOT NULL`
   - `description TEXT`
   - `duration_minutes INTEGER DEFAULT 60 NOT NULL`
   - `buffer_minutes INTEGER DEFAULT 15 NOT NULL`
   - `price_display VARCHAR(50)`
   - `is_active BOOLEAN DEFAULT TRUE NOT NULL`
   - `display_order INTEGER DEFAULT 0 NOT NULL`
   - Automated `updated_at` trigger.
2. **`availability_rules` Table:**
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - Foreign Key: `consultation_type_id UUID REFERENCES consultation_types(id) ON DELETE CASCADE` (nullable for global schedule)
   - `day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6)`
   - `start_time TIME NOT NULL`
   - `end_time TIME NOT NULL`
   - `break_start TIME`, `break_end TIME`
   - `is_active BOOLEAN DEFAULT TRUE NOT NULL`
3. **`availability_overrides` Table:**
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - Foreign Key: `consultation_type_id UUID REFERENCES consultation_types(id) ON DELETE CASCADE`
   - `override_date DATE NOT NULL`
   - `is_available BOOLEAN DEFAULT FALSE NOT NULL`
   - `start_time TIME`, `end_time TIME`, `reason VARCHAR(255)`
4. **`consultations` Table Alterations:**
   - Added `consultation_type_id UUID REFERENCES consultation_types(id) ON DELETE RESTRICT`
   - Added `booking_reference VARCHAR(32) UNIQUE`
   - Added `idempotency_key VARCHAR(64) UNIQUE`
   - Added `cancelled_at TIMESTAMPTZ`
   - Added `cancellation_reason TEXT`
   - Added `rescheduled_from_id UUID REFERENCES consultations(id) ON DELETE SET NULL`
   - Altered `phone` column to be optional (`DROP NOT NULL`)
   - Expanded status check constraint to include `'RESCHEDULED'`: `CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED'))`
   - Composite and filtered indexes:
     - `idx_consultations_booking_ref ON consultations(booking_reference)`
     - `idx_consultations_idempotency ON consultations(idempotency_key)`
     - `idx_consultations_user_status ON consultations(user_id, status)`
     - `idx_consultations_active_range ON consultations(slot_start, slot_end) WHERE (status IN ('CONFIRMED', 'PENDING'))`

### B. Down Migration (`004_consultation_booking_schema.down.sql`)
- Drops indexes, reverts status check constraints, drops added columns from `consultations`, and cascades drop on `availability_overrides`, `availability_rules`, and `consultation_types`.

---

## 3. New API Endpoints

All endpoints are versioned under `/api/v1/consultations`:

| Endpoint | Method | Protection | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/consultations/types` | `GET` | Public | Standard | Lists active consultation types |
| `/api/v1/consultations/availability/dates` | `GET` | Public | Standard | Returns dates with at least 1 open slot |
| `/api/v1/consultations/availability` | `GET` | Public | Standard | Returns open slots for a specific date |
| `/api/v1/consultations/book` | `POST` | Authenticated | 30 / 15m (`bookingLimiter`) | Transactionally books slot with concurrency lock |
| `/api/v1/consultations/my` | `GET` | Authenticated | Standard | Lists authenticated member's booking history |
| `/api/v1/consultations/:id` | `GET` | Authenticated | Standard | Retrieves booking details (owner only) |
| `/api/v1/consultations/:id/cancel` | `PATCH` | Authenticated | Standard | Cancels booking & releases slot (owner only) |
| `/api/v1/consultations/:id/reschedule` | `PATCH` | Authenticated | Standard | Atomically reschedules to new slot (owner only) |

---

## 4. Authentication Integration

- Every booking is irrevocably attached to `req.user.id` established by Phase 4's JWT `auth_token` HttpOnly cookie.
- No client-supplied `user_id` is trusted.
- Ownership is verified in every single-resource read, cancel, or reschedule operation. Attempts by one user to access or mutate another user's consultation immediately terminate with `403 Forbidden`.
- Authentication tokens remain strictly inside secure HttpOnly cookies (`SameSite: Lax`). No tokens are ever written to browser `localStorage` or `sessionStorage`.

---

## 5. Transaction and Concurrency Strategy

Double-booking is prevented using a multi-tiered defense:
1. **Date-Level Advisory Transaction Locks (`SELECT pg_advisory_xact_lock`):**
   Serializes concurrent bookings for the same calendar day while keeping distinct days 100% concurrent without lock contention.
2. **Row-Level Overlap Lock (`SELECT id, booking_reference FROM consultations WHERE ... FOR UPDATE`):**
   Detects any active booking whose interval overlaps `[slot_start, slot_end]`.
3. **Transactional Isolation (`BEGIN; ... COMMIT; / ROLLBACK;`):**
   If an overlap is detected, the transaction immediately rolls back and throws `ApiError.conflict(409)`.
4. **Idempotency Key Check:**
   If a client resends a booking request with the same `idempotency_key`, the transaction returns the existing booking rather than creating a duplicate.

---

## 6. Frontend Routes and Components

- **`/book` (`BookConsultation.jsx`):**
  Protected multi-step booking wizard with visual stepper, live date selection, slot grid, intentions form, summary review, and confirmation card.
- **`/my-consultations` (`MyConsultations.jsx`):**
  Protected dashboard view supporting tabs (Upcoming, Past & Cancelled, All), cancellation dialog with reason input, and rescheduling date/slot selector.
- **`/dashboard` (`Dashboard.jsx`):**
  Integrated upcoming session cards and quick scheduling shortcuts.
- **`Header.jsx` & `MobileMenu.jsx`:**
  Updated with direct links to "Book Consultation" (`/book`) and "My Sessions" (`/my-consultations`).

---

## 7. Tests Executed & Actual Results

### Test Suite Execution Summary
```text
> the-harmony-project-backend@1.0.0 test
> node --test tests/**/*.test.js

ℹ tests 65
ℹ suites 13
ℹ pass 65
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 7243.0305
```

### Breakdown of Test Suites
1. **`consultation.test.js` (In-Memory `pg-mem` Integration Suite - 13 Tests):**
   - Active consultation types retrieval with duration & buffer.
   - Future available dates calculation for a month.
   - Available time slot generation excluding break times (13:00–14:00).
   - Exclusion of inactive days (Sundays).
   - Rejection of unauthenticated booking attempts (`401 Unauthorized`).
   - Rejection of past slot booking attempts (`400 Bad Request`).
   - Successful consultation booking with unique booking reference generation (`201 Created`).
   - Double-booking rejection on identical slots (`409 Conflict`).
   - Overlapping appointment rejection with different durations (`409 Conflict`).
   - Idempotency key handling returning existing booking without duplicate insertion.
   - Multi-tenant isolation: user receives only their own bookings (`GET /consultations/my`).
   - Unauthorized access prevention (`403 Forbidden` on viewing, cancelling, or rescheduling other users' bookings).
   - Cancellation slot release and re-booking verification.
   - Atomic rescheduling releasing old slot and confirming new slot.
   - Double cancellation rejection (`400 Bad Request`).
2. **`consultation.real_pg.test.js` (Real PostgreSQL 18 Concurrency Suite - 2 Tests):**
   - Simultaneous concurrent booking race condition with mutual exclusion (`Promise.all` issuing parallel HTTP requests). Exactly one transaction achieves `201 Created` and the second receives `409 Conflict`.
   - Real PostgreSQL overlapping appointment prevention with different durations.
3. **Phase 1–4 Regression Suites (50 Tests):**
   - `auth.test.js` (16 tests) — Register, Login, Google OAuth, Cookies, CSRF, Expired Tokens.
   - `articles.test.js` (6 tests) — Filtering, searching, slugs, drafts.
   - `services.test.js` (5 tests) — 5 wellness pillars, ordering, slugs.
   - `newsletter.test.js` (5 tests) — Subscription, duplication, unsubscription.
   - `database.test.js` (6 tests) — Schema integrity, constraints, rollback snapshots.
   - `security.test.js` (3 tests) — SQL injection, malformed JSON, payload size limits.

### Frontend Production Build
```text
vite v6.4.6 building for production...
✓ 2036 modules transformed.
dist/index.html                   1.81 kB │ gzip:   0.78 kB
dist/assets/index-VPBvAro0.css   44.61 kB │ gzip:   7.89 kB
dist/assets/index-DvFDy2kN.js   540.78 kB │ gzip: 157.31 kB
✓ built in 12.85s
```

---

## 8. Real PostgreSQL Verification Details

To satisfy the strict concurrency verification requirements:
- A real PostgreSQL 18 server cluster was spawned on local port `5433` using the native binaries (`initdb.exe`, `pg_ctl.exe`).
- All 4 migration scripts and seeds were applied against real PostgreSQL.
- Two asynchronous HTTP clients simultaneously attempted to insert overlapping consultations inside real concurrent transactions.
- PostgreSQL's transactional row-locking and advisory locks correctly serialized the requests:
  - Client 1 received `HTTP 201 Created` (`booking_reference: HP-2026-XXXXXX`).
  - Client 2 received `HTTP 409 Conflict` (`"The selected time slot has already been booked..."`).
  - Database verification query confirmed that exactly 1 booking row existed in `consultations`.

---

## 9. Known Limitations & Phase 6 Boundaries

1. **Payment Gateway Integration:** Consultation booking currently confirms sessions without collecting online payment (as per prompt instructions, payments are out of scope for Phase 5).
2. **Video Consultation Integration:** Third-party video links (e.g., Zoom/Google Meet) are not auto-generated; session links will be connected in future operations.
3. **Admin Schedule Management UI:** Availability is configured via database seeds and migration rules; an administrative schedule modification dashboard was intentionally excluded as specified.

---

## 10. Setup and Execution Instructions

### Running Migrations & Seeds on PostgreSQL:
```bash
# In backend directory
npm run migrate:up
npm run seed
```

### Running the Complete Automated Test Suite:
```bash
# Executes both in-memory and real PostgreSQL concurrency suites
npm.cmd --prefix backend test
```

### Running the Frontend:
```bash
npm.cmd --prefix frontend run dev
```
Accessible at `http://localhost:5173/book` and `http://localhost:5173/my-consultations`.
