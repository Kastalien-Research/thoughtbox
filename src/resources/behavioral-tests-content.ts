/**
 * Behavioral test specifications for Thoughtbox MCP tools.
 * Served as both prompts (slash commands) and resources (URIs).
 */

export const BEHAVIORAL_TESTS = {
  thoughtbox: {
    name: "test-thoughtbox",
    uri: "thoughtbox://tests/thoughtbox",
    description: "Behavioral tests for the thoughtbox thinking tool (15 tests covering forward/backward thinking, branching, revisions, linked structure)",
    content: `# Thoughtbox Tool - Behavioral Tests

Workflows for Claude to execute when verifying the thoughtbox thinking tool functions correctly.

## Test 1: Basic Forward Thinking Flow

**Goal:** Verify sequential thought progression works.

**Steps:**
1. Call \`thoughtbox\` with thought 1 of 3, nextThoughtNeeded: true
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
2. Verify response includes \`sessionId\` (session auto-created at thought 5)
3. Progress backward: 4, 3, 2, 1
4. Verify thoughtNumber can decrease while totalThoughts stays constant
5. End session with nextThoughtNeeded: false at thought 1

**Expected:**
- Session auto-creates at first thought (thought 5), not waiting for thought 1
- \`sessionId\` returned in response from first call
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
2. Call session export tool to export session
3. Verify thoughts are stored correctly

**Expected:**
- Thoughts stored in creation order with correct thoughtNumbers
- Session metadata (thoughtCount) reflects actual count
- JSON export includes \`nodes: ThoughtNode[]\` with \`prev\`, \`next\`, \`revisesNode\`, \`branchOrigin\` fields

---

## Test 9: Tree Structure from Branching

**Goal:** Verify branches create tree with multiple children.

**Steps:**
1. Create thoughts 1-3 on main chain
2. Create thought 4 with \`branchFromThought: 3\`, \`branchId: "option-a"\`
3. Create thought 5 with \`branchFromThought: 3\`, \`branchId: "option-b"\`
4. Export session and examine node 3

**Expected:**
- Node 3 has \`next: ["{sessionId}:4", "{sessionId}:5"]\` (two children)
- Node 4 has \`branchOrigin: "{sessionId}:3"\`, \`branchId: "option-a"\`
- Node 5 has \`branchOrigin: "{sessionId}:3"\`, \`branchId: "option-b"\`

---

## Test 10: Revision Tracking in Nodes

**Goal:** Verify revisions maintain both sequential chain and revision pointer.

**Steps:**
1. Create thoughts 1-3
2. Create thought 4 with \`isRevision: true\`, \`revisesThought: 2\`
3. Export session

**Expected:**
- Node 4 has \`revisesNode: "{sessionId}:2"\`
- Node 4 has \`prev: "{sessionId}:3"\` (still in sequential chain)

---

## Test 11: Auto-Export on Session Close

**Goal:** Verify session automatically exports to filesystem when complete.

**Steps:**
1. Create thoughts 1-3 with \`nextThoughtNeeded: true\`
2. Create thought 4 with \`nextThoughtNeeded: false\`
3. Check response for \`exportPath\` field

**Expected:**
- Response includes \`sessionClosed: true\` and \`exportPath\`
- New JSON file created with pattern \`{sessionId}-{timestamp}.json\`

---

## Test 12: Manual Export Tool

**Goal:** Verify \`export_reasoning_chain\` tool exports without closing session.

**Steps:**
1. Create thoughts 1-3 with \`nextThoughtNeeded: true\` (session still open)
2. Call \`export_reasoning_chain\` tool
3. Create thought 4 (should work - session still active)

**Expected:** Export without closing session

---

## Test 13: Node ID Format Consistency

**Goal:** Verify all node IDs follow \`{sessionId}:{thoughtNumber}\` format.

**Steps:**
1. Create thought 1, capture sessionId from response
2. Create thoughts 2-3
3. Export session and verify thoughts have consistent structure

**Expected:**
- Session ID returned with each thought response
- ThoughtNumber preserved in export
- Thoughts traceable to their session
- JSON export includes node IDs in \`{sessionId}:{thoughtNumber}\` format (e.g., \`"abc-123:1"\`)

---

## Test 14: Backward Thinking Linked Structure

**Goal:** Verify backward thinking (N→1) creates valid doubly-linked chain.

**Steps:**
1. Start at thought 5 of 5
2. Create thoughts 4, 3, 2, 1 in sequence
3. Export session

**Expected:** Chain flows 5←4←3←2←1 by creation order

---

## Test 15: Gaps in Thought Numbers

**Goal:** Verify gaps in thought numbers maintain valid chain.

**Steps:**
1. Create thought 1 of 10
2. Create thought 5 of 10 (skipping 2-4)
3. Create thought 8 of 10 (skipping 6-7)
4. Create thought 10 of 10
5. Export session

**Expected:** Chain is contiguous (1←5←8←10) despite thought number gaps
`
  },

  notebook: {
    name: "test-notebook",
    uri: "thoughtbox://tests/notebook",
    description: "Behavioral tests for the notebook literate programming tool (8 tests covering creation, cells, execution, export)",
    content: `# Notebook Toolhost - Behavioral Tests

Workflows for Claude to execute when verifying the notebook toolhost functions correctly.

## Test 1: Create and List Flow

**Goal:** Verify notebook creation and discovery.

**Steps:**
1. Call \`notebook\` with operation \`create\`, args: { title: "Test Notebook", language: "typescript" }
2. Verify response includes notebookId, title, language, cells array
3. Call operation \`list\`
4. Verify created notebook appears in list with correct metadata

**Expected:** Notebook created with unique ID, discoverable via list

---

## Test 2: Cell Operations Flow

**Goal:** Verify adding and managing cells.

**Steps:**
1. Create a notebook
2. Add title cell: operation \`add_cell\`, cellType: "title", content: "My Analysis"
3. Add markdown cell: cellType: "markdown", content: "## Introduction..."
4. Add code cell: cellType: "code", content: "console.log('hello')", filename: "hello.ts"
5. Call operation \`list_cells\` with notebookId
6. Verify all three cells present with correct types

**Expected:** All cell types work, retrievable by ID

---

## Test 3: Code Execution Flow

**Goal:** Verify code cells execute correctly.

**Steps:**
1. Create notebook with language: "typescript"
2. Add code cell: \`const x = 1 + 1; console.log(x);\`
3. Call operation \`run_cell\` with notebookId and cellId
4. Verify output contains "2"
5. Verify cell status is "completed"

**Expected:** Code executes, output captured, status updated

---

## Test 4: Cell Update Flow

**Goal:** Verify cell content can be modified.

**Steps:**
1. Create notebook with a code cell
2. Call operation \`update_cell\` with new content
3. Call \`get_cell\` to verify content changed
4. Run the updated cell
5. Verify new output reflects updated code

**Expected:** Updates persist, execution uses new content

---

## Test 5: Export/Load Flow

**Goal:** Verify .src.md serialization roundtrip.

**Steps:**
1. Create notebook with title, markdown, and code cells
2. Call operation \`export\` with notebookId
3. Verify response includes content in .src.md format
4. Call operation \`load\` with the exported content string
5. Verify loaded notebook has same cells as original

**Expected:** Lossless roundtrip through .src.md format

---

## Test 6: Template Flow

**Goal:** Verify template instantiation.

**Steps:**
1. Call \`create\` with template: "sequential-feynman", title: "React Hooks"
2. Verify notebook created with pre-populated cells
3. Cells should include scaffolded structure from template

**Expected:** Template provides starting structure, not empty notebook

---

## Test 7: Dependency Installation Flow

**Goal:** Verify npm dependencies can be installed.

**Steps:**
1. Create notebook
2. Add package.json cell or update existing with dependencies
3. Call operation \`install_deps\` with notebookId
4. Verify installation completes
5. Add code cell that uses installed dependency
6. Run cell, verify it works

**Expected:** Dependencies available to code cells after install

---

## Test 8: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Call \`run_cell\` with nonexistent notebookId - should error
2. Call \`get_cell\` with invalid cellId - should error
3. Call \`add_cell\` with invalid cellType - should error
4. Run code cell with syntax error - should show error in output

**Expected:** Clear errors, failed cells have error info
`
  },

  mentalModels: {
    name: "test-mental-models",
    uri: "thoughtbox://tests/mental-models",
    description: "Behavioral tests for the mental_models structured reasoning tool (6 tests covering discovery, retrieval, capability graph)",
    content: `# Mental Models Toolhost - Behavioral Tests

Workflows for Claude to execute when verifying the mental_models toolhost functions correctly.

## Test 1: Discovery Flow

**Goal:** Verify an agent can discover what's available.

**Steps:**
1. Call \`mental_models\` with operation \`list_tags\`
2. Verify response contains 9 tags with descriptions
3. Pick a tag (e.g., "debugging") and call \`list_models\` with that tag filter
4. Verify only models with that tag are returned

**Expected:** Agent can navigate from tags → filtered models

---

## Test 2: Model Retrieval Flow

**Goal:** Verify an agent can retrieve and use a mental model.

**Steps:**
1. Call \`mental_models\` with operation \`get_model\`, model \`five-whys\`
2. Verify response contains:
   - Name and title
   - Tags array
   - Content with "# Five Whys" heading
   - "## When to Use" section
   - "## Process" section with numbered steps
3. Content should be process scaffolding (HOW to think), not analysis

**Expected:** Full prompt content suitable for guiding reasoning

---

## Test 3: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Call \`get_model\` without a model name - should error with available models list
2. Call \`get_model\` with invalid model name - should error with available models list
3. Call \`list_models\` with invalid tag - should error with available tags list
4. Call unknown operation - should error with available operations list

**Expected:** All errors include guidance on valid options

---

## Test 4: Capability Graph Flow

**Goal:** Verify capability graph can initialize knowledge graph.

**Steps:**
1. Call \`mental_models\` with operation \`get_capability_graph\`
2. Verify response contains:
   - \`entities\` array with thoughtbox_server, tools, tags, and models
   - \`relations\` array with provides, contains, tagged_with relationships
   - \`usage\` object with step-by-step instructions
3. Optionally: Use returned data with \`memory_create_entities\` and \`memory_create_relations\`

**Expected:** Structured data ready for knowledge graph initialization

---

## Test 5: Tag Coverage Flow

**Goal:** Verify tag taxonomy covers use cases.

**Steps:**
1. Call \`list_tags\` to see all categories
2. For each tag, call \`list_models\` with that tag
3. Verify each tag has at least one model
4. Verify model descriptions match tag intent

**Expected:** Complete coverage - no orphan tags or miscategorized models

---

## Test 6: Content Quality Flow

**Goal:** Verify mental model content follows "infrastructure not intelligence" principle.

**Steps:**
1. Retrieve several models (rubber-duck, pre-mortem, inversion)
2. For each, verify content:
   - Has clear process steps (numbered or bulleted)
   - Explains WHEN to use
   - Provides examples of APPLICATION
   - Lists anti-patterns or common mistakes
   - Does NOT perform reasoning or draw conclusions

**Expected:** Process scaffolds, not analysis
`
  },

  memory: {
    name: "test-memory",
    uri: "thoughtbox://tests/memory",
    description: "Behavioral tests for the knowledge/memory toolhost (12 tests covering patterns, scratchpad, persistence)",
    content: `# Knowledge Zone - Behavioral Tests

Workflows for Claude to execute when verifying the knowledge toolhost functions correctly.

The Knowledge Zone ("The Garden") has two areas:
1. **Patterns** - Extracted heuristics from successful reasoning sessions (persistent)
2. **Scratchpad** - Temporary collaborative working notes (ephemeral)

---

## Pattern Tests

### Test 1: Pattern Creation Flow

**Goal:** Verify patterns can be created and retrieved.

**Steps:**
1. Call \`knowledge\` with operation \`create_pattern\`, args:
   - title: "Test Pattern"
   - description: "A test pattern for behavioral verification"
   - content: "## Steps\\n\\n1. First step\\n2. Second step"
   - tags: ["testing", "verification"]
2. Verify response includes success: true, pattern id, pattern uri
3. Call operation \`get_pattern\` with args: { id: "test-pattern" }
4. Verify full pattern returned with content, tags, timestamps

**Expected:** Pattern persisted as Markdown file, retrievable by ID

---

### Test 2: Pattern Update Flow

**Goal:** Verify patterns can be modified.

**Steps:**
1. Create a pattern with initial content
2. Call operation \`update_pattern\` with new content and tags
3. Verify success response
4. Call \`get_pattern\` to verify changes persisted
5. Verify \`updatedAt\` timestamp changed

**Expected:** Partial updates work, unchanged fields preserved

---

### Test 3: Pattern Listing and Filtering Flow

**Goal:** Verify pattern discovery and search.

**Steps:**
1. Create multiple patterns with different tags
2. Call operation \`list_patterns\` with no args
3. Verify all patterns returned
4. Call \`list_patterns\` with args: { tags: ["debugging"] }
5. Verify only patterns with debugging tag returned

**Expected:** Filtering by tags and search works correctly

---

### Test 4: Pattern Tags Discovery Flow

**Goal:** Verify tag aggregation across patterns.

**Steps:**
1. Create patterns with various tags
2. Call operation \`list_tags\`
3. Verify response contains all unique tags used across patterns
4. Verify no duplicate tags in response

**Expected:** Complete tag inventory for navigation

---

### Test 5: Pattern Deletion Flow

**Goal:** Verify patterns can be removed.

**Steps:**
1. Create a test pattern
2. Verify it appears in \`list_patterns\`
3. Call operation \`delete_pattern\` with args: { id: "test-pattern" }
4. Verify success response
5. Call \`get_pattern\` - should return error "not found"

**Expected:** Pattern removed from filesystem and listings

---

## Scratchpad Tests

### Test 6: Scratchpad Write/Read Flow

**Goal:** Verify scratchpad notes can be created and read.

**Steps:**
1. Call \`knowledge\` with operation \`write_scratchpad\`, args:
   - topic: "API Design Ideas"
   - content: "## Current thinking\\n\\n- REST vs GraphQL"
2. Verify response includes note id
3. Call operation \`read_scratchpad\` with args: { id: "api-design-ideas" }
4. Verify full content returned

**Expected:** Scratchpad notes persist during session

---

### Test 7: Scratchpad Overwrite Flow

**Goal:** Verify scratchpad updates replace content.

**Steps:**
1. Create scratchpad note with initial content
2. Call \`write_scratchpad\` with same topic, different content
3. Call \`read_scratchpad\`
4. Verify content is new content (not appended)

**Expected:** Write is idempotent - same topic overwrites

---

### Test 8: Scratchpad Listing Flow

**Goal:** Verify scratchpad discovery.

**Steps:**
1. Create multiple scratchpad notes
2. Call operation \`list_scratchpad\`
3. Verify all notes returned with id, title, uri, updatedAt
4. Verify sorted by most recently updated

**Expected:** Complete scratchpad inventory

---

## Error Handling Tests

### Test 9: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Call \`create_pattern\` without required \`title\` - should error
2. Call \`get_pattern\` with nonexistent ID - should return "not found"
3. Call \`update_pattern\` with nonexistent ID - should error
4. Call unknown operation - should error with list of valid operations

**Expected:** Clear error messages, no data corruption

---

## Persistence Tests

### Test 10: Filesystem Persistence Flow

**Goal:** Verify data survives server restart.

**Steps:**
1. Create patterns and scratchpad notes
2. Note the data
3. Restart the server
4. Call \`list_patterns\` and \`list_scratchpad\`
5. Verify all previously created data still present

**Expected:** Markdown files in ~/.thoughtbox/knowledge/ persist across restarts
`
  }
} as const;

export type BehavioralTestKey = keyof typeof BEHAVIORAL_TESTS;
