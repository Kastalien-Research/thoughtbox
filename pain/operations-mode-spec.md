# Spec: Operations Mode for Interleaved Thinking

## Context

Thoughtbox has an existing interleaved thinking system that guides agents through a reason→act→observe→integrate loop. It currently supports three modes: `research`, `analysis`, `development`. This spec adds a fourth mode: **`operations`** — designed for agents that take real-world actions (sending emails, calling APIs, modifying data) where auditability of decisions and actions is critical.

The operations mode produces thought chains that serve as an audit trail. When something goes wrong at 3 AM, an engineer opens the thought chain and can reconstruct: what the agent decided, why, what it did in the real world, and where it went wrong.

## What Changes

### 1. New mode in `InterleavedMode` type

**File**: `src/prompts/contents/interleaved-template.ts`

Add `"operations"` to the `InterleavedMode` union type (line 11):
```typescript
export type InterleavedMode = "research" | "analysis" | "development" | "operations";
```

### 2. New capability kind

**File**: `src/prompts/contents/interleaved-template.ts`

Add `"external_actions"` to the `CapabilityKind` type (line 16):
```typescript
export type CapabilityKind =
  | "thoughtbox_workspace"
  | "retrieval_search"
  | "code_repo"
  | "sandbox_execute"
  | "external_actions";
```

### 3. Operations mode config

**File**: `src/prompts/contents/interleaved-template.ts`

Add to `MODE_CONFIG` (after the `development` entry):
```typescript
operations: {
  mode: "operations",
  title: "Operations Mode",
  description: "For agents that take real-world actions (emails, API calls, data mutations) where auditability of decisions and consequences is critical",
  requiredCapabilities: ["thoughtbox_workspace", "external_actions"],
  optionalCapabilities: ["retrieval_search"],
  phases: [
    "Tooling Inventory - Identify all tools that produce external side effects",
    "Constraint Assessment - Identify irreversible actions and escalation boundaries",
    "Strategy in Thoughtbox - Plan the operation using structured decision frames",
    "Auditable Execution Loop - Alternate between decision, action, and report cycles",
    "Session Summary - Produce final status with action manifest and assumption state"
  ],
  notes: [
    "Every decision that leads to an external action MUST be recorded as a decision frame thought BEFORE the action is taken",
    "Every external action MUST be followed by an action report thought linking the result back to the decision",
    "Assumptions about external state must be declared explicitly and tracked for changes",
    "Belief snapshots are required before any irreversible action",
    "If an assumption flips, immediately record which prior decisions depended on it"
  ]
}
```

### 4. Operations mode guide generation

**File**: `src/prompts/contents/interleaved-template.ts`

Update `isValidMode` (line 106):
```typescript
export function isValidMode(mode: string): mode is InterleavedMode {
  return mode === "research" || mode === "analysis" || mode === "development" || mode === "operations";
}
```

Update `getModeUsageGuidance` to add operations case:
```typescript
case "operations":
  return "you need to take real-world actions (API calls, emails, data changes) where every decision and action must be auditable";
```

Update `getCapabilityDescription` to add external_actions case:
```typescript
case "external_actions":
  return "Ability to perform actions with real-world consequences (API calls, emails, data mutations)";
```

### 5. Operations-specific execution pattern

The generic execution pattern in `interleavedGuide()` (lines 146-155) works for other modes, but the operations mode needs a more specific loop. Override the execution pattern section for operations mode to output the following instead:

```
## Execution Pattern — Auditable Operations Loop

The operations execution loop has a strict structure. Every external action is bookended by a decision thought (before) and a report thought (after).

WHILE task not complete:
  1. DECISION FRAME (thoughtbox call)
     Record a thought with the following structure in the thought content:
     - DECISION: What decision is being made (one sentence)
     - OPTIONS: What options were considered (bulleted list)
     - SELECTED: Which option was chosen
     - SELECTION_RULE: Why this option over others (the reasoning)
     - EVIDENCE: What observations or data informed this decision
     - CONFIDENCE: How confident (high / medium / low) and why
     - ASSUMPTIONS: What assumptions this decision depends on
     - NEXT_EXPECTED: What you expect to observe after acting

  2. EXECUTE ACTION (external tool call)
     Perform the external action using the appropriate tool.

  3. ACTION REPORT (thoughtbox call)
     Record a thought with the following structure in the thought content:
     - ACTION: What was done (tool name, target, key parameters)
     - RESULT: What happened (success/failure, response summary)
     - EXPECTED_VS_ACTUAL: Did the result match NEXT_EXPECTED from the decision frame?
     - SIDE_EFFECTS: Any observable consequences (data changed, message sent, state modified)
     - REVERSIBLE: Can this action be undone? (yes/no/partial)
     - ASSUMPTION_UPDATE: Did any assumptions change? If so, which ones and what depends on them?

  4. BELIEF CHECK (if needed)
     If assumptions changed or results were unexpected, record a belief snapshot:
     - ENTITIES: Key objects and their current known state
     - CONSTRAINTS: What rules or limits are active
     - OPEN_QUESTIONS: What is unknown or uncertain
     - RISKS: What could go wrong from here
     - NEXT_EXPECTED: What you expect to observe next

  5. Return to step 1
END WHILE
```

### 6. Thought content schemas (guidance only, not enforced by code)

These are structured formats that the operations mode template tells the agent to use in the `thought` string field. They are NOT new fields on `ThoughtData`. The existing `thought: string` field carries all of this as structured text.

**Decision Frame** (`thoughtType: "decision_frame"`):
```
DECISION: <one sentence>
OPTIONS: 
- <option A>
- <option B>
SELECTED: <chosen option>
SELECTION_RULE: <why this one>
EVIDENCE: <what data informed this>
CONFIDENCE: <high|medium|low> — <calibration text>
ASSUMPTIONS: <what this depends on being true>
NEXT_EXPECTED: <what should happen after acting>
```

**Action Report** (`thoughtType: "action_report"`):
```
ACTION: <tool name> → <target> (<key params>)
RESULT: <success|failure> — <response summary>
EXPECTED_VS_ACTUAL: <match|divergence — details>
SIDE_EFFECTS: <what changed in the real world>
REVERSIBLE: <yes|no|partial>
ASSUMPTION_UPDATE: <none | assumption X flipped from believed to refuted, affects decisions D1, D2>
```

**Belief Snapshot** (`thoughtType: "belief_snapshot"`):
```
ENTITIES: <key objects and current state>
CONSTRAINTS: <active rules and limits>
OPEN_QUESTIONS: <unknowns>
RISKS: <what could go wrong, with severity>
NEXT_EXPECTED: <what the agent expects to observe next>
```

**Assumption Update** (`thoughtType: "assumption_update"`):
```
ASSUMPTION: <what was believed>
NEW_STATUS: <believed|uncertain|refuted>
TRIGGER: <what observation caused the change>
DOWNSTREAM: <which prior decisions depended on this assumption>
```

### 7. Response schema — no changes needed

The existing SIL-101 minimal response (`{ thoughtNumber, sessionId }`) is correct for operations mode. The agent doesn't need the full thought echoed back — it just recorded it. An acknowledgement with the thought number is sufficient to maintain chain continuity.

The verbose mode (`verbose: true`) can optionally include critique results if the agent requested autonomous critique on a decision frame thought.

### 8. `thoughtType` metadata field on ThoughtData

Add an optional `thoughtType` field to enable programmatic filtering of auditability-structured thoughts without parsing the text content.

**File**: `src/thought-handler.ts` (line ~37, after `verbose?: boolean`):
```typescript
// Operations mode: structured thought type for auditability filtering
thoughtType?: 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update';
```

**File**: `src/persistence/types.ts` (line ~104, after `timestamp: string`):
```typescript
/** Operations mode: structured thought type for programmatic filtering */
thoughtType?: 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update';
```

**File**: `src/thought-handler.ts` `validateThoughtData` method (add to the return object):
```typescript
thoughtType: data.thoughtType as string | undefined,
```

This field is:
- **Optional** — existing thoughts without it have `undefined`. Zero migration.
- **Backwards compatible** — the persistence layer saves ThoughtData as JSON, so the field is automatically included when present.
- **Useful for querying** — "show me all decision frames from this session" without parsing thought text. Foundation for the 3 AM incident view.

The operations mode template instructs the agent to set `thoughtType` when recording decision frames, action reports, belief snapshots, and assumption updates.

## What Does NOT Change

- **ThoughtHandler logic** — no new operations. Forward, branch, revise, and critique all work as-is.
- **Persistence layer** — no schema migration. New optional field is automatically persisted in JSON.
- **Observatory** — no changes in this spec. (Future work: operations-aware visualization.)
- **Server factory tool registration** — no new tools.
- **Assumption registry** (`.assumptions/`) — the existing file-based registry is separate from the in-thought assumption tracking. Future integration is possible but out of scope.

## Files to Modify

| File | Change |
|------|--------|
| `src/prompts/contents/interleaved-template.ts` | Add `operations` mode config, update type, add capability kind, update validators and description helpers, add operations-specific execution pattern |
| `src/thought-handler.ts` | Add optional `thoughtType` field to `ThoughtData` interface (~line 37), pass through in `validateThoughtData` |
| `src/persistence/types.ts` | Add optional `thoughtType` field to `ThoughtData` interface (~line 104) |
| `src/prompts/contents/interleaved-thinking-content.ts` | No changes — this is the prompt content, not the template |
| `src/server-factory.ts` | No changes — resource template resolves dynamically |

## Implementation Notes

- The operations mode execution pattern is longer than the generic one. The `interleavedGuide()` function should check for `mode === "operations"` and emit the specific auditable loop instead of the generic WHILE loop.
- The structured thought content formats (decision frame, action report, belief snapshot) are guidance, not validation. The thought handler accepts any string in the `thought` field. The structure is enforced by the template telling the agent what to produce, not by schema validation.
- This is intentional: we don't want to reject malformed thoughts. A partially structured thought is still more auditable than an unstructured one.

## Verification

After implementation, verify by accessing `thoughtbox://interleaved/operations` via the resource template and confirming:
1. The guide renders with all 5 phases
2. The execution pattern shows the decision→action→report loop
3. The structured content formats are documented in the guide
4. The mode appears in the capabilities/modes list

## Future Work (Out of Scope)

- Observatory visualization of decision frames, action reports, and belief snapshots as distinct visual elements
- Automated extraction of assumption flip events from thought chains
- Checkpoint/replay: caching tool outputs for deterministic replay
- Counterfactual spec generation from incident thought chains
- Integration with the existing `.assumptions/registry.jsonl` (bridging in-thought assumptions with the file-based registry)
- MCP Apps alignment for the Observatory UI
