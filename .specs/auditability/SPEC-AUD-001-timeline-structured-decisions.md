# SPEC-AUD-001: Timeline — Structured Decision Frames

> **Status**: Draft
> **Priority**: CRITICAL (Auditability MVP)
> **Phase**: 3AM Auditability
> **Estimated Effort**: 3-5 hours
> **GitHub Issue**: #137
> **Source**: pain/3am-auditability.md — Thing #1

## Summary

The Observatory timeline must render `thoughtType`-tagged thoughts as structured visual cards instead of raw text blobs. Decision frames, action reports, belief snapshots, and assumption updates each get a distinct visual treatment so a sleep-deprived engineer can scan the timeline in under 60 seconds.

## Problem Statement

Currently, the Observatory renders all thoughts identically — as text blocks in a chronological list. Even with the operations mode producing structured content (DECISION/OPTIONS/SELECTED/etc.), the Observatory doesn't parse or distinguish them. At 3 AM, reading paragraphs of text to find the bad decision is unacceptable.

## Scope

### In Scope
- Observatory UI: parse `thoughtType` field and render distinct card types
- Observatory UI: decision_frame cards show options, selection, confidence as structured fields
- Observatory UI: action_report cards show success/failure badge, side effects, reversibility
- Observatory UI: belief_snapshot cards show entity state, constraints, risks
- Observatory UI: assumption_update cards show status change with visual indicator
- Observatory UI: link action_reports to their preceding decision_frames visually
- WebSocket events: ensure `thoughtType` is included in thought event payloads

### Out of Scope
- Filtering/querying by thoughtType (see SPEC-AUD-004)
- Blast radius visualization (see SPEC-AUD-004)
- Fault attribution (see SPEC-AUD-005)

## Requirements

### R1: WebSocket Event Payload

The Observatory WebSocket thought events must include `thoughtType`:

```typescript
interface ObservatoryThoughtEvent {
  type: 'thought';
  data: {
    thoughtNumber: number;
    thought: string;
    thoughtType?: 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update';
    // ... existing fields
  };
}
```

### R2: Decision Frame Card

When `thoughtType === 'decision_frame'`, parse the structured content and render:

| Field | Display |
|-------|---------|
| DECISION | Card title / header |
| OPTIONS | Bulleted list with the SELECTED option highlighted |
| SELECTION_RULE | Collapsed section (expandable) |
| CONFIDENCE | Badge: green (high), yellow (medium), red (low) |
| ASSUMPTIONS | Collapsed list |
| NEXT_EXPECTED | Italic text at bottom |

### R3: Action Report Card

When `thoughtType === 'action_report'`, render:

| Field | Display |
|-------|---------|
| ACTION | Card title with tool name |
| RESULT | Success (green) or Failure (red) badge |
| EXPECTED_VS_ACTUAL | Match (green) or Divergence (orange) indicator |
| SIDE_EFFECTS | Bulleted list |
| REVERSIBLE | Badge: yes (green), no (red), partial (yellow) |
| ASSUMPTION_UPDATE | Highlighted if non-"none" |

### R4: Visual Linking

Action report cards display a back-reference to their preceding decision frame (e.g., "Response to Decision #N"). Clicking navigates to that thought.

### R5: Belief Snapshot Card

When `thoughtType === 'belief_snapshot'`, render as a structured state summary with entity table, constraints list, and risk items color-coded by severity.

### R6: Assumption Update Card

When `thoughtType === 'assumption_update'`, render with a status change arrow (believed → refuted) and highlight DOWNSTREAM impacts.

## Files to Modify

| File | Change |
|------|--------|
| `src/observatory/ui/*.html` | Add card templates for each thoughtType |
| `src/observatory/index.ts` | Ensure thoughtType flows through WebSocket events |
| `src/observatory/reasoning.ts` | Include thoughtType in thought event payloads |

## Verification

1. Send thoughts with each thoughtType via operations mode
2. Verify Observatory renders distinct card types for each
3. Verify confidence badge colors match levels
4. Verify action report links back to decision frame
5. Verify thoughts without thoughtType render as before (backwards compatibility)

## Dependencies

- Operations mode (implemented on feat/auditability-mvp)
- `thoughtType` field on ThoughtData (implemented)
