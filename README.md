# The Harmony Project — Holistic Living Ecosystem

> **“Where Ancient Wisdom Meets Conscious Living”**  
> Founded by Rashmi, The Harmony Project integrates conscious movement (Soulfit), cosmic blueprints (Astrology), spatial geometry (Vastu), cellular nourishment (Food as Medicine), and workplace wellbeing (Corporate Wellbeing) into a unified sanctuary.

---

## 1. Project Overview & Current State

This repository houses the full-stack architecture for **The Harmony Project**.  
The project is currently at **Phase 1: Project Scaffolding, Architecture & Database Initialization**.

- **Frontend**: React 18 with Vite, Tailwind CSS (brand tokens), Lucide React, and React Router.
- **Backend**: Node.js with Express.js (ES Modules), Helmet security headers, rate limiting, and PostgreSQL connection pooling (`pg`).
- **Database**: PostgreSQL 14+ relational schema with UUID primary keys (`gen_random_uuid()`), timezone-aware timestamping, and constraint validation.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18
- **Tooling**: Vite 6
- **Styling**: Tailwind CSS v3.4 with custom brand tokens
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js (v18+) with ES Modules (`type: "module"`)
- **Web Framework**: Express.js 4.x
- **Security**: Helmet, CORS with strict origin validation, Express Rate Limit
- **Database Driver**: `pg` (PostgreSQL Client with Connection Pooling)
- **Environment Management**: `dotenv` with centralized validation

### Database
- **Engine**: PostgreSQL 14+
- **Key Features**: UUID primary keys, foreign key cascading constraints, role and status check constraints, composite performance indexes.

---

## 3. Root Folder Structure

Per strict architectural guidelines, the repository root contains exactly **two** project directories:

```
Soulfit/
├── .gitignore               # Root git ignore rules
├── README.md                # Master project documentation
│
├── backend/                 # Backend Node.js / Express service
│   ├── config/
│   │   ├── db.js            # PostgreSQL connection pool & health probe
│   │   └── env.js           # Environment variable validation & defaults
│   ├── controllers/
│   │   ├── auth.controller.js          # Authentication controller scaffold
│   │   └── consultation.controller.js  # Booking controller scaffold
│   ├── middleware/
│   │   ├── error.middleware.js         # Centralized sanitized error handler
│   │   └── notFound.middleware.js      # 404 handler for undefined routes
│   ├── models/              # Data access models (.gitkeep)
│   ├── routes/
│   │   ├── index.routes.js             # Centralized v1 API router
│   │   ├── auth.routes.js              # Auth route definitions
│   │   └── consultation.routes.js      # Consultation route definitions
│   ├── services/            # Business logic services (.gitkeep)
│   ├── utils/               # Shared utilities (.gitkeep)
│   ├── validators/          # Request validation schemas (.gitkeep)
│   ├── database.sql         # Production PostgreSQL schema initialization
│   ├── package.json         # Backend dependencies and scripts
│   ├── server.js            # Express application entry point
│   ├── PHASE_1_REPORT.md    # Detailed Phase 1 verification report
│   ├── .env.example         # Template for backend environment variables
│   └── .gitignore           # Backend-specific ignore rules
│
└── frontend/                # Frontend React / Vite application
    ├── public/
    │   └── favicon.svg      # Sacred geometry brand emblem
    ├── src/
    │   ├── assets/          # Static brand images and icons
    │   ├── components/
    │   │   └── common/      # Shared design system components
    │   ├── config/
    │   │   └── api.js       # Centralized Axios API client instance
    │   ├── context/         # React state providers (.gitkeep)
    │   ├── hooks/           # Custom React hooks (.gitkeep)
    │   ├── layouts/
    │   │   └── RootLayout.jsx # Application layout shell
    │   ├── pages/           # Application views (.gitkeep)
    │   ├── services/        # Service wrappers (.gitkeep)
    │   ├── utils/           # Helper functions (.gitkeep)
    │   ├── App.jsx          # Root component & Phase 1 status screen
    │   ├── index.css        # Tailwind directives, typography & reset
    │   └── main.jsx         # React application bootstrap
    ├── index.html           # HTML template with Google Fonts
    ├── package.json         # Frontend dependencies and scripts
    ├── postcss.config.js    # PostCSS configuration
    ├── tailwind.config.js   # Tailwind design tokens (Sand, Forest, Terracotta, Gold)
    ├── vite.config.js       # Vite configuration with proxy to port 5000
    ├── .env.example         # Template for frontend environment variables
    └── .gitignore           # Frontend-specific ignore rules
```

---

## 4. Setup and Installation Instructions

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)
- PostgreSQL 14+ (Local instance or Cloud PostgreSQL e.g., Supabase / Neon / AWS RDS)

---

### Step 1: Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   # Copy-Item .env.example .env
   ```

4. Configure your environment variables in `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/harmony_project
   FRONTEND_URL=http://localhost:5173
   ```

---

### Step 2: Database Initialization (PostgreSQL)

1. Connect to PostgreSQL and create the target database:
   ```sql
   CREATE DATABASE harmony_project;
   ```

2. Initialize the schema using the provided SQL script:
   - **Using psql CLI**:
     ```bash
     psql -U postgres -d harmony_project -f backend/database.sql
     ```
   - **Using pgAdmin or GUI tool**:
     Open `backend/database.sql` and execute the script against `harmony_project`.

3. The script initializes three core tables:
   - `users`: User profiles with Google OAuth ID support and role checks (`USER`, `ADMIN`).
   - `consultations`: Booking appointments across the 5 pillars with timezone-aware timestamps and status checks (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
   - `subscribers`: Newsletter subscriptions with consent tracking.
   - Triggers for automatic `updated_at` timestamp management.

---

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   # Copy-Item .env.example .env
   ```

4. Inspect `frontend/.env`:
   ```env
   VITE_API_BASE_URL=/api/v1
   ```

---

## 5. Running the Application

### Start the Backend Server
```bash
cd backend
npm run dev
# Or for production start:
# npm start
```
The server will start on `http://localhost:5000`.

### Start the Frontend Application
```bash
cd frontend
npm run dev
```
The frontend development server will start on `http://localhost:5173`.

---

## 6. API Endpoints & Health Check Instructions

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Application health status, service name, and timestamp |
| `/api/v1/health/db` | `GET` | Live PostgreSQL connection verification and latency |
| `/api/v1/auth/status` | `GET` | Scaffolded auth status |
| `/api/v1/consultations`| `GET` | Scaffolded consultation listing |

### Verifying with curl
```bash
# Test backend health
curl http://localhost:5000/health

# Test database health
curl http://localhost:5000/api/v1/health/db
```

Expected `/health` response:
```json
{
  "status": "healthy",
  "service": "The Harmony Project API",
  "environment": "development",
  "timestamp": "2026-11-13T15:18:10.552Z"
}
```

---

## 7. Next Phase

- **Phase 2**: Design System expansion, responsive Navigation, Services dropdown (5 pillars), and high-end editorial website pages.
