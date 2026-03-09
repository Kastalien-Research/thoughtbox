# SPEC-AUD-004: External Actions — Action Log with Blast Radius

> **Status**: Draft
> **Priority**: CRITICAL (Auditability MVP)
> **Phase**: 3AM Auditability
> **Estimated Effort**: 5-8 hours
> **GitHub Issue**: #140
> **Source**: pain/3am-auditability.md — Thing #4 (identified as biggest gap)

## Summary

Add a dedicated Actions view in the Observatory and a query mechanism for filtering thoughts by `thoughtType`. This is the blast radius map: when you find the bad decision, you immediately see what downstream real-world actions it caused.

## Problem Statement

This is the biggest gap in Thoughtbox's auditability story. The system records what agents *think* but not what they *do* in the real world. Operations mode introduces `action_report` thoughts where agents report actions back, but there's no way to:
- Query "what real-world actions did this session produce?"
- See the blast radius of a bad decision
- Detect gaps where a decision was made but no action was reported back
- Get a reversibility summary

## Scope

### In Scope
- Observatory UI: Actions view listing all action_report thoughts with status
- Observatory UI: blast radius view (select a thought → see all downstream actions)
- Observatory UI: gap detection (decision_frame with no corresponding action_report)
- Observatory UI: reversibility summary (reversible/irreversible/partial counts)
- API: `read_thoughts` filter by `thoughtType`
- API: action manifest at session close

### Out of Scope
- Intercepting actual tool calls (Approach D: agent reports voluntarily)
- Automated action reversal
- Cross-session action correlation

## Requirements

### R1: thoughtType Filter on read_thoughts

Add optional `thoughtType` parameter to the `read_thoughts` operation:

```typescript
// In gateway operations.ts, read_thoughts inputSchema
thoughtType: {
  type: "string",
  enum: ["decision_frame", "action_report", "belief_snapshot", "assumption_update"],
  description: "Filter thoughts by type"
}
```

Implementation in `handleReadThoughts`:
```typescript
if (args.thoughtType) {
  thoughts = thoughts.filter(t => t.thoughtType === args.thoughtType);
}
```

### R2: Actions View

A dedicated Observatory tab/panel showing:
- All `action_report` thoughts in chronological order
- Each entry shows: ACTION (tool + target), RESULT (success/failure badge), REVERSIBLE badge
- Click to expand: full action report with EXPECTED_VS_ACTUAL, SIDE_EFFECTS, ASSUMPTION_UPDATE
- Back-link to the decision_frame that caused this action

### R3: Blast Radius View

Select any thought in the timeline. Show all downstream action_reports that are causally linked:
- Direct: decision_frame at thought N → action_report at thought N+2
- Transitive: decision_frame → belief change → new decision → action

For MVP, use sequential proximity: an action_report is linked to the most recent preceding decision_frame.

### R4: Gap Detection

Highlight decision_frame thoughts that are NOT followed by a corresponding action_report within a reasonable window (configurable, default: 3 thoughts). Display as a warning: "Decision made but no action reported."

This catches the leakiness problem in Approach D: if the agent decides to act but doesn't report back, the gap is visible.

### R5: Action Manifest

When a session closes (`nextThoughtNeeded: false`), generate a summary:

```typescript
interface ActionManifest {
  sessionId: string;
  totalActions: number;
  successful: number;
  failed: number;
  reversible: number;
  irreversible: number;
  unreported: number; // decision_frames without action_reports
  actions: Array<{
    thoughtNumber: number;
    action: string;
    result: 'success' | 'failure';
    reversible: 'yes' | 'no' | 'partial';
    decisionThought: number; // linked decision_frame
  }>;
}
```

### R6: Advertise in Discovery Schema

Add `thoughtType` to the `read_thoughts` operation in `gateway/operations.ts` inputSchema.

## Files to Modify

| File | Change |
|------|--------|
| `src/gateway/operations.ts` | Add thoughtType to read_thoughts inputSchema |
| `src/gateway/gateway-handler.ts` | Filter by thoughtType in handleReadThoughts |
| `src/observatory/ui/*.html` | Actions view, blast radius, gap detection |
| `src/observatory/reasoning.ts` | Action manifest generation |
| `src/thought-handler.ts` | Action manifest on session close |

## Verification

1. Send operations mode session with decision_frames and action_reports
2. Query `read_thoughts` with `thoughtType: "action_report"` — returns only action reports
3. Verify Actions view in Observatory shows all actions with correct badges
4. Verify blast radius view links actions to decisions
5. Create a decision_frame without a following action_report — verify gap detection fires
6. Close session — verify action manifest is generated

## Dependencies

- Operations mode (implemented)
- thoughtType field (implemented)
- SPEC-AUD-001 (card rendering for action_reports)
