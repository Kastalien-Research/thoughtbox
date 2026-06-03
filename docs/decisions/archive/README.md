# Archived Architecture Decisions (ADRs)

**Status:** Historical context only — not authoritative for implementation.

Active design and acceptance authority lives in `.specs/**/*.md` with YAML frontmatter claims (see `.schemas/spec-v1.json`). PR governance references spec claims as `spec_id:claim_id` in `prs/<branch>.json`.

## Contents

| Path | Description |
|------|-------------|
| `adr/` | Former `.adr/` tree (`accepted/`, `staging/`, `rejected/`, `superseded/`, `retired/`) |
| `apps-web-adr/` | Former `apps/web/.adr/` |
| `hdd-commands/` | Retired `.claude/commands/hdd/` slash-command docs |

## Migration notes

- JSON ADRs (e.g. `ADR-022.json`) remain valid during PR validator compatibility; prefer spec frontmatter for new work.
- Do not add new ADRs here. Update the relevant spec and its frontmatter claims instead.
- Workflow: use `.claude/skills/workflow/SKILL.md` Stage 2 (spec + claims), not HDD.
