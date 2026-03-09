# Implementation Prompt: SPEC-AUD-001 — Timeline Structured Decisions

You are implementing SPEC-AUD-001 for the Thoughtbox project. Your task is to make the Observatory UI render `thoughtType`-tagged thoughts as structured visual cards instead of raw text.

## Context

Thoughtbox is an MCP server for multi-agent reasoning. It has an Observatory UI (WebSocket-based, single-page HTML at `src/observatory/ui/observatory.html`, ~2078 lines) that displays reasoning sessions in real time. A new `thoughtType` field was added to ThoughtData with four values: `decision_frame`, `action_report`, `belief_snapshot`, `assumption_update`. This field flows through the persistence layer and the gateway read-path, but the Observatory does not yet know about it.

## What you must do

Complete these tasks in order. Do not skip steps.

### Step 1: Add thoughtType to the Observatory ThoughtSchema

Read `src/observatory/schemas/thought.ts`. The `ThoughtSchema` Zod object is missing `thoughtType`. Add it:

```typescript
thoughtType: z.enum(['decision_frame', 'action_report', 'belief_snapshot', 'assumption_update']).optional(),
```

### Step 2: Include thoughtType in WebSocket event payloads

Read `src/observatory/emitter.ts` and trace how thought events are emitted. Find where the thought data is constructed for emission and ensure `thoughtType` is included. The emitter uses the `Thought` type from `schemas/thought.ts`, so Step 1 should handle the type. Verify the actual emission code passes the field through.

Then read `src/observatory/channels/reasoning.ts` — this is the reasoning channel that forwards thought events. Ensure `thoughtType` is not stripped during forwarding.

### Step 3: Render distinct card types in the Observatory UI

Read `src/observatory/ui/observatory.html`. Find where thoughts are rendered (search for where `thoughtNumber` or `thought` content is displayed in the DOM). Modify the rendering to check `thoughtType` and apply distinct visual treatments:

- **decision_frame**: Parse the thought content for DECISION, OPTIONS, SELECTED, CONFIDENCE, ASSUMPTIONS, NEXT_EXPECTED lines. Render as a structured card with:
  - DECISION as the card header
  - OPTIONS as a bulleted list with SELECTED highlighted (bold or colored)
  - CONFIDENCE as a badge: green background for "high", yellow for "medium", red for "low"
  - ASSUMPTIONS and NEXT_EXPECTED as collapsible sections

- **action_report**: Parse for ACTION, RESULT, EXPECTED_VS_ACTUAL, SIDE_EFFECTS, REVERSIBLE, ASSUMPTION_UPDATE. Render with:
  - ACTION as header
  - RESULT as a success (green) or failure (red) badge
  - REVERSIBLE as a badge: green (yes), red (no), yellow (partial)

- **belief_snapshot**: Parse for ENTITIES, CONSTRAINTS, OPEN_QUESTIONS, RISKS, NEXT_EXPECTED. Render as a structured state summary.

- **assumption_update**: Parse for ASSUMPTION, NEW_STATUS, TRIGGER, DOWNSTREAM. Render with a status arrow (e.g., "believed → refuted") and highlight DOWNSTREAM.

- **No thoughtType (undefined)**: Render as before — plain text. This preserves backwards compatibility.

### Step 4: Add visual linking between action_reports and decision_frames

When rendering an `action_report`, find the most recent preceding `decision_frame` in the same session (by scanning backwards through displayed thoughts). Add a clickable back-reference: "Response to Decision #N". Clicking scrolls to that thought.

### Step 5: Parse structured content from thought text

Write a parser function that extracts key-value pairs from the structured text format used in operations mode thoughts. The format is:

```
KEY: value text
ANOTHER_KEY: more value text
- bullet item
- bullet item
```

This parser should handle multiline values (value continues until the next KEY: line or end of string).

## Files you will modify

1. `src/observatory/schemas/thought.ts` — Add thoughtType to ThoughtSchema
2. `src/observatory/emitter.ts` — Verify thoughtType flows through emission
3. `src/observatory/channels/reasoning.ts` — Verify thoughtType flows through channel
4. `src/observatory/ui/observatory.html` — Card rendering, parser, visual linking

## Files you must read first (do not skip)

1. `src/observatory/ui/observatory.html` — Understand current rendering before changing it
2. `src/observatory/schemas/thought.ts` — Current schema
3. `src/observatory/emitter.ts` — How events are emitted
4. `src/observatory/channels/reasoning.ts` — How events reach the UI
5. `src/persistence/types.ts` — The `thoughtType` field definition (lines 105-107)

## Constraints

- TypeScript strict mode, ES modules with `.js` extensions in imports
- The Observatory HTML is a single-file SPA — CSS, JS, and HTML are all in one file
- Do NOT add external dependencies
- Do NOT break rendering of existing thoughts without `thoughtType`
- The structured content parser must be lenient — partially structured thoughts should still render, just with less structure

## Verification

After implementation, verify by:
1. Running `npm run build:local` — must pass with no errors
2. Starting the server and opening Observatory at http://localhost:1729
3. Sending thoughts with each `thoughtType` value via the gateway
4. Confirming distinct visual cards render for each type
5. Confirming thoughts without `thoughtType` render as before

## Reference

Full spec: `.specs/auditability/SPEC-AUD-001-timeline-structured-decisions.md`
GitHub Issue: #137
Branch: `feat/auditability-mvp`
