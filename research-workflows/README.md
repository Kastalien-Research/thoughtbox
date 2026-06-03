# Research Workflows

This directory now contains the canonical text sources for the research workflow
SQLite database.

## Files

- `schema.sql` — full schema for workflow-library tables plus agent playbook
  runtime tables
- `seed.sql` — deterministic seed rows for the 11 workflow templates and the 6
  reusable attack-pattern entries
- `workflows.db` — local generated SQLite database (ignored by git)

## Regenerate the database

From the repo root:

1. `rm -f research-workflows/workflows.db`
2. `sqlite3 research-workflows/workflows.db < research-workflows/schema.sql`
3. `sqlite3 research-workflows/workflows.db < research-workflows/seed.sql`

## What is and is not seeded

Seeded:

- workflow library rows (`workflows`, `workflow_steps`)
- reusable attack-pattern playbook entries (`attack_patterns`)

Not seeded:

- `adversarial_findings`
- `executions`
- `taste_evaluations`
- `verification_audits`
- `verification_failures`

Those tables represent runtime history and are expected to accumulate locally.
