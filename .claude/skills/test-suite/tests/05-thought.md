# 05 — thoughtbox_thought

Stage: STAGE_2_CIPHER_LOADED (requires init + cipher)
Single-operation tool — all parameters are top-level (no operation field)
thoughtTypes: reasoning, decision_frame, action_report, belief_snapshot, assumption_update, context_snapshot, progress

**Verification**: Always set `verbose: true` on calls that include structured payloads. The default response is just `{ thoughtNumber, sessionId }` — that proves nothing about payload processing. The verbose response includes the structured metadata mapping.

---

## Test 1: Basic Forward Thinking

**Goal:** Verify sequential thought progression.

**Steps:**
1. Call with thought 1 of 3, `thoughtType: "reasoning"`, `nextThoughtNeeded: true`, `verbose: true`
2. Verify response includes `thoughtNumber: 1`, `totalThoughts`, `nextThoughtNeeded: true`
3. Call thought 2 of 3 with `verbose: true`
4. Verify `thoughtNumber: 2`
5. Call thought 3 of 3 with `nextThoughtNeeded: false`
6. Verify session closes (`sessionClosed: true`, `exportPath` present)
7. Verify `auditManifest.thoughtCounts.total` equals 3

**Expected:** Clean 1→2→3 progression with session close at end

---

## Test 2: Backward Thinking (N→1)

**Goal:** Verify goal-driven reasoning where the agent starts numbering from a high number and counts down.

**Steps:**
1. Call with `thoughtNumber: 5`, `totalThoughts: 5`, `thoughtType: "reasoning"`, `nextThoughtNeeded: true`, `sessionTitle` and `sessionTags`
2. Verify `sessionId` returned (session auto-created)
3. Call with `thoughtNumber: 4`, then `thoughtNumber: 3`, then `thoughtNumber: 2`
4. Call with `thoughtNumber: 1`, `nextThoughtNeeded: false`
5. Verify each call returns the explicit `thoughtNumber` you submitted (not an auto-incremented one)
6. If the server ignores `thoughtNumber` and auto-increments, that is a **FAIL** — backward progression is not supported

**Expected:** Server respects explicit `thoughtNumber` values. If it always auto-increments, document this as a limitation.

**Verification note:** Compare the `thoughtNumber` in each response against the `thoughtNumber` you submitted. If they diverge, the server is overriding client-specified numbering.

---

## Test 3: Branching

**Goal:** Verify parallel exploration.

**Steps:**
1. Create thoughts 1-3 normally with `verbose: true`
2. Branch from thought 2: `branchFromThought: 2, branchId: "option-a"`, `verbose: true`
3. Verify verbose response includes `branchId: "option-a"` in the metadata mapping
4. Branch from thought 2: `branchFromThought: 2, branchId: "option-b"`, `verbose: true`
5. Verify verbose response includes `branchId: "option-b"`
6. Close session with `nextThoughtNeeded: false`
7. Verify `branches` array in close response contains `["option-a", "option-b"]`
8. **Cross-check:** Call `session_get` with the sessionId — verify `branches` object has both branch keys with their thoughts

**Expected:** Multiple branches tracked, visible in both close response and session retrieval

---

## Test 4: Revision

**Goal:** Verify updating previous thoughts.

**Steps:**
1. Create thoughts 1-3 with `verbose: true`
2. Create thought 4 with `isRevision: true, revisesThought: 2, verbose: true`
3. Verify verbose response includes revision metadata (e.g., `revisesThought: 2` echoed back, or revision chain info)
4. Close session, then call `session_export` with `format: "json"`
5. Find the revision thought in the nodes array — verify its `revisesNode` field points to thought 2
6. Verify thought 2's `revisionMetadata.revisedBy` includes the revision thought

**Expected:** Revision relationship verified through export, not just submission acceptance

---

## Test 5: Decision Frame

**Goal:** Verify decision_frame thoughtType with options.

**Steps:**
1. Call with `thoughtType: "decision_frame"`, `confidence: "medium"`, `options: [{ label: "Option A", selected: true, reason: "Best fit" }, { label: "Option B", selected: false, reason: "Too complex" }]`, `verbose: true`
2. Verify verbose response includes:
   - `thoughtType: "decision_frame"` in metadata
   - `confidence: "medium"` captured
   - `options` array with both options and their selected/reason values
3. If verbose response only contains `{ thoughtNumber, sessionId }`, the payload was NOT processed — mark as **FAIL**

**Expected:** Structured decision with options and confidence confirmed in verbose response

---

## Test 6: Action Report

**Goal:** Verify action_report thoughtType.

**Steps:**
1. Call with `thoughtType: "action_report"`, `actionResult: { success: true, reversible: "yes", tool: "Bash", target: "test.sh", sideEffects: ["created file"] }`, `verbose: true`
2. Verify verbose response includes:
   - `thoughtType: "action_report"` in metadata
   - `actionResult` with all fields: `success`, `reversible`, `tool`, `target`, `sideEffects`
3. If verbose response does not include `actionResult` fields, mark as **FAIL**

**Expected:** Tool action documented with reversibility and side effects confirmed in verbose response

---

## Test 7: Belief Snapshot

**Goal:** Verify belief_snapshot thoughtType.

**Steps:**
1. Call with `thoughtType: "belief_snapshot"`, `beliefs: { entities: [{ name: "API", state: "healthy" }], constraints: ["rate limited"], risks: ["timeout"] }`, `verbose: true`
2. Verify verbose response includes:
   - `thoughtType: "belief_snapshot"` in metadata
   - `beliefs` object with `entities`, `constraints`, `risks`
3. If verbose response does not include `beliefs`, mark as **FAIL**

**Expected:** Current belief state confirmed in verbose response

---

## Test 8: Assumption Update

**Goal:** Verify assumption_update thoughtType.

**Steps:**
1. Call with `thoughtType: "assumption_update"`, `assumptionChange: { text: "API is stable", oldStatus: "believed", newStatus: "refuted", trigger: "got 500 error" }`, `verbose: true`
2. Verify verbose response includes:
   - `thoughtType: "assumption_update"` in metadata
   - `assumptionChange` with `text`, `oldStatus`, `newStatus`, `trigger`
3. If verbose response does not include `assumptionChange` fields, mark as **FAIL**

**Expected:** Assumption transition tracked with trigger confirmed in verbose response

---

## Test 9: Progress Tracking

**Goal:** Verify progress thoughtType.

**Steps:**
1. Call with `thoughtType: "progress"`, `progressData: { task: "implement feature", status: "in_progress", note: "halfway done" }`, `verbose: true`
2. Verify verbose response includes:
   - `thoughtType: "progress"` in metadata
   - `progressData` with `task`, `status`, `note`
3. If verbose response does not include `progressData`, mark as **FAIL**

**Expected:** Task progress snapshot confirmed in verbose response

---

## Test 10: Dynamic Total Adjustment

**Goal:** Verify totalThoughts can change mid-stream.

**Steps:**
1. Start with thought 1, `totalThoughts: 5`, `verbose: true`
2. Verify response shows `totalThoughts: 5`
3. At thought 4, set `totalThoughts: 10`, `verbose: true`
4. Verify response shows `totalThoughts: 10` (not 5)
5. Continue to thought 10
6. Verify tool accepts the adjustment

**Expected:** Flexible estimation, not rigid planning

---

## Test 11: Guide Request

**Goal:** Verify on-demand patterns cookbook.

**Steps:**
1. Call with `includeGuide: true` on any thought
2. Verify response includes patterns cookbook content (may be in resource attachment or embedded text)
3. If response is just `{ thoughtNumber, sessionId }` with no guide content anywhere, mark as **FAIL**

**Expected:** Full cookbook available when requested

---

## Test 12: Session Auto-Export and Manifest Validation

**Goal:** Verify session exports on close with correct audit counts.

**Steps:**
1. Create a session with known thought types:
   - 2x `reasoning`
   - 1x `decision_frame` (with options)
   - 1x `action_report` (with actionResult)
   - 1x `progress` (with progressData)
2. Close with `nextThoughtNeeded: false`
3. Verify `sessionClosed: true` and `exportPath` present
4. **Validate audit manifest counts:**
   - `thoughtCounts.total` must equal 5
   - `thoughtCounts.reasoning` must equal 2
   - `thoughtCounts.decision_frame` must equal 1
   - `thoughtCounts.action_report` must equal 1
   - `thoughtCounts.progress` must equal 1
5. If any count doesn't match what you submitted, that's a **data loss bug** — mark as **FAIL**

**Expected:** Session auto-exports with accurate manifest reflecting exactly what was submitted

---

## Test 13: Multi-Agent Attribution

**Goal:** Verify agentId/agentName tagging.

**Steps:**
1. Call with `agentId: "agent-1", agentName: "Researcher"`, `verbose: true`
2. Verify verbose response includes `agentId: "agent-1"` and `agentName: "Researcher"` in metadata
3. Call without agentId, `verbose: true` — verify default attribution (no agentId or null)
4. **Cross-check:** Call `session_get` — verify the thought entry includes the agent attribution fields

**Expected:** Thoughts tagged with agent identity, verifiable through retrieval

---

## Test 14: Validation Errors

**Goal:** Verify input validation.

**Steps:**
1. Call without `thought` field — should error
2. Call without `nextThoughtNeeded` — should error
3. Call without `thoughtType` — should error

**Note:** These may be caught by the MCP schema layer before reaching the handler. If the client prevents the call entirely (tool won't execute without required fields), note as SKIP with explanation. If the call reaches the server and returns a validation error, that's a PASS.

**Expected:** Clear validation errors with required field names
