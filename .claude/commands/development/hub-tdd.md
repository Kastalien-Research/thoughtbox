---
name: hub-tdd
description: TDD workflow for MCP Hub implementation. Types → Tests (red) → Implementation (green) with git gates.
hooks:
  Stop:
    - hooks:
        - type: command
          command: "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/hub_tdd_stop.sh"
---

# /hub-tdd

Strict TDD workflow for implementing the MCP Hub from ADR-002. Enforces: types first, then tests (must be red), then implementation (must be green), with git commits at every checkpoint.

## Variables

```
RESUME: $ARGUMENTS (default: auto-detected from .hub-tdd/state.json)
```

## Module Order (dependency-driven)

| # | Module | Test Count | Depends On |
|---|--------|-----------|------------|
| 0 | hub-types | 0 (pure types) | — |
| 1 | identity | 4 | hub-types |
| 2 | attribution | 3 | hub-types, existing ThoughtData |
| 3 | workspace | 6 | identity |
| 4 | problems | 7 | workspace |
| 5 | proposals | 10 | problems |
| 6 | consensus | 5 | workspace |
| 7 | channels | 9 | problems |
| 8 | proxy | 5 | hub-handler interface |
| 9 | hub-handler | 18 | all modules |
| 10 | integration | 3 | everything |
| **Total** | | **70** | |

## Expected Test Counts Per Module

These counts are authoritative (derived from ADR Section 10 test IDs):

```json
{
  "identity": { "count": 4, "ids": "T-ID-1..4", "files": ["identity.test.ts"] },
  "attribution": { "count": 3, "ids": "T-ATT-1..3", "files": ["attribution.test.ts"] },
  "workspace": { "count": 6, "ids": "T-WS-1..6", "files": ["workspace.test.ts"] },
  "problems": { "count": 7, "ids": "T-PR-1..7", "files": ["problems.test.ts"] },
  "proposals": { "count": 10, "ids": "T-PP-1..10", "files": ["proposals.test.ts"] },
  "consensus": { "count": 5, "ids": "T-CON-1..5", "files": ["consensus.test.ts"] },
  "channels": { "count": 9, "ids": "T-CH-1..5, T-CHSUB-1..4", "files": ["channels.test.ts", "channel-subscription.test.ts"] },
  "proxy": { "count": 5, "ids": "T-PX-1..5", "files": ["proxy.test.ts"] },
  "hub-handler": { "count": 18, "ids": "T-PD-1..3, T-ERR-1..6, T-TERM-1..4, T-ISO-1..4, T-STOR-1..5", "files": ["hub-handler.test.ts", "errors.test.ts", "terminal-state.test.ts", "isolation.test.ts", "storage.test.ts"] },
  "integration": { "count": 3, "ids": "T-INT-1, T-CONC-1..2", "files": ["integration.test.ts", "concurrent.test.ts"] }
}
```

## Module Step Lifecycle

Standard module: `pending → types_written → tests_written → tests_red_verified → implemented → tests_green → complete`

Exceptions:
- `hub-types`: `pending → types_written → complete` (no tests for pure type file)
- `integration`: `pending → tests_written → tests_red_verified → implemented → tests_green → complete` (no separate types step)

## State File

Location: `.hub-tdd/state.json` (gitignored, ephemeral)

---

## Phase 0: Resume or Initialize

```
OBJECTIVE: Detect existing state or create fresh run

1. Check if .hub-tdd/state.json exists.

2. IF EXISTS:
   a. Read state.json
   b. Display progress dashboard (see Dashboard section below)
   c. Identify current module and step
   d. Resume from that exact point (jump to the appropriate phase/step)
   e. IMPORTANT: On resume, verify the last gate claim. If state says module X is at
      "tests_red_verified", actually run the tests to confirm they still fail before proceeding.

3. IF NOT EXISTS:
   a. Create .hub-tdd/ directory
   b. Read the ADR: staging/docs/adr/002-mcp-hub-staging-adr.md
   c. Initialize state.json:

      {
        "status": "in_progress",
        "startedAt": "<ISO timestamp>",
        "updatedAt": "<ISO timestamp>",
        "adrPath": "staging/docs/adr/002-mcp-hub-staging-adr.md",
        "phase": "types",
        "modules": {
          "hub-types":    { "step": "pending", "commits": {} },
          "identity":     { "step": "pending", "commits": {} },
          "attribution":  { "step": "pending", "commits": {} },
          "workspace":    { "step": "pending", "commits": {} },
          "problems":     { "step": "pending", "commits": {} },
          "proposals":    { "step": "pending", "commits": {} },
          "consensus":    { "step": "pending", "commits": {} },
          "channels":     { "step": "pending", "commits": {} },
          "proxy":        { "step": "pending", "commits": {} },
          "hub-handler":  { "step": "pending", "commits": {} },
          "integration":  { "step": "pending", "commits": {} }
        },
        "gates": [],
        "testCounts": { "total": 0, "passing": 0, "failing": 0 }
      }

   d. Display module order table
   e. Proceed to Phase 1
```

## Phase 1: Types (module: hub-types)

```
OBJECTIVE: Write all hub type definitions

SOURCE: ADR Section 1 (Data Model)

1. Read ADR Section 1 for all type definitions:
   - AgentIdentity
   - ThoughtData extension (agentId, agentName)
   - Workspace
   - Problem
   - Proposal
   - Review
   - ConsensusMarker
   - Channel
   - All enums and literal types

2. Write src/hub/hub-types.ts with all interfaces and types.

3. GATE: Type compilation check
   Run: npx tsc --noEmit src/hub/hub-types.ts
   REQUIRED: Must compile with 0 errors.
   If errors: fix and re-run until clean.

4. Update state:
   - modules.hub-types.step = "types_written"

5. COMMIT:
   git add src/hub/hub-types.ts
   git commit -m "feat(hub): add hub type definitions"

6. Record gate:
   {
     "name": "hub-types:complete",
     "passedAt": "<ISO timestamp>",
     "commitSha": "<sha from git rev-parse HEAD>",
     "commitMessage": "feat(hub): add hub type definitions"
   }

7. Update state:
   - modules.hub-types.step = "complete"
   - modules.hub-types.commits.types = "<sha>"
   - phase = "per-module"
   - Display progress dashboard

8. Proceed to Phase 2
```

## Phase 2: Per-Module TDD Loop

```
OBJECTIVE: For each module, write tests first (verify red), then implement (verify green)

MODULE ORDER: identity, attribution, workspace, problems, proposals, consensus, channels, proxy, hub-handler

For each MODULE in order:
```

### Step 2a: Write Types (if module has new types)

```
If this module introduces types not already in hub-types.ts:
  - Add any module-specific types to src/hub/hub-types.ts or the module file
  - Verify compilation: npx tsc --noEmit

Update state: modules.{MODULE}.step = "types_written"
```

### Step 2b: Write Tests

```
OBJECTIVE: Create test file(s) from ADR Section 10 test specifications

SOURCE: ADR Section 10, test specs for this module

1. Read ADR Section 10 for this module's test specifications.

2. Write test file(s) to src/hub/__tests__/{test-file}.test.ts
   - Each test case must have a comment with its ADR test ID (e.g., // T-ID-1)
   - Tests must import from the module being tested (which doesn't exist yet)
   - Tests should be complete and meaningful — not stubs
   - Use vitest (describe/it/expect)

3. COUNT CHECK:
   Count the number of test cases (it() blocks) in the written file(s).
   Expected count for this module is defined in the Expected Test Counts table above.
   If count doesn't match: investigate and fix before proceeding.

Update state: modules.{MODULE}.step = "tests_written"
```

### Step 2c: Verify Red (tests fail)

```
OBJECTIVE: Prove tests fail before implementation exists

1. Run: npx vitest run src/hub/__tests__/{test-file}.test.ts 2>&1
   (Run all test files for this module if multiple)

2. GATE: Red verification
   REQUIRED: >0 test failures.
   REQUIRED: 0 tests passing. If any tests pass, the test is not properly isolated
   (implementation may have leaked from a prior module). Investigate and fix.

   NOTE: Compilation errors count as failures — that's expected when the module
   file doesn't exist yet. This is fine for the red gate.

3. Record gate:
   {
     "name": "{MODULE}:tests_red",
     "passedAt": "<ISO timestamp>",
     "commitSha": "<will be set after commit>",
     "commitMessage": "test(hub): add {MODULE} tests (red)",
     "testResults": { "total": N, "passing": 0, "failing": N }
   }

4. COMMIT:
   git add src/hub/__tests__/{test-file(s)}.test.ts
   git commit -m "test(hub): add {MODULE} tests (red)"

5. Update gate commitSha with actual SHA.

Update state:
  - modules.{MODULE}.step = "tests_red_verified"
  - modules.{MODULE}.commits.tests_red = "<sha>"
  - Update testCounts
  - Display progress dashboard
```

### Step 2d: Implement

```
OBJECTIVE: Write the module implementation to make tests pass

SOURCE: ADR Sections 1-9 for design, Section 10 for expected behavior

1. Write src/hub/{MODULE}.ts
   - Import types from hub-types.ts
   - Implement all functions/classes specified in the ADR
   - Follow patterns from ADR Section 8 (Module Structure)

2. Iterate until tests pass:
   Run: npx vitest run src/hub/__tests__/{test-file}.test.ts 2>&1
   If failures remain: read error output, fix implementation, re-run.
   Do NOT modify tests to make them pass — only modify implementation.

3. GATE: Green verification
   Run: npx vitest run src/hub/__tests__/{test-file}.test.ts 2>&1
   REQUIRED: ALL tests pass. 0 failures.
   If any fail: implementation is incomplete. Fix and re-run.

4. REGRESSION CHECK:
   Run: npx vitest run src/hub/__tests__/ 2>&1
   REQUIRED: ALL prior module tests still pass.
   If any prior tests fail: the new implementation broke something.
   Fix without modifying prior tests if possible.

5. Record gate:
   {
     "name": "{MODULE}:tests_green",
     "passedAt": "<ISO timestamp>",
     "commitSha": "<will be set after commit>",
     "commitMessage": "feat(hub): implement {MODULE}",
     "testResults": { "total": N, "passing": N, "failing": 0 }
   }

6. COMMIT:
   git add src/hub/{MODULE}.ts
   (Also add any modified files like hub-types.ts if touched)
   git commit -m "feat(hub): implement {MODULE}"

7. Update gate commitSha with actual SHA.

Update state:
  - modules.{MODULE}.step = "complete"
  - modules.{MODULE}.commits.tests_green = "<sha>"
  - Update testCounts
  - Display progress dashboard
```

### Step 2e: Next Module

```
Proceed to the next module in order.
If all Phase 2 modules complete: proceed to Phase 3.
```

## Phase 3: Integration (module: integration)

```
OBJECTIVE: Full multi-agent workflow test from ADR T-INT-1, plus concurrency tests

1. Write test files:
   - src/hub/__tests__/integration.test.ts (T-INT-1)
   - src/hub/__tests__/concurrent.test.ts (T-CONC-1..2)

2. COUNT CHECK: Expect 3 test cases total.

3. Run: npx vitest run src/hub/__tests__/integration.test.ts src/hub/__tests__/concurrent.test.ts 2>&1

4. GATE: Red verification (same rules as Step 2c)
   Integration tests should fail because the full workflow hasn't been wired.

5. COMMIT: git commit -m "test(hub): add integration tests (red)"

6. Wire up any remaining connections. This may involve:
   - Adjusting hub-handler to properly chain operations
   - Fixing cross-module interactions
   - Ensuring the full register → create workspace → create problem → propose → merge flow works

7. Run: npx vitest run src/hub/__tests__/ 2>&1
   REQUIRED: ALL 70 tests pass.

8. GATE: Green verification
   COMMIT: git commit -m "feat(hub): complete hub implementation"

Update state:
  - modules.integration.step = "complete"
  - phase = "final"
  - Display progress dashboard
```

## Phase 4: Final Verification

```
OBJECTIVE: Ensure hub implementation doesn't break existing tests

1. Run full test suite:
   npx vitest run 2>&1

2. Check results:
   - All hub tests (70) pass
   - All existing tests pass (no regressions)

3. If existing tests break:
   - Investigate the attribution module (it extends ThoughtData, most likely regression source)
   - Fix without modifying test expectations if possible

4. Update state:
   - status = "completed"
   - updatedAt = "<ISO timestamp>"
   - phase = "completed"

5. Display final summary:
   - Total tests: 70
   - Total commits: N
   - Time elapsed: startedAt to now
   - All gate records
```

## Progress Dashboard

Display this after each gate and on resume:

```
MCP Hub TDD Progress
═══════════════════════════════════════════
Phase: {phase}              Tests: {passing}/{total_expected}

  hub-types    [{progress_bar}] {step}     {commit_sha}
  identity     [{progress_bar}] {step}     {commit_sha}
  attribution  [{progress_bar}] {step}     {commit_sha}
  workspace    [{progress_bar}] {step}     {commit_sha}
  problems     [{progress_bar}] {step}     {commit_sha}
  proposals    [{progress_bar}] {step}     {commit_sha}
  consensus    [{progress_bar}] {step}     {commit_sha}
  channels     [{progress_bar}] {step}     {commit_sha}
  proxy        [{progress_bar}] {step}     {commit_sha}
  hub-handler  [{progress_bar}] {step}     {commit_sha}
  integration  [{progress_bar}] {step}     {commit_sha}

Next: {description of next action}
```

Progress bar mapping:
- pending:             [            ]
- types_written:       [██          ]
- tests_written:       [████        ]
- tests_red_verified:  [██████      ]
- implemented:         [████████    ]
- tests_green:         [██████████  ]
- complete:            [████████████]

## Anti-Drift Rules

These rules are NON-NEGOTIABLE:

1. **Never skip red**: Every module MUST have its tests verified failing before implementation begins. No "I know the tests will fail, let me just implement."

2. **Never modify tests to pass**: If tests fail after implementation, fix the implementation. The only acceptable test modification is fixing a genuinely wrong test spec (document the deviation in state.json notes).

3. **Never skip regression**: After each module's green gate, ALL prior tests must be re-run. This catches coupling bugs early.

4. **Count enforcement**: The test count for each module is hardcoded. If your test file has fewer `it()` blocks than expected, you missed a test case from the ADR.

5. **Commit at every gate**: No batching commits across modules. Each gate gets its own atomic commit for easy bisection later.

6. **State before code**: Always update state.json before and after each step. If a session dies mid-step, state.json tells the next session exactly where to resume.

7. **Read the ADR**: Before writing tests or implementation for any module, re-read the relevant ADR sections. Don't rely on memory from earlier in the session.

## Git Commit Convention

All commits follow conventional commits (per CLAUDE.md):

| Gate | Message |
|------|---------|
| Types complete | `feat(hub): add hub type definitions` |
| Module tests red | `test(hub): add {module} tests (red)` |
| Module tests green | `feat(hub): implement {module}` |
| Integration tests red | `test(hub): add integration tests (red)` |
| Integration complete | `feat(hub): complete hub implementation` |

Each commit recorded in state.json gates[] with SHA for traceability.

## Error Recovery

If something goes wrong during a step:

1. **Compilation error in types**: Fix the types, re-run tsc. Don't proceed until clean.
2. **Tests pass when they should fail (red gate)**: The test isn't testing the right thing, or implementation leaked. Audit imports and mocks.
3. **Tests fail after implementation (green gate)**: Read the error output carefully. Fix implementation, not tests.
4. **Regression failure**: A prior module's test broke. `git diff` to see what changed. Fix the new module without touching prior code if possible.
5. **Session interrupted**: State file persists. Next `/hub-tdd` run auto-resumes.
6. **Want to abort**: Set `status: "halted"` in state.json. The Stop hook will allow exit.
