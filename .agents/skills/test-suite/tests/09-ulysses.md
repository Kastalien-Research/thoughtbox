# 09 — thoughtbox_ulysses

Stage: STAGE_2_CIPHER_LOADED (requires init + cipher)
Operations: init, plan, outcome, reflect, status, complete
Purpose: Surprise-gated debugging protocol — forces pre-committed recovery plans and escalation on consecutive surprises

---

## Test 1: Init Debugging Session

**Goal:** Verify session initialization with problem statement.

**Steps:**
1. Call `thoughtbox_ulysses { operation: "init", problem: "API returns 500 on /health endpoint", constraints: ["cannot restart production", "must preserve logs"] }`
2. Verify response includes `session_id`
3. Verify problem and constraints recorded

**Expected:** Debugging session created with problem context

---

## Test 2: Plan an Action

**Goal:** Verify pre-committed recovery planning.

**Steps:**
1. Init session
2. Call `{ operation: "plan", primary: "Check nginx logs for upstream errors", recovery: "If logs are rotated, check journalctl instead", irreversible: false }`
3. Verify plan recorded with primary action and recovery step

**Expected:** Action plan captured before execution

---

## Test 3: Expected Outcome

**Goal:** Verify recording an expected result.

**Steps:**
1. Init session, plan an action
2. Call `{ operation: "outcome", assessment: "expected", details: "Found 502 errors in nginx access log" }`
3. Verify S (surprise) register unchanged
4. Check status — S should be 0

**Expected:** Expected outcomes don't increment surprise register

---

## Test 4: Unexpected Outcome (Favorable)

**Goal:** Verify favorable surprise handling.

**Steps:**
1. Plan and execute an action
2. Call `{ operation: "outcome", assessment: "unexpected-favorable", severity: 1, details: "Found the root cause immediately" }`
3. Verify S register incremented but no reflection required

**Expected:** Favorable surprises are noted but don't force reflection

---

## Test 5: Unexpected Outcome (Unfavorable)

**Goal:** Verify unfavorable surprise handling.

**Steps:**
1. Plan and execute an action
2. Call `{ operation: "outcome", assessment: "unexpected-unfavorable", severity: 1, details: "Logs are empty — logging was disabled" }`
3. Verify S register incremented

**Expected:** Unfavorable surprises increment S register

---

## Test 6: Reflect (Required at S=2)

**Goal:** Verify mandatory reflection after consecutive surprises.

**Steps:**
1. Record two consecutive unexpected-unfavorable outcomes (S reaches 2)
2. Verify system indicates reflection is required
3. Call `{ operation: "reflect", hypothesis: "Logging was disabled by a recent deploy", falsification: "Check deploy history for config changes in last 24h" }`
4. Verify reflection recorded, S register resets

**Expected:** Reflection forces falsifiable hypothesis before continuing

---

## Test 7: Status Check

**Goal:** Verify status reporting.

**Steps:**
1. Init session, do some work
2. Call `{ operation: "status" }`
3. Verify response includes: S register value, active step, session state

**Expected:** Current debugging state visible

---

## Test 8: Complete — Resolved

**Goal:** Verify successful session termination.

**Steps:**
1. Complete a debugging session
2. Call `{ operation: "complete", terminalState: "resolved", summary: "Root cause: stale config after deploy. Fix: restart with correct env vars." }`
3. Verify session closed

**Expected:** Clean resolution with summary

---

## Test 9: Complete — Insufficient Information

**Goal:** Verify giving up gracefully.

**Steps:**
1. Call `{ operation: "complete", terminalState: "insufficient_information", summary: "Cannot reproduce in staging. Need production access." }`
2. Verify session closed with this state

**Expected:** Honest acknowledgment of limits

---

## Test 10: Complete — Environment Compromised

**Goal:** Verify environment compromise detection.

**Steps:**
1. Call `{ operation: "complete", terminalState: "environment_compromised", summary: "Test environment state is corrupted, results unreliable" }`
2. Verify session closed

**Expected:** Environment compromise is a valid terminal state

---

## Test 11: Error — Operations Without Session

**Goal:** Verify session requirement enforcement.

**Steps:**
1. Without init, call `{ operation: "plan", ... }`
2. Verify error requiring active session

**Expected:** Clear error: "No active session. Call init first."
