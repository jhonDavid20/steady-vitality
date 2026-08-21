---
name: prompt-optimizer
description: Rewrite a prompt, instruction, or task description to be clearer, more specific, and token-efficient. Use when asked to improve/optimize a prompt or when a task description is vague.
---

# prompt-optimizer

Turn a vague ask into a precise, efficient instruction.

## Checklist
1. **Goal** — state the single outcome in one sentence; cut restated context.
2. **Specifics** — name inputs, outputs, formats, constraints, and done-criteria explicitly.
3. **Context, not noise** — include only what changes the answer; reference large blobs instead of pasting them.
4. **Structure** — short sections or numbered steps; put the most important instruction first.
5. **Examples** — one good input→output example beats a paragraph of description.
6. **Guardrails** — say what NOT to do, and how to handle ambiguity (ask vs assume).
7. **Token economy** — remove filler, duplicated instructions, and hedging; use imperative voice.

## Output
Return the optimized prompt, then one line on what you changed and why.

> Recreated from the skill name — paste your original `prompt-optimizer` to override.
