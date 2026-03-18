# SPEC-EVAL-001: Unified Evaluation System (LangSmith Backbone)

> **Status**: Draft
> **Priority**: P0 (Foundation)
> **Dependencies**: Observatory (implemented), ThoughtEmitter (implemented)
> **Author**: glassBead
> **Date**: 2026-02-11

## Summary

Unify five disconnected evaluation subsystems (Observatory, Benchmarks, DGM fitness, Eval skill, AgentOps tracing) into a single closed-loop evaluation system built on LangSmith. This enables ALMA-style memory design meta-learning by providing real performance scores, experiment comparison, and automated feedback.

## Problem Statement

The current evaluation landscape is fragmented:

| Subsystem | Current State | Gap |
|-----------|--------------|-----|
| Observatory | Emits events, displays in dashboard | Events not persisted for analysis |
| Benchmark Harness | Runs tests, produces scores | Scores not fed back into DGM archive |
| DGM Fitness | Archive schema defined | All fitness scores are 0.0 |
| `.eval/baselines.json` | Template metrics defined | All sample_size: 0 |
| EvaluationGatekeeper | Type-safe gate interface | Pass-through stub (always passes) |

Without a closed evaluation loop, the system cannot:
- Compare agent performance across memory designs
- Detect regressions in session quality
- Feed fitness scores into the DGM quality-diversity archive
- Run ALMA collection/deployment task sets

## Philosophy

**Observation does NOT affect the observed.** LangSmith integration follows the same fire-and-forget principle as ThoughtEmitter. Trace recording is synchronous, non-blocking, and failure-isolated. If LangSmith is unavailable, behavior is identical to the current system.

**Existing code is preserved, not replaced.** Each layer adds a new listener or integration point. ThoughtEmitter gains a listener. TieredEvaluator gains experiment integration. DGM fitness gains real scores.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Agent Session                      │
│  thoughtbox tool calls → ThoughtEmitter events       │
└──────────────────────┬──────────────────────────────┘
                       │ fire-and-forget
                       ▼
┌─────────────────────────────────────────────────────┐
│  Layer 1: LangSmithTraceListener                     │
│  Subscribes to ThoughtEmitter → creates LangSmith    │
│  runs with thought content, timing, metadata         │
└──────────────────────┬──────────────────────────────┘
                       │ traces stored in LangSmith
                       ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: Evaluation Datasets                        │
│  ALMA collection tasks (no memory) and deployment    │
│  tasks (with memory) as LangSmith Dataset examples   │
└──────────────────────┬──────────────────────────────┘
                       │ datasets feed into
                       ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: Custom Evaluators                          │
│  - Session quality (thought depth, branching, tags)  │
│  - Memory quality (recall accuracy, entity coverage) │
│  - DGM fitness (novelty, performance, niche)         │
│  - LLM-as-judge (reasoning coherence)                │
└──────────────────────┬──────────────────────────────┘
                       │ scores annotate traces
                       ▼
┌─────────────────────────────────────────────────────┐
│  Layer 4: Experiment Runner                          │
│  Run agents against datasets with different configs, │
│  compare results, feed winners to QD archive         │
└──────────────────────┬──────────────────────────────┘
                       │ results update
                       ▼
┌─────────────────────────────────────────────────────┐
│  Layer 5: Online Monitoring                          │
│  Production session scoring, regression detection,   │
│  cost budgets, alerts via monitoring:alert events     │
└─────────────────────────────────────────────────────┘
```

## Layer Specifications

### Layer 1: Trace Everything

**Purpose**: Bridge ThoughtEmitter events to LangSmith traces.

**Implementation**: `src/evaluation/trace-listener.ts`

```typescript
import { Client } from "langsmith";
import { ThoughtEmitter } from "../observatory/emitter.js";

export class LangSmithTraceListener {
  private client: Client;
  private sessionRuns: Map<string, string>; // sessionId → runId

  constructor(config: LangSmithConfig) {
    this.client = new Client({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
    });
    this.sessionRuns = new Map();
  }

  /**
   * Subscribe to ThoughtEmitter events.
   * Fire-and-forget: errors are caught and logged, never propagated.
   */
  attach(emitter: ThoughtEmitter): void {
    emitter.on("session:started", (data) => {
      this.onSessionStarted(data);
    });
    emitter.on("thought:added", (data) => {
      this.onThoughtAdded(data);
    });
    emitter.on("session:ended", (data) => {
      this.onSessionEnded(data);
    });
  }
}
```

**Key constraints**:
- All LangSmith API calls are fire-and-forget (no `await` on the hot path)
- Errors logged via `console.warn`, never thrown
- If `LANGSMITH_API_KEY` is not set, listener is not created (graceful no-op)

### Layer 2: Evaluation Datasets

**Purpose**: Maintain ALMA-style collection and deployment task sets.

**Dataset structure**:
- **Collection dataset**: Tasks run WITHOUT memory (baseline performance)
- **Deployment dataset**: Tasks run WITH memory (memory-augmented performance)
- **Regression dataset**: Known-good inputs with expected outputs

**Management**: Via LangSmith Datasets API. Created programmatically or via CLI.

```typescript
interface CollectionTask {
  taskId: string;
  description: string;
  expectedCapabilities: string[];
  difficultyTier: "smoke" | "regression" | "real_world";
}

interface DeploymentTask extends CollectionTask {
  memoryDesignId: string;
  priorContext: Record<string, unknown>;
}
```

### Layer 3: Custom Evaluators

**Purpose**: Score traces on multiple dimensions.

| Evaluator | Input | Output | Maps To |
|-----------|-------|--------|---------|
| `sessionQuality` | Session trace | 0.0–1.0 score | `.eval/baselines.json` |
| `memoryQuality` | Deployment trace + ground truth | 0.0–1.0 score | ALMA deployment score |
| `dgmFitness` | Experiment results | Fitness vector | `.dgm/` archive entries |
| `reasoningCoherence` | Thought chain | LLM judge score | Regression detection |

```typescript
interface EvaluatorResult {
  key: string;          // evaluator name
  score: number;        // 0.0–1.0
  comment?: string;     // explanation
  metadata?: Record<string, unknown>;
}
```

### Layer 4: Experiment Runner

**Purpose**: Run agents against datasets with different configurations and compare.

```typescript
interface ExperimentConfig {
  datasetName: string;
  memoryDesignId?: string;
  evaluators: string[];
  metadata: Record<string, unknown>;
}
```

**Integration with EvaluationGatekeeper**: The experiment runner replaces the pass-through stub. When `checkGates()` is called, it:
1. Runs the smoke tier against the regression dataset
2. Compares scores against baselines
3. Returns real pass/fail with evidence

### Layer 5: Online Monitoring

**Purpose**: Score production sessions in real-time and detect regressions.

**New event type**: `monitoring:alert` added to ThoughtEmitter for surfacing evaluation concerns.

```typescript
"monitoring:alert": {
  type: "regression" | "anomaly" | "budget_exceeded";
  severity: "info" | "warning" | "critical";
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: string;
};
```

## ALMA Mapping

| ALMA Concept | Our Implementation |
|---|---|
| Memory Design Archive | `.dgm/` + LangSmith Experiments |
| Performance Score | Custom evaluators (session + memory quality) |
| Evaluation Logs | LangSmith traces with evaluator annotations |
| Visit Count | Experiment metadata `visitCount` field |
| Sampling (visit-penalized softmax) | QD niche-grid competition |
| Collection Phase | LangSmith dataset: tasks WITHOUT memory |
| Deployment Phase | LangSmith dataset: tasks WITH memory |
| Meta Agent reflection | LangSmith comparison view + eval log access |

## Implementation Phases

### Phase 1: Foundation (this PR)
- Add `langsmith` SDK dependency
- Create `src/evaluation/langsmith-config.ts` — env-based config
- Create `src/evaluation/types.ts` — shared types
- Create `src/evaluation/trace-listener.ts` — ThoughtEmitter → LangSmith bridge
- Create `src/evaluation/index.ts` — barrel export
- Add `monitoring:alert` event type to ThoughtEmitter
- Wire trace listener into server startup (opt-in)

### Phase 2: Datasets & Evaluators
- Create evaluation datasets via LangSmith API
- Implement `sessionQuality` evaluator
- Implement `reasoningCoherence` LLM-as-judge evaluator
- Update `.eval/baselines.json` with real data

### Phase 3: Experiment Runner
- Wire EvaluationGatekeeper to experiment runner
- Implement collection/deployment experiment workflow
- Feed results to DGM fitness archive

### Phase 4: Online Monitoring
- Real-time session scoring
- Regression detection against baselines
- Cost budget enforcement
- Alert emission via `monitoring:alert` events

## Graceful Degradation

| Condition | Behavior |
|-----------|----------|
| No `LANGSMITH_API_KEY` | Trace listener not created; all other behavior identical |
| LangSmith API unreachable | Traces silently dropped; console.warn logged |
| No datasets exist | Experiment runner returns "no datasets" result |
| Evaluator error | Individual evaluator score marked as error; others continue |

## Requirements

### REQ-EVAL-001: Trace Listener
- MUST subscribe to ThoughtEmitter without blocking emission path
- MUST create LangSmith runs for each session
- MUST add child runs for each thought
- MUST NOT throw errors that propagate to callers
- MUST be disabled when LANGSMITH_API_KEY is not set

### REQ-EVAL-002: Configuration
- MUST read from existing `.env` variables (LANGSMITH_API_KEY, LANGSMITH_PROJECT, etc.)
- MUST provide typed configuration interface
- MUST validate configuration at startup

### REQ-EVAL-003: Type Safety
- MUST define shared types for all evaluation concepts
- MUST use Zod schemas where data crosses boundaries
- MUST be compatible with existing Observatory types

### REQ-EVAL-004: Monitoring Events
- MUST add `monitoring:alert` event type to ThoughtEmitter
- MUST follow existing fire-and-forget pattern
- MUST include severity, metric, and threshold information

### REQ-EVAL-005: Graceful Degradation
- MUST work identically without LangSmith credentials
- MUST NOT add required dependencies to server startup
- MUST NOT affect existing tool behavior

## Files

| File | Action | Purpose |
|------|--------|---------|
| `.specs/SPEC-EVAL-001-unified-evaluation-system.md` | Create | This specification |
| `src/evaluation/langsmith-config.ts` | Create | Config loader |
| `src/evaluation/types.ts` | Create | Shared types |
| `src/evaluation/trace-listener.ts` | Create | ThoughtEmitter → LangSmith bridge |
| `src/evaluation/index.ts` | Create | Module barrel export |
| `src/observatory/emitter.ts` | Modify | Add `monitoring:alert` event type |
| `package.json` | Modify | Add `langsmith` dependency |

---

**Last Updated**: 2026-02-11
