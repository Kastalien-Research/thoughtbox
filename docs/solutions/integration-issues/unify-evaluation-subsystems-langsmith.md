---
title: Unified Evaluation System Foundation with LangSmith Integration
date: 2026-02-11
category: integration-issues
severity: high
components:
  - src/evaluation/
  - src/observatory/emitter.ts
  - src/index.ts
  - package.json
  - .specs/SPEC-EVAL-001-unified-evaluation-system.md
  - dgm-specs/implementation-status.json
tags:
  - evaluation
  - langsmith
  - feedback-loop
  - trace-listener
  - alma
  - observatory
  - dgm-fitness
related_issues: []
resolution_time: ~2 hours (spec + Phase 1 infrastructure)
author: claude-opus-4-6
---

# Unifying Five Disconnected Evaluation Subsystems via LangSmith

## Problem

The Thoughtbox project had five evaluation subsystems built independently with no integration layer:

| Subsystem | What It Did | What It Didn't Do |
|-----------|------------|-------------------|
| **Observatory** | Emits events, displays dashboard | Events not persisted for analysis |
| **Benchmark Harness** | Runs tests, produces scores | Scores not fed back to DGM archive |
| **DGM Fitness** | Archive schema defined | All fitness scores hardcoded to 0.0 |
| **`.eval/baselines.json`** | Template metrics defined | All `sample_size: 0` |
| **EvaluationGatekeeper** | Type-safe gate interface | Pass-through stub (always passes) |

**Symptom**: No closed feedback loop. ALMA-style memory design meta-learning impossible.

**Evidence**:
- `EvaluationGatekeeper.runTieredEvaluation()` contained: `"TieredEvaluator integration pending - using pass-through"`
- `.eval/baselines.json` had every metric at `sample_size: 0`
- DGM archive entries all showed `fitness: 0.0`

## Root Cause

No integration layer existed between subsystems. Each was built to its own interface with no mechanism to:
- Persist evaluation events for downstream analysis
- Feed benchmark scores back to the DGM archive
- Populate baseline metrics with real data
- Gate deployments on actual evaluation results

The subsystems were designed in isolation during separate development sessions without a unifying specification.

## Solution

### Approach: Spec-First, Then Build

1. Wrote `SPEC-EVAL-001` defining a 5-layer architecture before any code
2. Implemented Phase 1 (trace infrastructure) to validate the design
3. Preserved all existing code — added listeners, not replacements

### Architecture: 5-Layer Evaluation System

```
Agent Session (ThoughtEmitter events)
        |
        v
Layer 1: LangSmithTraceListener (ThoughtEmitter -> LangSmith runs)
        |
        v
Layer 2: Evaluation Datasets (ALMA collection/deployment task sets)
        |
        v
Layer 3: Custom Evaluators (session quality, memory quality, DGM fitness)
        |
        v
Layer 4: Experiment Runner (compare configs, feed winners to QD archive)
        |
        v
Layer 5: Online Monitoring (regression detection, cost budgets, alerts)
```

### Phase 1 Implementation (what was built)

**`src/evaluation/types.ts`** (222 lines) — Shared types for all 5 layers:
- `LangSmithConfig` — connection configuration
- `SessionRun` — maps Thoughtbox sessions to LangSmith runs
- `CollectionTask` / `DeploymentTask` — ALMA-style dataset types
- `EvaluatorResult` — evaluator output contract
- `ExperimentConfig` / `ExperimentResult` — experiment runner types
- `MemoryDesignArchiveEntry` — DGM quality-diversity archive bridge
- `MonitoringAlert` — Layer 5 alert types

**`src/evaluation/langsmith-config.ts`** — Config loader:
- Reads `LANGSMITH_API_KEY`, `LANGSMITH_ENDPOINT`, `LANGSMITH_PROJECT`, `LANGSMITH_WORKSPACE_ID`
- Returns `null` if API key not set (graceful degradation)

**`src/evaluation/trace-listener.ts`** — Core trace bridge:
- `LangSmithTraceListener` subscribes to ThoughtEmitter singleton
- Creates parent LangSmith run per session (`run_type: "chain"`)
- Creates child runs per thought/revision/branch (`run_type: "tool"`)
- All API calls fire-and-forget via `safeAsync()` wrapper
- Idempotent attach/detach, 5-second delayed cleanup on session end

**`src/observatory/emitter.ts`** — New event type:
- Added `monitoring:alert` to `ThoughtEmitterEvents` union
- Added `emitMonitoringAlert()` method following existing pattern

**`src/index.ts`** — Server wiring:
- `initEvaluation()` called in both `startHttpServer()` and `runStdioServer()`
- Returns `null` (no-op) when `LANGSMITH_API_KEY` not set

## Key Technical Decisions

### 1. `CreateRunParams` vs `RunUpdate` Tags

The LangSmith SDK's `CreateRunParams` does NOT include a `tags` field, while `RunUpdate` does. Solution:
- **Run creation**: Tags stored in `extra.metadata.tags`
- **Run updates**: Tags used directly via `RunUpdate.tags`

### 2. Fire-and-Forget Pattern

All LangSmith API calls are non-blocking:

```typescript
private safeAsync(fn: () => Promise<unknown>): void {
  fn().catch((err) => {
    console.warn("[Evaluation] LangSmith trace error:",
      err instanceof Error ? err.message : err);
  });
}
```

This ensures Observatory events are never delayed by network I/O and LangSmith outages don't crash the server.

### 3. Graceful Degradation

```typescript
export function initEvaluation(): LangSmithTraceListener | null {
  const config = loadLangSmithConfig();
  if (!config) {
    console.error("[Evaluation] LangSmith not configured. Tracing disabled.");
    return null;
  }
  // ...
}
```

Without `LANGSMITH_API_KEY`, the system behaves identically to before this change.

## Prevention Strategies

### Avoid Building Disconnected Subsystems

1. **Spec-first for cross-cutting concerns** — Write the integration spec before any component. If the spec doesn't describe data flow between subsystems, the integration won't happen.

2. **Integration smoke tests** — Test the feedback loop as a closed system:
   - Emit session event -> verify trace in LangSmith
   - Run benchmark -> verify fitness score updates
   - Check gatekeeper -> verify it blocks/passes based on real data

3. **Red flags to watch for**:
   - "We'll integrate later" -> Will not happen
   - Subsystem doesn't mention how it reads from other subsystems -> Isolated
   - No integration test examples in the spec -> Integration is optional

### Future Risks

| Risk | Mitigation |
|------|-----------|
| Phases 2-4 not built | SPEC-EVAL-001 has phased plan; track in `dgm-specs/implementation-status.json` |
| LangSmith API breaking changes | Pin SDK version; add weekly compat test |
| Trace emission performance overhead | Fire-and-forget pattern; benchmark before Phase 2 |

### Test Cases for Verification

1. **Trace sync**: Create session, verify LangSmith run exists with correct parent-child hierarchy
2. **Graceful degradation**: Unset `LANGSMITH_API_KEY`, verify server starts and operates normally
3. **Monitoring alerts**: Emit `monitoring:alert` event, verify listeners receive it
4. **Performance**: Measure overhead of trace listener attachment (<5% threshold)

## Related Documentation

### Specifications
- [SPEC-EVAL-001](.specs/SPEC-EVAL-001-unified-evaluation-system.md) — Full 5-layer architecture
- [SPEC-SIL-000](.specs/self-improvement-loop/SPEC-SIL-000-feedback-loop-validation.md) — Feedback loop validation
- [SPEC-SIL-004](.specs/self-improvement-loop/SPEC-SIL-004-tiered-evaluator.md) — Tiered evaluator

### Implementation
- `src/evaluation/` — New evaluation module (Phase 1)
- `src/observatory/evaluation-gatekeeper.ts` — Gate interface (stub, to be wired in Phase 3)
- `benchmarks/tiered-evaluator.ts` — Tiered evaluation pipeline
- `.eval/baselines.json` — Baseline metrics (sample_size: 0, to be populated in Phase 4)

### Tracking
- `dgm-specs/implementation-status.json` — EVAL-001 status: `in_progress` (Phase 1 complete)

## ALMA Mapping

| ALMA Concept | Our Implementation |
|---|---|
| Memory Design Archive | `.dgm/` + LangSmith Experiments |
| Performance Score | Custom evaluators (session + memory quality) |
| Collection Phase | LangSmith dataset: tasks WITHOUT memory |
| Deployment Phase | LangSmith dataset: tasks WITH memory |
| Meta Agent reflection | LangSmith comparison view + eval log access |
