# 05 — thoughtbox_thought

Stage: STAGE_2_CIPHER_LOADED (requires init + cipher)
Single-operation tool — all parameters are top-level (no operation field)
thoughtTypes: reasoning, decision_frame, action_report, belief_snapshot, assumption_update, context_snapshot, progress

---

## Test 1: Basic Forward Thinking

**Goal:** Verify sequential thought progression.

**Steps:**
1. Call with thought 1 of 3, `thoughtType: "reasoning"`, `nextThoughtNeeded: true`
2. Verify response includes thoughtNumber, totalThoughts, nextThoughtNeeded
3. Call thought 2 of 3
4. Call thought 3 of 3 with `nextThoughtNeeded: false`
5. Verify session closes (sessionClosed: true)

**Expected:** Clean 1→2→3 progression with session close at end

---

## Test 2: Backward Thinking (N→1)

**Goal:** Verify goal-driven reasoning.

**Steps:**
1. Start at thought 5 of 5 with `sessionTitle` and `sessionTags`
2. Verify `sessionId` returned (session auto-created)
3. Progress backward: 4, 3, 2, 1
4. End with `nextThoughtNeeded: false` at thought 1

**Expected:** Session auto-creates at first thought (5), backward progression accepted

---

## Test 3: Branching

**Goal:** Verify parallel exploration.

**Steps:**
1. Create thoughts 1-3 normally
2. Branch from thought 2: `branchFromThought: 2, branchId: "option-a"`, thoughtNumber 4
3. Branch from thought 2: `branchFromThought: 2, branchId: "option-b"`, thoughtNumber 4
4. Verify branches tracked in response
5. Create synthesis thought 5

**Expected:** Multiple branches tracked, can reference later

---

## Test 4: Revision

**Goal:** Verify updating previous thoughts.

**Steps:**
1. Create thoughts 1-3
2. Create thought 4 with `isRevision: true, revisesThought: 2`
3. Verify response acknowledges revision

**Expected:** Revision tracked, original thought number referenced

---

## Test 5: Decision Frame

**Goal:** Verify decision_frame thoughtType with options.

**Steps:**
1. Call with `thoughtType: "decision_frame"`, `confidence: "medium"`, `options: [{ label: "Option A", selected: true, reason: "Best fit" }, { label: "Option B", selected: false, reason: "Too complex" }]`
2. Verify response acknowledges the decision frame
3. Verify options are stored

**Expected:** Structured decision with options and confidence captured

---

## Test 6: Action Report

**Goal:** Verify action_report thoughtType.

**Steps:**
1. Call with `thoughtType: "action_report"`, `actionResult: { success: true, reversible: "yes", tool: "Bash", target: "test.sh", sideEffects: ["created file"] }`
2. Verify action result stored with all fields

**Expected:** Tool action documented with reversibility and side effects

---

## Test 7: Belief Snapshot

**Goal:** Verify belief_snapshot thoughtType.

**Steps:**
1. Call with `thoughtType: "belief_snapshot"`, `beliefs: { entities: [{ name: "API", state: "healthy" }], constraints: ["rate limited"], risks: ["timeout"] }`
2. Verify beliefs captured

**Expected:** Current belief state recorded

---

## Test 8: Assumption Update

**Goal:** Verify assumption_update thoughtType.

**Steps:**
1. Call with `thoughtType: "assumption_update"`, `assumptionChange: { text: "API is stable", oldStatus: "believed", newStatus: "refuted", trigger: "got 500 error" }`
2. Verify assumption state change recorded

**Expected:** Assumption transition tracked with trigger

---

## Test 9: Progress Tracking

**Goal:** Verify progress thoughtType.

**Steps:**
1. Call with `thoughtType: "progress"`, `progressData: { task: "implement feature", status: "in_progress", note: "halfway done" }`
2. Verify progress recorded

**Expected:** Task progress snapshot captured

---

## Test 10: Dynamic Total Adjustment

**Goal:** Verify totalThoughts can change mid-stream.

**Steps:**
1. Start with thought 1 of 5
2. At thought 4, set `totalThoughts: 10`
3. Continue to thought 10
4. Verify tool accepts the adjustment

**Expected:** Flexible estimation, not rigid planning

---

## Test 11: Guide Request

**Goal:** Verify on-demand patterns cookbook.

**Steps:**
1. Call with `includeGuide: true` on any thought
2. Verify patterns cookbook is embedded in response

**Expected:** Full cookbook available when requested

---

## Test 12: Session Auto-Export

**Goal:** Verify session exports on close.

**Steps:**
1. Create thoughts 1-3 with `nextThoughtNeeded: true`
2. Create thought 4 with `nextThoughtNeeded: false`
3. Check response for `sessionClosed` and `exportPath`

**Expected:** Session auto-exports when closed

---

## Test 13: Multi-Agent Attribution

**Goal:** Verify agentId/agentName tagging.

**Steps:**
1. Call with `agentId: "agent-1", agentName: "Researcher"`
2. Verify thought is attributed to the specified agent
3. Call without agentId — verify default attribution

**Expected:** Thoughts tagged with agent identity

---

## Test 14: Validation Errors

**Goal:** Verify input validation.

**Steps:**
1. Call without `thought` field — should error
2. Call without `nextThoughtNeeded` — should error
3. Call without `thoughtType` — should error

**Expected:** Clear validation errors with required field names
