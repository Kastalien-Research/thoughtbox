---
name: hdd
description: DEPRECATED — use workflow Stage 2 (spec + frontmatter claims). Historical HDD docs are in docs/decisions/archive/.
deprecated: true
---

# HDD (Deprecated)

Hypothesis-Driven Development with ADR lifecycle is retired. Use:

1. **`.claude/skills/workflow/SKILL.md`** — Stage 2 produces or updates `.specs/**/*.md` with YAML frontmatter claims (`.schemas/spec-v1.json`).
2. **PR claims** — `prs/<branch>.json` references `spec_claim_id` as `SPEC-ID:cN`.
3. **Historical ADRs** — `docs/decisions/archive/adr/` (read-only context).

Do not create new files under `.adr/`.
