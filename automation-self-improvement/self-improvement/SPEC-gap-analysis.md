# Gap Analysis: Self-Improving Codebase

Status: Draft

---

## 1) Executive Gap Summary

We have the components of a self-improvement loop (SIL runner, evaluator,
behavioral tests, observability), but they are not connected into a persistent,
automated, enforceable feedback loop. This prevents measurable, continuous
improvement over time.

---

## 2) Gap Matrix (Needs vs. Have)

### 2.1 Improvement History Persistence

**Need**
- Persist all improvement events (timestamped, iteration-scoped).
- Query by time, iteration, success, cost, and evaluation results.

**Have**
- ImprovementTracker emits events only:
  `src/observatory/improvement-tracker.ts`
- No persistent store for `improvement:event`.
- Observatory stores sessions in-memory only:
  `src/observatory/channels/reasoning.ts`

**Gap**
- No authoritative historical record of improvements.
- No trend or regression analysis possible.

---

### 2.2 SIL Wiring to ImprovementTracker

**Need**
- Each SIL phase must emit tracker events.
- Iterations must be bounded with start/end events.

**Have**
- SIL orchestration exists:
  `scripts/agents/sil-010-main-loop-orchestrator.ts`
  `scripts/agents/run-improvement-loop.ts`
- ImprovementTracker exists but is not called by SIL.

**Gap**
- SIL phases are not captured in the improvement event stream.
- ImprovementTracker data is incomplete (only evaluation events via
  tiered evaluator).

---

### 2.3 Enforced Evaluation Gates

**Need**
- Deterministic and black-box checks must gate integration.
- Failing a gate blocks integration by default.

**Have**
- Tiered evaluator supports thresholds:
  `benchmarks/tiered-evaluator.ts`
  `benchmarks/suite.yaml`
- Behavioral contracts exist:
  `scripts/agents/behavioral-contracts.ts`

**Gap**
- No gating policy is enforced in SIL.
- Tests are optional and manual.

---

### 2.4 Scorecard for Improvement Over Time

**Need**
- A single, deterministic scorecard that measures improvement across runs.
- Required metrics: success rate, evaluation pass rates, regression count,
  cost per success.

**Have**
- SIL runner writes a JSON summary per run:
  `scripts/agents/run-improvement-loop.ts`
- No aggregation, no trend computation, no standard format.

**Gap**
- No consistent definition of "getting better."
- No historical comparison.

---

### 2.5 Automation and Scheduling

**Need**
- A scheduled, repeatable loop (daily/weekly).
- Budget limits and max-iteration enforcement.
- CI integration for gating.

**Have**
- CLI runner for SIL (manual invocation).
- No scheduled workflows in repo that run SIL.

**Gap**
- Improvement does not happen unless manually initiated.
- No continuous measurement cadence.

---

### 2.6 Observability of Improvements

**Need**
- Improvement events are visible in observatory channels.
- UI and API endpoints expose improvement trends.

**Have**
- Observatory channels only emit session and thought events:
  `src/observatory/channels/observatory.ts`
  `src/observatory/channels/reasoning.ts`
- `improvement:event` is defined in emitter but not surfaced in channels.

**Gap**
- Improvement events are invisible to observatory UI.
- No API surface for improvement history.

---

## 3) Concrete Missing Wires (File-Level)

1. **SIL → ImprovementTracker**
   - No calls to `improvementTracker.startIteration/track*/endIteration`
     in `scripts/agents/sil-010-main-loop-orchestrator.ts`.

2. **Improvement Events → Persistence**
   - No store attached to `ThoughtEmitter`’s `improvement:event` in
     `src/observatory/emitter.ts`.

3. **Improvement Events → Observatory Channels**
   - No `thoughtEmitter.on("improvement:event", ...)` in:
     - `src/observatory/channels/observatory.ts`
     - `src/observatory/channels/reasoning.ts`

4. **Evaluation Gates → Integration**
   - No gate enforcement in SIL runner or orchestrator.
   - Tiered evaluator and behavioral contracts are not required steps.

5. **Scorecard → Trend Reporting**
   - No aggregation or trend computation across run outputs.

---

## 4) Required Outputs to Close the Gap

### Minimum Viable Loop
- Persistent improvement history (JSONL or SQLite).
- SIL emits events for every phase.
- Tiered evaluator and behavioral contracts run automatically in SIL.
- Scorecard JSON computed and written per run.

### Measurable Improvement Over Time
- Historical trend API or reports.
- Regression detection and gating.
- Scheduled runs in CI or local automation.

