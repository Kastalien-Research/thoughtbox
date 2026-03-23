# 03 — thoughtbox_execute

Purpose: Verify the JavaScript execution surface and the main `tb.*` SDK workflows.

---

## Test 1: Single Operation

**Goal:** Verify direct execution against `tb.session`.

**Steps:**
1. Call:
   ```js
   async () => await tb.session.list()
   ```

**Expected:** Returns a valid session-list response without error

---

## Test 2: Chained Workflow

**Goal:** Verify one execute call can chain multiple Thoughtbox operations.

**Steps:**
1. Call:
   ```js
   async () => {
     const thought = await tb.thought({
       thought: "Code Mode behavioral test",
       thoughtType: "reasoning",
       nextThoughtNeeded: true,
       sessionTitle: "Code Mode Behavioral Test"
     });
     const sessions = await tb.session.list();
     return { thought, sessions };
   }
   ```

**Expected:** Returns both `thought` and `sessions` in one response

---

## Test 3: Console Capture

**Goal:** Verify `console.log` output is captured in the response envelope.

**Steps:**
1. Call:
   ```js
   async () => {
     console.log("execute smoke test");
     return "ok";
   }
   ```

**Expected:**
- `result` is `"ok"`
- Logs contain `execute smoke test`

---

## Test 4: Legacy Namespace Absence

**Goal:** Verify legacy namespaces are not part of the Code Mode SDK contract.

**Steps:**
1. Call:
   ```js
   async () => ({
     hub: typeof tb.hub,
     init: typeof tb.init
   })
   ```

**Expected:**
- `hub === "undefined"`
- `init === "undefined"`

---

## Test 5: Syntax/Runtime Error Reporting

**Goal:** Verify execution errors surface clearly.

**Steps:**
1. Call code that throws:
   ```js
   async () => { throw new Error("boom") }
   ```

**Expected:**
- `result` is `null`
- `error` contains `boom`

---

## Test 6: Truncation Envelope

**Goal:** Verify oversized execute results are truncated instead of breaking the response.

**Steps:**
1. Call:
   ```js
   async () => ({ payload: "x".repeat(30000) })
   ```

**Expected:**
- `truncated === true`
- `result` contains a truncation marker
