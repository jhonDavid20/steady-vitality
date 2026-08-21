---
name: add-endpoint
description: Scaffold a new backend resource in apps/api following this project's entity → migration → service → route conventions. Use when adding a new API resource or endpoint group to the Steady Vitality backend.
---

# Add a backend resource (apps/api)

Use the `leads` feature as the copy-from reference. Given a resource name `<name>`
(singular entity `<Name>`), do the following in order.

## 1. Entity — `apps/api/src/database/entities/<Name>.ts`
- `@Entity('<table>')` with `@PrimaryGeneratedColumn('uuid')`, columns, `@Index(...)`,
  and relations. Add a `@CreateDateColumn({ type: 'timestamptz' })`.
- If it has a status, model it as a string enum + a `LEAD_STATUSES`-style const.

## 2. Migration — `apps/api/src/database/migrations/<timestamp>-Create<Name>Table.ts`
- Pick a timestamp just above the current latest migration.
- `CREATE TABLE IF NOT EXISTS` with `uuid_generate_v4()` PK; add indexes.
- Implement both `up` and `down`. Never edit an already-applied migration.

## 3. Register — `apps/api/src/database/data-source.ts`
- Import the entity and add it to the `entities` array.

## 4. Service — `apps/api/src/services/<name>.service.ts`
- Class with `private repo = AppDataSource.getRepository(<Name>)`.
- Methods wrap logic in try/catch and return `{ success, data?, message }` (and
  `pagination` for lists). Coerce/validate inputs here as needed.

## 5. Route — `apps/api/src/routes/<name>.routes.ts`
- If a request contract exists or should be shared with the web app, define/validate it
  with a Zod schema in `@steady/shared` and `safeParse` it here. Otherwise use
  express-validator with the `handleValidationErrors` helper.
- Static paths BEFORE parameterized ones. Protect with `authenticate` / `requireAdmin` /
  `requireCoach` as appropriate. Public endpoints (like lead capture) stay unauthenticated.

## 6. Mount — `apps/api/src/app.ts`
- `import <name>Routes from './routes/<name>.routes';`
- `app.use('/api/<name>', <name>Routes);` and add it to the `/api` index object.

## 7. Document — `apps/api/README.md`
- Add the endpoints to the API reference table (and a request-body example if useful).

## 8. Validate
- `pnpm build:shared` (if you touched shared) then `pnpm --filter @steady/api typecheck`.
- Mention that the migration must be run locally: `pnpm --filter @steady/api migration:run`.
