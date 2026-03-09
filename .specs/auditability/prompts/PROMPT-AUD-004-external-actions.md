# Implementation Prompt: SPEC-AUD-004 — External Actions

You are implementing SPEC-AUD-004 for the Thoughtbox project. Your task is to add an Actions view to the Observatory, a `thoughtType` filter to the `read_thoughts` API, and gap detection for unreported actions.

## Context

Thoughtbox records what agents think but not what they do in the real world. The operations mode introduced `action_report` thoughts where agents voluntarily report actions (Approach D). This spec makes those action reports queryable and visible. It's the biggest gap in the auditability story — the blast radius map that shows "this decision caused this email to go out."

## What you must do

Complete these tasks in order. Do not skip steps.

### Step 1: Add thoughtType filter to read_thoughts API

Read `src/gateway/operations.ts`. Find the `read_thoughts` operation definition. Add `thoughtType` to its inputSchema properties:

```typescript
thoughtType: {
  type: "string",
  enum: ["decision_frame", "action_report", "belief_snapshot", "assumption_update"],
  description: "Filter thoughts by structured type. Returns only thoughts matching this type."
}
```

Then read `src/gateway/gateway-handler.ts`. Find the `handleReadThoughts` method. After thoughts are retrieved but before they're formatted, add filtering:

```typescript
if (args?.thoughtType) {
  thoughts = thoughts.filter(t => t.thoughtType === args.thoughtType);
}
```

### Step 2: Add Actions view to Observatory UI

Read `src/observatory/ui/observatory.html`. Add a new tab or panel called "Actions" that shows:
- All thoughts with `thoughtType === 'action_report'` from the current session
- Each entry displays: ACTION field (parsed from content), RESULT badge (green success / red failure), REVERSIBLE badge
- Click to expand: full action report content
- A back-link showing "Decision #N" linking to the preceding decision_frame

### Step 3: Implement blast radius view

When any thought in the timeline is selected, show a panel listing all downstream `action_report` thoughts. For the MVP, use sequential proximity: scan forward from the selected thought and collect all `action_report` thoughts until the next `decision_frame` (which starts a new decision-action cycle).

Display as: "This decision led to N actions: [list with success/failure badges]"

### Step 4: Implement gap detection

After rendering all thoughts, scan for `decision_frame` thoughts that are NOT followed by an `action_report` within the next 3 thoughts (configurable). For each gap, display a yellow warning badge on the decision_frame: "Decision made — no action reported."

This catches the leakiness in Approach D: the agent decided to act but didn't report back.

### Step 5: Generate action manifest on session close

Read `src/thought-handler.ts`. Find where session close is handled (search for `nextThoughtNeeded: false` or session export logic). When a session closes, generate an action manifest summary:

```typescript
interface ActionManifest {
  sessionId: string;
  totalActions: number;
  successful: number;
  failed: number;
  reversible: number;
  irreversible: number;
  unreported: number;
  actions: Array<{
    thoughtNumber: number;
    action: string;
    result: 'success' | 'failure';
    reversible: 'yes' | 'no' | 'partial';
    decisionThought: number;
  }>;
}
```

Parse the structured content from action_report thoughts to extract these fields. Store the manifest as part of the session export or as a separate JSON file in the session directory.

## Files you will modify

1. `src/gateway/operations.ts` — Add thoughtType to read_thoughts inputSchema
2. `src/gateway/gateway-handler.ts` — Filter by thoughtType in handleReadThoughts
3. `src/observatory/ui/observatory.html` — Actions tab, blast radius panel, gap detection badges
4. `src/thought-handler.ts` — Action manifest generation on session close

## Files you must read first (do not skip)

1. `src/gateway/operations.ts` — Current read_thoughts definition (around line 86-123)
2. `src/gateway/gateway-handler.ts` — handleReadThoughts method (search for "read_thoughts" or "handleReadThoughts")
3. `src/observatory/ui/observatory.html` — Current tab/panel structure
4. `src/thought-handler.ts` — Session close handling
5. `src/persistence/types.ts` — ThoughtData interface, SessionExport interface

## Constraints

- TypeScript strict mode, ES modules with `.js` extensions in imports
- The action manifest parser must be lenient — if an action_report has partial structure, extract what's available
- Do NOT add external dependencies
- The thoughtType filter must work alongside existing read_thoughts query modes (last N, range, branchId)
- Gap detection threshold (3 thoughts) should be a const, not hardcoded inline

## Verification

After implementation:
1. `npm run build:local` passes
2. Send an operations mode session with decision_frames and action_reports
3. Call `read_thoughts` with `thoughtType: "action_report"` — verify only action reports returned
4. Open Observatory — verify Actions tab shows all actions with correct badges
5. Select a thought — verify blast radius panel shows downstream actions
6. Send a decision_frame without a following action_report — verify gap warning appears
7. Close a session — verify action manifest is generated

## Reference

Full spec: `.specs/auditability/SPEC-AUD-004-external-actions.md`
GitHub Issue: #140
Branch: `feat/auditability-mvp`
Depends on: SPEC-AUD-001 (for content parsing utilities)
