---
name: hdd:stage-adr
description: Phase 2 router for staging ADR creation
version: 2.0.0
---
# /hdd:stage-adr

Create a staging ADR from approved research hypotheses.

## Usage

```bash
/hdd:stage-adr "<adr-title>"
```

## Delegation

- Primary module: `./modules/stage-adr-brief.md`
- Handoff schema: `../_contracts/delegation-handoff-schema.md`

## Inputs

- `task_goal`
- `hypotheses`
- `paths_to_inspect` (ADR template, staging path, dependency references)
- `acceptance_checks`

## Steps

1. Delegate ADR drafting and completeness checks.
2. Verify output path and hypothesis quality.
3. Ask for user approval before implementation.

## Output

- Staging ADR path, quality summary, and open risks.
