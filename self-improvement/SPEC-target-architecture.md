# Target Architecture: Self-Improving Codebase

Status: Draft

---

## 1) Target Outcomes

- Continuous improvement runs with deterministic gates.
- Persistent, queryable improvement history.
- A scorecard that measures improvement over time.
- Observability into improvement events and trends.

---

## 2) Core Components

### 2.1 Improvement Event Store
- Persistent store for `improvement:event` entries.
- Append-only writes with schema versioning.
- Query support for trends and summaries.

### 2.2 Improvement Tracker Wiring
- `ImprovementTracker` emits to `ThoughtEmitter`.
- `ThoughtEmitter` writes to improvement store (non-blocking).

### 2.3 SIL Orchestrator Integration
- SIL calls `startIteration/track*/endIteration`.
- Each phase emits structured metadata.

### 2.4 Evaluation Gatekeeper
- Tiered evaluator + behavioral contracts as required gates.
- Failures block integration.

### 2.5 Scorecard Aggregator
- Periodic summary across improvement history.
- Produces deterministic metrics (success, cost, pass rates, regressions).

### 2.6 Automation Scheduler
- CI or cron triggers for routine runs.
- Budget and iteration caps enforced.

---

## 3) Data Flow (Target)

```
[SIL Orchestrator]
  -> ImprovementTracker
    -> ThoughtEmitter ("improvement:event")
      -> ImprovementStore (persist)
        -> Scorecard Aggregator
          -> Reporting / Gatekeeper
```

---

## 4) Integration Points (File-Level)

- SIL runner:
  `scripts/agents/sil-010-main-loop-orchestrator.ts`
  `scripts/agents/run-improvement-loop.ts`

- Improvement tracking:
  `src/observatory/improvement-tracker.ts`
  `src/observatory/emitter.ts`

- Evaluation:
  `benchmarks/tiered-evaluator.ts`
  `benchmarks/suite.yaml`
  `scripts/agents/behavioral-contracts.ts`

- Observability:
  `src/observatory/server.ts`
  `src/observatory/channels/observatory.ts`

