# Implementation Prompt: SPEC-AUD-002 — Branch Point Visualization

You are implementing SPEC-AUD-002 for the Thoughtbox project. Your task is to make branch points visually prominent in the Observatory UI so an engineer can instantly see where an agent chose one path over another.

## Context

Thoughtbox supports branching: an agent can fork its reasoning at any thought using `branchFromThought` and `branchId`. The data is persisted and queryable. However, the Observatory UI treats branch points like any other thought — there's no visual distinction. For auditability, branch points are critical: they're where the agent made the wrong choice.

## What you must do

Complete these tasks in order. Do not skip steps.

### Step 1: Understand the current branch rendering

Read `src/observatory/ui/observatory.html` and find how branches are currently displayed. Search for "branch" in the HTML/JS. Understand how the UI currently handles `branchId` and `branchFromThought` fields.

Read `src/observatory/schemas/thought.ts` — the `BranchSchema` defines the branch data structure.

### Step 2: Identify branch origins in the thought stream

A thought is a branch origin if other thoughts reference it via `branchFromThought`. In the UI rendering code, after receiving all session thoughts, build an index: for each thought number, collect all branches that originate from it.

### Step 3: Add visual treatment for branch origin thoughts

When rendering a thought that is a branch origin:
- Add a fork icon (use Unicode: ⑂ or 🔀) next to the thought number
- Show a badge with the count of branches: "2 branches" or "3 branches"
- Add a distinct CSS class (e.g., `thought-branch-origin`) with a left border accent color (use orange or purple — something that stands out from the default blue)

### Step 4: Add branch comparison view

When the user clicks a branch origin thought, expand a comparison panel below it showing:
- The main chain continuation (the next thought on the main chain)
- Each alternative branch (first 2-3 thoughts of each branch)
- Each path is labeled with its `branchId`
- The taken path (main chain) has a solid border; alternatives have a dashed/dimmed border

### Step 5: Link decision_frames to branches

If a thought with `thoughtType === 'decision_frame'` is immediately followed by a branch point (the next thought has `branchFromThought` equal to a nearby thought number), draw a visual connector showing that the decision led to the branch. Use a dotted line or arrow between the decision card and the branch indicator.

This depends on SPEC-AUD-001 being implemented for the `decision_frame` card. If it's not implemented yet, add a TODO comment and skip this step.

### Step 6: Enhance get_structure response

Read `src/gateway/gateway-handler.ts` and find the `handleGetStructure` method. Ensure the response includes which thoughts are branch origins and how many branches each has, so the Observatory can render branch topology without loading full thought content.

## Files you will modify

1. `src/observatory/ui/observatory.html` — Branch origin styling, comparison view, click handler
2. `src/gateway/gateway-handler.ts` — get_structure branch origin metadata (if not already present)

## Files you must read first (do not skip)

1. `src/observatory/ui/observatory.html` — Current rendering code
2. `src/observatory/schemas/thought.ts` — ThoughtSchema and BranchSchema
3. `src/gateway/gateway-handler.ts` — Find `handleGetStructure` or `get_structure`
4. `src/persistence/types.ts` — ThoughtData and ThoughtNode interfaces

## Constraints

- TypeScript strict mode, ES modules with `.js` extensions in imports
- Do NOT break rendering of sessions without branches
- The comparison view should be collapsible — don't clutter the timeline by default
- Keep the UI single-file (observatory.html)

## Verification

After implementation:
1. `npm run build:local` passes
2. Create a session with branches using the thoughtbox gateway
3. Open Observatory — branch origin thoughts should have fork icons and branch count badges
4. Click a branch origin — comparison view expands showing main chain vs alternatives
5. Sessions without branches render exactly as before

## Reference

Full spec: `.specs/auditability/SPEC-AUD-002-branch-point-visualization.md`
GitHub Issue: #138
Branch: `feat/auditability-mvp`
Depends on: SPEC-AUD-001 (for decision_frame → branch linkage only)
