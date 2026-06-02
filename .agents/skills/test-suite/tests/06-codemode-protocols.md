# 06 — Protocols: Theseus and Ulysses via `tb.*`

Purpose: Verify full protocol lifecycles through the Code Mode execute surface.

---

## Test 1: Theseus — Init and Status

**Goal:** Verify refactoring session initialization and status.

**Steps:**
1. Call:
   ```js
   async () => {
     const init = await tb.theseus({ operation: "init", scope: ["src/code-mode/execute-tool.ts"], description: "Test 1: Theseus lifecycle" });
     const status = await tb.theseus({ operation: "status" });
     return { init, status };
   }
   ```
2. Verify `init.session_id` is present
3. Verify `status.session_id` matches `init.session_id`
4. Verify `status.scope` contains the init scope file

**Expected:** Session created with explicit file scope, status reflects it.

---

## Test 2: Theseus — Visa (Scope Expansion)

**Goal:** Verify requesting access to an out-of-scope file.

**Steps:**
1. Call:
   ```js
   async () => {
     await tb.theseus({ operation: "init", scope: ["src/code-mode/search-tool.ts"], description: "Test 2: Visa test" });
     const visa = await tb.theseus({ operation: "visa", filePath: "src/code-mode/execute-tool.ts", justification: "Need to update execute handler" });
     const status = await tb.theseus({ operation: "status" });
     return { visa, visaCount: status.visa_count };
   }
   ```
2. Verify visa was granted
3. Verify `visa_count` increased

**Expected:** Scope expansion tracked with justification.

---

## Test 3: Theseus — Checkpoint and Outcome

**Goal:** Verify diff submission and test result recording.

**Steps:**
1. Call:
   ```js
   async () => {
     await tb.theseus({ operation: "init", scope: ["src/test-file.ts"], description: "Test 3: Checkpoint" });
     const checkpoint = await tb.theseus({ operation: "checkpoint", diffHash: "abc123", commitMessage: "refactor: test checkpoint", approved: true });
     const outcome = await tb.theseus({ operation: "outcome", testsPassed: true, details: "All tests pass" });
     return { checkpoint, outcome };
   }
   ```
2. Verify checkpoint and outcome recorded

**Expected:** Checkpoint passes, outcome tracked.

---

## Test 4: Theseus — Complete Session

**Goal:** Verify clean session termination.

**Steps:**
1. Call:
   ```js
   async () => {
     await tb.theseus({ operation: "init", scope: ["src/test-file.ts"], description: "Test 4: Complete" });
     await tb.theseus({ operation: "checkpoint", diffHash: "def456", commitMessage: "refactor: complete test", approved: true });
     await tb.theseus({ operation: "outcome", testsPassed: true, details: "Pass" });
     const complete = await tb.theseus({ operation: "complete", terminalState: "complete", summary: "Refactoring finished" });
     const status = await tb.theseus({ operation: "status" });
     return { complete, statusAfter: status };
   }
   ```
2. Verify session is closed
3. Verify status shows no active session (or the completed one)

**Expected:** Clean session termination.

---

## Test 5: Ulysses — Init, Plan, Expected Outcome

**Goal:** Verify debugging session with expected outcome (no surprise).

**Steps:**
1. Call:
   ```js
   async () => {
     const init = await tb.ulysses({ operation: "init", problem: "Test 5: API returns 500", constraints: ["cannot restart production"] });
     const plan = await tb.ulysses({ operation: "plan", primary: "Check nginx logs", recovery: "Check journalctl if logs rotated", irreversible: false });
     const outcome = await tb.ulysses({ operation: "outcome", assessment: "expected", details: "Found 502 errors in nginx log" });
     const status = await tb.ulysses({ operation: "status" });
     return { init, plan, outcome, S: status.S };
   }
   ```
2. Verify `S === 0` (no surprise)

**Expected:** Expected outcomes don't increment surprise register.

---

## Test 6: Ulysses — Unexpected Outcomes and Reflection

**Goal:** Verify surprise handling and mandatory reflection at S=2.

**Steps:**
1. Call:
   ```js
   async () => {
     await tb.ulysses({ operation: "init", problem: "Test 6: Surprise handling", constraints: ["test"] });
     await tb.ulysses({ operation: "plan", primary: "Check logs", recovery: "Check backup", irreversible: false });
     await tb.ulysses({ operation: "outcome", assessment: "unexpected-unfavorable", severity: 1, details: "Logs empty" });
     const s1 = await tb.ulysses({ operation: "status" });
     await tb.ulysses({ operation: "plan", primary: "Check config", recovery: "Restart service", irreversible: false });
     await tb.ulysses({ operation: "outcome", assessment: "unexpected-unfavorable", severity: 1, details: "Config missing" });
     const s2 = await tb.ulysses({ operation: "status" });
     const reflect = await tb.ulysses({ operation: "reflect", hypothesis: "Logging was disabled by deploy", falsification: "Check deploy history" });
     const s3 = await tb.ulysses({ operation: "status" });
     return { s1: s1.consecutive_surprises, s2: s2.consecutive_surprises, s3: s3.consecutive_surprises, reflect };
   }
   ```
2. Verify `s1 === 1`, `s2 === 2`
3. Verify reflection was recorded
4. Verify `s3` resets (0 or lower than s2)

**Expected:** Reflection forces falsifiable hypothesis, resets surprise counter.

---

## Test 7: Ulysses — Complete with Resolution

**Goal:** Verify session termination.

**Steps:**
1. Call:
   ```js
   async () => {
     await tb.ulysses({ operation: "init", problem: "Test 7: Resolution", constraints: [] });
     await tb.ulysses({ operation: "plan", primary: "Fix the thing", recovery: "Revert", irreversible: false });
     await tb.ulysses({ operation: "outcome", assessment: "expected", details: "Fixed" });
     const complete = await tb.ulysses({ operation: "complete", terminalState: "resolved", summary: "Root cause found and fixed" });
     const status = await tb.ulysses({ operation: "status" });
     return { complete, statusAfter: status };
   }
   ```
2. Verify session closed
3. Verify status reflects no active session

**Expected:** Clean resolution with summary.

---

## Test 8: Observability — Health and Session Queries

**Goal:** Verify observability namespace operations.

**Steps:**
1. Call:
   ```js
   async () => {
     const health = await tb.observability({ operation: "health" });
     const sessions = await tb.observability({ operation: "sessions" });
     return { health, sessions };
   }
   ```
2. Verify health returns status
3. Verify sessions returns session data

**Expected:** Observability namespace reachable through execute, no raw tools needed.
