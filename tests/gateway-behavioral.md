# Gateway & Init - Behavioral Tests

Workflows for verifying the `thoughtbox_gateway` tool's initialization, navigation, progressive disclosure, and cipher operations.

**Tool:** `thoughtbox_gateway`
**Operations covered:** `get_state`, `list_sessions`, `navigate`, `load_context`, `start_new`, `list_roots`, `bind_root`, `cipher`
**Progressive disclosure stages:** Stage 0 (entry) → Stage 1 (init_complete) → Stage 2 (cipher_loaded)

---

## GW-001: get_state Returns Current Stage

**Goal:** Verify `get_state` returns the current disclosure stage and available operations.

**Steps:**
1. Call `thoughtbox_gateway` with `{ operation: "get_state" }`
2. Verify response includes:
   - `stage` field (should be `"entry"` at start)
   - `availableOperations` array listing what's currently callable
   - No error

**Expected:** Stage is `"entry"`, available operations include Stage 0 ops (`get_state`, `list_sessions`, `navigate`, `load_context`, `start_new`, `list_roots`, `bind_root`)

---

## GW-002: list_sessions with Limit

**Goal:** Verify `list_sessions` returns sessions and respects `limit` filter.

**Steps:**
1. Ensure at least 3 sessions exist (create them via `start_new` + `thought` if needed, or use existing data)
2. Call `thoughtbox_gateway` with `{ operation: "list_sessions", args: { limit: 2 } }`
3. Verify response includes at most 2 sessions
4. Each session should have: `id`, `title`, `thoughtCount`, `tags`, `createdAt`

**Expected:** Sessions returned, count ≤ limit

---

## GW-003: list_sessions with Filters

**Goal:** Verify `list_sessions` filters by project, task, aspect, and search.

**Steps:**
1. Call `thoughtbox_gateway` with `{ operation: "list_sessions", args: { search: "some-known-keyword" } }`
2. Verify only matching sessions returned
3. Call with `{ args: { project: "test-project" } }` if project-scoped sessions exist
4. Verify filtering narrows results appropriately

**Expected:** Filters reduce result set to matching sessions only

---

## GW-004: navigate

**Goal:** Verify `navigate` moves to a project/task/aspect position in the hierarchy.

**Steps:**
1. Call `thoughtbox_gateway` with `{ operation: "navigate", args: { project: "test-project", task: "test-task" } }`
2. Verify response confirms navigation
3. Call `get_state` to verify the navigation context is reflected

**Expected:** Navigation succeeds, subsequent operations are scoped to the navigated context

---

## GW-005: load_context Advances to Stage 1

**Goal:** Verify `load_context` loads an existing session and advances to Stage 1.

**Prerequisite:** At least one session exists.

**Steps:**
1. Call `{ operation: "list_sessions" }` to get a session ID
2. Call `{ operation: "load_context", args: { sessionId: "<id-from-step-1>" } }`
3. Verify response confirms session loaded
4. Call `{ operation: "get_state" }`
5. Verify stage is now `"init_complete"` (Stage 1)
6. Verify Stage 1 operations (`cipher`, `session`, `deep_analysis`) are now available

**Expected:** Stage advances from 0 → 1 after load_context

---

## GW-006: start_new Advances to Stage 1

**Goal:** Verify `start_new` initializes new work and advances to Stage 1.

**Steps:**
1. Call `{ operation: "start_new", args: { project: "behavioral-tests", task: "gw-006", aspect: "testing" } }`
2. Verify response includes session context (project, task, aspect)
3. Call `{ operation: "get_state" }`
4. Verify stage is now `"init_complete"` (Stage 1)

**Expected:** New session context created, stage advances 0 → 1

---

## GW-007: list_roots

**Goal:** Verify `list_roots` returns MCP roots.

**Steps:**
1. Call `{ operation: "list_roots" }`
2. Verify response includes roots array (may be empty if client doesn't support roots)
3. Each root should have a `uri` field

**Expected:** Roots returned (or empty array with message about client support)

---

## GW-008: bind_root

**Goal:** Verify `bind_root` binds a root URI as the project scope.

**Steps:**
1. Call `{ operation: "list_roots" }` to get available roots
2. Call `{ operation: "bind_root", args: { rootUri: "<uri-from-roots>" } }`
3. Verify response confirms binding
4. Call `{ operation: "get_state" }` to verify root context is active

**Expected:** Root bound successfully, project scope set

---

## GW-009: cipher Advances to Stage 2

**Goal:** Verify `cipher` loads the notation system and advances to Stage 2.

**Prerequisite:** Must be at Stage 1 (run `start_new` first).

**Steps:**
1. Call `{ operation: "start_new", args: { project: "behavioral-tests", task: "gw-009" } }`
2. Verify at Stage 1
3. Call `{ operation: "cipher" }`
4. Verify response includes cipher content (notation system documentation)
5. Call `{ operation: "get_state" }`
6. Verify stage is now `"cipher_loaded"` (Stage 2)
7. Verify Stage 2 operations (`thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models`, `knowledge`) are now available

**Expected:** Cipher loaded, stage advances 1 → 2

---

## GW-010: Progressive Disclosure — Stage 0 Blocks Stage 1 Operations

**Goal:** Verify operations that require Stage 1 are blocked at Stage 0 with a helpful error.

**Steps:**
1. Ensure at Stage 0 (fresh state — do NOT call `start_new` or `load_context`)
2. Call `{ operation: "cipher" }` (requires Stage 1)
3. Verify response is an error
4. Verify error message mentions:
   - What stage is required
   - What the current stage is
   - How to advance (e.g., "call start_new or load_context first")
5. Repeat with `{ operation: "session", args: { operation: "list" } }` (also Stage 1)
6. Verify same pattern of helpful error

**Expected:** Blocked with actionable guidance, not a cryptic error

---

## GW-011: Progressive Disclosure — Stage 1 Blocks Stage 2 Operations

**Goal:** Verify operations that require Stage 2 are blocked at Stage 1 with a helpful error.

**Prerequisite:** At Stage 1 (run `start_new`, do NOT call `cipher`).

**Steps:**
1. Call `{ operation: "start_new", args: { project: "behavioral-tests", task: "gw-011" } }`
2. Verify at Stage 1
3. Call `{ operation: "thought", args: { thought: "test", thoughtNumber: 1, totalThoughts: 1, nextThoughtNeeded: false } }`
4. Verify response is an error
5. Verify error message mentions needing to load cipher first
6. Repeat with `{ operation: "knowledge", args: { action: "stats" } }` (also Stage 2)
7. Verify same helpful error pattern

**Expected:** Blocked with message to call `cipher` first

---

## GW-012: Full Stage Progression End-to-End

**Goal:** Verify the complete happy path: Stage 0 → Stage 1 → Stage 2 → thought creation.

**Steps:**
1. Call `{ operation: "get_state" }` — verify `"entry"` (Stage 0)
2. Call `{ operation: "start_new", args: { project: "behavioral-tests", task: "gw-012", aspect: "e2e", domain: "testing" } }`
3. Call `{ operation: "get_state" }` — verify `"init_complete"` (Stage 1)
4. Call `{ operation: "cipher" }`
5. Call `{ operation: "get_state" }` — verify `"cipher_loaded"` (Stage 2)
6. Call `{ operation: "thought", args: { thought: "This is an end-to-end test thought.", thoughtNumber: 1, totalThoughts: 1, nextThoughtNeeded: false } }`
7. Verify thought created successfully with sessionId and content
8. Call `{ operation: "get_structure" }`
9. Verify structure includes 1 thought

**Expected:** Full progression works without errors. Each stage gate enforced correctly. Final thought creation succeeds.

---

## Running These Tests

Execute by calling the `thoughtbox_gateway` MCP tool with the specified operation and args. Tests GW-010 and GW-011 require starting from a clean state (no prior init). Test GW-012 is the integration smoke test — run it last.

**Stage reset:** To reset to Stage 0, restart the server or start a new client connection.
