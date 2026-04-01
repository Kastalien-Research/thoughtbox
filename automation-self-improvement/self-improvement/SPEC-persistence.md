# Persistence Specification: Improvement History

Status: Draft

---

## 1) Purpose

Persist improvement events and evaluation outcomes so that the system can
measure improvement over time and detect regressions.

---

## 2) Data Model

### 2.1 Improvement Event (Core)

Fields (from `ImprovementEvent`):
- timestamp
- iteration
- type
- phase
- cost
- success
- metadata

### 2.2 Derived Summaries

- Iteration summary (duration, total cost, pass/fail)
- Scorecard snapshot (see `SPEC-automation.md`)

---

## 3) Storage Options

### Option A: JSONL (MVP)
- Append-only log per run or per day.
- Easy to audit and export.
- Low operational complexity.

### Option B: SQLite (Scaling)
- Indexed queries for time-series and trend analysis.
- Supports aggregation and filtering.

**Recommendation**: JSONL first, SQLite after gating and scorecard stabilize.

---

## 4) Required Interfaces

```
recordImprovementEvent(event: ImprovementEvent): Promise<void>
listImprovementEvents(filter): Promise<ImprovementEvent[]>
summarizeImprovements(range): Promise<ImprovementSummary>
```

---

## 5) Wiring Requirements

- Subscribe to `ThoughtEmitter` "improvement:event".
- Persist events asynchronously and non-blocking.
- Never block SIL execution on persistence failures.

