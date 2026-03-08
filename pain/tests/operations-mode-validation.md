# Operations Mode Validation Test

## Prerequisites

- Thoughtbox MCP server running (HTTP on port 1731 or stdio)
- Agent with access to `mcp__thoughtbox__thoughtbox` tool
- Agent with access to at least one tool that produces side effects (filesystem write, HTTP request, etc.)

## Test Procedure

### Test 1: Resource Template Resolution

Fetch the operations mode guide via the resource template:

```
GET thoughtbox://interleaved/operations
```

**Pass criteria:**
- Resource resolves without error
- Content includes "Operations Mode" in the title
- Content includes "Auditable Operations Loop" execution pattern
- Content includes all 5 phases: Tooling Inventory, Constraint Assessment, Strategy, Auditable Execution Loop, Session Summary
- Content mentions `thoughtType` field
- Content includes structured formats for: DECISION FRAME, ACTION REPORT, BELIEF CHECK, ASSUMPTION UPDATE

### Test 2: Decision Frame Thought

Record a thought with `thoughtType: "decision_frame"` and structured content:

```json
{
  "thought": "DECISION: Whether to create a test file to validate operations mode\nOPTIONS:\n- Create file at /tmp/thoughtbox-ops-test.txt\n- Create file at ./test-output.txt\nSELECTED: Create file at /tmp/thoughtbox-ops-test.txt\nSELECTION_RULE: /tmp/ is ephemeral and won't pollute the project directory\nEVIDENCE: /tmp/ exists on all POSIX systems and is cleaned on reboot\nCONFIDENCE: high — standard filesystem convention\nASSUMPTIONS: /tmp/ is writable by the current process\nNEXT_EXPECTED: File creation succeeds, file contains test content",
  "thoughtNumber": 1,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "thoughtType": "decision_frame",
  "sessionTitle": "operations-mode-validation"
}
```

**Pass criteria:**
- Thought is accepted and persisted (returns `{ thoughtNumber: 1, sessionId: "..." }`)
- No error about `thoughtType` field

### Test 3: External Action Execution

After recording the decision frame, the agent executes the action (creates the file). This happens OUTSIDE Thoughtbox — using the agent's filesystem tools.

### Test 4: Action Report Thought

Record a follow-up thought with `thoughtType: "action_report"`:

```json
{
  "thought": "ACTION: write_file → /tmp/thoughtbox-ops-test.txt (content: 'operations mode test')\nRESULT: success — file created, 20 bytes written\nEXPECTED_VS_ACTUAL: match — file creation succeeded as expected\nSIDE_EFFECTS: New file at /tmp/thoughtbox-ops-test.txt\nREVERSIBLE: yes — file can be deleted\nASSUMPTION_UPDATE: none — /tmp/ writable assumption confirmed",
  "thoughtNumber": 2,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "thoughtType": "action_report"
}
```

**Pass criteria:**
- Thought is accepted and persisted (returns `{ thoughtNumber: 2, sessionId: "..." }`)
- `thoughtType` field is preserved in storage

### Test 5: Belief Snapshot Thought

Record a belief snapshot:

```json
{
  "thought": "ENTITIES: test file at /tmp/thoughtbox-ops-test.txt (exists, 20 bytes)\nCONSTRAINTS: test must not modify project files\nOPEN_QUESTIONS: none\nRISKS: /tmp/ may be cleaned by OS before test completes (severity: low)\nNEXT_EXPECTED: file is readable and contains expected content",
  "thoughtNumber": 3,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "thoughtType": "belief_snapshot"
}
```

**Pass criteria:**
- Thought accepted and persisted

### Test 6: Assumption Update Thought

Simulate an assumption flip:

```json
{
  "thought": "ASSUMPTION: /tmp/ is writable by the current process\nNEW_STATUS: believed\nTRIGGER: File creation at /tmp/thoughtbox-ops-test.txt succeeded\nDOWNSTREAM: Decision in thought #1 depended on this assumption — no impact since assumption held",
  "thoughtNumber": 4,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "thoughtType": "assumption_update"
}
```

**Pass criteria:**
- Thought accepted and persisted

### Test 7: Session Retrieval with thoughtType Filtering

After all thoughts are recorded, retrieve the session and verify that `thoughtType` metadata is preserved on each thought. Use the session export or thought retrieval to inspect:

- Thought 1: `thoughtType: "decision_frame"`
- Thought 2: `thoughtType: "action_report"`
- Thought 3: `thoughtType: "belief_snapshot"`
- Thought 4: `thoughtType: "assumption_update"`

**Pass criteria:**
- All 4 thoughts have their `thoughtType` field preserved in storage
- Standard thoughts without `thoughtType` continue to work (backwards compatibility)

### Test 8: Mixed Chain — Standard + Operations Thoughts

Record a final thought WITHOUT `thoughtType` to verify backwards compatibility:

```json
{
  "thought": "Test complete. All operations mode thought types accepted and persisted correctly.",
  "thoughtNumber": 5,
  "totalThoughts": 5,
  "nextThoughtNeeded": false
}
```

**Pass criteria:**
- Thought accepted with `thoughtType: undefined` (or absent from JSON)
- Session contains 5 thoughts total, 4 with thoughtType, 1 without
- No errors or regressions

## Cleanup

Delete `/tmp/thoughtbox-ops-test.txt` after test completes.

## Summary Pass Criteria

| Test | What it validates |
|------|-------------------|
| 1 | Resource template resolves and contains operations mode guide |
| 2 | `thoughtType: "decision_frame"` accepted on ThoughtData |
| 3 | External action happens outside Thoughtbox (agent responsibility) |
| 4 | `thoughtType: "action_report"` accepted on ThoughtData |
| 5 | `thoughtType: "belief_snapshot"` accepted on ThoughtData |
| 6 | `thoughtType: "assumption_update"` accepted on ThoughtData |
| 7 | `thoughtType` field persisted and retrievable from storage |
| 8 | Backwards compatibility — thoughts without `thoughtType` still work |
