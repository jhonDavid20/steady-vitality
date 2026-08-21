---
name: impeccable
description: Final code-quality pass so every change is impeccable — clean, typed, tested, minimal, and consistent with the codebase. Use before finishing a code change.
---

# impeccable

A final pass so every change is clean and production-grade.

## Checklist
- **Fits the codebase**: matches surrounding style, naming, and structure; no new patterns without reason.
- **Minimal diff**: only what the task needs; no drive-by churn, no commented-out code, no dead files/imports.
- **Typed**: no `any` escape hatches; `pnpm typecheck` passes.
- **Validated**: relevant build/tests pass; new behavior is actually exercised.
- **Errors handled**: no unhandled rejections; failures return clear, actionable messages.
- **No secrets / no noise**: nothing sensitive committed; no stray `console.log` debug lines.
- **Docs in sync**: README, comments, and i18n keys updated alongside the change.
- **Reads well**: names say what things are; comments explain *why*, not *what*.

> Recreated from the skill name — paste your original `impeccable` to override.
