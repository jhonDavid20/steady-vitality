---
name: add-landing-section
description: Add a new section/component to the web landing page with bilingual (en/es) i18n copy. Use when adding a section or block to the Steady Vitality landing in apps/web.
---

# Add a landing section (apps/web)

Given a section name `<Name>` and its namespace `<Namespace>`:

## 1. Component — `apps/web/src/components/<name>-section.tsx`
- Add `"use client"` only if it uses hooks/state.
- Read copy via `const t = useTranslations('<Namespace>')`.
- Use existing UI primitives from `src/components/ui/` and Tailwind tokens
  (`bg-background`, `text-foreground`, `border-border`, …). Support `dark:` variants.
- Keep it responsive (no horizontal overflow on mobile).

## 2. i18n — add the SAME keys to BOTH files
- `apps/web/messages/en.json` and `apps/web/messages/es.json`, under `"<Namespace>": { ... }`.
- Every key present in one file must exist in the other. Validate the JSON parses.

## 3. Mount — `apps/web/src/app/[locale]/page.tsx`
- Import the component and place it in the desired order in `<HomePage>`.
- If it needs navigation, add an anchor entry in `src/components/navbar.tsx` and a matching
  `id="<name>"` on the section wrapper.

## 4. Validate
- `pnpm --filter @steady/web typecheck` and, if unsure about rendering,
  `pnpm --filter @steady/web build`.

## Notes
- Prefer pulling shared form/DTO types from `@steady/shared` over local interfaces.
- Match the visual style and spacing of the existing sections (hero, services, about).
