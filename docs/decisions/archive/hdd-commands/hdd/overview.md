# Hypothesis-Driven Development: Complete Overview

## What is Hypothesis-Driven Development?

Hypothesis-driven development (HDD) is a workflow that treats **ADRs (Architecture Decision Records) as the source of truth** rather than code. Before writing any code, we form testable hypotheses about what we expect to happen, document them in staging ADRs, implement, validate, and then either accept or reject based on whether reality matched our predictions.

## Loop Building Blocks

The HDD workflow composes OODA loops across all 5 phases. See the unified `/hdd` command for the full loop architecture:

| Category | Loops | Reference |
|----------|-------|-----------|
| Exploration | problem-space, codebase-discovery, domain-research | @loops/exploration/ |
| Authoring | spec-drafting, code-generation | @loops/authoring/ |
| Refinement | requirement-quality, code-quality, consistency-check | @loops/refinement/ |
| Verification | acceptance-gate, integration-test | @loops/verification/ |
| Orchestration | queue-processor, spiral-detector, dependency-resolver | @loops/orchestration/ |

See @loops/README.md for the full loop library.
See `.claude/commands/hdd/hdd.md` for the executable unified command.

---

## The Problem HDD Solves

Traditional development treats code as the source of truth, which creates problems:

1. **Agent collaboration is hard**: Agents must infer intent from implementation details
2. **Change reasoning is opaque**: Why decisions were made is lost after implementation
3. **Failed attempts are invisible**: Teams repeat mistakes because failures aren't documented
4. **Architectural drift**: The "why" behind decisions erodes over time
5. **Refactoring is risky**: Without documented invariants, unclear what can change

## Core Philosophy

### Code is an Implementation Artifact

Code shows **how** something is done. ADRs explain:
- **Why** we chose this approach
- **What** alternatives we considered
- **What** outcomes we predicted
- **Whether** reality matched predictions

### Two Sets of ADRs

1. **Production ADRs** (`docs/adr/`) — Accepted, validated approaches
2. **Rejected ADRs** (`docs/adr/rejected/`) — Failed approaches with analysis
3. **Staging ADRs** (`staging/docs/adr/`) — Work in progress, under validation

### Hypotheses Must Be Testable

Every ADR contains specific, falsifiable predictions:

**Good hypothesis**:
```markdown
### Hypothesis 1: Triple-layer error isolation prevents crashes
**Prediction**: Background tool execution errors will be caught at Layer 2
and stored in TaskStore, with zero unhandled promise rejections.

**Validation**: Run 100 tool executions where 50% throw errors. Verify:
- Process does not crash
- All errors appear in TaskStore
- No unhandled rejection warnings
```

**Bad hypothesis**:
```markdown
### Hypothesis 1: Error handling works
**Prediction**: Errors will be handled correctly
**Validation**: Test it
```

## The Five-Phase Workflow

### Phase 1: Research and Hypothesis Formation

**Goal**: Understand the problem and form testable hypotheses

**Steps**:
1. Read production ADRs (`docs/adr/`)
2. Read rejected ADRs (`docs/adr/rejected/`)
3. Read specifications (`docs/*.md`)
4. Check active staging (`staging/docs/adr/`)
5. Form specific, testable hypotheses
6. **🚦 USER CHECKPOINT**: Present research findings and draft hypotheses for approval

**Output**: Clear understanding + draft hypotheses + user approval to proceed

### Phase 2: Staging ADR Creation

**Goal**: Document hypotheses before implementing

**Steps**:
1. Create staging ADR: `staging/docs/adr/NNN-feature.md`
2. Write sections:
   - **Context**: What problem are we solving?
   - **Decision**: What approach are we taking?
   - **Consequences**: Predicted outcomes (positive/negative)
   - **Hypotheses**: Specific testable predictions
3. Update staging README
4. **🚦 USER CHECKPOINT**: Present completed staging ADR for approval before implementation

**Output**: Staged ADR with status "Proposed" + user approval to implement

### Phase 3: Implementation

**Goal**: Build code to test hypotheses

**Steps**:
1. Update ADR status to "In Progress"
2. Implement according to ADR
3. Write tests that validate hypotheses
4. Build and type-check
5. Update ADR status to "Validating"

**Output**: Working code + tests

### Phase 4: Validation

**Goal**: Test whether predictions match reality

**Steps**:
1. Run validation tests (`npm run build`, `npm test`)
2. **Required**: User performs manual testing for all hypotheses
3. Compare outcomes to predictions
4. Mark each hypothesis:
   - ✅ VALIDATED — prediction matched reality
   - ❌ INVALIDATED — prediction was wrong
   - ⏳ PENDING — needs runtime validation
5. **🚦 USER CHECKPOINT**: Agent proposes accept/reject decision, user confirms

**Output**: ADR with validation results + user-confirmed decision

### Phase 5: Decision Point

**Goal**: Accept or reject based on validation

#### Path A: Hypotheses Validated ✅

1. Update ADR status to "Accepted"
2. Move to production: `mv staging/docs/adr/NNN.md docs/adr/NNN.md`
3. Commit ADR + implementation together
4. Clean up staging README

#### Path B: Hypotheses Invalidated ❌

1. **DO NOT commit implementation code**
2. Document failure analysis in ADR
3. **🚦 USER CHECKPOINT**: Agent proposes rejection with analysis, user must approve rejection
4. Update ADR status to "Rejected (Reason: [hypothesis])"
5. Move to rejected: `mv staging/docs/adr/NNN.md docs/adr/rejected/NNN.md`
6. Rollback implementation: `git restore [files]`
7. Commit rejected ADR only

## User Interaction Requirements

**Critical principle**: While HDD enables agent-to-agent collaboration, **all major decisions require explicit user approval**.

### Required User Checkpoints

1. **After Research (Phase 1)**: User reviews research findings and approves draft hypotheses
2. **After Staging ADR (Phase 2)**: User reviews complete ADR and approves implementation
3. **After Validation (Phase 4)**: User performs manual testing for all hypotheses
4. **Before Decision (Phase 5)**: Agent proposes accept/reject, user confirms
5. **Before Rejection**: User must explicitly approve moving ADR to rejected/

### Why User Approval Matters

- **Architectural oversight**: Ensures human understanding of all architectural decisions
- **Hypothesis quality**: User validates that predictions are meaningful and testable
- **Implementation alignment**: Confirms approach matches user's mental model
- **Learning validation**: User confirms that both successes and failures are properly understood
- **Prevention of waste**: Catches issues before significant implementation effort

**Agents can research and propose, but users decide.**

## Why HDD Works for Agents

### Explicit Reasoning

Hypotheses make predictions explicit, not implicit in code. Agents can reason about changes from documented principles.

### Shared Context

ADRs are both human and agent readable. No "tribal knowledge" locked in code.

### Failure Documentation

Rejected ADRs prevent repeated mistakes. Future agents see what doesn't work and why.

### Architectural Continuity

Future agents can reason from first principles without archaeology through code history.

### Change Safety

Staging prevents breaking changes from being committed. Only validated approaches go to production.

## When to Use HDD

### Always Use HDD For

- New features with multiple components
- Architectural changes affecting system design
- Protocol implementations (MCP features)
- Refactoring that changes behavior
- Performance optimizations with measurable goals
- Security enhancements

### Can Skip HDD For

- Trivial bug fixes (typos, obvious one-line fixes)
- Documentation-only changes
- Test-only additions
- Code formatting/linting

## ADR Format

```markdown
# ADR-NNN — Title

## Status

Proposed | In Progress | Validating | Accepted | Rejected

## Context

What problem are we solving? What constraints matter?
What alternatives were considered?

## Decision

What approach are we taking?
Key architectural components and integration points.

## Consequences

### Positive
Expected benefits

### Negative / Tradeoffs
What we're giving up or accepting

### Follow-ups
Future work this enables or requires

## Validation Criteria

Implementation complete when:
1. Specific criterion 1
2. Specific criterion 2

## Hypotheses Validated

### Hypothesis 1: [Specific testable claim]
**Prediction**: [Exact outcome we expect]

**Outcome**: ✅ VALIDATED | ❌ INVALIDATED | ⏳ PENDING
- Evidence: [What we observed]
- Analysis: [Why it matched/didn't match]

### Hypothesis 2: ...

## Links

- Spec sections:
- Related ADRs:
- Files modified:
```

## Success Metrics

HDD is successful when:

1. ✅ Agents can implement features by reading ADRs alone (no code archaeology)
2. ✅ Failed approaches are documented and not repeated
3. ✅ Architectural decisions remain clear years after implementation
4. ✅ Changes are validated against specific hypotheses
5. ✅ The "why" behind decisions is never lost

## Examples

### Example 1: Task-Augmented Execution (ADR-005)

**Hypotheses**:
1. Triple-layer error isolation prevents crashes → ✅ VALIDATED
2. Immediate return is non-blocking → ✅ VALIDATED
3. TTL cleanup prevents exhaustion → ⏳ PENDING (runtime)
4. Backwards compatibility maintained → ✅ VALIDATED

**Outcome**: All critical hypotheses validated. Moved to production.

### Example 2: Router Aggregation (ADR-006)

**Hypotheses**:
1. Namespace encoding prevents collisions → ✅ VALIDATED
2. Router supports local + upstream → ✅ VALIDATED
3. Pagination works across mounts → ✅ VALIDATED
4. TaskAugmentedExecutor integrates → ✅ VALIDATED

**Outcome**: All hypotheses validated. Built on ADR-001 and ADR-005.

## Common Pitfalls

### Pitfall 1: Vague Hypotheses

**Bad**: "Performance will be good"
**Good**: "95th percentile latency < 100ms for typical requests"

### Pitfall 2: Implementation-Focused Hypotheses

**Bad**: "We will use class TaskStore"
**Good**: "Task state survives process restart with <1s recovery time"

### Pitfall 3: Committing Invalidated Code

**Wrong**: Try to "fix" the code when hypothesis fails
**Right**: Revert code, update ADR with analysis, form new hypothesis

### Pitfall 4: Skipping Research Phase

**Wrong**: Jump straight to implementation
**Right**: Read all ADRs (accepted + rejected) first

## Tools and Automation

### Sub-Agents

The workflow is automated via specialized agents:

- **adr-researcher**: Read ADRs for constraints
- **adr-creator**: Create staging ADRs with hypotheses
- **hypothesis-validator**: Test predictions and document outcomes
- **adr-migrator**: Move ADRs to accepted/rejected based on validation

See `.claude/agents/README.md` for details.

### Manual Commands

```bash
# Research
/hdd:research "feature name"

# Stage ADR
/hdd:stage-adr "NNN-feature-name"

# Validate
/hdd:validate "staging/docs/adr/NNN-feature.md"

# Decide
/hdd:decide "staging/docs/adr/NNN-feature.md"
```

## Resources

- **WORKFLOW.md** — Detailed step-by-step workflow
- **docs/adr/007-hypothesis-driven-development.md** — The ADR defining HDD
- **docs/adr/000-template.md** — ADR template
- **docs/adr/rejected/README.md** — Rejected approaches
- **staging/docs/adr/README.md** — Active work

## The Key Insight

> Code is an implementation artifact. ADRs are the source of truth.

By treating architectural decisions as primary and code as secondary, we enable:
- Agent-to-agent collaboration without shared context
- Compound learning over time (both successes and failures)
- Safe experimentation with clear rollback criteria
- Architectural reasoning that survives implementation changes

**The goal**: Enable agents to work together where architectural reasoning is preserved and compounded over time.
