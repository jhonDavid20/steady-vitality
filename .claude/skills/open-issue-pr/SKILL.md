---
name: open-issue-pr
description: Open a pull request for the work done on an issue — targeting develop, linking the issue, and following any repo PR template. Use when asked to open/create a PR for an issue or a pushed branch.
---

# open-issue-pr

Open a PR for a branch that implements an issue `#N`.

## 1. Preconditions
- Work is committed and the branch is pushed. Working tree clean (`git status`).
- Typecheck/build are green (don't open a PR on a broken branch).

## 2. Base & template
- Base branch = `develop` (gitflow), head = the feature branch.
- Look for a PR template (`.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE/`).
  If one exists, mirror its section headings and fill them from the diff. Skip any section
  asking for secrets/tokens/internal hostnames.

## 3. PR content
- **Title:** Conventional-Commit style, concise (`feat(web): authenticated area (#N)`).
- **Body:**
  - One-paragraph summary of what and why.
  - Bulleted list of key changes.
  - "Acceptance criteria" checklist mirrored from the issue, ticking what's done.
  - `Closes #N` (or `Refs #N` if partial).
  - How to test locally.
- **No AI/model attribution** anywhere in the title or body.

## 4. Create it
- Use the GitHub MCP `create_pull_request` (or `gh pr create`). Report the PR URL.

## 5. After
- Offer to watch CI / address review comments. If the branch is behind `develop`, rebase/update.
