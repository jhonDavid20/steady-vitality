---
name: shadcn
description: How to add and use shadcn/ui + Radix components in apps/web. Use when adding UI primitives, building components, or theming the frontend.
---

# shadcn/ui in apps/web

Config lives in `apps/web/components.json`. Primitives live in `src/components/ui/`.

## Adding a primitive
- Add it under `src/components/ui/<name>.tsx`, following the existing ones (button, card,
  dialog, input, select…). They wrap Radix primitives.
- If a primitive needs a new dependency (e.g. `react-day-picker` for a calendar), add it to
  `apps/web/package.json` — never leave an import to a missing package (it breaks typecheck).

## Using components
- Compose app UI from `ui/` primitives; keep app-specific components in `src/components/`.
- Merge Tailwind classes with the `cn()` helper from `src/lib/utils.ts`.
- Style via Tailwind tokens (`bg-background`, `text-foreground`, `border-border`,
  `text-muted-foreground`) so theming and light/dark work. Add `dark:` variants where needed.

## Rules
- Don't hardcode hex colors when a token exists.
- Keep accessibility: labels, visible focus states, correct `aria-*`.
- Remove unused `ui/` files instead of leaving dead imports.
