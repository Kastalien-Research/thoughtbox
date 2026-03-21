# 03 — thoughtbox_session

Stage: STAGE_1_INIT_COMPLETE (requires init)
Operations: session_list, session_get, session_search, session_resume, session_export, session_analyze, session_extract_learnings, session_discovery
Annotation: readOnlyHint (does not modify reasoning state, except session_resume)

---

## Test 1: List Sessions

**Goal:** Verify session listing.

**Steps:**
1. Complete init (start_new)
2. Call `thoughtbox_session { operation: "session_list" }`
3. Verify response includes sessions array with metadata
4. Call with `limit: 2, offset: 0`
5. Verify pagination works

**Expected:** Session list with title, tags, thought count, timestamps

---

## Test 2: Get Session Details

**Goal:** Verify full session retrieval.

**Steps:**
1. Create a session with a few thoughts
2. Call `thoughtbox_session { operation: "session_get", sessionId: "<id>" }`
3. Verify response includes all thoughts, branches, metadata

**Expected:** Complete session object with full thought chain

---

## Test 3: Search Sessions

**Goal:** Verify text search across sessions.

**Steps:**
1. Create sessions with distinct titles/tags
2. Call `thoughtbox_session { operation: "session_search", query: "<title substring>" }`
3. Verify matching sessions returned

**Expected:** Sessions matching title or tags

---

## Test 4: Resume Session

**Goal:** Verify resuming appends to existing session.

**Steps:**
1. Create a session with thoughts 1-3
2. Start a new context
3. Call `thoughtbox_session { operation: "session_resume", sessionId: "<id>" }`
4. Submit thought 4 via thoughtbox_thought
5. Verify thought 4 is appended to the original session

**Expected:** Resumed session continues from where it left off

---

## Test 5: Export — Markdown Format

**Goal:** Verify markdown export.

**Steps:**
1. Create session with thoughts including branches
2. Call `thoughtbox_session { operation: "session_export", sessionId: "<id>", format: "markdown" }`
3. Verify output is valid markdown with thought content

**Expected:** Human-readable markdown export

---

## Test 6: Export — JSON Format

**Goal:** Verify JSON export with linked nodes.

**Steps:**
1. Create session with thoughts
2. Call `thoughtbox_session { operation: "session_export", sessionId: "<id>", format: "json" }`
3. Verify JSON includes nodes with prev/next pointers

**Expected:** Structured JSON with linked-list node format

---

## Test 7: Export — Cipher Format

**Goal:** Verify compressed cipher notation export.

**Steps:**
1. Create session with thoughts (requires cipher loaded)
2. Call `thoughtbox_session { operation: "session_export", sessionId: "<id>", format: "cipher" }`
3. Verify output uses cipher notation

**Expected:** Token-efficient compressed format

---

## Test 8: Analyze Session

**Goal:** Verify objective session metrics.

**Steps:**
1. Create session with branches and revisions
2. Call `thoughtbox_session { operation: "session_analyze", sessionId: "<id>" }`
3. Verify metrics include: linearity, revision rate, branch depth, convergence

**Expected:** Quantitative analysis of reasoning patterns

---

## Test 9: Extract Learnings

**Goal:** Verify pattern extraction from sessions.

**Steps:**
1. Create a session with decision points
2. Call `thoughtbox_session { operation: "session_extract_learnings", sessionId: "<id>", targetTypes: ["pattern", "signal"] }`
3. Verify patterns and signals are returned

**Expected:** Structured learnings categorized by type

---

## Test 10: Discovery Management

**Goal:** Verify tool visibility controls.

**Steps:**
1. Call `thoughtbox_session { operation: "session_discovery", action: "list" }`
2. Verify list of discoverable tools
3. Call with `action: "hide", toolName: "thoughtbox_notebook"`
4. Call `action: "list"` again — verify notebook is hidden
5. Call with `action: "show", toolName: "thoughtbox_notebook"`
6. Verify notebook is visible again

**Expected:** Tools can be hidden/shown per session
