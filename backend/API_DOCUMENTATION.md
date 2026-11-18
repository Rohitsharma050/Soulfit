# The Harmony Project — Public REST API Documentation (v1)

This document provides a comprehensive technical reference for the public-facing RESTful APIs powering **The Harmony Project** web application. All endpoints are versioned under `/api/v1` and strictly enforce centralized JSON envelope structures, input validation, rate limiting, and database-backed persistence with PostgreSQL.

---

## 1. Global Architecture & Response Envelope Standards

All responses conform to standardized JSON formats.

### 1.1 Success Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable confirmation message",
  "data": { ... } | [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```
*Note: `meta` is included on paginated list endpoints.*

### 1.2 Error Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed for request parameters",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ],
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

---

## 2. Rate Limiting & Global Security Policies

| Category | Endpoints Protected | Window | Max Requests | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Limiter** | `POST /api/v1/auth/*` | 15 minutes | 30 requests per IP | Mitigates brute-force credential stuffing and registration spam |
| **Contact Limiter** | `POST /api/v1/contact` | 15 minutes | 5 requests per IP | Prevents email bombarding and inbox spam |
| **Newsletter Limiter** | `POST /api/v1/newsletter/*` | 15 minutes | 10 requests per IP | Protects subscription table from mass bot abuse |
| **Public Limiter** | `GET /api/v1/services/*`, `GET /api/v1/articles/*` | 15 minutes | 100 requests per IP | Mitigates automated scraping and DDoS surges |
| **Global Middleware** | All routes | Continuous | 10 KB body limit | Blocks oversized/malicious payload amplification attacks |

---

## 3. Services API

### 3.1 Get All Active Services
Fetches the ordered catalog of active wellness pillars.

- **URL:** `/api/v1/services`
- **Method:** `GET`
- **Auth Required:** No
- **Headers:** `Accept: application/json`
- **Rate Limit:** 100 req / 15 min

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `featured` | `boolean` (`true`\|`false`) | No | None | When `true`, filters only services flagged as `is_featured = true`. |

#### Example Request
```http
GET /api/v1/services?featured=true HTTP/1.1
Host: localhost:5000
Accept: application/json
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Active services retrieved successfully",
  "data": [
    {
      "id": "c138d67c-9b16-43b7-9fa5-38c7f3ba9e12",
      "slug": "yoga-wellness",
      "name": "Soulfit — Somatic Vitality & Restorative Yoga",
      "subtitle": "The Biological Vessel",
      "short_description": "Structural spinal realignment, restorative yoga as a way of life, and nervous system regulation to exit fight-or-flight.",
      "description": "A comprehensive physical cultivation discipline...",
      "icon_name": "Activity",
      "display_order": 1,
      "is_featured": true,
      "is_active": true,
      "meta_title": "Soulfit & Restorative Yoga | The Harmony Project",
      "meta_description": "Restorative movement and disorder management...",
      "created_at": "2026-11-14T07:44:00.000Z",
      "updated_at": "2026-11-14T07:44:00.000Z"
    }
  ]
}
```

---

### 3.2 Get Single Service by Slug
Fetches full details for a specific active wellness pillar.

- **URL:** `/api/v1/services/:slug`
- **Method:** `GET`
- **Auth Required:** No
- **Headers:** `Accept: application/json`
- **Rate Limit:** 100 req / 15 min

#### Route Parameters
| Parameter | Type | Validation | Description |
| :--- | :--- | :--- | :--- |
| `slug` | `string` | Lowercase alphanumeric with hyphens, max 100 chars | Unique URL identifier (e.g., `yoga-wellness`, `vastu`, `astrology`, `food-as-medicine`, `corporate-wellbeing`) |

#### Example Request
```http
GET /api/v1/services/food-as-medicine HTTP/1.1
Host: localhost:5000
Accept: application/json
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Service details retrieved successfully",
  "data": {
    "id": "e492b1a8-d621-4d33-bc92-57cb5ef83a99",
    "slug": "food-as-medicine",
    "name": "Food as Medicine — Systemic Cellular Nourishment",
    "subtitle": "Cellular Bio-Fuel",
    "short_description": "Anti-inflammatory seasonal Ritucharya and cellular nutrition restoring gut biome vitality and serene mental clarity.",
    "description": "Every meal is a biochemical dialogue with your cells...",
    "icon_name": "Apple",
    "display_order": 4,
    "is_featured": true,
    "is_active": true,
    "meta_title": "Food as Medicine & Nutritional Biology | The Harmony Project",
    "meta_description": "Anti-inflammatory dietary frameworks...",
    "created_at": "2026-11-14T07:44:00.000Z",
    "updated_at": "2026-11-14T07:44:00.000Z"
  }
}
```

#### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Service with slug \"unknown-pillar\" was not found or is currently inactive.",
  "errors": [],
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

---

## 4. Contact Inquiries API

### 4.1 Submit Public Contact Inquiry
Processes inquiries from the public contact page, sanitizes input, validates required fields, verifies honeypot spam protection, and persists to `contact_messages`.

- **URL:** `/api/v1/contact`
- **Method:** `POST`
- **Auth Required:** No
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Rate Limit:** 5 req / 15 min

#### Request Validation Rules (Zod)
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | 2 - 100 characters, trimmed |
| `email` | `string` | **Yes** | Valid RFC 5322 email format, lowercase, max 255 chars |
| `phone` | `string` | No | Optional, max 30 chars, trimmed |
| `service_interest` | `string` | No | Optional, max 100 chars, trimmed |
| `message` | `string` | **Yes** | 10 - 3,000 characters, trimmed |
| `website_url` | `string` | No | **Honeypot field**. Must remain empty. If populated, submission is rejected as bot spam. |

#### Example Request
```http
POST /api/v1/contact HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "phone": "+91 98765 43210",
  "service_interest": "Vastu Spatial Geometry",
  "message": "We are renovating our ancestral home in Gurgaon and would love an elemental directional audit.",
  "website_url": ""
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Your message has been received. Soulfit's sanctuary team will review and connect with you shortly.",
  "data": {
    "id": "18cf325e-38aa-462c-8064-1ddbc131d9c7",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "created_at": "2026-11-14T08:00:00.000Z"
  }
}
```

#### Error Response (`400 Bad Request` - Validation Failure)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed for request parameters",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "message",
      "message": "Message must be at least 10 characters long"
    }
  ],
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

#### Error Response (`429 Too Many Requests`)
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many contact messages received from this IP address. Please wait 15 minutes before sending another inquiry.",
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

---

## 5. Newsletter Subscription API

### 5.1 Subscribe to Newsletter
Enrolls an email into the weekly cosmic & wellness digest. Implements idempotent handling: re-subscribing an active user succeeds gracefully, and re-subscribing a previously unsubscribed user reactivates their status.

- **URL:** `/api/v1/newsletter/subscribe`
- **Method:** `POST`
- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Rate Limit:** 10 req / 15 min

#### Request Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Valid RFC 5322 email format, lowercase, max 255 chars |
| `name` | `string` | No | Optional, max 100 chars |
| `consent` | `boolean` | **Yes** | Must be boolean `true` |

#### Example Request
```http
POST /api/v1/newsletter/subscribe HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "email": "seeker@harmonyproject.life",
  "name": "Devi",
  "consent": true
}
```

#### Success Response (`201 Created` or `200 OK`)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Thank you for subscribing to Soulfit's Wellness Digest.",
  "data": {
    "email": "seeker@harmonyproject.life",
    "status": "SUBSCRIBED"
  }
}
```

---

### 5.2 Unsubscribe from Newsletter
Allows users to opt out using their secure SHA-256 hashed unsubscribe token.

- **URL:** `/api/v1/newsletter/unsubscribe`
- **Method:** `POST`
- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Rate Limit:** 10 req / 15 min

#### Request Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Yes** | 64-character hexadecimal SHA-256 token string |

#### Example Request
```http
POST /api/v1/newsletter/unsubscribe HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "token": "4a7d6e8b2c1f903a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "You have been successfully unsubscribed from The Harmony Project digest.",
  "data": {
    "email": "seeker@harmonyproject.life",
    "status": "UNSUBSCRIBED"
  }
}
```

#### Error Response (`400 Bad Request` - Invalid/Expired Token)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid, expired, or already processed unsubscribe token",
  "errors": [],
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

---

## 6. Articles & Knowledge Sanctuary API

### 6.1 List Published Articles
Retrieves published wisdom dispatches with server-side pagination, category filtering, and keyword search. Strictly excludes non-published articles (`DRAFT`, `ARCHIVED`).

- **URL:** `/api/v1/articles`
- **Method:** `GET`
- **Auth Required:** No
- **Headers:** `Accept: application/json`
- **Rate Limit:** 100 req / 15 min

#### Query Parameters
| Parameter | Type | Required | Default | Validation & Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | Min: `1` |
| `limit` | `integer` | No | `10` | Min: `1`, Max: `50` |
| `category` | `string` | No | None | Case-insensitive filter (`SOULFIT & MIND`, `VASTU PRINCIPLES`, `FOOD AS MEDICINE`, `COSMIC CYCLES`) |
| `search` | `string` | No | None | Keyword query searched across `title`, `excerpt`, and `author_name` |

#### Example Request
```http
GET /api/v1/articles?category=FOOD%20AS%20MEDICINE&limit=5 HTTP/1.1
Host: localhost:5000
Accept: application/json
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Published articles retrieved successfully",
  "data": [
    {
      "id": "7f8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "slug": "gut-inflammation-mind-anxiety",
      "title": "Inflammation in the Gut Is Anxiety in the Mind",
      "excerpt": "How repairing the enteric nervous system through targeted seed broths restores serene emotional states.",
      "category": "FOOD AS MEDICINE",
      "author_name": "Soulfit Guidance",
      "reading_time_minutes": 6,
      "featured_image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
      "published_at": "2026-10-18T10:00:00.000Z",
      "created_at": "2026-10-18T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 6.2 Get Single Article by Slug
Fetches full article narrative, metadata, and body by unique slug.

- **URL:** `/api/v1/articles/:slug`
- **Method:** `GET`
- **Auth Required:** No
- **Headers:** `Accept: application/json`
- **Rate Limit:** 100 req / 15 min

#### Route Parameters
| Parameter | Type | Validation | Description |
| :--- | :--- | :--- | :--- |
| `slug` | `string` | Lowercase alphanumeric with hyphens, max 150 chars | Unique article URL identifier |

#### Example Request
```http
GET /api/v1/articles/gut-inflammation-mind-anxiety HTTP/1.1
Host: localhost:5000
Accept: application/json
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Article details retrieved successfully",
  "data": {
    "id": "7f8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "slug": "gut-inflammation-mind-anxiety",
    "title": "Inflammation in the Gut Is Anxiety in the Mind",
    "excerpt": "How repairing the enteric nervous system through targeted seed broths restores serene emotional states.",
    "content": "Modern gastroenterology has finally confirmed what ancient Vedic science termed the Agni-Manas connection...",
    "category": "FOOD AS MEDICINE",
    "author_name": "Soulfit Guidance",
    "reading_time_minutes": 6,
    "featured_image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    "status": "PUBLISHED",
    "published_at": "2026-10-18T10:00:00.000Z",
    "meta_title": "Gut Inflammation & Emotional Anxiety | The Harmony Project",
    "meta_description": "Explore the Agni-Manas connection...",
    "created_at": "2026-10-18T10:00:00.000Z",
    "updated_at": "2026-10-18T10:00:00.000Z"
  }
}
```

#### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Article with slug \"nonexistent-guide\" was not found or has not yet been published.",
  "errors": [],
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

---

## 7. System Health & Infrastructure Diagnostics

### 7.1 Server Liveness Probe
- **URL:** `/health`
- **Method:** `GET`
- **Success (`200 OK`):**
```json
{
  "status": "OK",
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

### 7.2 Database Connectivity Diagnostics
- **URL:** `/api/v1/health/db`
- **Method:** `GET`
- **Success (`200 OK`):**
```json
{
  "status": "connected",
  "database": "PostgreSQL",
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```
- **Failure (`503 Service Unavailable`):**
```json
{
  "status": "error",
  "message": "Database ping failed or credentials invalid",
  "timestamp": "2026-11-14T08:00:00.000Z"
}
```

---

## 8. Authentication & User Identity Management API (Phase 4)

The Phase 4 identity architecture enforces defense-in-depth:
1. **HttpOnly Cookie Storage:** JWT auth tokens are delivered exclusively in secure `HttpOnly`, `SameSite: Lax`, and `Secure` (production) cookies named `auth_token`. Tokens are never exposed to browser JavaScript (no `localStorage` or `sessionStorage` storage).
2. **Password Security:** Passwords are salted and hashed using `bcryptjs` with 12 computational rounds. Plain-text passwords are never stored or logged.
3. **User Enumeration Defense:** Failed login attempts return an identical generic `401 Unauthorized` response whether the email exists or not.
4. **Google OAuth 2.0 Integration:** Server-side verification and callback handling. Prevents duplicate identities by safely linking verified Google accounts to existing email profiles.

### 8.1 Register New Account
- **URL:** `/api/v1/auth/register`
- **Method:** `POST`
- **Rate Limit:** 30 requests / 15 minutes
- **Body Schema:**
```json
{
  "name": "Rohit Sharma",
  "email": "rohit@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```
- **Password Requirements:** Minimum 8 characters, containing at least one letter and at least one number.
- **Success (`201 Created`):**
  - Sets `auth_token` HttpOnly cookie.
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created successfully.",
  "data": {
    "id": 14,
    "name": "Rohit Sharma",
    "email": "rohit@example.com",
    "role": "user",
    "avatar": null,
    "auth_provider": "local",
    "created_at": "2026-11-17T05:00:00.000Z"
  }
}
```
- **Error (`409 Conflict`):**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "An account with this email address already exists.",
  "error": "An account with this email address already exists."
}
```

### 8.2 Login (Email & Password)
- **URL:** `/api/v1/auth/login`
- **Method:** `POST`
- **Rate Limit:** 30 requests / 15 minutes
- **Body Schema:**
```json
{
  "email": "rohit@example.com",
  "password": "Password123!",
  "rememberMe": true
}
```
- **Success (`200 OK`):**
  - Sets `auth_token` HttpOnly cookie (default 7 days, or 30 days if `rememberMe: true`).
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Authentication successful.",
  "data": {
    "id": 14,
    "name": "Rohit Sharma",
    "email": "rohit@example.com",
    "role": "user",
    "avatar": null,
    "auth_provider": "local",
    "last_login_at": "2026-11-17T05:05:00.000Z",
    "created_at": "2026-11-17T05:00:00.000Z"
  }
}
```
- **Error (`401 Unauthorized`):** Generic message preventing user enumeration.
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password.",
  "error": "Invalid email or password."
}
```

### 8.3 Get Current Authenticated Profile
- **URL:** `/api/v1/auth/me`
- **Method:** `GET`
- **Authentication:** Required (`auth_token` cookie or `Authorization: Bearer <token>`)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Current session retrieved successfully.",
  "data": {
    "id": 14,
    "name": "Rohit Sharma",
    "email": "rohit@example.com",
    "role": "user",
    "avatar": null,
    "auth_provider": "local",
    "last_login_at": "2026-11-17T05:05:00.000Z",
    "created_at": "2026-11-17T05:00:00.000Z"
  }
}
```
- **Error (`401 Unauthorized`):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required. Please log in.",
  "error": "Authentication required. Please log in."
}
```

### 8.4 Logout
- **URL:** `/api/v1/auth/logout`
- **Method:** `POST`
- **Success (`200 OK`):**
  - Clears `auth_token` HttpOnly cookie.
```json
{
  "success": true,
  "statusCode": 200,
  "message": "You have been successfully logged out."
}
```

### 8.5 Google OAuth 2.0 Flow
1. **Initiate Google Sign-In:**
   - **URL:** `GET /api/v1/auth/google`
   - Redirects user to Google Accounts consent screen (`https://accounts.google.com/o/oauth2/v2/auth`) with scope `openid email profile`.
2. **Google Callback:**
   - **URL:** `GET /api/v1/auth/google/callback?code=...`
   - Validates authorization code with Google token endpoint.
   - Verifies profile (`google_id`, `email`, `name`, `avatar`).
   - If user exists: links Google identity if not already linked, updates `last_login_at`.
   - If new user: registers new user with `auth_provider: 'google'`.
   - Sets secure HttpOnly cookie and redirects to frontend `/dashboard` (or `/login?error=...` on failure).

### 8.6 Environment Variables for Authentication
```env
# JWT Session Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REMEMBER_EXPIRES_IN=30d
COOKIE_SECRET=your_cookie_signing_secret

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
```

---

## 9. Consultation Booking System API (Phase 5)

The Consultation Booking System provides transactional, concurrency-safe appointment scheduling across the five sanctuary disciplines.

### Key Architecture & Concurrency Safeguards:
1. **Advisory Transactional Locking:** `SELECT pg_advisory_xact_lock(...)` serializes concurrent booking requests targeting the same calendar day, eliminating race conditions while allowing independent days to book simultaneously in parallel.
2. **Row-Level Overlap Exclusion (`SELECT ... FOR UPDATE`):** Transactions verify within PostgreSQL that no active booking (`CONFIRMED` or `PENDING`) overlaps the requested `[slot_start, slot_end]` window.
3. **Idempotency Protection:** Requests with an `idempotency_key` safely return existing bookings upon network retries without creating duplicates.
4. **Owner Verification:** Authenticated user identity (`req.user.id`) is enforced on all booking, viewing, cancelling, and rescheduling operations.

---

### 9.1 Get Consultation Types
- **URL:** `/api/v1/consultations/types`
- **Method:** `GET`
- **Protection:** Public
- **Success (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Consultation types retrieved successfully",
  "data": [
    {
      "id": "c0a80123-0000-0000-0000-000000000001",
      "slug": "yoga-wellness",
      "name": "Restorative Yoga Therapy & Physical Alignment",
      "description": "Personalized 1-on-1 restorative yoga guidance focusing on rest, calm, physical vitality, and management of conditions including PCOD, diabetes, and hypertension.",
      "duration_minutes": 60,
      "buffer_minutes": 15,
      "price_display": "Complimentary Initial Sanctuary Session",
      "is_active": true,
      "display_order": 1
    }
  ],
  "meta": { "count": 5 }
}
```

---

### 9.2 Get Available Dates
- **URL:** `/api/v1/consultations/availability/dates`
- **Method:** `GET`
- **Protection:** Public
- **Query Parameters:**
  - `type_id` (required): Consultation type UUID or slug
  - `month` (optional): `YYYY-MM`
  - `start_date` (optional): `YYYY-MM-DD`
  - `end_date` (optional): `YYYY-MM-DD`
  - `timezone` (optional): default `Asia/Kolkata`
- **Success (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Available dates retrieved successfully",
  "data": {
    "availableDates": ["2026-11-20", "2026-11-21", "2026-11-23"],
    "consultationType": { "id": "...", "name": "Restorative Yoga Therapy" },
    "timeZone": "Asia/Kolkata"
  }
}
```

---

### 9.3 Get Available Time Slots
- **URL:** `/api/v1/consultations/availability`
- **Method:** `GET`
- **Protection:** Public
- **Query Parameters:**
  - `type_id` (required): Consultation type UUID or slug
  - `date` (required): `YYYY-MM-DD`
  - `timezone` (optional): default `Asia/Kolkata`
- **Success (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Available time slots retrieved successfully",
  "data": {
    "date": "2026-11-20",
    "timeZone": "Asia/Kolkata",
    "isAvailable": true,
    "slots": [
      {
        "id": "2026-11-20_0900",
        "slotStart": "2026-11-20T09:00:00+05:30",
        "slotEnd": "2026-11-20T10:00:00+05:30",
        "formattedTime": "9:00 AM - 10:00 AM",
        "durationMinutes": 60,
        "available": true
      }
    ]
  }
}
```

---

### 9.4 Book Consultation
- **URL:** `/api/v1/consultations/book`
- **Method:** `POST`
- **Protection:** Authenticated (`requireAuth`)
- **Rate Limit:** 30 requests / 15 minutes (`bookingLimiter`)
- **Body Schema:**
```json
{
  "type_id": "c0a80123-0000-0000-0000-000000000001",
  "slot_start": "2026-11-20T09:00:00+05:30",
  "goals": "Restorative yoga for lower back pain and posture alignment",
  "notes": "Prefers morning sessions",
  "phone": "+91 98765 43210",
  "idempotency_key": "c2a93410-b98a-4933-a3d2-d7b3cf2861e2",
  "timezone": "Asia/Kolkata"
}
```
- **Success (`201 Created` or `200 OK` for Idempotent Replay):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Consultation successfully scheduled with Soulfit Sanctuary.",
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "user_id": "14",
    "booking_reference": "HP-2026-B8F12A",
    "status": "CONFIRMED",
    "slot_start": "2026-11-20T03:30:00.000Z",
    "slot_end": "2026-11-20T04:30:00.000Z",
    "timezone": "Asia/Kolkata",
    "type_name": "Restorative Yoga Therapy & Physical Alignment",
    "created_at": "2026-11-17T06:00:00.000Z"
  }
}
```
- **Error (`409 Conflict`):** Returned when slot was booked by another concurrent transaction.
```json
{
  "success": false,
  "statusCode": 409,
  "message": "The selected time slot has already been booked by another sanctuary member. Please select another time.",
  "error": "The selected time slot has already been booked by another sanctuary member. Please select another time."
}
```

---

### 9.5 Get User Consultation History
- **URL:** `/api/v1/consultations/my`
- **Method:** `GET`
- **Protection:** Authenticated (`requireAuth`)
- **Query Parameters:**
  - `status`: `'upcoming'` | `'past'` | `'all'` | `'confirmed'` | `'cancelled'` (default `'all'`)
  - `page`: integer >= 1 (default 1)
  - `limit`: integer (default 20, max 50)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Consultations retrieved successfully",
  "data": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "booking_reference": "HP-2026-B8F12A",
      "status": "CONFIRMED",
      "slot_start": "2026-11-20T03:30:00.000Z",
      "slot_end": "2026-11-20T04:30:00.000Z",
      "type_name": "Restorative Yoga Therapy & Physical Alignment"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 9.6 Get Consultation by ID
- **URL:** `/api/v1/consultations/:id`
- **Method:** `GET`
- **Protection:** Authenticated (`requireAuth` - Owner only)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Consultation details retrieved successfully",
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "booking_reference": "HP-2026-B8F12A",
    "status": "CONFIRMED",
    "full_name": "Rohit Sharma",
    "email": "rohit@example.com",
    "goals": "Restorative yoga for lower back pain",
    "slot_start": "2026-11-20T03:30:00.000Z",
    "slot_end": "2026-11-20T04:30:00.000Z"
  }
}
```

---

### 9.7 Cancel Consultation
- **URL:** `/api/v1/consultations/:id/cancel`
- **Method:** `PATCH`
- **Protection:** Authenticated (`requireAuth` - Owner only)
- **Policy:** Minimum 2 hours advance notice before session start.
- **Body Schema:**
```json
{
  "reason": "Travel schedule conflict"
}
```
- **Success (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Consultation cancelled successfully.",
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "CANCELLED",
    "cancelled_at": "2026-11-17T06:15:00.000Z",
    "cancellation_reason": "Travel schedule conflict"
  }
}
```

---

### 9.8 Reschedule Consultation
- **URL:** `/api/v1/consultations/:id/reschedule`
- **Method:** `PATCH`
- **Protection:** Authenticated (`requireAuth` - Owner only)
- **Policy:** Minimum 2 hours advance notice before session start.
- **Body Schema:**
```json
{
  "new_slot_start": "2026-11-24T10:00:00+05:30",
  "timezone": "Asia/Kolkata"
}
```
- **Success (`200 OK`):** Atomically releases old slot and confirms new slot.
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Consultation rescheduled successfully.",
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "CONFIRMED",
    "slot_start": "2026-11-24T04:30:00.000Z",
    "slot_end": "2026-11-24T05:30:00.000Z"
  }
}
```


