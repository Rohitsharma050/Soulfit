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
  "message": "Your message has been received. Rashmi's sanctuary team will review and connect with you shortly.",
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
  "message": "Thank you for subscribing to Rashmi's Cosmic & Wellness Digest.",
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
      "author_name": "Rashmi",
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
    "author_name": "Rashmi",
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
