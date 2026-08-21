---
name: git-commit
description: Conventions for writing clean git commits in this repo — message format, scope, and staging. Use when committing changes.
---

# git-commit

## Message format (Conventional Commits)
```
<type>(<scope>): <imperative summary>

<optional body: what & why, not how>
```
- **type**: feat · fix · refactor · chore · docs · test · perf · style · build · ci
- **scope** (optional): affected area — `api`, `web`, `shared`, `leads`, `auth`…
- **summary**: imperative mood, lower-case, no trailing period, ≤ ~72 chars.
- **body**: explain the why and any consequences; wrap ~72 cols; bullets for multiple changes.

Examples:
- `feat(api): add public leads endpoint`
- `fix(web): correct default locale mismatch`
- `refactor: consolidate into pnpm monorepo`

## Practice
- One logical change per commit; stage intentionally (`git add -p` when a diff mixes concerns).
- Never commit secrets, `.env`, `node_modules`, `dist`, or `.next`.
- Run typecheck/build before committing when you changed code.
- **Never** add `Co-Authored-By`, `Claude-Session`, or any AI/model attribution to commits, PR titles/bodies, or code. Keep messages to the change itself.
- Branch off the default branch for new work; don't commit straight to `main`/`master` unless asked.
