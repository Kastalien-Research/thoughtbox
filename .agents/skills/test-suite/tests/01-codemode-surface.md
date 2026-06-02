# 01 — Code Mode Surface

Purpose: Verify that the live `/mcp` endpoint exposes the intended Code Mode contract and not the old raw-tool surface.

---

## Test 1: Public Tool List

**Goal:** Verify that `/mcp` exposes only the two Code Mode tools.

**Steps:**
1. Call `tools/list`
2. Capture the full tool name list

**Expected:**
- Exactly `thoughtbox_search` and `thoughtbox_execute`
- No `thoughtbox_init`
- No `thoughtbox_session`
- No `thoughtbox_knowledge`
- No `thoughtbox_hub`

---

## Test 2: Server Instructions

**Goal:** Verify server instructions describe the Code Mode workflow.

**Steps:**
1. Inspect the server instructions returned during MCP initialization

**Expected:**
- Instructions mention `thoughtbox_search`
- Instructions mention `thoughtbox_execute`
- Instructions describe search → execute workflow

---

## Test 3: Prompts and Resources Still Available

**Goal:** Verify that moving to Code Mode did not remove prompts/resources from the MCP surface.

**Steps:**
1. Call:
   ```js
   async () => ({
     prompts: catalog.prompts.length,
     resources: catalog.resources.length,
     resourceTemplates: catalog.resourceTemplates.length
   })
   ```

**Expected:**
- Prompts count > 0
- Resources count > 0
- Resource templates count > 0

---

## Test 4: No Legacy Raw Tool Calls Required

**Goal:** Verify the suite can proceed using only the two public Code Mode tools.

**Steps:**
1. Use `thoughtbox_search` to discover session operations
2. Use `thoughtbox_execute` to call `tb.session.list()`

**Expected:** No dependency on any raw legacy tool invocation
