---
name: find-skills
description: Given a task, find whether an existing skill or subagent applies and route to it before doing the work manually. Use when unsure which skill fits a request.
---

# find-skills

Before hand-rolling a workflow, check if a skill or subagent already covers it.

## Steps
1. Restate the task in one line and pull out keywords (e.g. "add endpoint", "landing section", "commit").
2. Scan `.claude/skills/` and `.claude/agents/` for a match by name/description.
3. If one clearly fits, invoke it (`/skill-name`) or delegate to the subagent instead of improvising.
4. If several partially fit, pick the most specific one.
5. If none fits but the task is repeatable, consider creating a new skill (see `skill-creator`).

Keep this cheap — it's a ~10-second routing check, not a research task.

> Recreated from the skill name — paste your original `find-skills` to override.
