# Hypothesis-Driven Development (HDD)

Commands for working with the hypothesis-driven development workflow where ADRs are the source of truth, not code.

## Core Principle

**Code is an implementation artifact. ADRs (Architecture Decision Records) are the source of truth.**

## Available Commands

### Core Workflow

#### [overview](./overview.md)
Complete explanation of the hypothesis-driven development approach, workflow phases, and philosophy.

#### [quick-reference](./quick-reference.md)
Quick command reference and cheat sheet for the HDD workflow.

### Session Management

#### [init](./init.md)
Initialize a new HDD session by creating epic and phase structure.

#### [state](./state.md)
State management, checkpoints, and phase transitions.

### Phase Commands

#### [research](./research.md)
Phase 1: Research existing ADRs, rejected approaches, and form hypotheses.

#### [stage-adr](./stage-adr.md)
Phase 2: Create staging ADR with context, decision, hypotheses, and validation criteria.

#### [validate](./validate.md)
Phase 4: Validate hypotheses through automated testing and required manual user testing.

#### [decide](./decide.md)
Phase 5: Make accept/reject decision based on validation results and migrate ADRs.

### Router + Modules

- [`hdd`](./hdd.md) is a thin orchestrator router.
- Focused phase modules live in `./modules/`.
- State contract: `./state.md`

## Workflow Summary

```
Research → 🚦 → Stage ADR → 🚦 → Implement → Validate+Manual → 🚦 → Accept/Reject
   ↓      User      ↓       User       ↓         Testing      User       ↓
docs/adr  Approve staging/  Approve  Code +                  Confirm  docs/adr
rejected          docs/adr          Tests                             or rejected/
```

**🚦 = Required User Approval Checkpoint**

**User interaction is required at EVERY phase:**
1. After Research - Approve hypotheses
2. After Staging ADR - Approve implementation plan
3. During Validation - Perform manual testing
4. Before Decision - Confirm accept/reject
5. Before Rejection - Approve rejection (if applicable)

## Directory Structure

```
docs/
├── adr/                          # ✅ Accepted (production)
│   ├── 000-template.md
│   ├── 001-namespacing.md
│   └── ...
├── adr/rejected/                 # ❌ Rejected (failed hypotheses)
│   └── README.md
└── [specs: 00-charter.md, ...]

staging/
└── docs/
    └── adr/                      # 🔄 In Progress (under validation)
        └── README.md
```

## When to Use HDD

Use hypothesis-driven development for:

- **New features**: Any significant new functionality
- **Architectural changes**: Changes affecting multiple components
- **Protocol implementations**: MCP feature implementations
- **Refactoring**: Changes that affect existing behavior
- **Performance optimizations**: Changes with measurable outcomes
- **Security enhancements**: Changes affecting security posture

Skip ADRs only for:
- Trivial bug fixes with no architectural implications
- Documentation-only changes
- Test-only changes
- Code formatting/linting fixes

## Key Principles

1. **Hypotheses must be testable**: Specific, falsifiable predictions
2. **Validation before acceptance**: Test reality against predictions
3. **Document failures**: Rejected ADRs prevent repeated mistakes
4. **Stage before production**: Never commit unvalidated changes
5. **Compound learning**: Both successes and failures add knowledge

## Best Practices

### Good Hypotheses

- ✅ **Specific**: "Response time < 100ms" not "fast enough"
- ✅ **Testable**: Can be validated through observation
- ✅ **Outcome-focused**: Predict effects, not implementation
- ✅ **Falsifiable**: Can be proven wrong

### Bad Hypotheses

- ❌ Vague: "Error handling works"
- ❌ Untestable: "Code will be maintainable"
- ❌ Implementation-focused: "We will use class X"
- ❌ Unfalsifiable: "Performance will be good"

## Integration with Sub-Agents

The HDD workflow is automated via sub-agents in `.claude/agents/`:

1. **adr-researcher** — Research ADRs for constraints (Haiku, read-only)
2. **adr-creator** — Create staging ADR with hypotheses (Sonnet)
3. **[implementer]** — Write code to test hypotheses (general-purpose)
4. **hypothesis-validator** — Test predictions, document outcomes (Sonnet)
5. **adr-migrator** — Accept or reject based on validation (Sonnet)

See `.claude/agents/README.md` for sub-agent details.

## Quick Start

```bash
# Start new work
/hdd:research "task endpoints implementation"

# Create staging ADR
/hdd:stage-adr "008-task-endpoints"

# After implementation, validate
/hdd:validate "staging/docs/adr/008-task-endpoints.md"

# Make decision
/hdd:decide "staging/docs/adr/008-task-endpoints.md"
```

## Resources

- `WORKFLOW.md` — Detailed workflow documentation
- `docs/adr/007-hypothesis-driven-development.md` — The ADR defining this workflow
- `docs/adr/000-template.md` — ADR template
- `staging/docs/adr/README.md` — Active staging work
- `docs/adr/rejected/README.md` — Rejected approaches
