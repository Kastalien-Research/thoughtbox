---
name: agentops-tdd
description: Hypothesis-driven TDD workflow for AgentOps pipeline hardening. Validates existing code against specs, migrates tests to vitest, adds per-module coverage.
hooks:
  Stop:
    - hooks:
        - type: command
          command: "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/agentops_tdd_stop.sh"
---

# /agentops-tdd

Systematic validation workflow for the AgentOps self-improving pipeline. Unlike hub-tdd (red→green TDD for new code), this validates **existing code** against specs through hypothesis-driven testing.

## Variables

```
RESUME: $ARGUMENTS (default: auto-detected from .agentops-tdd/state.json)
```

## Module Order (dependency-driven, cheapest-first)

| # | Module | Expected Tests | API Cost | Key Hypotheses |
|---|--------|---------------|----------|----------------|
| 1 | `state` | 6 | Free | StateManager init/load/save/checkpoint lifecycle with temp dirs |
| 2 | `trace` | 4 | Free | TracingClient works without API key (graceful degradation) |
| 3 | `sources/rss` | 3 | Free | Real RSS feed returns SignalItems with required fields |
| 4 | `sources/repo` | 3 | Free (read) | GitHub repo signal returns recent commits/issues/PRs |
| 5 | `sources/collect` | 4 | Free | Orchestrator aggregates, deduplicates, caps at max_signal_items |
| 6 | `github` | 5 | Free (read) | GitHubClient.parseLabel works. Issue read works. Write uses --dry-run |
| 7 | `llm/provider` | 3 | ~$0.05 | getLLMConfig returns valid config. callLLM returns structured response |
| 8 | `synthesis` | 4 | ~$0.10 | synthesizeProposals produces rubric-passing proposals from fixtures |
| 9 | `daily-dev-brief` | 3 | ~$0.10 | Pipeline runs end-to-end with --fixtures + one --dry-run |
| 10 | `implement` | 3 | Free | Runner parses proposals, creates branch plan (--dry-run) |
| 11 | `cli` | 3 | Free | Arg parsing, help output, command dispatch |
| **Total** | | **~41** | **~$0.25** | |

## Existing Test Migration (Phase 1)

| File | Current Tests | Framework |
|------|--------------|-----------|
| `extract.test.ts` | 5 | node:test + assert |
| `integration.test.ts` | 2 | node:test + assert |
| `phase1.2.test.ts` | 12 | assert (IIFE blocks) |
| `sources.test.ts` | 2 | node:test + assert |
| `synthesis.test.ts` | 4 | node:test + assert |
| `template.test.ts` | 5 | node:test + assert |
| `xml-parsing.test.ts` | 5 | node:test + assert |
| **Total** | **35** | |

## Spec/Config Reference Documents

| Spec/Config | Code it describes | Key Check |
|------------|-------------------|-----------|
| `evals/dev_brief_proposal_rubric.md` | `runner/lib/template.ts` | Are all 5 hard gates (G0-G4) enforced? |
| `evals/selection_algorithm.md` | `runner/lib/synthesis.ts` | Does synthesis generate 5-8 candidates then filter? |
| `config/dev_brief_policy.yaml` | `runner/lib/sources/collect.ts` | Are max_signal_items, max_llm_cost_usd enforced? |
| `prompts/dev_brief_synthesizer.md` | `runner/lib/synthesis.ts` | Does the prompt match what synthesis sends? |

## State File

Location: `.agentops-tdd/state.json` (gitignored, ephemeral)

---

## Phase 0: Resume or Initialize

```
OBJECTIVE: Detect existing state or create fresh run

1. Check if .agentops-tdd/state.json exists.

2. IF EXISTS:
   a. Read state.json
   b. Display progress dashboard (see Dashboard section below)
   c. Identify current phase and module
   d. Resume from that exact point
   e. IMPORTANT: On resume, verify the last gate claim. If state says Phase 1
      migration is complete, run the migrated tests to confirm they still pass.

3. IF NOT EXISTS:
   a. Create .agentops-tdd/ directory
   b. Verify agentops runner code exists:
      - Check agentops/runner/cli.ts exists
      - Check agentops/tests/ directory exists
      - If missing: the agentops code may not be on this branch.
        Check if feat/agentops-phase1.2 has the code and inform user.
   c. Read reference documents:
      - agentops/evals/dev_brief_proposal_rubric.md
      - agentops/evals/selection_algorithm.md
      - agentops/config/dev_brief_policy.yaml
      - agentops/prompts/dev_brief_synthesizer.md
   d. Initialize state.json:

      {
        "status": "in_progress",
        "startedAt": "<ISO timestamp>",
        "updatedAt": "<ISO timestamp>",
        "phase": "init",
        "modules": {
          "state":           { "step": "pending", "tests": 0, "commits": {} },
          "trace":           { "step": "pending", "tests": 0, "commits": {} },
          "sources/rss":     { "step": "pending", "tests": 0, "commits": {} },
          "sources/repo":    { "step": "pending", "tests": 0, "commits": {} },
          "sources/collect": { "step": "pending", "tests": 0, "commits": {} },
          "github":          { "step": "pending", "tests": 0, "commits": {} },
          "llm/provider":    { "step": "pending", "tests": 0, "commits": {} },
          "synthesis":       { "step": "pending", "tests": 0, "commits": {} },
          "daily-dev-brief": { "step": "pending", "tests": 0, "commits": {} },
          "implement":       { "step": "pending", "tests": 0, "commits": {} },
          "cli":             { "step": "pending", "tests": 0, "commits": {} }
        },
        "gates": [],
        "testCounts": { "total": 0, "passing": 0 },
        "divergences": [],
        "costUsd": 0.0
      }

   e. Display module order table
   f. Proceed to Phase 1
```

## Phase 1: Vitest Migration

```
OBJECTIVE: Migrate all 7 existing test files from node:test (assert + test()) to vitest (describe/it/expect)

SOURCE: agentops/tests/*.test.ts (all 7 files)

BEFORE STARTING:
  Ensure vitest.config.ts includes agentops test paths.
  Ensure package.json has a test:agentops script.

For each test file:
  1. Read the existing file
  2. Replace imports:
     - Remove: import { test } from 'node:test'
     - Remove: import assert from 'node:assert' / import assert from 'assert'
     - Add: import { describe, it, expect } from 'vitest'
  3. Convert test structure:
     - test('name', () => {}) → it('name', () => {})
     - Wrap related tests in describe() blocks
     - For phase1.2.test.ts: convert IIFE blocks { ... } to it() blocks within describe()
  4. Convert assertions:
     - assert.strictEqual(a, b) → expect(a).toBe(b)
     - assert.ok(x) → expect(x).toBeTruthy()
     - assert.throws(() => fn(), /msg/) → expect(() => fn()).toThrow(/msg/)
     - assert.match(str, /regex/) → expect(str).toMatch(/regex/)
     - assert.ok(arr.some(fn)) → expect(arr.some(fn)).toBe(true)
  5. Remove console.log('✅ ...') result lines (vitest reports results)
  6. Fix import paths: .js → no extension (vitest resolves .ts natively)

GATE: All migrated tests pass
  Run: npx vitest run agentops/tests/
  REQUIRED: All tests pass (count should match pre-migration count)
  If any fail: investigate — could be an import path issue or assertion API difference.

COMMIT:
  git add agentops/tests/
  git commit -m "refactor(agentops): migrate tests from node:test to vitest"

Record gate:
  {
    "name": "migration:complete",
    "passedAt": "<ISO timestamp>",
    "commitSha": "<sha>",
    "testResults": { "total": N, "passing": N }
  }

Update state:
  - phase = "audit"
  - Display progress dashboard

Proceed to Phase 2.
```

## Phase 2: Spec-Code Divergence Audit

```
OBJECTIVE: Compare reference documents to actual implementation, document divergences

For each spec/config pair in the reference table:

  1. Read the spec/config document
  2. Read the code file(s) it describes
  3. Compare: does the code implement what the spec says?
  4. Document divergences (if any) with this format:

     ## {Spec Name} vs {Code File}

     ### Divergence: {brief description}
     - **Spec says**: {exact quote or summary}
     - **Code does**: {what actually happens, with line references}
     - **Impact**: {what this means for behavior}
     - **Recommendation**: {keep spec, keep code, or discuss}

Specific checks:

  1. Rubric Hard Gates (G0-G4):
     Read evals/dev_brief_proposal_rubric.md for gate definitions.
     Read runner/lib/template.ts for validateProposalsPayload().
     Check: Does validateProposalsPayload enforce ALL 5 gates?
     - G0: Evidence links (≥1 from signals)
     - G1: Touch points (≥2 plausible file/dir)
     - G2: Test plan (unit + integration mentioned)
     - G3: Rollout/rollback strategy
     - G4: Acceptance criteria (≥2)

  2. Selection Algorithm:
     Read evals/selection_algorithm.md for candidate generation strategy.
     Read runner/lib/synthesis.ts for actual synthesis flow.
     Check: Does synthesis generate 5-8 candidates then filter to 2-3?
     Or does it directly produce 2-3?

  3. Policy Enforcement:
     Read config/dev_brief_policy.yaml for resource limits.
     Read runner/lib/sources/collect.ts for signal collection.
     Check: Is max_signal_items (30) enforced in collection?
     Check: Is max_llm_cost_usd ($10) enforced before LLM calls?

  4. Prompt Fidelity:
     Read prompts/dev_brief_synthesizer.md for the expected prompt.
     Read runner/lib/synthesis.ts for what's actually sent to LLM.
     Check: Does the actual prompt match the spec prompt?

OUTPUT: Write .agentops-tdd/divergence-report.md

IMPORTANT: Do NOT auto-fix divergences. Document them and present to user.
  Divergence is data, not defect — the user decides intent.

GATE: Report exists and covers all 4 spec/config pairs.
  No commit for the report itself (it's in .agentops-tdd/ which is gitignored).

Update state:
  - phase = "per-module"
  - divergences = [{summary of each divergence found}]
  - Display progress dashboard

Present divergence report to user. Ask: "Any of these divergences need fixing
before we proceed to per-module testing?"

Proceed to Phase 3 after user acknowledges.
```

## Phase 3: Per-Module Validation (Dependency Order)

```
OBJECTIVE: Write hypothesis-driven tests for each untested module

MODULE ORDER: state, trace, sources/rss, sources/repo, sources/collect,
             github, llm/provider, synthesis, daily-dev-brief, implement, cli
```

### Per-Module Step Lifecycle

```
For each MODULE in order:

  1. READ: Read the relevant source file(s)
     - agentops/runner/lib/{module}.ts (or subdirectory)
     - Any types it imports from runner/types.ts or lib/sources/types.ts

  2. HYPOTHESIZE: Form testable hypotheses from specs + code analysis
     - What does this module promise?
     - What are the edge cases?
     - What does the spec say vs what the code does?
     - Document hypotheses as comments in the test file

  3. WRITE TESTS: Create agentops/tests/{module-name}.test.ts
     - Use vitest (describe/it/expect)
     - Each test maps to a hypothesis
     - Import from the actual module
     - For API-dependent tests: use --fixtures or --dry-run flags
     - For LLM tests: use fixtures for iteration, one real call for validation

  4. RUN TESTS: npx vitest run agentops/tests/{module-name}.test.ts
     EXPECT: GREEN (code already exists)

  5. IF RED: Investigate — is the test wrong or is there a bug?
     - Bug in code → fix implementation, document the fix
     - Wrong hypothesis → fix test, document hypothesis revision
     - Missing export → check if function is exported, may need to adjust import

  6. REGRESSION: Run ALL agentops tests
     npx vitest run agentops/tests/
     REQUIRED: All prior tests still pass
     If regression: fix without modifying prior tests if possible

  7. COMMIT:
     git add agentops/tests/{module-name}.test.ts
     git add agentops/runner/... (if any fixes were needed)
     git commit -m "test(agentops): add {module-name} validation tests"

  8. Record gate + update state:
     {
       "name": "{module}:tested",
       "passedAt": "<ISO timestamp>",
       "commitSha": "<sha>",
       "testResults": { "total": N, "passing": N }
     }
     modules.{module}.step = "complete"
     modules.{module}.tests = <count>
     Update testCounts
     Display progress dashboard
```

### Module-Specific Guidance

```
MODULE: state
  SOURCE: runner/lib/state.ts
  HYPOTHESES:
    - StateManager creates .agentops-bootstrap/ directory on init
    - load() returns null/default when no prior state exists
    - save() persists and load() recovers state
    - checkpoint() creates a named snapshot
    - State survives across instantiations (same dir)
    - Handles missing directory gracefully

MODULE: trace
  SOURCE: runner/lib/trace.ts
  HYPOTHESES:
    - TracingClient initializes without LANGCHAIN_API_KEY (graceful degradation)
    - startSpan() returns a span handle
    - endSpan() closes the span
    - getRunSummary() returns structured summary
    - No errors thrown when tracing is disabled

MODULE: sources/rss
  SOURCE: runner/lib/sources/rss.ts
  HYPOTHESES:
    - Parses valid RSS XML into SignalItem[]
    - Returns items with required fields (url, title, source)
    - Handles empty feeds gracefully
    - NOTE: Can test against real RSS feeds (free, fast)

MODULE: sources/repo
  SOURCE: runner/lib/sources/repo.ts
  HYPOTHESES:
    - Collects recent commits from GitHub API
    - Returns SignalItem[] with source='repo'
    - Handles empty repository gracefully
    - NOTE: Uses real GitHub API (read-only, free)

MODULE: sources/collect
  SOURCE: runner/lib/sources/collect.ts
  HYPOTHESES:
    - Orchestrates all source collectors
    - Deduplicates signals by URL
    - Caps output at config.max_signal_items
    - Reports per-source timing and counts
    - Handles individual source failures without crashing

MODULE: github
  SOURCE: runner/lib/github.ts
  HYPOTHESES:
    - GitHubClient initializes with GITHUB_TOKEN
    - parseLabel extracts proposal ID from label strings
    - Can read issues (real API, read-only)
    - Write operations respect --dry-run flag
    - Handles missing token gracefully

MODULE: llm/provider
  SOURCE: runner/lib/llm/provider.ts
  HYPOTHESES:
    - getLLMConfig reads API key from environment
    - callLLM returns structured response with content
    - Cost metadata is populated correctly
    - Handles missing API key with clear error
    - NOTE: One real LLM call (~$0.05), rest use fixtures

MODULE: synthesis
  SOURCE: runner/lib/synthesis.ts
  HYPOTHESES:
    - synthesizeProposals in fixture mode returns proposals.example.json
    - In real mode: sends prompt, parses response, validates payload
    - Repair flow triggers on malformed JSON
    - Cost tracking accumulates across calls
    - NOTE: Use --fixtures for iteration, one real call for validation (~$0.10)

MODULE: daily-dev-brief
  SOURCE: runner/daily-dev-brief.ts
  HYPOTHESES:
    - Pipeline runs end-to-end with --fixtures --dry-run (free)
    - Produces run_summary.json artifact
    - Signal collection → synthesis → template → (mock) issue creation
    - NOTE: One real --dry-run to validate full flow (~$0.10)

MODULE: implement
  SOURCE: runner/implement.ts
  HYPOTHESES:
    - Parses proposal from issue body
    - Creates branch plan in --dry-run mode
    - SMOKE mode validates without code changes
    - Guardrails: must touch src/** or agentops/evals/**

MODULE: cli
  SOURCE: runner/cli.ts
  HYPOTHESES:
    - Parses daily-dev-brief command
    - Parses implement command
    - --dry-run flag propagates correctly
    - --fixtures flag propagates correctly
    - --help outputs usage info
```

## Phase 4: Integration Validation

```
OBJECTIVE: Validate full pipeline end-to-end

1. FIXTURES DRY RUN:
   Run: npx tsx agentops/runner/cli.ts daily-dev-brief --fixtures --dry-run
   GATE: Exits 0, produces run_summary artifact
   This validates the full pipeline with zero API cost.

2. REAL DRY RUN (if user approves — costs ~$0.10):
   Run: npx tsx agentops/runner/cli.ts daily-dev-brief --dry-run
   GATE: Exits 0, proposals pass rubric hard gates (G0-G4)
   Records actual LLM cost in state.

3. COST CHECK:
   Total LLM spend for entire test suite + integration runs ≤ $1.00.
   Display cost breakdown from state.costUsd.

Record gate:
  {
    "name": "integration:complete",
    "passedAt": "<ISO timestamp>",
    "commitSha": "N/A (no new code)",
    "testResults": { "fixturesDryRun": "pass", "realDryRun": "pass|skipped" }
  }

Update state:
  - phase = "final"
  - Display progress dashboard
```

## Phase 5: Final Verification

```
OBJECTIVE: Full regression + build check

1. Run full agentops test suite:
   npx vitest run agentops/tests/
   REQUIRED: All tests pass (migrated + new)

2. Run existing project tests:
   npx vitest run src/hub/__tests__/
   REQUIRED: All hub tests still pass

3. Build check:
   npm run build
   REQUIRED: Clean build, no errors

4. Update state:
   - status = "completed"
   - phase = "completed"

5. Display final summary:

   AgentOps TDD — COMPLETE
   ═══════════════════════════════════════════
   Tests:       {passing} passing (35 migrated + {new} new)
   Divergences: {count} documented
   LLM Cost:    ${costUsd}
   Gates:       {count} passed
   Commits:     {count} atomic commits

   Divergence report: .agentops-tdd/divergence-report.md
```

## Progress Dashboard

Display this after each gate and on resume:

```
AgentOps TDD Progress
═══════════════════════════════════════════
Phase: {phase}              Tests: {passing}/{total}
Cost: ${cost_usd}           Divergences: {count}

  migration      [{progress_bar}] {status}     {commit_sha}
  audit          [{progress_bar}] {status}     —
  state          [{progress_bar}] {status}     {commit_sha}
  trace          [{progress_bar}] {status}     {commit_sha}
  sources/rss    [{progress_bar}] {status}     {commit_sha}
  sources/repo   [{progress_bar}] {status}     {commit_sha}
  sources/collect[{progress_bar}] {status}     {commit_sha}
  github         [{progress_bar}] {status}     {commit_sha}
  llm/provider   [{progress_bar}] {status}     {commit_sha}
  synthesis      [{progress_bar}] {status}     {commit_sha}
  daily-dev-brief[{progress_bar}] {status}     {commit_sha}
  implement      [{progress_bar}] {status}     {commit_sha}
  cli            [{progress_bar}] {status}     {commit_sha}

Next: {description of next action}
```

Progress bar mapping:
- pending:     [            ]
- tested:      [██████      ]
- complete:    [████████████]

Phase-level items (migration, audit):
- pending:     [            ]
- complete:    [████████████]

## Anti-Drift Rules

These rules are NON-NEGOTIABLE:

1. **Real APIs, not mocks**: External boundaries are tested against real services. Use `--fixtures`/`--dry-run` flags for zero-cost iteration, but at least one real validation per module where applicable.

2. **Investigate failures, don't paper over**: If a test fails, determine root cause before proceeding. Could be a code bug (fix it) or a wrong hypothesis (revise it). Document the outcome either way.

3. **Divergence is data, not defect**: Spec-code mismatches are documented in .agentops-tdd/divergence-report.md, not auto-fixed. User decides intent.

4. **Cost tracking**: Every LLM call's cost is recorded in state. Total must stay ≤$1.00. Display running total after each module with LLM calls.

5. **Commit at every module**: Atomic commits for bisection. Each module gets its own commit after tests pass.

6. **Regression after each module**: All prior agentops tests must still pass before committing.

7. **State before code**: Always update .agentops-tdd/state.json before and after each step. If a session dies mid-step, state tells the next session exactly where to resume.

8. **Read the code**: Before writing tests for any module, read the actual source file. Don't rely on memory or the explore agent's summary. Form hypotheses from the real code.

## Git Commit Convention

All commits follow conventional commits (per CLAUDE.md):

| Gate | Message |
|------|---------|
| Migration complete | `refactor(agentops): migrate tests from node:test to vitest` |
| Module tests added | `test(agentops): add {module-name} validation tests` |
| Module bug fixed | `fix(agentops): {description of fix}` |
| Integration validated | `test(agentops): add integration validation` |

Each commit recorded in state.json gates[] with SHA for traceability.

## Error Recovery

If something goes wrong during a step:

1. **Import errors**: agentops uses .js extensions for node:test imports. Vitest resolves .ts natively — remove .js extensions from imports in test files.
2. **Missing module**: The agentops runner code may not be on the current branch. Check feat/agentops-phase1.2 and suggest merging/cherry-picking if needed.
3. **Tests pass unexpectedly**: If a test passes when you expected it to fail, the code may already handle that case. Update the hypothesis and move on.
4. **Tests fail unexpectedly**: Read the error output carefully. Check: is the import path correct? Is the function exported? Is the assertion right?
5. **LLM call fails**: Check API key environment variable. If not set, skip real LLM tests and note in state.
6. **Session interrupted**: State file persists. Next `/agentops-tdd` run auto-resumes.
7. **Want to abort**: Set `status: "halted"` in state.json.

## Key Differences from /hub-tdd

| Aspect | /hub-tdd | /agentops-tdd |
|--------|----------|---------------|
| Code state | Doesn't exist yet | Already exists |
| Red gate | Required (prove tests fail first) | Not applicable (code already exists) |
| Green gate | Implement to make tests pass | Tests should pass immediately |
| Failure meaning | Implementation incomplete | Bug in code OR wrong hypothesis |
| Specs | ADR Section 10 (prescriptive) | Evals/config (descriptive, may diverge) |
| Mocking | In-memory storage | Real APIs + --fixtures/--dry-run |
| Divergence | N/A | Documented, user-decided |
| Cost tracking | N/A | Required (LLM calls cost money) |
