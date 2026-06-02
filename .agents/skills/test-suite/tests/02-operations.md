# 02 — thoughtbox_operations

Stage: STAGE_0_ENTRY (always available)
Operations: list, get, search

---

## Test 1: List All Operations

**Goal:** Verify full operations catalog across all modules.

**Steps:**
1. Call `thoughtbox_operations { operation: "list" }`
2. Verify response includes operations grouped by module
3. Verify `totalOperations` count is present
4. Verify modules include: init, session, notebook, hub, knowledge

**Expected:** Complete catalog with operation names, titles, descriptions, categories

---

## Test 2: List by Module

**Goal:** Verify module filtering.

**Steps:**
1. Call `thoughtbox_operations { operation: "list", args: { module: "hub" } }`
2. Verify only hub operations returned
3. Call with `module: "init"`
4. Verify only init operations returned

**Expected:** Each module filter returns only that module's operations

---

## Test 3: Get Specific Operation

**Goal:** Verify full operation definition retrieval.

**Steps:**
1. Call `thoughtbox_operations { operation: "get", args: { name: "register" } }`
2. Verify response includes:
   - `name`, `title`, `description`
   - `inputSchema` with properties and required fields
   - `example` with sample args
   - `category` and `stage`

**Expected:** Full operation definition with actionable schema

---

## Test 4: Search Operations

**Goal:** Verify text search across operations.

**Steps:**
1. Call `thoughtbox_operations { operation: "search", args: { query: "workspace" } }`
2. Verify `matches` array contains operations mentioning "workspace"
3. Verify `totalMatches` count
4. Call with `query: "nonexistent-term-xyz"`
5. Verify empty matches

**Expected:** Substring match across name, title, description fields

---

## Test 5: Search with Module Scope

**Goal:** Verify search respects module filter.

**Steps:**
1. Call `thoughtbox_operations { operation: "search", args: { query: "list", module: "session" } }`
2. Verify only session operations matching "list" returned
3. Hub operations matching "list" should NOT appear

**Expected:** Module scoping narrows search results

---

## Test 6: Get Nonexistent Operation

**Goal:** Verify error on invalid operation name.

**Steps:**
1. Call `thoughtbox_operations { operation: "get", args: { name: "nonexistent_op" } }`
2. Verify clear error message

**Expected:** Actionable error, not a crash
