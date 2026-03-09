# ADR-010: Observatory Structured Rendering

**Status**: Accepted
**Date**: 2026-03-08
**Accepted**: 2026-03-08
**Deciders**: Thoughtbox development team

## Context

The Thoughtbox backend has rich structured thought data since SPEC-AUDIT-001/002/003:

- **7 thoughtTypes**: `reasoning`, `decision_frame`, `action_report`, `belief_snapshot`, `assumption_update`, `context_snapshot`, `progress`
- **Structured fields**: `confidence`, `options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData`, `progressData`
- **Query operations**: Filter by thoughtType, confidence level, generate audit manifests

The WebSocket `thought:added` events carry the full `Thought` object including all structured fields (verified: `emitThoughtAdded` in emitter.ts broadcasts the complete thought object via the reasoning channel).

The Observatory HTML UI ignores all of this. Every thought renders as a plain text block regardless of type. The `renderCommitDetail()` function in `observatory.html` constructs `mcpData` with only 5 fields, discarding thoughtType, confidence, actionResult, progressData, and all other structured data.

Additionally, the storage adapter (`toObservatoryThought()` in `storage-adapter.ts`) maps only 10 fields when loading historical sessions from disk, dropping all structured audit fields. This means even after a UI fix, historical sessions would still render as plain text without the adapter fix.

ADR-009 explicitly deferred UI rendering to this ADR. ADR-009's lesson about gateway passthrough (all three layers: handler, type cast, schema) applies here as a pattern to follow: verify data flows end-to-end before considering the work done.

A secondary gap: the Observatory ThoughtSchema is missing the `'progress'` thoughtType enum value and the `progressData` field, despite these being present in the persistence layer's ThoughtData type.

## Decision

Modify three files to display thoughtType-specific visual cards in the Observatory:

1. **`src/observatory/ui/observatory.html`** — Switch on `thoughtType` in `renderCommitDetail()` and session list rendering. Each type gets a distinct card: decision_frame shows confidence badges and options lists; action_report shows success/fail indicators and reversibility; progress shows status and task description. Add timestamp gap indicators between thoughts. Thoughts without `thoughtType` render as plain text (backward compatible).

2. **`src/observatory/storage-adapter.ts`** — Extend `toObservatoryThought()` to pass through `thoughtType`, `confidence`, `options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData`, and `progressData` from ThoughtData to Observatory Thought.

3. **`src/observatory/schemas/thought.ts`** — Add `'progress'` to the thoughtType enum and add `progressData` field to match the persistence layer's ThoughtData definition.

This is purely a rendering and data-passthrough change. No new backend APIs. No gateway changes. No new dependencies.

## Consequences

### Positive

- Observatory becomes demo-ready for auditability: structured decisions, actions, and progress are visible at a glance
- Historical sessions render with full structured data after the storage-adapter fix
- Foundation for SPEC-AUD-002 (branch visualization) and SPEC-AUD-005 (fault attribution) which build on top of card rendering
- Timestamp gap indicators surface session pacing without additional backend work

### Tradeoffs

- observatory.html grows in complexity (rendering logic for 7 card types + fallback)
- Must maintain backward compatibility: any thought without `thoughtType` must render as before
- Manual testing required for HTML UI changes (vitest covers the adapter and schema, not the HTML rendering)

### Follow-ups

- SPEC-AUD-002: Branch point visualization — structural rendering (lanes, fork lines, dots) already implemented in observatory.html. Remaining work is thoughtType-aware labels on branch points, which ADR-010's card rendering covers.
- SPEC-AUD-005: Fault attribution checklist (builds on action_report cards)
- tb-0yl: Knowledge graph extraction from sessions (independent track)

## Hypotheses

### Hypothesis 1: Structured fields reach the Observatory UI via WebSocket

**Prediction**: WebSocket `thought:added` events already include `thoughtType`, `confidence`, `actionResult`, `progressData`, and other structured fields from the Thought type. No backend changes needed for real-time rendering.

**Validation**: Phase 1 reading of emitter.ts and reasoning.ts confirmed the WebSocket broadcast uses the full Thought object. Phase 4 revealed that the `observatoryThought` object constructed in `thought-handler.ts:788` was missing all structured fields — they were never copied into the object that gets emitted. Fix: added `thoughtType`, `confidence`, `options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData` to the observatoryThought construction. After fix, MCP validation confirmed `decision_frame` thoughts arrive with all structured fields intact via `read_thoughts`.

**Outcome**: VALIDATED (Phase 4, with backend fix — prediction partially wrong: a backend change WAS needed in thought-handler.ts)

### Hypothesis 2: Historical sessions can include structured fields with a storage-adapter fix

**Prediction**: Adding `thoughtType`, `confidence`, and structured fields to `toObservatoryThought()` in storage-adapter.ts will make historical sessions render structured cards. The fields exist in ThoughtData on disk; the adapter currently drops them.

**Validation**: After fixing `toObservatoryThought()` to pass through all structured fields, queried historical session `ea5af1b2` ("Observatory Eval") via MCP `read_thoughts`. Thought #2 (`decision_frame`) returned `confidence: "medium"` and full `options` array. Thought #3 returned `thoughtType: "progress"`. All structured fields present.

**Outcome**: VALIDATED (Phase 4)

### Hypothesis 3: Timestamp gaps are computable client-side with no backend changes

**Prediction**: Each thought has an ISO 8601 timestamp. Computing time gaps between consecutive thoughts requires only client-side JavaScript subtraction. No new API endpoint or field needed.

**Validation**: Verified by reading ThoughtSchema (line 30: `timestamp: z.string().datetime()`).

**Outcome**: VALIDATED (Phase 1)

### Hypothesis 4: ThoughtType-specific card rendering requires only observatory.html changes

**Prediction**: Modifying `renderCommitDetail()` and the session list rendering in observatory.html to switch on `thoughtType` and display structured fields is sufficient for the MVP. The only other changes needed are in storage-adapter.ts (for historical sessions) and the ThoughtSchema (to add missing `progress` type and `progressData` field).

**Validation**: `renderStructuredCard` (observatory.html:1873) dispatches to 6 type-specific renderers: `renderDecisionCard` (1895), `renderActionCard` (1920), `renderProgressCard` (1947), `renderBeliefCard` (1964), `renderAssumptionCard` (1988), `renderContextCard` (2017). Called from main render path at line 2058. Additionally required a fix in `thought-handler.ts` (H1) — prediction was correct that observatory.html + storage-adapter + schema were the three files, but missed that the observatoryThought construction also needed updating.

**Outcome**: VALIDATED (Phase 4, with additional backend fix noted in H1)

## Spec

[SPEC-AUD-010: Observatory Structured Rendering](../../.specs/auditability/SPEC-AUD-010-observatory-structured-rendering.md)

## Links

- [ADR-009: Merge Auditability Experiments](../accepted/ADR-009-merge-auditability-experiments.md) (defers UI to this ADR)
- [ADR-003: Observability](../accepted/ADR-003-observability.md) (channel architecture)
- SPEC-AUDIT-001: thoughtType discriminated union (implemented)
- SPEC-AUDIT-002: query operations (implemented)
- SPEC-AUDIT-003: audit manifest (implemented)
- [SPEC-AUD-001: Timeline Structured Decisions](../../.specs/auditability/SPEC-AUD-001-timeline-structured-decisions.md) (unimplemented design doc)
- [SPEC-AUD-002: Branch Point Visualization](../../.specs/auditability/SPEC-AUD-002-branch-point-visualization.md) (follow-up)
- [SPEC-AUD-005: Fault Attribution](../../.specs/auditability/SPEC-AUD-005-session-context-fault-attribution.md) (follow-up)
- tb-0yl: Knowledge graph extraction (independent track)
- tb-925: This ADR's tracking bead
