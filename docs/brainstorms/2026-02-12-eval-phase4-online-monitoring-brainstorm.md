---
title: "Phase 4: Online Monitoring for Evaluation System"
type: brainstorm
date: 2026-02-12
spec: SPEC-EVAL-001
layer: 5
---

# Phase 4: Online Monitoring

## What We're Building

A real-time session monitor that scores production sessions using the same evaluator pipeline as offline experiments, detects regressions against learned baselines, and emits `monitoring:alert` events when quality degrades.

**Single new file:** `src/evaluation/online-monitor.ts`

## Key Decisions

### 1. Trigger: Threshold + Tag Filter

- **Production sessions**: Score only sessions with >= 5 thoughts. Filters out trivial single-question interactions that don't produce meaningful quality signals.
- **Tagged sessions**: Always score sessions tagged with `eval`, `test`, or `experiment`, regardless of thought count.
- Both filters are zero-cost to check — trace-listener already captures `session.tags` and `sessionRun.thoughtCount` at `session:ended` time.

### 2. Scoring: LangSmith Round-Trip

- Fetch the completed parent run from LangSmith after `session:ended`.
- Pass it through the same 4 evaluators used in experiments (sessionQuality, memoryQuality, dgmFitness, reasoningCoherence).
- Scores are directly comparable between live monitoring and offline experiments.
- Latency is irrelevant — scoring is async, session is already over.
- LangSmith dependency is acceptable; circuit breaker handles outages.

### 3. Baselines: Cold Start with N Sessions

- Require 10+ scored sessions before enabling regression detection.
- No regression alerts until real baselines are established from accumulated data.
- Baselines stored as rolling mean + stddev per evaluator in LangSmith run feedback.
- Experiment runner thresholds (0.3-0.5) are NOT used as initial baselines — they're minimum acceptable floors, not expected performance.

### 4. Cost Tracking: Deferred

- `budget_exceeded` alert type exists in types but has no implementation.
- No meaningful cost signal to track: Anthropic API covered by max plan, LangSmith credits abundant.
- Wire in later if cost situation changes. Zero dead code shipped.

### 5. Persistence: LangSmith Only

- Scores stored as LangSmith run feedback/annotations on the parent session run.
- Query via LangSmith dashboard and API.
- No local `.eval/session-scores.jsonl` file to manage.
- Baseline computation happens by querying LangSmith for recent scored runs.

## Deliverables

### New File

| File | Purpose |
|------|---------|
| `src/evaluation/online-monitor.ts` | `OnlineMonitor` class — subscribes to `session:ended`, scores, detects regressions, emits alerts |

### Modified Files

| File | Change |
|------|--------|
| `src/evaluation/index.ts` | Export `OnlineMonitor`, add `initMonitoring()` factory |
| `src/evaluation/types.ts` | Add `MonitorConfig` interface if needed (threshold, minSessions, tags) |

### Test File

| File | Purpose |
|------|---------|
| `tests/unit/online-monitor.test.ts` | Unit tests with mock LangSmith client |

## Architecture

```
session:ended event
       │
       ▼
┌─ OnlineMonitor ───────────────────────────┐
│                                            │
│  1. Filter: >= 5 thoughts OR tagged?       │
│     └─ No → skip                           │
│     └─ Yes ↓                               │
│                                            │
│  2. Fetch: client.readRun(sessionRunId)    │
│     └─ Failed → circuit breaker, skip      │
│                                            │
│  3. Score: run all 4 evaluators            │
│     └─ Store as run feedback in LangSmith  │
│                                            │
│  4. Regression check (if >= 10 samples):   │
│     └─ Fetch recent scores from LangSmith  │
│     └─ Compute rolling mean + stddev       │
│     └─ Compare current vs baseline         │
│     └─ If regression detected:             │
│        emitMonitoringAlert({               │
│          type: "regression",               │
│          severity: "warning"|"critical",   │
│          metric, currentValue, threshold   │
│        })                                  │
│                                            │
│  5. Anomaly detection:                     │
│     └─ Score > 2 stddev from mean?         │
│     └─ Emit "anomaly" alert               │
└────────────────────────────────────────────┘
```

## What Already Exists

- `MonitoringAlert`, `AlertSeverity`, `AlertType` types in `types.ts`
- `monitoring:alert` event on ThoughtEmitter with `emitMonitoringAlert()` helper
- 4 evaluators ready to score any LangSmith Run
- Trace listener captures all session/thought data into LangSmith
- Circuit breaker pattern in trace-listener (reusable for monitor)
- `safeAsync` fire-and-forget pattern

## Open Questions

1. **Anomaly detection sensitivity**: Should we use 2 stddev or 3 stddev as the anomaly threshold? 2 stddev catches ~5% of sessions as anomalies, 3 stddev catches ~0.3%. Start with 2, tighten if noisy.
2. **Rolling window size**: How many recent sessions for baseline computation? 20? 50? Smaller window adapts faster but is noisier.
3. **Alert deduplication**: If 3 sessions in a row trigger regression, emit 3 alerts or suppress after the first? Probably suppress with a cooldown similar to the circuit breaker pattern.

## What This Does NOT Include

- Cost budget enforcement (deferred — no meaningful cost signal)
- Local score persistence (LangSmith only)
- Productivity metric baselines (separate concern from evaluator scores)
- Dashboard or UI (LangSmith dashboard serves this role)
