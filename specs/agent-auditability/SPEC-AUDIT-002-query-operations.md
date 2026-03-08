# SPEC-AUDIT-002: Audit Query Operations

> **Status**: Draft
> **Priority**: HIGH (Auditability MVP)
> **Phase**: 3AM Auditability — Backend Data Layer
> **Source**: [pain/3am-auditability.md](../../pain/3am-auditability.md)
> **Depends on**: SPEC-AUDIT-001
> **Blocks**: SPEC-AUDIT-003

## Summary

Add filtering and analysis capabilities to make audit data queryable. Engineers debugging at 3 AM need to slice the thought chain by type and confidence without reading every thought. This spec adds `thoughtType` and `confidence` filters to `read_thoughts`, and an `audit_summary` analysis mode to `deep_analysis`.

## Problem Statement

After SPEC-AUDIT-001, every thought carries structured audit metadata. But the only way to access it is `read_thoughts` with `last: N` or `range` — sequential retrieval that forces the engineer to scan linearly. At 3 AM, the questions are targeted:

- "Show me all the decisions" -> filter by `thoughtType: "decision_frame"`
- "Show me the low-confidence decisions" -> filter by `confidence: "low"`
- "How many actions failed?" -> aggregate by `actionResult.success`
- "Did the agent override any critiques?" -> cross-reference critique metadata

These queries need first-class support, not post-hoc client-side filtering.

## Requirements

### R1: `thoughtType` Filter on `read_thoughts`

Add optional `thoughtType` parameter to the `read_thoughts` operation. When provided, only thoughts matching the specified type are returned.

**Input schema addition:**

```typescript
thoughtType: {
  type: "string",
  enum: ["reasoning", "decision_frame", "action_report", "belief_snapshot", "assumption_update"],
  description: "Filter thoughts by type. Returns only thoughts matching this type."
}
```

**Behavior:**

- `{ thoughtType: "decision_frame" }` — return all decision frames in the session
- `{ thoughtType: "action_report", last: 3 }` — return the last 3 action reports
- `{ thoughtType: "decision_frame", range: [10, 20] }` — return decision frames in thought range 10-20
- Combinable with existing `last`, `range`, `branchId` parameters
- Filter is applied after range/last slicing (filter the slice, not slice the filtered results)

**Response includes filter metadata:**

```json
{
  "sessionId": "abc-123",
  "query": "decision_frame thoughts in range 10-20",
  "filter": { "thoughtType": "decision_frame" },
  "count": 3,
  "totalUnfiltered": 11,
  "thoughts": [...]
}
```

### R2: `confidence` Filter on `read_thoughts`

Add optional `confidence` parameter to filter decision frames by confidence level.

**Input schema addition:**

```typescript
confidence: {
  type: "string",
  enum: ["high", "medium", "low"],
  description: "Filter by confidence level. Only applies to decision_frame thoughts. Implicitly sets thoughtType to decision_frame."
}
```

**Behavior:**

- `{ confidence: "low" }` — return all low-confidence decision frames
- Implicitly sets `thoughtType: "decision_frame"` (confidence only exists on decision frames)
- If `thoughtType` is explicitly set to something other than `decision_frame`, return an error
- Combinable with `last`, `range`, `branchId`

### R3: `audit_summary` Analysis Type in `deep_analysis`

Add a new `audit_summary` analysis type to the existing `deep_analysis` operation. This provides an aggregate view of the session's audit data.

**Input schema update:**

Add `"audit_summary"` to the `analysisType` enum in the `deep_analysis` operation.

**Output structure:**

```typescript
interface AuditSummaryAnalysis {
  sessionId: string;
  analysisType: "audit_summary";
  timestamp: string;

  thoughtCounts: {
    total: number;
    reasoning: number;
    decision_frame: number;
    action_report: number;
    belief_snapshot: number;
    assumption_update: number;
  };

  decisions: {
    total: number;
    byConfidence: {
      high: number;
      medium: number;
      low: number;
    };
  };

  actions: {
    total: number;
    successful: number;
    failed: number;
    reversible: number;
    irreversible: number;
    partiallyReversible: number;
  };

  assumptions: {
    totalUpdates: number;
    flips: number;  // transitions from "believed" to "refuted" or vice versa
    currentlyRefuted: number;
  };

  gaps: Array<{
    type: "decision_without_action" | "critique_override";
    thoughtNumber: number;
    description: string;
  }>;

  critiques: {
    generated: number;
    addressed: number;
    overridden: number;
  };
}
```

### R3a: Gap Detection — Decision Without Action

Detect `decision_frame` thoughts that are not followed by an `action_report` within the next N thoughts (default N=5). These represent decisions that were made but never acted on — potential confusion points.

**Gap entry:**

```json
{
  "type": "decision_without_action",
  "thoughtNumber": 12,
  "description": "Decision frame at thought #12 has no following action_report within 5 thoughts"
}
```

### R3b: Gap Detection — Critique Override

Detect thoughts that have a `critique` field (from sampling-based autonomous critique) where the immediately following thought does not reference or address the critique. This identifies cases where the agent received feedback and ignored it.

**Detection logic:**

1. Find thoughts with non-null `critique.text`
2. Check the next thought's `thought` prose for any reference to the critique content (substring match on key terms is sufficient — this is a heuristic, not an exact match)
3. If no reference found, flag as a critique override

**Gap entry:**

```json
{
  "type": "critique_override",
  "thoughtNumber": 15,
  "description": "Thought #15 received critique but thought #16 does not address it"
}
```

## Files to Modify

### `src/gateway/operations.ts`

1. Update `read_thoughts` `inputSchema` to add `thoughtType` and `confidence` properties
2. Add `"audit_summary"` to the `deep_analysis` `analysisType` enum

### `src/gateway/gateway-handler.ts`

1. **`handleReadThoughts`**: Add filter logic
   - After retrieving thoughts (via storage), apply `thoughtType` filter
   - Apply `confidence` filter (requires checking `confidence` field on decision frames)
   - Include `filter` and `totalUnfiltered` in response
   - Handle the `confidence` + non-`decision_frame` `thoughtType` conflict

2. **`handleDeepAnalysis`**: Add `audit_summary` branch
   - Fetch all thoughts for the session
   - Count by `thoughtType`
   - Aggregate decision confidence levels
   - Aggregate action results (success/failure, reversibility)
   - Count assumption flips (oldStatus -> newStatus transitions)
   - Run gap detection: decisions without actions, critique overrides
   - Count critiques: total generated, addressed (next thought references critique), overridden

## Verification

### Unit Tests — `read_thoughts` Filters

1. **Filter by thoughtType**: Submit 5 thoughts (2 decision_frame, 2 action_report, 1 reasoning). Filter by `decision_frame`. Verify only 2 returned.
2. **Filter + last**: Submit 10 thoughts. Filter by `action_report` with `last: 2`. Verify returns last 2 action reports.
3. **Filter + range**: Submit 10 thoughts. Filter by `belief_snapshot` with `range: [3, 8]`. Verify only belief snapshots within range.
4. **Confidence filter**: Submit 3 decision frames (high, medium, low confidence). Filter by `confidence: "low"`. Verify only the low-confidence decision returned.
5. **Confidence conflict**: Set `thoughtType: "action_report"` and `confidence: "low"`. Expect validation error.
6. **Empty result**: Filter by type that has no matches. Verify returns empty array with `count: 0`.

### Unit Tests — `audit_summary`

1. **Thought counts**: Submit mixed-type thoughts. Run `audit_summary`. Verify counts per type.
2. **Decision aggregation**: Submit decision frames at each confidence level. Verify `byConfidence` counts.
3. **Action aggregation**: Submit action reports with various success/reversibility. Verify aggregation.
4. **Gap detection — decision without action**: Submit a decision frame followed by 6 reasoning thoughts (no action report). Verify gap detected.
5. **Gap detection — no false positive**: Submit a decision frame followed by an action report within 3 thoughts. Verify no gap flagged.
6. **Critique override detection**: Submit a thought with critique, followed by a thought that ignores it. Verify override flagged.
7. **Assumption flip count**: Submit assumption updates transitioning from believed to refuted. Verify flip counted.

### Integration Test

1. Submit a full audit session:
   - `belief_snapshot` (initial state)
   - `decision_frame` (low confidence)
   - `action_report` (success, reversible)
   - `assumption_update` (believed -> refuted)
   - `decision_frame` (high confidence, with critique)
   - `reasoning` (ignores critique)
   - `action_report` (failure, irreversible)
2. Query `read_thoughts` with `thoughtType: "decision_frame"` — verify 2 results
3. Query `read_thoughts` with `confidence: "low"` — verify 1 result
4. Run `deep_analysis` with `analysisType: "audit_summary"` — verify all counts, gaps, and critique data
