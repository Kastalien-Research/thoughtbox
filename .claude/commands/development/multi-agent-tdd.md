---
name: multi-agent-tdd
description: TDD workflow for multi-agent hardening. Agent attribution, content hashing, conflict detection, and structural diffs.
---

# /multi-agent-tdd

Strict TDD workflow for hardening Thoughtbox as "Git for reasoning" — content-addressable thought hashing (SHA-256 Merkle chain), agent attribution on all thought operations, formal logic notation for conflict detection, and structural branch diffs with human-legible views.

## Variables

```
RESUME: $ARGUMENTS (default: auto-detected from .multi-agent-tdd/state.json)
```

## Module Order (dependency-driven)

| # | Module | Test Count | Type | Depends On |
|---|--------|-----------|------|------------|
| 1 | `thought-attribution` | 10 | Hybrid | — |
| 2 | `content-hash` | 10 | New (TDD) | M1 |
| 3 | `cipher-logic-extension` | 5 | New (TDD) | — |
| 4 | `claim-parser` | 9 | New (TDD) | M3 |
| 5 | `conflict-detection` | 8 | New (TDD) | M4, M1 |
| 6 | `thought-diff` | 10 | New (TDD) | M1, M4, M5 |
| 7 | `identity-resilience` | 6 | Validate | — |
| 8 | `multi-client-demo` | 9 | Integration | M1–M7 |
| **Total** | | **67** | | |

## Execution Order

```
M3 + M7 (parallel, no deps) → M1 → M2 + M4 (parallel) → M5 → M6 → M8
```

## Anti-Drift Rules

1. **Red gate for new code**: Every new module (M2-M6, M8) must have tests verified failing before implementation
2. **Hypothesis gate for existing code**: M1, M7 tests should pass immediately against existing code
3. **Backward compatibility**: Adding optional fields to ThoughtData must not break existing tests
4. **Regression after each module**: All prior tests still pass
5. **Commit at every gate**: Atomic commits for bisection
6. **State before code**: Update `.multi-agent-tdd/state.json` before and after each step

## State File

Path: `.multi-agent-tdd/state.json` (gitignored)

## Workflow

### On Start

1. Read `.multi-agent-tdd/state.json` — if exists and `status != completed`, resume from last step
2. If no state file, initialize fresh state and begin at Phase 1

### Per Module (New Code — M2-M6, M8)

1. `pending` → Write tests → `tests_written`
2. Run tests → Verify red → `tests_red_verified`
3. Implement → `implemented`
4. Run tests → Verify green → `tests_green`
5. Run regression → `complete`
6. Commit

### Per Module (Hybrid — M1)

1. `pending` → Modify types → `types_modified`
2. Write tests → `tests_written`
3. Run tests → Verify hypothesis → `hypothesis_verified`
4. Implement → `implemented`
5. Run tests → `tests_green`
6. Run regression → `complete`
7. Commit

### Per Module (Validate — M7)

1. `pending` → Form hypotheses → `hypotheses_formed`
2. Write tests → `tests_written`
3. Run tests → Validate → `validated`
4. Commit → `complete`

### On Complete

1. Run all multi-agent tests: `npx vitest run src/multi-agent/__tests__/`
2. Run hub regression: `npx vitest run src/hub/__tests__/`
3. Build: `npm run build`
4. Display final summary

## Code Layout

```
src/multi-agent/
├── index.ts                  # Re-exports
├── content-hash.ts           # M2: SHA-256 Merkle chain
├── claim-parser.ts           # M4: CLAIM/PREMISE/REFUTE extraction
├── conflict-detection.ts     # M5: Cross-branch contradiction detection
├── thought-diff.ts           # M6: Structural branch diff + rendering
├── cipher-extension.ts       # M3: Formal logic notation
└── __tests__/
    ├── test-helpers.ts
    ├── thought-attribution.test.ts    # M1 (10 tests)
    ├── content-hash.test.ts           # M2 (10 tests)
    ├── cipher-extension.test.ts       # M3 (5 tests)
    ├── claim-parser.test.ts           # M4 (9 tests)
    ├── conflict-detection.test.ts     # M5 (8 tests)
    ├── thought-diff.test.ts           # M6 (10 tests)
    ├── identity-resilience.test.ts    # M7 (6 tests)
    └── multi-agent-integration.test.ts # M8 (9 tests)
```
