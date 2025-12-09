# Thoughtbox Tool - Behavioral Tests

Workflows for Claude to execute when verifying the thoughtbox thinking tool functions correctly.

## Test 1: Basic Forward Thinking Flow

**Goal:** Verify sequential thought progression works.

**Steps:**
1. Call `thoughtbox` with thought 1 of 3, nextThoughtNeeded: true
2. Verify response includes thoughtNumber, totalThoughts, nextThoughtNeeded
3. Call thought 2 of 3
4. Call thought 3 of 3 with nextThoughtNeeded: false
5. Verify patterns cookbook is embedded at thought 1 and final thought

**Expected:** Clean progression with guide at bookends

---

## Test 2: Backward Thinking Flow

**Goal:** Verify goal-driven reasoning (N→1) works with session auto-creation.

**Steps:**
1. Start at thought 5 of 5 (the goal state) with sessionTitle and sessionTags
2. Verify response includes `sessionId` (session auto-created at thought 5)
3. Progress backward: 4, 3, 2, 1
4. Verify thoughtNumber can decrease while totalThoughts stays constant
5. End session with nextThoughtNeeded: false at thought 1

**Expected:**
- Session auto-creates at first thought (thought 5), not waiting for thought 1
- `sessionId` returned in response from first call
- Tool accepts backward progression without error

---

## Test 3: Branching Flow

**Goal:** Verify parallel exploration works.

**Steps:**
1. Create thoughts 1-3 normally
2. Branch from thought 2 with branchId "option-a", thoughtNumber 4
3. Branch from thought 2 with branchId "option-b", thoughtNumber 4
4. Verify response includes both branches in branches array
5. Create synthesis thought 5

**Expected:** Multiple branches tracked, can reference later

---

## Test 4: Revision Flow

**Goal:** Verify updating previous thoughts works.

**Steps:**
1. Create thoughts 1-3
2. Create thought 4 with isRevision: true, revisesThought: 2
3. Verify response acknowledges revision

**Expected:** Revision tracked, original thought number referenced

---

## Test 5: Guide Request Flow

**Goal:** Verify on-demand patterns cookbook.

**Steps:**
1. Create thought 10 of 20 with includeGuide: true
2. Verify patterns cookbook is embedded in response
3. Cookbook should include all 6 patterns: forward, backward, branching, revision, interleaved, first principles

**Expected:** Full cookbook available mid-stream when requested

---

## Test 6: Dynamic Adjustment Flow

**Goal:** Verify totalThoughts can be adjusted.

**Steps:**
1. Start with thought 1 of 5
2. At thought 4, realize more needed - set totalThoughts to 10
3. Continue to thought 10
4. Verify tool accepts the adjustment

**Expected:** Flexible estimation, not rigid planning

---

## Test 7: Validation Flow

**Goal:** Verify input validation.

**Steps:**
1. Call without required field (thought) - should error
2. Call without thoughtNumber - should error
3. Call with thoughtNumber > totalThoughts - should auto-adjust totalThoughts
4. Call with invalid types - should error with clear message

**Expected:** Clear validation errors, graceful handling of edge cases

---

## Test 8: Linked Node Structure

**Goal:** Verify thoughts create proper doubly-linked chain by creation order (not thought number).

**Steps:**
1. Create thoughts 1, 2, 3 sequentially with nextThoughtNeeded: true
2. Call `export_reasoning_chain` tool to export session
3. Parse exported JSON, examine nodes array

**Expected:**
- Node 1: `prev: null`, `next: ["{sessionId}:2"]`
- Node 2: `prev: "{sessionId}:1"`, `next: ["{sessionId}:3"]`
- Node 3: `prev: "{sessionId}:2"`, `next: []`
- All node IDs follow `{sessionId}:{thoughtNumber}` format

**Note:** The `prev`/`next` pointers link nodes by creation order, not by thought number sequence. This enables valid chains for backward thinking and gaps.

---

## Test 9: Tree Structure from Branching

**Goal:** Verify branches create tree with multiple children.

**Steps:**
1. Create thoughts 1-3 on main chain
2. Create thought 4 with `branchFromThought: 3`, `branchId: "option-a"`
3. Create thought 5 with `branchFromThought: 3`, `branchId: "option-b"`
4. Export session and examine node 3

**Expected:**
- Node 3 has `next: ["{sessionId}:4", "{sessionId}:5"]` (two children)
- Node 4 has `branchOrigin: "{sessionId}:3"`, `branchId: "option-a"`
- Node 5 has `branchOrigin: "{sessionId}:3"`, `branchId: "option-b"`
- Tree structure maintained via array-based `next` pointers

---

## Test 10: Revision Tracking in Nodes

**Goal:** Verify revisions maintain both sequential chain and revision pointer.

**Steps:**
1. Create thoughts 1-3
2. Create thought 4 with `isRevision: true`, `revisesThought: 2`
3. Export session

**Expected:**
- Node 4 has `revisesNode: "{sessionId}:2"`
- Node 4 has `prev: "{sessionId}:3"` (still in sequential chain)
- Node 4 appears after node 3 in nodes array
- Revision relationship is forward-pointing (from revision to original)

---

## Test 11: Auto-Export on Session Close

**Goal:** Verify session automatically exports to filesystem when complete.

**Steps:**
1. Create thoughts 1-3 with `nextThoughtNeeded: true`
2. Create thought 4 with `nextThoughtNeeded: false`
3. Check response for `exportPath` field
4. Verify file exists at `~/.thoughtbox/exports/`

**Expected:**
- Response includes `sessionClosed: true` and `exportPath`
- New JSON file created with pattern `{sessionId}-{timestamp}.json`
- File contains `version: "1.0"`
- File contains `nodes` array with 4 nodes
- File contains `session` object with metadata
- Response shows `sessionId: null` (session closed)

---

## Test 12: Manual Export Tool

**Goal:** Verify `export_reasoning_chain` tool exports without closing session.

**Steps:**
1. Create thoughts 1-3 with `nextThoughtNeeded: true` (session still open)
2. Call `export_reasoning_chain` tool (no sessionId - uses current)
3. Verify response includes `success: true`, `exportPath`, `nodeCount`
4. Create thought 4 (should work - session still active)

**Expected:**
- Export tool returns file path without closing session
- File exists with correct linked structure
- Session remains active, thought 4 succeeds
- Can export multiple times during active session
- Export includes `version: "1.0"`, `session`, `nodes`, `exportedAt`

---

## Test 13: Node ID Format Consistency

**Goal:** Verify all node IDs follow `{sessionId}:{thoughtNumber}` format.

**Steps:**
1. Create thought 1, capture sessionId from response
2. Create thoughts 2-3
3. Export and examine all node IDs

**Expected:**
- All `id` fields match pattern `{sessionId}:{thoughtNumber}`
- All `prev`/`next` pointers use same format
- All `revisesNode`/`branchOrigin` pointers use same format when present
- Node 1 has `prev: null`, all others have valid prev pointer
- Format is parseable: split on `:` gives [sessionId, thoughtNumber]

---

## Test 14: Backward Thinking Linked Structure

**Goal:** Verify backward thinking (N→1) creates valid doubly-linked chain.

**Steps:**
1. Start at thought 5 of 5 with nextThoughtNeeded: true (session auto-creates)
2. Create thought 4 of 5
3. Create thought 3 of 5
4. Create thought 2 of 5
5. Create thought 1 of 5 with nextThoughtNeeded: false
6. Export session and examine nodes

**Expected:**
- Session created at thought 5 (first call)
- Node 5: `prev: null`, `next: ["{sessionId}:4"]` (head of chain)
- Node 4: `prev: "{sessionId}:5"`, `next: ["{sessionId}:3"]`
- Node 3: `prev: "{sessionId}:4"`, `next: ["{sessionId}:2"]`
- Node 2: `prev: "{sessionId}:3"`, `next: ["{sessionId}:1"]`
- Node 1: `prev: "{sessionId}:2"`, `next: []` (tail of chain)
- Chain flows 5←4←3←2←1 by creation order

---

## Test 15: Gaps in Thought Numbers

**Goal:** Verify gaps in thought numbers maintain valid chain (prev points to last actual node).

**Steps:**
1. Create thought 1 of 10 with nextThoughtNeeded: true
2. Create thought 5 of 10 (skipping thoughts 2-4)
3. Create thought 8 of 10 (skipping thoughts 6-7)
4. Create thought 10 of 10 with nextThoughtNeeded: false
5. Export session and examine nodes

**Expected:**
- Node 1: `prev: null`, `next: ["{sessionId}:5"]`
- Node 5: `prev: "{sessionId}:1"`, `next: ["{sessionId}:8"]`
- Node 8: `prev: "{sessionId}:5"`, `next: ["{sessionId}:10"]`
- Node 10: `prev: "{sessionId}:8"`, `next: []`
- Chain is contiguous (1←5←8←10) despite thought number gaps
- No broken links to non-existent nodes

---

## Running These Tests

Execute by calling the `thoughtbox` and `export_reasoning_chain` MCP tools with specified parameters. The tool outputs to stderr for visual display; verify JSON response matches expectations.

For Tests 8-15 (linked structure tests), the AI agent executes tests by:
1. Calling `thoughtbox` tool with specified parameters
2. Calling `export_reasoning_chain` to get exported file path
3. Reading exported JSON file to verify structure
4. Comparing actual structure against expected values
