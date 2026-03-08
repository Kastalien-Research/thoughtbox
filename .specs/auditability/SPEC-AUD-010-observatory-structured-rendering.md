# SPEC-AUD-010: Observatory Structured Rendering

**Status**: Draft
**ADR**: ADR-010
**Parent specs**: SPEC-AUDIT-001 (thoughtType union), SPEC-AUDIT-002 (query operations), SPEC-AUDIT-003 (audit manifest)

## Summary

Make the Observatory HTML UI render structured thoughtType data as visual cards instead of plain text. Fix the storage adapter to pass structured fields through for historical sessions. Add missing `progress` thoughtType to the Observatory schema.

## Scope

Three files change. No new backend APIs. No gateway changes.

### Change 1: observatory.html -- ThoughtType-Aware Card Rendering

**File**: `src/observatory/ui/observatory.html`

Modify `renderCommitDetail()` and the session list thought rendering to switch on `thought.thoughtType` and display type-specific cards.

#### Card designs by thoughtType

**`decision_frame`**
- Header: "Decision" label with confidence badge (high=green, medium=amber, low=red)
- Body: List of `options[]` with each option showing `label` and `reason`; the option with `selected: true` is visually highlighted (bold, checkmark, or distinct background)
- Thought text displayed below options

**`action_report`**
- Header: "Action" label with success/fail indicator (green checkmark or red X based on `actionResult.success`)
- Metadata row: `actionResult.tool` | `actionResult.target` | reversibility badge (`yes`=green, `partial`=amber, `no`=red)
- Side effects listed if present (`actionResult.sideEffects[]`)
- Thought text displayed below

**`progress`**
- Header: "Progress" label with status badge (`pending`=gray, `in_progress`=blue, `done`=green, `blocked`=red) based on `progressData.status`
- Body: Task description from `progressData.task`
- Note text from `progressData.note` if present
- Thought text displayed below

**`reasoning`**
- Header: "Reasoning" label (neutral color)
- Body: Thought text (same as current rendering but with the type label)

**`belief_snapshot`**
- Header: "Beliefs" label
- Body: Entity list from `beliefs.entities[]` showing `name: state`
- Constraints and risks listed if present
- Thought text displayed below

**`assumption_update`**
- Header: "Assumption Update" label
- Body: `assumptionChange.text` with status transition (`oldStatus` -> `newStatus`, color-coded by newStatus: believed=green, uncertain=amber, refuted=red)
- Trigger shown if present
- Downstream thought numbers listed if present

**`context_snapshot`**
- Header: "Context" label
- Body: Key-value display of available fields (toolsAvailable, modelId, constraints, dataSourcesAccessed)
- Thought text displayed below

**Fallback** (no `thoughtType` or unrecognized value)
- Render identically to current behavior: plain text block with thought content
- No regression for legacy sessions

#### Timestamp gap indicators

Between consecutive thoughts in a session detail view, compute the time difference. If the gap exceeds 5 minutes, insert a visual separator showing the human-readable duration (e.g., "15 min gap", "2 hr gap", "1 day gap").

Implementation: iterate the sorted thoughts array, compute `new Date(thoughts[i].timestamp) - new Date(thoughts[i-1].timestamp)` for each pair.

### Change 2: storage-adapter.ts -- Pass Through Structured Fields

**File**: `src/observatory/storage-adapter.ts`

Extend `toObservatoryThought()` (lines 35-48) to include all structured audit fields from ThoughtData.

Fields to add to the return object:
- `thoughtType` (required in ThoughtData, optional in Observatory ThoughtSchema)
- `confidence`
- `options`
- `actionResult`
- `beliefs`
- `assumptionChange`
- `contextData`
- `progressData` (requires ThoughtSchema update from Change 3)

The mapping is direct pass-through. Use conditional inclusion for optional fields (only add if present on ThoughtData). `thoughtType` is always present on ThoughtData so it maps directly.

### Change 3: observatory/schemas/thought.ts -- Add Missing Fields

**File**: `src/observatory/schemas/thought.ts`

Current state: ThoughtSchema includes `thoughtType`, `confidence`, `options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData` but has two gaps:

1. **`'progress'` enum value** -- The `thoughtType` enum on line 48 lists 6 values but omits `'progress'`. ThoughtData (persistence layer) has 7 values including `'progress'`. Add `'progress'` to the enum.

2. **`progressData` field** -- Add the schema matching ThoughtData's definition:
   ```typescript
   progressData: z.object({
     task: z.string(),
     status: z.enum(['pending', 'in_progress', 'done', 'blocked']),
     note: z.string().optional(),
   }).optional()
   ```

All structured fields remain optional in the Observatory schema to maintain backward compatibility with historical sessions that predate SPEC-AUDIT-001.

## Out of Scope

- Notebook visibility in Observatory
- New REST API endpoints
- Knowledge graph extraction (tb-0yl)
- Branch point visualization (SPEC-AUD-002)
- Fault attribution checklist (SPEC-AUD-005)
- Multi-agent attribution rendering (agentId, agentName)
- Content hash / Merkle chain visualization

## Acceptance Criteria

1. A thought with `thoughtType: "decision_frame"` renders with confidence badge and options list in the Observatory detail view.
2. A thought with `thoughtType: "action_report"` renders with success/fail indicator and reversibility badge.
3. A thought with `thoughtType: "progress"` renders with a progress indicator showing status and task description.
4. A historical session loaded from disk shows structured cards (not plain text), verifying the storage-adapter fix works end-to-end.
5. Thoughts without `thoughtType` (legacy sessions) render identically to current behavior. No regression.
6. Timestamp gaps > 5 minutes between consecutive thoughts show a visual gap indicator with human-readable duration.
7. All existing vitest tests continue to pass (`pnpm run test:unit`).

## Test Strategy

**Manual verification** (Observatory is an HTML UI):
- Create thoughts with each thoughtType via the MCP gateway, open Observatory, verify card rendering.
- Load a historical session predating SPEC-AUDIT-001, verify plain text fallback.
- Create a session with time gaps > 5 minutes between thoughts, verify gap indicators appear.

**Automated tests**:
- Unit test for `toObservatoryThought()` verifying all structured fields pass through.
- Unit test for ThoughtSchema validating a thought with `thoughtType: "progress"` and `progressData`.
- Existing test suite (384 tests) must pass unchanged.

## Dependencies

- SPEC-AUDIT-001 (thoughtType discriminated union) -- implemented
- SPEC-AUDIT-002 (query operations) -- implemented
- ADR-009 (gateway passthrough) -- accepted