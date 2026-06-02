# 08 — thoughtbox_theseus

Stage: STAGE_2_CIPHER_LOADED (requires init + cipher)
Operations: init, visa, checkpoint, outcome, status, complete
Purpose: Friction-gated refactoring protocol — prevents scope creep and "refactoring fugue state"

---

## Test 1: Init Refactoring Session

**Goal:** Verify session initialization with scope boundary.

**Steps:**
1. Call `thoughtbox_theseus { operation: "init", scope: ["src/hub/hub-tool-handler.ts", "src/hub/hub-tool-schema.ts"], description: "Refactor hub tool handler" }`
2. Verify response includes `session_id`
3. Verify scope files are locked as the boundary

**Expected:** Session created with explicit file scope

---

## Test 2: Status Check

**Goal:** Verify status reporting.

**Steps:**
1. Init a session
2. Call `{ operation: "status" }`
3. Verify response includes: scope list, visa count, audit count, B counter

**Expected:** Current session state visible

---

## Test 3: Visa Request (Scope Expansion)

**Goal:** Verify requesting access to an out-of-scope file.

**Steps:**
1. Init session with scope ["src/hub/hub-tool-handler.ts"]
2. Call `{ operation: "visa", filePath: "src/hub/operations.ts", justification: "Need to update operation schemas" }`
3. Verify visa is granted or recorded
4. Check status — visa count should increase

**Expected:** Scope expansion tracked with justification

---

## Test 4: Checkpoint (Cassandra Audit)

**Goal:** Verify diff submission for adversarial review.

**Steps:**
1. Init session
2. Call `{ operation: "checkpoint", diffHash: "abc123", commitMessage: "refactor: extract schema", approved: true }`
3. Verify checkpoint recorded

**Expected:** Checkpoint passes Cassandra audit

---

## Test 5: Outcome Recording

**Goal:** Verify test result recording.

**Steps:**
1. Init session, submit checkpoint
2. Call `{ operation: "outcome", testsPassed: true, details: "All 22 hub tests pass" }`
3. Verify outcome recorded
4. Call with `testsPassed: false` — verify failure recorded

**Expected:** Test outcomes tracked per checkpoint

---

## Test 6: Complete Session

**Goal:** Verify session termination.

**Steps:**
1. Init session, do work (checkpoint + outcome)
2. Call `{ operation: "complete", terminalState: "complete", summary: "Refactoring finished" }`
3. Verify session is closed
4. Call status — verify no active session

**Expected:** Clean session termination

---

## Test 7: Complete with Audit Failure

**Goal:** Verify non-success terminal states.

**Steps:**
1. Init session
2. Call `{ operation: "complete", terminalState: "audit_failure", summary: "Cassandra found breaking change" }`
3. Verify session closed with failure state

**Expected:** Audit failure is a valid terminal state

---

## Test 8: Error — Operations Without Session

**Goal:** Verify session requirement enforcement.

**Steps:**
1. Without init, call `{ operation: "checkpoint", ... }`
2. Verify error requiring active session
3. Call `{ operation: "visa", ... }` — same error

**Expected:** Clear error: "No active session. Call init first."
