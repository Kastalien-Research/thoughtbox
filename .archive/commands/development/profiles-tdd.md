---
name: profiles-tdd
description: TDD workflow for SPEC-HUB-002 Agent Profiles. Registry → Identity → Hub Handler → Priming with git gates.
---

# /profiles-tdd

Strict TDD workflow for implementing hierarchical agent roles (SPEC-HUB-002). Profiles bind mental models to agent identities, enabling behavioral specialization. Follows the same TDD discipline as `/hub-tdd` and `/multi-agent-tdd`.

## Variables

```
RESUME: $ARGUMENTS (default: auto-detected from .profiles-tdd/state.json)
```

## Module Order (dependency-driven)

| # | Module | Test Count | Type | Depends On | Files |
|---|--------|-----------|------|------------|-------|
| 1 | profile-types | 0 | Pure types | — | new `src/hub/profiles-types.ts`, mod `src/hub/hub-types.ts` |
| 2 | profiles-registry | 8 | New (TDD) | M1 | new `src/hub/profiles-registry.ts` |
| 3 | identity-profiles | 6 | Hybrid | M1, M2 | mod `src/hub/identity.ts` |
| 4 | profile-prompt | 5 | New (TDD) | M2 | mod `src/hub/hub-handler.ts` |
| 5 | thought-priming | 7 | New (TDD) | M2, M4 | new `src/hub/profile-primer.ts`, mod `src/gateway/gateway-handler.ts` |
| 6 | hub-integration | 6 | Integration | M1–M5 | test file only |
| **Total** | | **32** | | | |

## Expected Test Counts Per Module

```json
{
  "profiles-registry": { "count": 8, "ids": "T-PR2-1..8", "files": ["profiles-registry.test.ts"] },
  "identity-profiles": { "count": 6, "ids": "T-IP-1..6", "files": ["identity-profiles.test.ts"] },
  "profile-prompt": { "count": 5, "ids": "T-PP-1..5", "files": ["profile-prompt.test.ts"] },
  "thought-priming": { "count": 7, "ids": "T-TP-1..7", "files": ["thought-priming.test.ts"] },
  "hub-integration": { "count": 6, "ids": "T-PI-1..6", "files": ["profiles-integration.test.ts"] }
}
```

## Profile Definitions (authoritative)

| Profile | Mental Models | Primary Goal |
|---------|--------------|--------------|
| MANAGER | decomposition, pre-mortem, five-whys | Delegation and team coordination |
| ARCHITECT | decomposition, trade-off-matrix, abstraction-laddering | Structural design |
| DEBUGGER | five-whys, rubber-duck, assumption-surfacing | Root cause analysis |
| SECURITY | adversarial-thinking, pre-mortem | Risk and vulnerability detection |

## Module Step Lifecycle

Standard module: `pending → types_written → tests_written → tests_red_verified → implemented → tests_green → complete`

Exceptions:
- `profile-types`: `pending → types_written → complete` (no tests for pure type file)
- `hub-integration`: `pending → tests_written → tests_red_verified → implemented → tests_green → complete` (no separate types step)

## State File

Location: `.profiles-tdd/state.json` (gitignored)

---

## Phase 0: Resume or Initialize

```
OBJECTIVE: Detect existing state or create fresh run

1. Check if .profiles-tdd/state.json exists.

2. IF EXISTS:
   a. Read state.json
   b. Display progress dashboard (see Dashboard section below)
   c. Identify current module and step
   d. Resume from that exact point (jump to the appropriate phase/step)
   e. IMPORTANT: On resume, verify the last gate claim. If state says module X is at
      "tests_red_verified", actually run the tests to confirm they still fail before proceeding.

3. IF NOT EXISTS:
   a. Create .profiles-tdd/ directory
   b. Initialize state.json:

      {
        "status": "in_progress",
        "startedAt": "<ISO timestamp>",
        "updatedAt": "<ISO timestamp>",
        "spec": "SPEC-HUB-002",
        "phase": "types",
        "modules": {
          "profile-types":      { "step": "pending", "commits": {} },
          "profiles-registry":  { "step": "pending", "commits": {} },
          "identity-profiles":  { "step": "pending", "commits": {} },
          "profile-prompt":     { "step": "pending", "commits": {} },
          "thought-priming":    { "step": "pending", "commits": {} },
          "hub-integration":    { "step": "pending", "commits": {} }
        },
        "gates": [],
        "testCounts": { "total": 0, "passing": 0, "failing": 0 }
      }

   c. Display module order table
   d. Proceed to Phase 1
```

## Phase 1: Types (module: profile-types)

```
OBJECTIVE: Write all profile type definitions

1. Create src/hub/profiles-types.ts with:
   - ProfileName type: 'MANAGER' | 'ARCHITECT' | 'DEBUGGER' | 'SECURITY'
   - ProfileDefinition interface: { name, description, mentalModels, primaryGoal }

2. Modify src/hub/hub-types.ts:
   - Add `profile?: string` to AgentIdentity interface
   - Add 'get_profile_prompt' to HubOperation union type
   - Add 'get_profile_prompt' to STAGE_OPERATIONS[1] array

3. GATE: Type compilation check
   Run: npx tsc --noEmit
   REQUIRED: Must compile with 0 errors.

4. Update state: modules.profile-types.step = "types_written"

5. COMMIT:
   git add src/hub/profiles-types.ts src/hub/hub-types.ts
   git commit -m "feat(hub): add agent profile type definitions"

6. Record gate and update state:
   - modules.profile-types.step = "complete"
   - modules.profile-types.commits.types = "<sha>"
   - phase = "per-module"
   - Display progress dashboard

7. Proceed to Phase 2
```

## Phase 2: Per-Module TDD Loop

```
OBJECTIVE: For each module, write tests first (verify red), then implement (verify green)

MODULE ORDER: profiles-registry, identity-profiles, profile-prompt, thought-priming
```

### Step 2a: Write Types (if module has new types)

```
If this module introduces types not already in profiles-types.ts or hub-types.ts:
  - Add any module-specific types
  - Verify compilation: npx tsc --noEmit

Update state: modules.{MODULE}.step = "types_written"
```

### Step 2b: Write Tests

```
OBJECTIVE: Create test file(s) from the test catalog

1. Write test file to src/hub/__tests__/{test-file}.test.ts
   - Each test case must have a comment with its test ID (e.g., // T-PR2-1)
   - Tests must import from the module being tested (which may not exist yet)
   - Tests should be complete and meaningful — not stubs
   - Use vitest (describe/it/expect)
   - Use shared helpers from test-helpers.ts

2. COUNT CHECK:
   Count the number of test cases (it() blocks) in the written file.
   Expected count for this module is in the Expected Test Counts table.
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
   NOTE: Compilation errors count as failures — expected when module
   file doesn't exist yet.

3. Record gate:
   {
     "name": "{MODULE}:tests_red",
     "passedAt": "<ISO timestamp>",
     "testResults": { "total": N, "passing": 0, "failing": N }
   }

4. COMMIT:
   git add src/hub/__tests__/{test-file}.test.ts
   git commit -m "test(hub): add {MODULE} tests (red)"

5. Update gate commitSha with actual SHA.

Update state:
  - modules.{MODULE}.step = "tests_red_verified"
  - modules.{MODULE}.commits.tests_red = "<sha>"
  - Display progress dashboard
```

### Step 2d: Implement

```
OBJECTIVE: Write the module implementation to make tests pass

1. Write or modify the implementation file(s).
   - Follow existing patterns: createXxxManager(storage) factory functions
   - Import types from profiles-types.ts and hub-types.ts

2. Iterate until tests pass:
   Run: npx vitest run src/hub/__tests__/{test-file}.test.ts 2>&1
   If failures remain: read error output, fix implementation, re-run.
   Do NOT modify tests to make them pass — only modify implementation.

3. GATE: Green verification
   Run: npx vitest run src/hub/__tests__/{test-file}.test.ts 2>&1
   REQUIRED: ALL tests pass. 0 failures.

4. REGRESSION CHECK:
   Run: npx vitest run src/hub/__tests__/ 2>&1
   REQUIRED: ALL prior module tests still pass.

5. Record gate:
   {
     "name": "{MODULE}:tests_green",
     "passedAt": "<ISO timestamp>",
     "commitSha": "<will be set after commit>",
     "testResults": { "total": N, "passing": N, "failing": 0 }
   }

6. COMMIT:
   git add src/hub/{files}
   git commit -m "feat(hub): implement {MODULE}"

7. Update gate commitSha with actual SHA.

Update state:
  - modules.{MODULE}.step = "complete"
  - modules.{MODULE}.commits.tests_green = "<sha>"
  - Display progress dashboard
```

### Step 2e: Next Module

```
Proceed to the next module in order.
If all Phase 2 modules complete: proceed to Phase 3.
```

## Phase 3: Integration (module: hub-integration)

```
OBJECTIVE: Full integration tests across all profile modules

1. Write test file:
   - src/hub/__tests__/profiles-integration.test.ts

2. COUNT CHECK: Expect 6 test cases total.

3. Run: npx vitest run src/hub/__tests__/profiles-integration.test.ts 2>&1

4. GATE: Red verification (same rules as Step 2c)

5. COMMIT: git commit -m "test(hub): add profiles integration tests (red)"

6. Wire up any remaining connections:
   - Ensure hub-handler routes get_profile_prompt at Stage 1
   - Verify register-with-profile flows through identity → storage → whoami
   - Confirm profiled agents work in flat workspace operations

7. Run: npx vitest run src/hub/__tests__/ 2>&1
   REQUIRED: ALL hub tests pass (existing 74 + new 32 = 106).

8. GATE: Green verification
   COMMIT: git commit -m "feat(hub): complete agent profiles implementation"

Update state:
  - modules.hub-integration.step = "complete"
  - phase = "final"
  - Display progress dashboard
```

## Phase 4: Final Verification

```
OBJECTIVE: Ensure profiles don't break existing tests

1. Run full test suite:
   npx vitest run 2>&1

2. Check results:
   - All profile tests (32) pass
   - All existing tests pass (no regressions)

3. Type check:
   npx tsc --noEmit
   REQUIRED: 0 errors.

4. Update state:
   - status = "completed"
   - updatedAt = "<ISO timestamp>"
   - phase = "completed"

5. Display final summary:
   - Total new tests: 32
   - Total commits: N
   - All gate records
```

## Progress Dashboard

Display this after each gate and on resume:

```
Agent Profiles TDD Progress (SPEC-HUB-002)
═══════════════════════════════════════════
Phase: {phase}              Tests: {passing}/{total_expected}

  profile-types      [{progress_bar}] {step}     {commit_sha}
  profiles-registry  [{progress_bar}] {step}     {commit_sha}
  identity-profiles  [{progress_bar}] {step}     {commit_sha}
  profile-prompt     [{progress_bar}] {step}     {commit_sha}
  thought-priming    [{progress_bar}] {step}     {commit_sha}
  hub-integration    [{progress_bar}] {step}     {commit_sha}

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

1. **Never skip red**: Every module MUST have its tests verified failing before implementation begins.

2. **Never modify tests to pass**: If tests fail after implementation, fix the implementation.

3. **Never skip regression**: After each module's green gate, ALL prior hub tests must be re-run.

4. **Count enforcement**: The test count for each module is hardcoded. If your test file has fewer `it()` blocks than expected, you missed a test.

5. **Commit at every gate**: No batching commits across modules. Each gate gets its own atomic commit.

6. **State before code**: Always update state.json before and after each step.

7. **Cross-check mental model names**: All profile.mentalModels entries MUST exist in the mental-models registry (`src/mental-models/operations.ts`). T-PR2-8 enforces this at test time.

## Git Commit Convention

All commits follow conventional commits:

| Gate | Message |
|------|---------|
| Types complete | `feat(hub): add agent profile type definitions` |
| Module tests red | `test(hub): add {module} tests (red)` |
| Module tests green | `feat(hub): implement {module}` |
| Integration tests red | `test(hub): add profiles integration tests (red)` |
| Integration complete | `feat(hub): complete agent profiles implementation` |

## Error Recovery

1. **Compilation error in types**: Fix the types, re-run tsc. Don't proceed until clean.
2. **Tests pass when they should fail (red gate)**: The test isn't testing the right thing, or implementation leaked. Audit imports and mocks.
3. **Tests fail after implementation (green gate)**: Read the error output carefully. Fix implementation, not tests.
4. **Regression failure**: A prior module's test broke. `git diff` to see what changed. Fix the new module without touching prior code if possible.
5. **Session interrupted**: State file persists. Next `/profiles-tdd` run auto-resumes.
6. **Want to abort**: Set `status: "halted"` in state.json.
