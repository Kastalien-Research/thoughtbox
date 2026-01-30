# Phase 2 Implementation: Task Definitions (Partial)

**Implementation Date**: 2026-01-24
**Status**: 🟡 Task definitions complete, runners pending

## Overview

Phase 2 focuses on creating feature-aligned benchmark tasks that test Thoughtbox's specific differentiators:
1. **Bug Localization**: Tests context isolation (prevents distraction)
2. **Detect-Recover Traps**: Tests self-observability (surfaces inconsistencies)

## What Was Implemented

### ✅ Bug Localization Tasks (5 tasks)

**Purpose**: Test whether Thoughtbox's context isolation helps agents locate and fix bugs without getting distracted by irrelevant code.

**Tasks created** (from real git history):

1. **BranchId Validation Bug** (`bug-loc-001`)
   - **File**: `branchid-validation.json`
   - **Bug**: Agent uses branchId without branchFromThought, creating orphan nodes
   - **Fix**: Add validation rejecting branchId without branchFromThought
   - **Files**: `src/thought-handler.ts` (1 file, focused)
   - **Tokens**: ~3,000

2. **Graceful Shutdown Race Condition** (`bug-loc-002`)
   - **File**: `shutdown-race-condition.json`
   - **Bug**: Database cleanup starts before in-flight requests complete
   - **Fix**: Capture server instance, use server.close(), wait for requests
   - **Files**: `src/http.ts` (1 file, async reasoning)
   - **Tokens**: ~2,500

3. **Session Status Update Race** (`bug-loc-003`)
   - **File**: `session-status-await.json`
   - **Bug**: Broadcasting session:ended before awaiting status update
   - **Fix**: Await status update before broadcast
   - **Files**: `src/observatory/channels/reasoning.ts` (1 file, async)
   - **Tokens**: ~2,000

4. **Branch Thought ID Collision** (`bug-loc-004`)
   - **File**: `branch-collision.json`
   - **Bug**: Branch thoughts with same thoughtNumber overwrite each other
   - **Fix**: Include branchId in node ID format
   - **Files**: `src/persistence/storage.ts` + 2 others (multi-file)
   - **Tokens**: ~3,500

5. **Snapshot Payload Parsing Error** (`bug-loc-005`)
   - **File**: `snapshot-payload-parsing.json`
   - **Bug**: HTML reads wrong nested path for payload
   - **Fix**: Correct payload.session.thoughts → payload.thoughts
   - **Files**: `observatory-test.html`, `src/observatory/channels/reasoning.ts`
   - **Tokens**: ~2,500

**Total estimated cost**: 5 tasks × 2 runs (control + treatment) × $0.136 = **~$1.36 per iteration**

### ✅ Detect-Recover Trap Tasks (5 tasks)

**Purpose**: Test whether Thoughtbox's structured thinking helps agents detect inconsistencies, traps, and recover gracefully.

**Tasks created**:

1. **Ambiguous Performance Requirement** (`trap-001`)
   - **File**: `ambiguous-performance.json`
   - **Trap**: Spec says "make it fast" without defining fast
   - **Expected**: Agent asks for clarification or states assumptions
   - **Type**: ambiguous-requirement
   - **Tokens**: ~2,500

2. **Misleading Test Name** (`trap-002`)
   - **File**: `misleading-test-name.json`
   - **Trap**: Test named test_valid_email actually tests INVALID emails
   - **Expected**: Agent notices name/behavior mismatch
   - **Type**: misleading-test
   - **Tokens**: ~2,000

3. **Flaky Test - Non-Deterministic** (`trap-003`)
   - **File**: `flaky-test.json`
   - **Trap**: Test has race condition, passes 80% of time
   - **Expected**: Agent identifies timing dependency
   - **Type**: flaky-test
   - **Tokens**: ~2,800

4. **Missing Thread-Safety Requirement** (`trap-004`)
   - **File**: `missing-thread-safety.json`
   - **Trap**: Spec omits that cache must be thread-safe for concurrent use
   - **Expected**: Agent infers from usage context or asks
   - **Type**: missing-constraint
   - **Tokens**: ~3,000

5. **Contradictory Specification** (`trap-005`)
   - **File**: `contradictory-spec.json`
   - **Trap**: Spec says both "return empty array" AND "return null" for no results
   - **Expected**: Agent flags contradiction
   - **Type**: contradictory-spec
   - **Tokens**: ~2,200

**Total estimated cost**: 5 tasks × 2 runs (control + treatment) × $0.136 = **~$1.36 per iteration**

### ✅ Type Definitions

**Files created**:
- `bug-localization-types.ts`: Types for bug localization benchmark
- `trap-types.ts`: Types for detect-recover benchmark

**Key types**:
- `BugLocalizationTask`, `BugFixMetrics`, `BugLocalizationResult`
- `TrapTask`, `TrapMetrics`, `TrapResult`
- Suite aggregation types

## Directory Structure

```
dgm-specs/
├── harness/
│   ├── bug-localization-types.ts          # NEW: Bug loc types
│   ├── trap-types.ts                      # NEW: Trap types
│   ├── PHASE1-IMPLEMENTATION.md           # Phase 1 docs
│   └── PHASE2-TASK-DEFINITIONS.md         # This file
│
└── tasks/
    ├── bug-localization/                   # NEW: 5 bug tasks
    │   ├── branchid-validation.json
    │   ├── shutdown-race-condition.json
    │   ├── session-status-await.json
    │   ├── branch-collision.json
    │   └── snapshot-payload-parsing.json
    │
    └── traps/                              # NEW: 5 trap tasks
        ├── ambiguous-performance.json
        ├── misleading-test-name.json
        ├── flaky-test.json
        ├── missing-thread-safety.json
        └── contradictory-spec.json
```

## What's Pending (Phase 2 Completion)

### 🟡 Bug Localization Runner

**Not yet implemented**:
- `bug-localization-runner.ts`: Orchestrates bug fix comparisons
- `bug-localization-metrics.ts`: Computes bug fix quality metrics

**Metrics to implement**:
```typescript
interface BugFixMetrics {
  correctFileLocated: boolean;    // Found right file?
  testsPass: boolean;             // Tests pass after fix?
  bugFixed: boolean;              // Bug actually resolved?
  diffSize: number;               // LOC changed
  filesTouched: number;           // Files edited
  wrongFileEdits: number;         // Edits to wrong files
  timeToCorrectFile: number;      // ms to first correct edit
  hallucinatedSymbols: number;    // Non-existent refs
  localizationAccuracy: number;   // 0-100 score
  fixQuality: number;             // 0-100 score
  efficiency: number;             // 0-100 score
}
```

**Implementation approach**:
1. Run agent with bug context (failing test, error message)
2. Monitor which files agent reads/edits
3. Track time to first edit of correct file
4. Run tests after agent finishes
5. Compute metrics from agent actions and test results

### 🟡 Trap Runner

**Not yet implemented**:
- `trap-runner.ts`: Orchestrates trap detection comparisons
- `trap-metrics.ts`: Computes detection/recovery metrics

**Metrics to implement**:
```typescript
interface TrapMetrics {
  trapDetected: boolean;          // Flagged inconsistency?
  detectionTurns: number;         // Turns to detection
  detectionTime_ms: number;       // Time to detection
  recoveryAttempts: number;       // Failed attempts after
  falseStarts: number;            // Started before detection
  trapHandled: boolean;           // Solved despite trap?
  finalCorrectness: number;       // 0-100
  detectionSpeed: number;         // 0-100 (faster = higher)
  recoveryEfficiency: number;     // 0-100 (fewer tries = higher)
}
```

**Implementation approach**:
1. Run agent with trap-embedded prompt
2. Monitor agent messages for detection keywords
3. Count turns until detection flagged
4. Track false starts (began implementing before flagging)
5. Evaluate final solution correctness
6. Compute detection speed and recovery efficiency

## Why Runners Are Deferred

**Runners require**:
1. Agent SDK integration (capture tool calls, file edits)
2. Test execution infrastructure (run tests in sandbox)
3. Diff analysis (parse git diffs, count LOC)
4. Hallucination detection (parse code for non-existent symbols)
5. Turn-by-turn message analysis (detect when trap flagged)

**Estimated effort**: 2-3 days per runner (bug loc + trap)

**Decision**: Get task definitions right first, then build runners with proper infrastructure.

## Current Capabilities

### What You Can Do Now

1. **Review task definitions**:
   ```bash
   cat dgm-specs/tasks/bug-localization/*.json
   cat dgm-specs/tasks/traps/*.json
   ```

2. **Manually test tasks**:
   - Give agent a bug localization prompt
   - Give agent a trap task prompt
   - Observe how it performs

3. **Use existing reasoning eval**:
   ```bash
   npx tsx dgm-specs/harness/cli.ts reasoning-compare --runs 5
   ```
   (Uses Phase 1 infrastructure with 5 existing tasks)

### What You Can't Do Yet

1. **Run bug localization benchmark**: No runner implemented
2. **Run trap detection benchmark**: No runner implemented
3. **Compute specialized metrics**: BugFixMetrics and TrapMetrics not computed
4. **Compare Thoughtbox on new tasks**: Infrastructure needs runners

## Cost Estimates

### Full Phase 2 Suite (10 tasks)

**Single run**:
- 10 tasks × 2 runs (control + treatment) × ~$0.136 = **~$2.72**

**5-run statistical mode**:
- 10 tasks × 5 iterations × $2.72 = **~$13.60**

**Combined with Phase 1** (15 tasks total):
- Single run: ~$4.08
- 5-run mode: ~$20.40

Still very affordable for blog post validation!

## Next Steps (Phase 2 Completion)

### Priority 1: Build Bug Localization Runner

1. Create `bug-localization-runner.ts`:
   - Integrate with Agent SDK
   - Capture file read/edit actions
   - Track timing metrics
   - Run tests after agent finishes

2. Create `bug-localization-metrics.ts`:
   - Implement `BugFixMetrics` calculation
   - Analyze diffs for quality metrics
   - Detect hallucinations (parse code AST)

3. Integrate with CLI:
   - Add `bug-localization-compare` command
   - Support `--runs` flag
   - Display bug loc-specific metrics

### Priority 2: Build Trap Runner

1. Create `trap-runner.ts`:
   - Run agent with trap-embedded prompts
   - Monitor messages for detection keywords
   - Track turn count, timing
   - Evaluate final correctness

2. Create `trap-metrics.ts`:
   - Implement `TrapMetrics` calculation
   - Detect when trap was flagged
   - Count false starts and backtracks

3. Integrate with CLI:
   - Add `trap-compare` command
   - Support `--runs` flag
   - Display trap-specific metrics

### Priority 3: Full Suite Integration

1. Combine all 15 tasks (5 reasoning + 5 bug loc + 5 trap)
2. Unified reporting across families
3. Cross-family analysis

## Verification Checklist

Phase 2 task definitions:

- [x] 5 bug localization tasks created from real git history
- [x] 5 detect-recover trap tasks created
- [x] Type definitions for both families
- [x] Task JSON files properly structured
- [x] Estimated token counts included
- [ ] Bug localization runner (pending)
- [ ] Trap runner (pending)
- [ ] CLI integration (pending)
- [ ] Test with actual agent runs (pending)

## Conclusion

Phase 2 task definitions are complete! We now have:

✅ **10 feature-aligned tasks** that test Thoughtbox's differentiators
✅ **Type-safe definitions** for bug localization and trap detection
✅ **Real-world bugs** from git history (ecological validity)
✅ **Diverse trap types** covering common failure modes

**Ready for**: Runner implementation (Priority 1 next session)

**Total work**: ~$2.72 per run for 10 new tasks, very affordable for validation.
