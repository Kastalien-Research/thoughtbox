# 01 — thoughtbox_init

Stage: STAGE_0_ENTRY (always available)
Operations: get_state, list_sessions, navigate, load_context, start_new, list_roots, bind_root, cipher

---

## Test 1: Get State (cold start)

**Goal:** Verify initial state before any session is active.

**Steps:**
1. Call `thoughtbox_init { operation: "get_state" }`
2. Verify response includes navigation state (no active project/task/aspect)
3. Verify suggested next steps are present

**Expected:** Clean state with guidance on how to proceed

---

## Test 2: Start New Session

**Goal:** Verify creating a fresh work context.

**Steps:**
1. Call `thoughtbox_init { operation: "start_new", project: "test-project", task: "test-task" }`
2. Verify response confirms new context created
3. Call `get_state` again
4. Verify project and task are now set

**Expected:** New context established, stage advances to STAGE_1_INIT_COMPLETE

---

## Test 3: List Sessions

**Goal:** Verify session listing with filters.

**Steps:**
1. Call `thoughtbox_init { operation: "list_sessions" }`
2. Verify response includes sessions array (may be empty)
3. Call with filters: `{ operation: "list_sessions", filters: { limit: 5 } }`
4. Verify limit is respected

**Expected:** Sessions listed with metadata (title, tags, thought count, timestamps)

---

## Test 4: Navigate Hierarchy

**Goal:** Verify project/task/aspect navigation.

**Steps:**
1. Start a new context with project "nav-test"
2. Call `thoughtbox_init { operation: "navigate", target: { project: "nav-test" } }`
3. Verify response shows related sessions for that project

**Expected:** Navigation scopes view to the specified coordinates

---

## Test 5: Load Context (session restore)

**Goal:** Verify loading a previous session restores state.

**Steps:**
1. Start new context, create a few thoughts to generate a session
2. Note the sessionId
3. Start a fresh context (new start_new call)
4. Call `thoughtbox_init { operation: "load_context", sessionId: "<id>" }`
5. Verify response includes restoration metadata (thought count, branches)
6. Verify stage advanced to STAGE_1_INIT_COMPLETE

**Expected:** Session state restored, ThoughtHandler has correct thought count

---

## Test 6: Cipher Loading

**Goal:** Verify cipher notation loads and unlocks Stage 2 tools.

**Steps:**
1. Complete init (start_new or load_context)
2. Call `thoughtbox_init { operation: "cipher" }`
3. Verify cipher notation content is returned
4. Verify STAGE_2 tools (thoughtbox_thought, thoughtbox_notebook) become available

**Expected:** Cipher loaded, tools/list_changed notification sent, Stage 2 tools visible

---

## Test 7: List and Bind Roots

**Goal:** Verify MCP roots discovery and binding.

**Steps:**
1. Call `thoughtbox_init { operation: "list_roots" }`
2. Verify response lists available MCP roots (may be empty if client doesn't support)
3. If roots available, call `thoughtbox_init { operation: "bind_root", rootUri: "<uri>" }`
4. Verify root is bound as project scope

**Expected:** Roots listed from client, binding sets project scope

---

## Test 8: Error — Operations Before Init

**Goal:** Verify stage enforcement blocks premature tool access.

**Steps:**
1. Without calling start_new or load_context, attempt to use thoughtbox_thought
2. Verify error message explains that init must complete first

**Expected:** Clear error with recovery guidance (call start_new or load_context)
