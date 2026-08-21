---
name: handoff-issue
description: Prepare a clean handoff on a GitHub issue so another person (or a fresh session) can pick it up — state summary, branch/PR, what's left, how to run. Use when pausing work or handing an issue over.
---

# handoff-issue

Leave an issue `#N` in a state anyone can resume without you.

## 1. Leave the repo clean & runnable
- Commit and push everything (no uncommitted changes; `git status` clean).
- Typecheck/build green, or clearly note what's broken and why.

## 2. Update the issue
- Tick the acceptance-criteria checkboxes that are done.
- Post a handoff comment (GitHub MCP `add_issue_comment` or `gh issue comment N`) with:
  - **State:** what's done vs. remaining (against the acceptance criteria).
  - **Branch:** `feat/N-<slug>` (and PR link if one is open).
  - **How to run/test:** exact commands (`pnpm build:shared`, `pnpm dev:api`, `pnpm dev:web`, envs needed).
  - **Decisions still open / blockers** (e.g. payment provider, pricing).
  - **Gotchas / next step:** where to start, files touched, anything non-obvious.

## 3. Keep it honest
- Don't mark criteria done that aren't. If tests fail or a step was skipped, say so.
- Don't add AI/model attribution in the comment.

## 4. Report
- Give the user the issue/PR links and a one-line status so they know exactly where things stand.
