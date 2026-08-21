---
name: implement-issue
description: Implement a GitHub issue end-to-end in this repo — read it, branch off develop, build to its acceptance criteria following project conventions, validate, and push. Use when asked to "implement", "work on", or "resolve" an issue by number.
---

# implement-issue

Given an issue number `#N` (repo `jhonDavid20/steady-vitality`):

## 1. Understand it
- Read the issue (title, body, **acceptance criteria**) and its parent epic — via the GitHub MCP tools (`issue_read`) or `gh issue view N`.
- If the ask is ambiguous or a decision is missing (e.g. payment provider), ask before coding.

## 2. Branch (gitflow)
- Base off the latest `develop`:
  `git fetch origin develop && git checkout -B feat/N-<slug> origin/develop`
  (use `fix/` for bugs). Never commit straight to `main`/`develop`.

## 3. Build it
- Follow `CLAUDE.md` and reuse skills: `add-endpoint` (backend), `add-landing-section` (frontend),
  `nodejs-backend-patterns`, `next-best-practices`, `shadcn`.
- Delegate to the `api-dev` / `web-dev` subagents **only if the user asks** for subagents.
- Cross-app types/validation go in `@steady/shared` (run `pnpm build:shared` after editing it).
- i18n keys in BOTH `en.json` and `es.json`. Keep diffs minimal; match surrounding style.
- Aim to satisfy every acceptance-criteria checkbox.

## 4. Validate (run the `impeccable` checklist)
- `pnpm --filter @steady/api typecheck` and/or `pnpm --filter @steady/web typecheck`.
- Build when rendering/route changes are involved. Fix everything before committing.

## 5. Commit & push
- Conventional Commits, scoped (`feat(web): …`), referencing the issue (`refs #N`, or `closes #N`
  when it fully resolves it).
- **No AI/model attribution** (see `git-commit` skill).
- `git push -u origin feat/N-<slug>`.

## 6. Report
- Summarize what changed, which acceptance criteria are met, and what's left (if partial).
- Offer to open a PR (`open-issue-pr`) or hand off (`handoff-issue`).
