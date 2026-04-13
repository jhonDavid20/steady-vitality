# Steady Vitality API

Backend REST API for the Steady Vitality health & fitness coaching platform. Built with Node.js, TypeScript, Express, TypeORM, and PostgreSQL.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Docker](#docker)
- [Database & Migrations](#database--migrations)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Coaches](#coaches)
  - [Packages](#packages)
  - [Invites](#invites)
  - [Admin](#admin)
- [Authentication](#authentication)
- [Roles](#roles)
- [Error Responses](#error-responses)

---

## Quick Start

```bash
pnpm install
pnpm run dev
```

The API will be available at `http://localhost:3000`.  
Interactive Swagger docs: `http://localhost:3000/api-docs`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=steadyuser
DB_PASSWORD=steadypass123
DB_NAME=steady_vitality

# JWT
JWT_SECRET=change-me-at-least-32-chars
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12

# Email (Mailtrap SMTP)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
EMAIL_FROM="Coaching Platform <noreply@coachingplatform.dev>"

# Frontend base URL (used in invite links)
FRONTEND_URL=http://localhost:3000
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start dev server with hot reload (ts-node-dev) |
| `pnpm run build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run the compiled production build |
| `pnpm run migration:run` | Apply all pending TypeORM migrations |
| `pnpm run migration:revert` | Revert the last applied migration |
| `pnpm run migration:generate -- src/database/migrations/Name` | Auto-generate a migration from entity changes |

---

## Docker

```bash
# Start app + PostgreSQL + Adminer
docker-compose up -d

# Tail logs
docker-compose logs app -f

# Stop
docker-compose down

# Full reset (drops all data)
docker-compose down -v && docker-compose up -d
```

**Adminer** (database UI): `http://localhost:8080`  
Server: `postgres` · User: `steadyuser` · Password: `steadypass123` · Database: `steady_vitality`

---

## Database & Migrations

The project uses TypeORM with `synchronize: false`. All schema changes must go through versioned migrations in `src/database/migrations/`.

After pulling new migrations, run:

```bash
pnpm run migration:run
```

### Applied migrations

| File | Description |
|---|---|
| `*-CreateUsersTable` | Core users table |
| `*-CreateUserProfiles` | Client fitness profile |
| `*-CreateCoachProfiles` | Coach profile |
| `*-CreateInvites` | Invite system |
| `*-CreatePackages` | Package templates |
| `*-CreateClientPackages` | Package assignments |
| `*-CreateConnectionRequests` | Coach connection request flow |
| `*-AddCoachIdToUsers` | `users.coachId` FK (one coach per client) |
| `*-AddInviteType` | Coach vs. client invite types |
| `*-AddPendingToClientPackageStatus` | Adds `pending` enum value |
| `*-EnrichPackageColumns` | `sessionsCompleted`, `notes`, `goals`, `features` columns |

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require a `Bearer` JWT in the `Authorization` header.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new client account |
| POST | `/api/auth/register/coach` | Public | Register a coach using an invite token |
| POST | `/api/auth/login` | Public | Login and receive access + refresh tokens |
| POST | `/api/auth/logout` | Bearer | Invalidate the current session |
| POST | `/api/auth/refresh` | Public | Exchange a refresh token for a new access token |
| GET | `/api/auth/me` | Bearer | Get the currently authenticated user |
| POST | `/api/auth/verify-email` | Public | Verify email address with a token |
| POST | `/api/auth/resend-verification` | Public | Resend the email verification link |
| POST | `/api/auth/forgot-password` | Public | Request a password reset email |
| POST | `/api/auth/reset-password` | Public | Reset password with a token |

**Register request body:**
```json
{
  "email": "jane@example.com",
  "username": "jane_doe",
  "password": "Str0ng!Pass",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Login response:**
```json
{
  "success": true,
  "user": { "id": "...", "email": "...", "role": "client" },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "dGhp...",
    "expiresIn": 3600
  }
}
```

---

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Bearer | Get own user + profile (includes `coachId`) |
| PATCH | `/api/users/me` | Bearer | Update own user fields |
| POST | `/api/users/me/profile` | Bearer | Create client fitness profile (onboarding) |
| PATCH | `/api/users/me/profile` | Bearer | Update client fitness profile |
| GET | `/api/users/me/profile` | Bearer | Get own fitness profile |
| GET | `/api/users/me/sessions` | Bearer | List active login sessions |
| DELETE | `/api/users/me/sessions/:sessionId` | Bearer | Revoke a specific session |

**GET /api/users/me** response includes `coachId` — the UUID of the coach the client is linked to (or `null`).

---

### Coaches

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/coaches` | Public | Paginated list of coaches accepting clients |
| GET | `/api/coaches/me` | Coach | Own coach profile |
| POST | `/api/coaches/me` | Coach | Create coach profile (first time) |
| PATCH | `/api/coaches/me` | Coach | Update coach profile fields |
| GET | `/api/coaches/me/clients` | Coach | List clients linked to this coach |
| GET | `/api/coaches/me/clients/:clientId` | Coach | Single linked client's full profile |
| GET | `/api/coaches/me/dashboard` | Coach | Aggregate stats |
| GET | `/api/coaches/me/stats` | Coach | Alias for dashboard stats |
| GET | `/api/coaches/me/linked-clients` | Coach | Alias for `/me/clients` |
| POST | `/api/coaches/connection-requests` | Client | Send a connection request to a coach |
| GET | `/api/coaches/me/connection-requests` | Coach | Get pending connection requests |
| PATCH | `/api/coaches/me/connection-requests/:requestId` | Coach | Accept or decline a request |
| GET | `/api/coaches/:id` | Public | Public coach profile by user ID |

**GET /api/coaches** query parameters: `page`, `limit`, `coachingType` (`online`\|`in_person`\|`hybrid`), `trialOnly`, `search`.  
Response includes `activeClientsCount` — live count from `users.coachId`.

**POST /api/coaches/connection-requests** body:
```json
{ "coachId": "<coach-user-uuid>" }
```
Returns 409 if the client already has a coach (`users.coachId` is set).

**PATCH /api/coaches/me/connection-requests/:requestId** body:
```json
{ "action": "accept" }
```
`accept` sets `users.coachId` on the client. Both `accept` and `decline` remove the `ConnectionRequest` row.

---

### Packages

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/packages` | Coach | Create a package template |
| PATCH | `/api/packages/:id` | Coach | Update own package template |
| DELETE | `/api/packages/:id` | Coach | Soft-delete (deactivate) a package |
| POST | `/api/packages/:id/assign` | Coach | Directly assign a package to a client (active) |
| GET | `/api/packages/coach/:coachId` | Public | List a coach's active packages |
| GET | `/api/packages/me/active` | Bearer | Client's currently active package |
| GET | `/api/packages/client/:clientId` | Coach | Most recent package for a linked client |
| PATCH | `/api/packages/client/:id` | Coach | Update notes, goals, sessionsCompleted |
| PATCH | `/api/packages/client/:id/status` | Coach | Transition status (pending→active→completed/cancelled) |
| POST | `/api/packages/:packageId/request` | Client | Request a package from the linked coach |

**Package template fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 255 chars |
| `description` | string | No | |
| `durationWeeks` | integer | Yes | Min 1 |
| `sessionsIncluded` | integer | Yes | Min 1 |
| `priceUSD` | number | Yes | Min 0 |
| `features` | string[] | No | Bullet-point selling points |

**ClientPackage shape** (returned from most package endpoints):
```json
{
  "id": "...",
  "packageId": "...",
  "clientId": "...",
  "status": "active",
  "startDate": "2026-03-01T12:00:00.000Z",
  "endDate": "2026-06-01T12:00:00.000Z",
  "sessionsCompleted": 8,
  "notes": "...",
  "goals": ["Lose 10 kg"],
  "package": {
    "id": "...",
    "name": "12-Week Transformation",
    "durationWeeks": 12,
    "sessionsIncluded": 24,
    "priceUSD": 599,
    "features": ["Weekly check-ins"]
  }
}
```

`endDate` is computed on read (`startDate + durationWeeks × 7 days`) and is not stored for active packages.

**Client request flow:**

1. Client calls `POST /api/packages/:packageId/request` — creates a `pending` assignment.
2. Coach calls `PATCH /api/packages/client/:id/status` with `{ "status": "active" }` to activate it.
3. Coach updates progress with `PATCH /api/packages/client/:id` (notes, goals, sessionsCompleted).
4. Coach closes out with `{ "status": "completed" }` or `{ "status": "cancelled" }`.

**Direct assign flow** (coach-initiated, skips pending step):

```http
POST /api/packages/:id/assign
{ "clientId": "...", "startDate": "2026-03-01", "notes": "...", "goals": ["..."] }
```

---

### Invites

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/invites` | Admin | Create a coach invite (sends email) |
| GET | `/api/invites` | Admin | List all invites, paginated |
| GET | `/api/invites/validate/:token` | Public | Validate a coach invite token |
| DELETE | `/api/invites/:id` | Admin | Revoke a pending invite |
| DELETE | `/api/invites/:id/permanent` | Admin | Hard-delete any invite (bypasses used guard) |
| POST | `/api/invites/client` | Coach | Create a client invite link (sends email) |
| GET | `/api/invites/validate/client/:token` | Public | Validate a client invite token |
| POST | `/api/invites/accept/client` | Public | Accept a client invite and register |

**Coach invite flow:**

1. Admin calls `POST /api/invites` with `{ "email": "coach@example.com" }`.
2. An invite email with a registration link is sent via Mailtrap.
3. The coach visits the link and calls `POST /api/auth/register/coach` with the token.

**Client invite flow:**

1. Coach calls `POST /api/invites/client` with `{ "email": "client@example.com" }`.
2. An invite email is sent. The link contains the token.
3. Client visits the link; frontend calls `GET /api/invites/validate/client/:token` to pre-fill the form.
4. Client submits the form; frontend calls `POST /api/invites/accept/client` with `{ token, firstName, lastName, password }`.
5. Account is created and linked to the coach (`users.coachId`).

**POST /api/invites/accept/client** body:
```json
{
  "token": "<invite-token>",
  "firstName": "Sam",
  "lastName": "Lee",
  "password": "Str0ng!Pass"
}
```

Password requirements: min 8 chars, uppercase, lowercase, digit, and special character.

---

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Platform stats (user counts, invite summary, 30-day signups) |
| GET | `/api/admin/users` | Admin | Paginated user list with role/status filters |
| PATCH | `/api/admin/users/:id/role` | Admin | Change a user's role |
| PATCH | `/api/admin/users/:id/status` | Admin | Activate or deactivate a user |
| POST | `/api/admin/cleanup/sessions` | Admin | Manually trigger expired-session cleanup |

---

## Authentication

All protected endpoints require:

```
Authorization: Bearer <accessToken>
```

Access tokens expire in 1 hour (7 days when `rememberMe: true`). Use `POST /api/auth/refresh` to obtain a new access token:

```json
{ "refreshToken": "<your-refresh-token>" }
```

---

## Roles

| Role | Description |
|---|---|
| `client` | Default role. Can browse coaches, manage their profile, and request packages. |
| `coach` | Can manage their own profile, invite clients, manage packages and assignments. |
| `admin` | Full platform access. Manages invites, users, and platform stats. |

---

## Error Responses

All error responses follow this shape:

```json
{
  "error": "Error type",
  "message": "Human-readable description"
}
```

Validation errors include a `details` array:

```json
{
  "error": "Validation failed",
  "message": "Please check your input data",
  "details": [
    { "type": "field", "path": "email", "msg": "Please provide a valid email address", "value": "not-an-email" }
  ]
}
```

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request or validation error |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal server error |
