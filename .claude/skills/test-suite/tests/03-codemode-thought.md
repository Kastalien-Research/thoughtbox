# 03 — Thought Workflows via `tb.thought()`

Purpose: Verify all thought types, branching, revision, session lifecycle, and data retrieval through the Code Mode execute surface. Every test creates real data and verifies it through retrieval.

**Verification**: Always pass `verbose: true` when testing structured payloads. The default response is just `{ thoughtNumber, sessionId }` — that proves nothing about payload processing.

---

## Test 1: Basic Forward Thinking (3 thoughts)

**Goal:** Verify sequential thought progression with session creation and close.

**Steps:**
1. Call:
   ```js
   async () => {
     const t1 = await tb.thought({ thought: "Test 1: Forward Thinking - Step 1", thoughtType: "reasoning", nextThoughtNeeded: true, totalThoughts: 3, sessionTitle: "Test 1: Forward Thinking", verbose: true });
     const t2 = await tb.thought({ thought: "Test 1: Forward Thinking - Step 2", thoughtType: "reasoning", nextThoughtNeeded: true, totalThoughts: 3, verbose: true });
     const t3 = await tb.thought({ thought: "Test 1: Forward Thinking - Step 3", thoughtType: "reasoning", nextThoughtNeeded: false, totalThoughts: 3, verbose: true });
     return { t1, t2, t3 };
   }
   ```
2. Verify `t1.thoughtNumber === 1`, `t2.thoughtNumber === 2`, `t3.thoughtNumber === 3`
3. Verify session was created (sessionId present in all three)

**Expected:** Clean 1→2→3 progression. Session created with title "Test 1: Forward Thinking".

---

## Test 2: Backward Thinking (5→1)

**Goal:** Verify goal-driven reasoning where the agent numbers from high to low.

**Steps:**
1. Call:
   ```js
   async () => {
     const results = [];
     for (let i = 5; i >= 1; i--) {
       const t = await tb.thought({
         thought: `Test 2: Backward Thinking - Step ${i}`,
         thoughtType: "reasoning",
         thoughtNumber: i,
         totalThoughts: 5,
         nextThoughtNeeded: i > 1,
         sessionTitle: "Test 2: Backward Thinking",
         verbose: true
       });
       results.push({ submitted: i, returned: t.thoughtNumber });
     }
     return results;
   }
   ```
2. Verify each returned `thoughtNumber` matches the submitted value

**Expected:** Server respects explicit thoughtNumber values. If it auto-increments, that is a **FAIL**.

---

## Test 3: Branching

**Goal:** Verify parallel exploration from a branch point.

**Steps:**
1. Call:
   ```js
   async () => {
     const t1 = await tb.thought({ thought: "Test 3: Main line 1", thoughtType: "reasoning", nextThoughtNeeded: true, totalThoughts: 3, sessionTitle: "Test 3: Branching", verbose: true });
     const t2 = await tb.thought({ thought: "Test 3: Main line 2", thoughtType: "reasoning", nextThoughtNeeded: true, verbose: true });
     const t3 = await tb.thought({ thought: "Test 3: Main line 3", thoughtType: "reasoning", nextThoughtNeeded: true, verbose: true });
     const branchA = await tb.thought({ thought: "Test 3: Branch A from thought 2", thoughtType: "reasoning", branchFromThought: 2, branchId: "option-a", nextThoughtNeeded: true, verbose: true });
     const branchB = await tb.thought({ thought: "Test 3: Branch B from thought 2", thoughtType: "reasoning", branchFromThought: 2, branchId: "option-b", nextThoughtNeeded: false, verbose: true });
     const session = await tb.session.get(t1.sessionId);
     return { t1, t2, t3, branchA, branchB, session };
   }
   ```
2. Verify `branchA` has `branchId: "option-a"` in response
3. Verify `branchB` has `branchId: "option-b"` in response
4. Verify `session.branches` contains both branch keys

**Expected:** Multiple branches tracked, visible in session retrieval.

---

## Test 4: Revision

**Goal:** Verify updating previous thoughts.

**Steps:**
1. Call:
   ```js
   async () => {
     const t1 = await tb.thought({ thought: "Test 4: Original thought 1", thoughtType: "reasoning", nextThoughtNeeded: true, totalThoughts: 4, sessionTitle: "Test 4: Revision", verbose: true });
     const t2 = await tb.thought({ thought: "Test 4: Original thought 2", thoughtType: "reasoning", nextThoughtNeeded: true, verbose: true });
     const t3 = await tb.thought({ thought: "Test 4: Original thought 3", thoughtType: "reasoning", nextThoughtNeeded: true, verbose: true });
     const revision = await tb.thought({ thought: "Test 4: Revised thought 2 — corrected", thoughtType: "reasoning", isRevision: true, revisesThought: 2, nextThoughtNeeded: false, verbose: true });
     const exported = await tb.session.export(t1.sessionId, "json");
     return { t1, t2, t3, revision, exported };
   }
   ```
2. Verify revision response includes revision metadata
3. Verify exported JSON shows revision relationship

**Expected:** Revision relationship verified through export.

---

## Test 5: Decision Frame

**Goal:** Verify decision_frame thoughtType with options.

**Steps:**
1. Call:
   ```js
   async () => await tb.thought({
     thought: "Test 5: Choosing between architectures",
     thoughtType: "decision_frame",
     confidence: "medium",
     options: [
       { label: "Option A: Monolith", selected: true, reason: "Simpler deployment" },
       { label: "Option B: Microservices", selected: false, reason: "Too complex for team size" }
     ],
     nextThoughtNeeded: false,
     sessionTitle: "Test 5: Decision Frame",
     verbose: true
   })
   ```
2. Verify response includes `thoughtType: "decision_frame"`
3. Verify `confidence: "medium"` captured
4. Verify `options` array with both entries

**Expected:** Structured decision with options confirmed in verbose response.

---

## Test 6: Action Report

**Goal:** Verify action_report thoughtType.

**Steps:**
1. Call:
   ```js
   async () => await tb.thought({
     thought: "Test 6: Ran database migration",
     thoughtType: "action_report",
     actionResult: { success: true, reversible: "yes", tool: "Bash", target: "migrate.sh", sideEffects: ["created 3 tables"] },
     nextThoughtNeeded: false,
     sessionTitle: "Test 6: Action Report",
     verbose: true
   })
   ```
2. Verify verbose response includes `actionResult` with all fields

**Expected:** Tool action documented with reversibility and side effects.

---

## Test 7: Belief Snapshot

**Goal:** Verify belief_snapshot thoughtType.

**Steps:**
1. Call:
   ```js
   async () => await tb.thought({
     thought: "Test 7: Current system beliefs",
     thoughtType: "belief_snapshot",
     beliefs: { entities: [{ name: "API", state: "healthy" }, { name: "Database", state: "degraded" }], constraints: ["rate limited"], risks: ["timeout under load"] },
     nextThoughtNeeded: false,
     sessionTitle: "Test 7: Belief Snapshot",
     verbose: true
   })
   ```
2. Verify verbose response includes `beliefs` with entities, constraints, risks

**Expected:** Current belief state confirmed.

---

## Test 8: Assumption Update

**Goal:** Verify assumption_update thoughtType.

**Steps:**
1. Call:
   ```js
   async () => await tb.thought({
     thought: "Test 8: API stability assumption changed",
     thoughtType: "assumption_update",
     assumptionChange: { text: "API is stable", oldStatus: "believed", newStatus: "refuted", trigger: "got 500 error on /health" },
     nextThoughtNeeded: false,
     sessionTitle: "Test 8: Assumption Update",
     verbose: true
   })
   ```
2. Verify verbose response includes `assumptionChange` with all fields

**Expected:** Assumption transition tracked with trigger.

---

## Test 9: Progress Tracking

**Goal:** Verify progress thoughtType.

**Steps:**
1. Call:
   ```js
   async () => await tb.thought({
     thought: "Test 9: Feature implementation status",
     thoughtType: "progress",
     progressData: { task: "implement OAuth 2.1", status: "in_progress", note: "token exchange working, consent page done" },
     nextThoughtNeeded: false,
     sessionTitle: "Test 9: Progress Tracking",
     verbose: true
   })
   ```
2. Verify verbose response includes `progressData` with task, status, note

**Expected:** Task progress snapshot confirmed.

---

## Test 10: Dynamic Total Adjustment

**Goal:** Verify totalThoughts can change mid-stream.

**Steps:**
1. Call:
   ```js
   async () => {
     const t1 = await tb.thought({ thought: "Test 10: Step 1", thoughtType: "reasoning", nextThoughtNeeded: true, totalThoughts: 3, sessionTitle: "Test 10: Dynamic Total", verbose: true });
     const t2 = await tb.thought({ thought: "Test 10: Step 2 - extending", thoughtType: "reasoning", nextThoughtNeeded: true, totalThoughts: 5, verbose: true });
     const t3 = await tb.thought({ thought: "Test 10: Step 3", thoughtType: "reasoning", nextThoughtNeeded: false, totalThoughts: 5, verbose: true });
     return { t1, t2, t3 };
   }
   ```
2. Verify t2 response shows `totalThoughts: 5` (not 3)

**Expected:** Flexible estimation, not rigid planning.

---

## Test 11: Session Auto-Export and Manifest

**Goal:** Verify session exports with correct audit counts for mixed thought types.

**Steps:**
1. Call:
   ```js
   async () => {
     const t1 = await tb.thought({ thought: "Test 11: Reasoning 1", thoughtType: "reasoning", nextThoughtNeeded: true, totalThoughts: 5, sessionTitle: "Test 11: Mixed Types Export", verbose: true });
     const t2 = await tb.thought({ thought: "Test 11: Reasoning 2", thoughtType: "reasoning", nextThoughtNeeded: true, verbose: true });
     const t3 = await tb.thought({ thought: "Test 11: Decision", thoughtType: "decision_frame", confidence: "high", options: [{ label: "Go", selected: true }], nextThoughtNeeded: true, verbose: true });
     const t4 = await tb.thought({ thought: "Test 11: Action", thoughtType: "action_report", actionResult: { success: true, reversible: "yes", tool: "Bash", target: "deploy.sh" }, nextThoughtNeeded: true, verbose: true });
     const t5 = await tb.thought({ thought: "Test 11: Progress", thoughtType: "progress", progressData: { task: "deploy", status: "done" }, nextThoughtNeeded: false, verbose: true });
     const session = await tb.session.get(t1.sessionId);
     return { t1, t2, t3, t4, t5, thoughtCount: session.session.thoughtCount };
   }
   ```
2. Verify `thoughtCount === 5`
3. Verify session contains all 5 thought types

**Expected:** Session has accurate count reflecting what was submitted.

---

## Test 12: Multi-Agent Attribution

**Goal:** Verify agentId/agentName tagging.

**Steps:**
1. Call:
   ```js
   async () => {
     const tagged = await tb.thought({ thought: "Test 12: Agent-attributed thought", thoughtType: "reasoning", agentId: "agent-1", agentName: "Researcher", nextThoughtNeeded: true, sessionTitle: "Test 12: Multi-Agent", verbose: true });
     const untagged = await tb.thought({ thought: "Test 12: Unattributed thought", thoughtType: "reasoning", nextThoughtNeeded: false, verbose: true });
     const session = await tb.session.get(tagged.sessionId);
     return { tagged, untagged, session };
   }
   ```
2. Verify tagged response includes `agentId` and `agentName`
3. Verify through session retrieval

**Expected:** Thoughts tagged with agent identity, verifiable through retrieval.

---

## Test 13: Console Capture

**Goal:** Verify `console.log` output is captured in the response envelope.

**Steps:**
1. Call:
   ```js
   async () => {
     console.log("test 13 smoke");
     return "ok";
   }
   ```

**Expected:**
- `result` is `"ok"`
- Logs contain `test 13 smoke`

---

## Test 14: Error Reporting

**Goal:** Verify execution errors surface clearly.

**Steps:**
1. Call:
   ```js
   async () => { throw new Error("test 14 boom") }
   ```

**Expected:**
- `result` is `null`
- `error` contains `test 14 boom`

---

## Test 15: Legacy Namespace Absence

**Goal:** Verify legacy namespaces are not part of the Code Mode SDK.

**Steps:**
1. Call:
   ```js
   async () => ({ hub: typeof tb.hub, init: typeof tb.init })
   ```

**Expected:**
- `hub === "undefined"`
- `init === "undefined"`
