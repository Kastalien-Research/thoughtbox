---
name: "source-command-hdd-research"
description: "Phase 1 router for HDD research"
---

# source-command-hdd-research

Use this skill when the user asks to run the migrated source command `hdd-research`.

## Command Template

# /hdd:research

Build context and hypotheses for a new ADR initiative.

## Usage

```bash
/hdd:research "<task-goal>"
```

## Delegation

- Primary module: `./modules/research-brief.md`
- Handoff schema: `../_contracts/delegation-handoff-schema.md`

## Inputs

- `task_goal`
- `paths_to_inspect` (accepted ADRs, rejected ADRs, staging ADRs, relevant specs)
- `acceptance_checks`

## Steps

1. Delegate research to the module using path-scoped inputs.
2. Capture hypotheses, unknowns, and open risks.
3. Ask for user approval before moving to ADR staging.

## Output

- Research summary with SOFT hypotheses and blockers.
