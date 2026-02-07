# Session Management - Behavioral Tests

Workflows for verifying the `thoughtbox_gateway` session sub-operations.

**Tool:** `thoughtbox_gateway`
**Operation:** `session` (with sub-operations via `args.operation`)
**Required stage:** Stage 1 (init_complete) — call `start_new` or `load_context` first
**Sub-operations:** `list`, `get`, `search`, `resume`, `export`, `analyze`, `extract_learnings`, `discovery`

---

## SS-001: session.list Returns Sessions with Metadata

**Goal:** Verify `session.list` returns session summaries with metadata.

**Prerequisite:** Stage 1. At least one session exists.

**Steps:**
1. Advance to Stage 1 via `start_new`
2. Call `{ operation: "session", args: { operation: "list" } }`
3. Verify response includes an array of sessions
4. Each session should have: `id`, `title`, `thoughtCount`, `tags`, `createdAt`

**Expected:** Session list returned with correct metadata fields

---

## SS-002: session.list with Tags Filter

**Goal:** Verify filtering sessions by tags.

**Prerequisite:** Sessions with known tags exist.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "list", tags: ["behavioral-test"] } }`
3. Verify only sessions with matching tags returned
4. Call with a tag that no session has
5. Verify empty result (not an error)

**Expected:** Tag filter narrows results correctly, empty tag match returns empty array

---

## SS-003: session.list with Limit and Offset

**Goal:** Verify pagination.

**Prerequisite:** At least 3 sessions exist.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "list", limit: 2, offset: 0 } }`
3. Verify exactly 2 sessions returned
4. Note the session IDs
5. Call with `{ limit: 2, offset: 2 }`
6. Verify different sessions returned (or fewer if near end)
7. Verify no overlap between page 1 and page 2

**Expected:** Pagination works correctly with no duplicate results

---

## SS-004: session.get Returns Full Session

**Goal:** Verify `session.get` returns full session details including all thoughts.

**Prerequisite:** A session with multiple thoughts exists.

**Steps:**
1. Advance to Stage 1
2. Get a session ID from `session.list`
3. Call `{ operation: "session", args: { operation: "get", sessionId: "<id>" } }`
4. Verify response includes:
   - `id`, `title`, `tags`, `createdAt`
   - `thoughts` array with all thoughts
   - Each thought has `thoughtNumber`, `content`, `createdAt`
   - Branch information if applicable

**Expected:** Complete session with all thoughts returned

---

## SS-005: session.get with Nonexistent ID

**Goal:** Verify clear error for missing session.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "get", sessionId: "nonexistent-id-12345" } }`
3. Verify error response (not a crash)
4. Verify error message indicates session not found

**Expected:** Clear "not found" error, not a server crash or generic error

---

## SS-006: session.search

**Goal:** Verify searching sessions by query string.

**Steps:**
1. Advance to Stage 1
2. Create a session with a distinctive title (e.g., "Unicorn Rainbow Analysis")
3. Call `{ operation: "session", args: { operation: "search", query: "Unicorn" } }`
4. Verify the session with matching title appears in results
5. Search for a non-matching query
6. Verify empty results

**Expected:** Search matches against title and tags

---

## SS-007: session.resume Loads Session

**Goal:** Verify `session.resume` loads a session into the ThoughtHandler for continuation.

**Prerequisite:** A completed session exists.

**Steps:**
1. Advance to Stage 1
2. Get a session ID from `session.list`
3. Call `{ operation: "session", args: { operation: "resume", sessionId: "<id>" } }`
4. Verify response confirms session loaded
5. Verify the session context is now active

**Expected:** Session loaded, ready for continuation

---

## SS-008: session.resume Then Add Thought

**Goal:** Verify thoughts can be added after resuming a session.

**Prerequisite:** A session with existing thoughts.

**Steps:**
1. Advance to Stage 1
2. Resume a session via `session.resume`
3. Advance to Stage 2 via `cipher`
4. Call `{ operation: "thought", args: { thought: "Continuation thought after resume", thoughtNumber: <next-number>, totalThoughts: <next-number>, nextThoughtNeeded: false } }`
5. Verify thought created successfully
6. Verify it belongs to the resumed session (same sessionId)

**Expected:** Continuation works — new thought appended to resumed session

---

## SS-009: session.export JSON Format

**Goal:** Verify JSON export with linked node structure.

**Prerequisite:** A session with multiple thoughts.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "export", sessionId: "<id>", format: "json" } }`
3. Verify response includes JSON content
4. Verify JSON contains:
   - `version` field
   - `session` object with metadata
   - `nodes` array with linked thoughts
   - Each node has `id`, `prev`, `next` pointers

**Expected:** Valid JSON with linked node structure

---

## SS-010: session.export Markdown Format

**Goal:** Verify markdown export is human-readable.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "export", sessionId: "<id>", format: "markdown" } }`
3. Verify response includes markdown content
4. Verify markdown includes:
   - Session title as heading
   - Thoughts rendered in order
   - Branch labels if present
   - Revision annotations if present

**Expected:** Readable markdown suitable for documentation

---

## SS-011: session.export Cipher Format

**Goal:** Verify cipher notation format export.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "export", sessionId: "<id>", format: "cipher" } }`
3. Verify response includes cipher-formatted content
4. Verify content uses cipher notation conventions

**Expected:** Cipher notation format output

---

## SS-012: session.analyze

**Goal:** Verify session analysis returns structure/quality metrics.

**Prerequisite:** A session with several thoughts, revisions, and/or branches.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "analyze", sessionId: "<id>" } }`
3. Verify response includes metrics:
   - `linearity` (how linear vs branching the session is)
   - `revisionRate` (ratio of revisions to total thoughts)
   - `depth` (max chain length)
   - `thoughtDensity` or similar quality indicators
4. Verify metrics are numeric and within reasonable ranges

**Expected:** Quantitative analysis of session structure

---

## SS-013: session.extract_learnings

**Goal:** Verify extraction of patterns and anti-patterns from a session.

**Prerequisite:** A substantial session with at least 5+ thoughts.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "extract_learnings", sessionId: "<id>" } }`
3. Verify response includes:
   - Patterns identified (successful strategies)
   - Anti-patterns identified (things that didn't work)
   - Fitness signals for DGM evolution (if applicable)
4. Verify learnings reference specific thoughts or thought ranges

**Expected:** Actionable learnings extracted from session history

---

## SS-014: session.discovery

**Goal:** Verify operation-based tool discovery management.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "session", args: { operation: "discovery" } }` (list mode)
3. Verify response lists available session operations with descriptions
4. Call with `{ operation: "discovery", action: "hide", target: "analyze" }` (if supported)
5. Call discovery again, verify "analyze" is marked as hidden
6. Call with `{ operation: "discovery", action: "show", target: "analyze" }`
7. Verify "analyze" is visible again

**Expected:** Discovery lists operations, hide/show toggles visibility

---

## Running These Tests

All session tests require Stage 1 minimum. Execute by calling `thoughtbox_gateway` with `operation: "session"` and sub-operation in `args.operation`.

**Setup:** Create test sessions with known titles and tags before running filter/search tests. Use `start_new` followed by a few `thought` calls to create test data.
