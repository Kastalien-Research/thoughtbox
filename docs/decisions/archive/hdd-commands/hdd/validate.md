---
name: hdd:validate
description: Phase 4 router for hypothesis validation
version: 2.0.0
---
# /hdd:validate

Validate or falsify ADR hypotheses with evidence.

## Usage

```bash
/hdd:validate <staging-adr-path>
```

## Delegation

- Primary module: `./modules/validate-brief.md`
- Handoff schema: `../_contracts/delegation-handoff-schema.md`

## Inputs

- `staging_adr_path`
- `test_targets`
- `paths_to_inspect`
- `acceptance_checks`

## Steps

1. Delegate automated and manual validation checks.
2. Review hypothesis outcomes and evidence quality.
3. Confirm manual verification results with user checkpoint.

## Output

- Validation report with per-hypothesis outcome.
