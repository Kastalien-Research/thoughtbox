---
name: hdd
description: "[DEPRECATED] Thin HDD router — use /hdd skill instead"
version: 2.0.0
deprecated: true
---
# /hdd (DEPRECATED)

**This command is deprecated.** Use the `/hdd` skill at `.claude/skills/hdd/SKILL.md` instead.
The skill is the canonical HDD entry point with full sub-agent delegation templates,
spec creation, reconciliation dispositions, and `--phases` support for `/workflow` integration.

The module briefs in `./modules/` remain as reference material for sub-agent context.

---

## Original description (preserved for reference)

Run Hypothesis-Driven Development using small delegated modules.

## Usage

```bash
/hdd <adr-number> "<title>" [--resume]
```

## Instruction Budget

- This orchestrator is router-only and must stay under the orchestrator budget policy.
- Execution details live in phase modules.

## Inputs

- `adr_number` (required)
- `title` (required)
- `resume` (optional)

## Delegation

1. Research -> `./modules/research-brief.md`
2. Stage ADR -> `./modules/stage-adr-brief.md`
3. Implement -> `./modules/implement-brief.md`
4. Validate -> `./modules/validate-brief.md`
5. Decide -> `./modules/decide-brief.md`

## Orchestrator Steps

1. Initialize or resume state.
2. Delegate current phase using the standard handoff schema.
3. Collect module output and persist phase result.
4. Run user checkpoint after each phase.
5. Append delegation trace event.
6. Route to next phase until complete.

## Checkpoints

- After research: approve hypotheses.
- After stage ADR: approve implementation scope.
- After validate: confirm manual verification findings.
- Before decision: confirm accept/reject action.

## Output

- Accepted ADR migrated to production path, or rejected ADR archived with rationale.
- Workflow summary with outcomes and open risks.
- Trace artifact at `.claude/command-traces/hdd.jsonl`.
