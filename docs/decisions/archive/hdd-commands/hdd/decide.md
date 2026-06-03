---
name: hdd:decide
description: Phase 5 router for accept/reject ADR decision
version: 2.0.0
---
# /hdd:decide

Finalize ADR outcome based on validation evidence.

## Usage

```bash
/hdd:decide <staging-adr-path>
```

## Delegation

- Primary module: `./modules/decide-brief.md`
- Handoff schema: `../_contracts/delegation-handoff-schema.md`

## Inputs

- `staging_adr_path`
- `hypothesis_results`
- `paths_to_inspect`
- `acceptance_checks`

## Steps

1. Delegate accept/reject evaluation.
2. Confirm user decision checkpoint.
3. Migrate ADR to accepted or rejected path.
4. Emit final rationale and risk record.

## Output

- Final decision artifact and migrated ADR location.
