---
name: next-best-practices
description: Best practices for the Next.js (App Router) frontend in apps/web — server vs client components, data fetching, env vars, i18n, and performance. Use when writing or reviewing frontend code.
---

# Next.js best practices (apps/web)

Next 15 App Router + React 19 + Tailwind + next-intl.

## Server vs client components
- Default to **server components**. Add `"use client"` only when you need state, effects,
  event handlers, or browser APIs — and keep those components small, at the leaves.
- Never import server-only code or secrets into a client component.

## Data & the backend
- The browser never calls the backend directly. Do it in server-side route handlers
  (`src/app/api/*/route.ts`) or server components, using `process.env.API_URL`.
- Validate payloads with shared Zod schemas from `@steady/shared`.

## Env vars
- `NEXT_PUBLIC_*` is inlined into the client bundle — non-secret config only.
- Unprefixed vars (e.g. `API_URL`) are server-only. Document new ones in `apps/web/.env.example`.

## i18n (next-intl)
- Every key exists in BOTH `messages/en.json` and `messages/es.json`. Default locale is `es`
  (`src/i18n/routing.ts`). Use `useTranslations('Namespace')`; never hardcode user-facing text.

## Performance & UX
- Use `next/image` with explicit sizes. Prefer CSS/Tailwind over JS for layout.
- Show loading/disabled states on async actions and surface errors via i18n keys.
- Support light/dark with `dark:` variants; keep pages responsive (no horizontal scroll).

## Before finishing
- `pnpm --filter @steady/web typecheck`; run a build if rendering behavior is uncertain.
