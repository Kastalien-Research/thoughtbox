# SPEC-SIL-000: Feedback Loop Validation

> **Status**: Draft
> **Priority**: CRITICAL (MUST complete before other specs)
> **Week**: 0 (Pre-flight)
> **Phase**: Validation
> **Estimated Effort**: 4-6 hours
> **Source**: Revised based on direct-use-is-the-test principle

## Summary

Pre-flight checks to verify the Thoughtbox server works correctly before beginning autonomous improvement cycles. Validation uses **direct Claude Code execution** of existing behavioral tests, not intermediate scripts.

**Core Principle**: The best way to validate that Thoughtbox works is to use it directly with Claude Code. Scripts introduce their own noise layer - debugging scripts ≠ debugging the server.

**DGM Insight**: The deer that survives the lion didn't prove it was faster. It just was. Similarly, we validate empirically through actual use, not through scripted proofs.

## Problem Statement

Without validation:
- We might spend tokens on "improvements" to a broken system
- We can't distinguish real improvements from measurement variance
- The compounding nature of CLAUDE.md learnings means errors propagate

**Why NOT scripts?**
- Scripts introduce an intermediate layer with its own bugs
- When validation fails, you debug the script, not the server
- The real use case is Claude Code using Thoughtbox - test that directly

## Scope

### In Scope
1. Direct behavioral test execution via Claude Code
2. Pass/fail tracking for each toolhost
3. dgm-specs/ directory structure
4. CLAUDE.md update mechanism (already implemented)
5. Token-based cost tracking

### Out of Scope
- Script-based validation infrastructure (intentionally removed)
- Distbook integration (not needed for direct execution)
- Variance calculations (pass/fail is clearer signal)

## Requirements

### R1: Behavioral Test Execution

Claude Code executes the existing behavioral tests as its validation method. Tests exist at `src/resources/behavioral-tests-content.ts`:

| Toolhost | Tests | Coverage |
|----------|-------|----------|
| thoughtbox | 15 | Forward/backward thinking, branching, revisions, linked structure |
| notebook | 8 | Creation, cells, execution, export |
| mental_models | 6 | Discovery, retrieval, capability graph |
| memory | 12 | Patterns, scratchpad, persistence |

**Total: 41 behavioral tests**

### R2: Validation Protocol

```markdown
## Validation Run Protocol

1. Connect to Thoughtbox MCP server
2. Complete init flow (init → cipher)
3. For each toolhost:
   a. Request behavioral tests resource: `thoughtbox://tests/{toolhost}`
   b. Execute each test workflow step-by-step
   c. Record: PASS (expected behavior) or FAIL (unexpected/error)
4. Document results in `dgm-specs/validation/run-{timestamp}.md`
```

### R3: Token-Based Budgets

```yaml
budgets:
  per_validation_run:
    tokens: 500000       # 500K tokens for full test suite
  per_improvement_cycle:
    tokens: 2000000      # 2M tokens max per iteration
  daily:
    tokens: 10000000     # 10M tokens daily cap
```

### R4: CLAUDE.md Learning Capture

Already implemented at `src/improvement/claude-md-updater.ts`. No changes needed.

## Technical Approach

### Task 1: Execute Behavioral Tests Directly

No new code required. Claude Code reads the behavioral test resource and executes workflows:

```
1. Read resource: thoughtbox://tests/thoughtbox
2. For each test (15 tests):
   - Execute the documented steps
   - Verify expected outcomes
   - Record PASS/FAIL
3. Repeat for notebook, mental_models, memory
```

### Task 2: Document Validation Results

Create `dgm-specs/validation/run-{timestamp}.md`:

```markdown
# Validation Run - {timestamp}

## Summary
- **Thoughtbox**: 15/15 PASS
- **Notebook**: 8/8 PASS
- **Mental Models**: 6/6 PASS
- **Memory**: 12/12 PASS
- **Total**: 41/41 PASS

## Detailed Results

### Thoughtbox (15 tests)

| Test | Result | Notes |
|------|--------|-------|
| Test 1: Basic Forward Thinking | PASS | Clean progression |
| Test 2: Backward Thinking | PASS | Session auto-created at thought 5 |
| ... | ... | ... |

### Failures (if any)

#### Test X: {name}
- **Expected**: ...
- **Actual**: ...
- **Root Cause**: ...
```

### Task 3: Directory Structure

```
dgm-specs/
├── README.md                          # Overview + quick start
├── config.yaml                        # Token-based budgets
├── validation/                        # Validation run records
│   └── run-{timestamp}.md             # Results from each validation run
├── hypotheses/
│   ├── active/                        # Improvements being tested
│   └── tested/                        # Completed experiments
│       └── 000-baseline.md            # Initial state documentation
└── history/
    └── runs/                          # Improvement cycle history
```

**Note**: No TypeScript validation scripts - validation is Claude Code executing behavioral tests directly.

### Task 4: CLAUDE.md Update Mechanism

Already implemented at `src/improvement/claude-md-updater.ts`. Tests exist at `src/improvement/claude-md-updater.test.ts`.

## Files

### Existing Files (No Changes Needed)
| File | Purpose |
|------|---------|
| `src/resources/behavioral-tests-content.ts` | 41 behavioral test workflows |
| `src/improvement/claude-md-updater.ts` | Learning capture mechanism |
| `dgm-specs/config.yaml` | Token budgets (basic version exists) |
| `dgm-specs/README.md` | DGM overview |

### New Files (This Spec)
| File | Purpose |
|------|---------|
| `dgm-specs/validation/run-{timestamp}.md` | Results from validation runs |
| `dgm-specs/hypotheses/tested/000-baseline.md` | Initial baseline documentation |

### Files NOT Created (Intentionally)
| File | Reason |
|------|--------|
| `validation/baseline-reproducibility.ts` | Scripts introduce noise, direct execution preferred |
| `validation/sensitivity-test.ts` | Same - direct execution is the test |
| `dgm-specs/distbook-status.md` | Distbook not needed for direct execution |

## Acceptance Criteria

- [ ] Claude Code can read behavioral tests resource (`thoughtbox://tests/{toolhost}`)
- [ ] Claude Code can execute all 41 behavioral test workflows
- [ ] Validation run results documented in `dgm-specs/validation/`
- [ ] All 4 toolhosts pass: thoughtbox, notebook, mental_models, memory
- [ ] dgm-specs/ structure created (minimal, no scripts)
- [ ] Token budgets defined in config.yaml

## Gates

### Entry Gate
- Thoughtbox MCP server accessible
- Behavioral tests resource available

### Exit Gate
- All 41 behavioral tests pass
- First validation run documented
- Green light to begin improvement cycles

## Dependencies

- None

## Blocked By

- None

## Blocks

- ALL other specs (this must complete first)

## How to Run Validation

```markdown
## Validation Workflow

1. Start conversation with Claude Code
2. Connect to Thoughtbox MCP server
3. Initialize: `thoughtbox_gateway` → `init` → `cipher`
4. Request: "Execute the behavioral tests for thoughtbox"
5. Claude Code reads `thoughtbox://tests/thoughtbox` resource
6. Claude Code executes each test, recording PASS/FAIL
7. Repeat for notebook, mental_models, memory
8. Document results in `dgm-specs/validation/run-{timestamp}.md`
```

## Rationale: Why Direct Execution?

| Approach | Pro | Con |
|----------|-----|-----|
| **Script-based** | Automated, repeatable | Introduces noise layer; debugging scripts ≠ debugging server |
| **Direct execution** | Tests actual use case; cleaner signal | Manual invocation required |

**Decision**: Direct execution. The real use case is Claude Code using Thoughtbox. Test that directly.

When validation fails with direct execution, you know the SERVER has a problem. When validation fails with scripts, you first have to determine: is it the script or the server?

---

**Created**: 2026-01-19
**Revised**: 2026-01-19 (removed script-based approach per direct-use-is-the-test principle)
**Source**: DGM empirical validation + existing behavioral tests at `src/resources/behavioral-tests-content.ts`
