# SPEC-AUD-002: Branch Point — Visual Decision Nodes

> **Status**: Draft
> **Priority**: HIGH (Auditability MVP)
> **Phase**: 3AM Auditability
> **Estimated Effort**: 3-4 hours
> **GitHub Issue**: #138
> **Source**: pain/3am-auditability.md — Thing #2

## Summary

Branch points in the Observatory must be visually prominent decision nodes, not just another item in the chain. The engineer needs to see at a glance: where the agent chose path A over path B, what it considered, and what the rejected path looked like.

## Problem Statement

Branch points exist structurally (`branchFromThought`, `branchId`) but the Observatory treats them like any other thought. At 3 AM you're scanning for "where did it go wrong?" — the branch point is usually that moment, and it should visually jump out.

## Scope

### In Scope
- Observatory UI: distinct visual treatment for branch point thoughts (the thought with `branchFromThought`)
- Observatory UI: show the branching thought alongside the main chain thought it forked from
- Observatory UI: render rejected/unexplored branches as dimmed alternatives
- Observatory UI: link decision_frame thoughts to the branch they caused
- Observatory UI: click a branch to expand and see where it went

### Out of Scope
- Counterfactual analysis ("what would have happened") — future work
- Automated branch comparison — future work

## Requirements

### R1: Branch Point Visual Treatment

Thoughts that are branch origins (have nodes branching from them) get:
- A fork icon or visual indicator
- The number of branches emanating from them
- Color-coded: the taken path vs alternatives

### R2: Branch Comparison View

When a branch point is selected, show a side-by-side or stacked view:
- Left/top: the path that was taken (main chain continuation)
- Right/bottom: the alternative branch(es)
- Each path shows at minimum the first 2-3 thoughts so the divergence is visible

### R3: Decision Frame → Branch Linkage

If a `decision_frame` thought immediately precedes a branch, draw a visual connection:
- The decision frame shows OPTIONS
- The branch represents the SELECTED option
- Other branches (if they exist) represent alternatives

### R4: Branch Metadata in Topology

The `get_structure` operation response should include which thoughts are branch origins and how many branches emanate from each, so the Observatory can render the topology without loading all thought content.

## Files to Modify

| File | Change |
|------|--------|
| `src/observatory/ui/*.html` | Branch point visual components |
| `src/gateway/gateway-handler.ts` | Ensure get_structure includes branch origin metadata |
| `src/observatory/reasoning.ts` | Branch topology in session events |

## Verification

1. Create a session with branches via operations mode
2. Verify branch points are visually distinct in Observatory
3. Verify clicking a branch point shows comparison view
4. Verify decision_frame → branch visual link renders correctly
5. Verify sessions without branches render as before

## Dependencies

- Existing branching infrastructure (branchFromThought, branchId)
- get_structure operation (existing)
- SPEC-AUD-001 (for decision_frame rendering)
