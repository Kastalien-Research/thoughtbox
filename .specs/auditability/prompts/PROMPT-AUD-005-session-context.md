# Implementation Prompt: SPEC-AUD-005 — Session Context and Fault Attribution

You are implementing SPEC-AUD-005 for the Thoughtbox project. Your task is to surface session context alongside the reasoning chain in the Observatory and provide a fault attribution guide that helps engineers distinguish agent bugs, data bugs, and instruction bugs in under 30 seconds.

## Context

When something breaks at 3 AM, the engineer needs to answer: "Was it the agent's fault, the data's fault, or our fault (bad instructions)?" Currently, session context (what tools were available, what stage the session reached, what the agent was working with) is captured during init but not visible alongside the thought chain. This spec makes it visible and adds a guided fault attribution flow.

## What you must do

Complete these tasks in order. Do not skip steps.

### Step 1: Add session context panel to Observatory

Read `src/observatory/ui/observatory.html`. Add a persistent side panel or collapsible header that shows:
- Session title, tags, creation time, duration
- Agent identity: agentId, agentName (from thought metadata, if present)
- Thought count and branch count
- Session status (active / completed)

This data comes from the session events already emitted to the Observatory. Read `src/observatory/channels/reasoning.ts` to understand what session data is available.

### Step 2: Add tool inventory view

Read `src/tool-registry.ts`. Understand how progressive disclosure stages work:
- Stage 0: Entry (gateway only)
- Stage 1: Init (session management)  
- Stage 2: Active (thought, notebook, mental models, etc.)

Add a section in the context panel showing what stage the session reached and what tools were available at that stage. The tool registry tracks this. You may need to emit the current stage as part of session events, or derive it from the thought chain (if cipher was used → Stage 2, if init operations were called → Stage 1).

### Step 3: Update operations mode template for initial context capture

Read `src/prompts/contents/interleaved-template.ts`. In the operations mode config, Phase 1 is "Tooling Inventory" and Phase 2 is "Constraint Assessment." Update the operations execution pattern to explicitly instruct the agent to record its Phase 1 and Phase 2 results as `belief_snapshot` thoughts with `thoughtType: "belief_snapshot"`.

Add to the operations execution pattern text (in `getOperationsExecutionPattern()`), before the WHILE loop:

```
BEFORE THE EXECUTION LOOP:
  Record a belief_snapshot thought (thoughtType: "belief_snapshot") capturing:
  - ENTITIES: what systems, services, or data you are working with
  - CONSTRAINTS: what rules, limits, or policies you are operating under
  - Your understanding of the task instructions (summarized)
  - What tools you have available and any limitations
  This initial snapshot establishes the baseline for fault attribution.
```

### Step 4: Add fault attribution checklist to Observatory

In the Observatory UI, add a "Diagnose" button or tab that opens a guided checklist:

```
Step 1: INSTRUCTIONS CHECK
  ↳ View the initial belief_snapshot (first belief_snapshot thought in session)
  ↳ Did the agent understand its task correctly?
  ↳ Were the instructions ambiguous or wrong?
  → If yes: INSTRUCTION BUG [Select]

Step 2: DATA CHECK  
  ↳ View what data/observations the agent had
  ↳ Was the data correct and complete?
  ↳ Did the agent have access to information it needed?
  → If data was wrong/missing: DATA BUG [Select]

Step 3: REASONING CHECK
  ↳ View the decision_frames leading to the failure
  ↳ Given correct instructions and correct data, did the agent reason correctly?
  ↳ Check confidence levels — was it uncertain?
  → If reasoning was wrong: AGENT BUG [Select]
```

Each step should link to the relevant thoughts (belief_snapshots for Step 1, data-related thoughts for Step 2, decision_frames for Step 3).

### Step 5: Record fault attribution

When the engineer selects a fault type, record it as a session annotation. Store as a JSON object in the session directory or as a special thought:

```typescript
interface FaultAttribution {
  sessionId: string;
  faultType: 'agent_bug' | 'data_bug' | 'instruction_bug' | 'unknown';
  evidence: string;
  thoughtNumber: number;
  attributedBy: string;
  timestamp: string;
}
```

For the MVP, store this by calling the thoughtbox gateway with a special thought (the engineer can enter evidence text). The `attributedBy` can be a text input field.

## Files you will modify

1. `src/observatory/ui/observatory.html` — Context panel, tool inventory, fault attribution checklist
2. `src/prompts/contents/interleaved-template.ts` — Update operations execution pattern for initial context capture
3. `src/observatory/channels/reasoning.ts` — Verify session context data flows to UI
4. `src/tool-registry.ts` — Expose stage info for Observatory (if needed)

## Files you must read first (do not skip)

1. `src/observatory/ui/observatory.html` — Current layout and session display
2. `src/observatory/channels/reasoning.ts` — What session data reaches the UI
3. `src/tool-registry.ts` — Progressive disclosure stages and tool registration
4. `src/prompts/contents/interleaved-template.ts` — Operations mode execution pattern (the `getOperationsExecutionPattern()` function)
5. `src/persistence/types.ts` — Session interface

## Constraints

- TypeScript strict mode, ES modules with `.js` extensions in imports
- The fault attribution checklist should be simple HTML/JS — no framework
- Do NOT add external dependencies
- The initial context capture instruction is guidance in the template, not enforced by code
- Keep observatory.html as a single file

## Verification

After implementation:
1. `npm run build:local` passes
2. Start an operations mode session — verify the template instructs initial belief_snapshot
3. Open Observatory — verify session context panel displays
4. Click "Diagnose" — verify fault attribution checklist renders with clickable links
5. Select a fault type and enter evidence — verify it's recorded
6. Verify non-operations-mode sessions still render correctly (context panel shows what's available)

## Reference

Full spec: `.specs/auditability/SPEC-AUD-005-session-context-fault-attribution.md`
GitHub Issue: #141
Branch: `feat/auditability-mvp`
Depends on: SPEC-AUD-001 (belief_snapshot rendering), SPEC-AUD-003 (confidence trail for reasoning check)
