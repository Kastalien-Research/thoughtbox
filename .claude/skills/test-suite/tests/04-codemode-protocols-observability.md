# 04 — Protocols and Observability via `tb.*`

Purpose: Verify protocol and observability capabilities remain reachable through the Code Mode execute surface.

---

## Test 1: Theseus Init

**Goal:** Verify `tb.theseus` can initialize a refactoring session.

**Steps:**
1. Call:
   ```js
   async () => await tb.theseus({
     operation: "init",
     scope: ["src/code-mode/execute-tool.ts"],
     description: "Exercise Code Mode protocol surface"
   })
   ```

**Expected:** Returns a `session_id`

---

## Test 2: Theseus Status

**Goal:** Verify `tb.theseus` state can be queried after init.

**Steps:**
1. Init a Theseus session
2. Call:
   ```js
   async () => await tb.theseus({ operation: "status" })
   ```

**Expected:** Status response contains the active `session_id`

---

## Test 3: Ulysses Init + Status

**Goal:** Verify `tb.ulysses` works through the execute surface.

**Steps:**
1. Call:
   ```js
   async () => {
     const init = await tb.ulysses({
       operation: "init",
       problem: "Exercise Code Mode protocol surface",
       constraints: ["behavioral-suite"]
     });
     const status = await tb.ulysses({ operation: "status" });
     return { init, status };
   }
   ```

**Expected:** Both `init.session_id` and `status.session_id` are present and match

---

## Test 4: Observability Namespace

**Goal:** Verify `tb.observability` is reachable through execute.

**Steps:**
1. Call:
   ```js
   async () => await tb.observability({
     operation: "dashboard_url",
     args: { dashboard: "thoughtbox-mcp" }
   })
   ```

**Expected:** Returns a Grafana URL payload with `dashboard: "thoughtbox-mcp"`

---

## Test 5: No Raw Tool Escape Hatch Needed

**Goal:** Verify protocol/observability checks do not require direct raw tool calls.

**Steps:**
1. Complete Tests 1-4 using only `thoughtbox_execute`

**Expected:** No need to call `thoughtbox_theseus`, `thoughtbox_ulysses`, or `observability_gateway` directly
