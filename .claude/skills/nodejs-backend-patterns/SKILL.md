---
name: nodejs-backend-patterns
description: Best practices and patterns for the Node/Express/TypeORM backend in apps/api. Use when writing or reviewing backend code — services, routes, entities, error handling, validation, or security.
---

# Node.js backend patterns (apps/api)

Stack: Express + TypeORM + PostgreSQL + TypeScript.

## Layering (keep concerns separate)
- **Routes** parse/validate input and shape the HTTP response. No business logic.
- **Services** hold business logic and talk to repositories. Return `{ success, data?, message }`.
- **Entities** define the schema; every change goes through a **migration** (`synchronize: false`).

## Validation
- Prefer shared Zod schemas from `@steady/shared` (`safeParse`) for bodies the web app also
  sends. Otherwise express-validator + the `handleValidationErrors` helper.
- Never trust client input; normalize in the service (trim, lower-case email, coerce numbers).

## Error handling
- Wrap service methods in try/catch; log with context and return a failure result — don't throw raw.
- Routes: `res.status(result.success ? 200 : <code>).json(result)`.
- The global error middleware in `app.ts` catches the rest; never leak stack traces in prod.

## Security (already wired in app.ts — keep it)
- `helmet`, `cors` allow-list per env, `express-rate-limit` (strict on `/auth`), `compression`.
- bcrypt for passwords (rounds from env); JWT access + refresh with rotation.
- Public endpoints (lead capture) stay open; everything else uses `authenticate` + role guards.

## Database
- One migration per change; incremental timestamp; both `up` and `down`; `uuid_generate_v4()` PKs.
- Index foreign keys and columns you filter/sort by. Paginate list endpoints.
- PG `decimal` comes back as a string — coerce before doing math.

## Async & config
- Always `await`; no floating promises. Read config from `config/env.ts`; never hardcode secrets;
  fail fast on missing production vars.

## Before finishing
- `pnpm --filter @steady/api typecheck` and update the endpoint table in `apps/api/README.md`.
