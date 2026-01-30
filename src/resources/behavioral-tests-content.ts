/**
 * Behavioral test specifications for Thoughtbox MCP tools.
 * Served as both prompts (slash commands) and resources (URIs).
 */

export const BEHAVIORAL_TESTS = {
  thoughtbox: {
    name: "test-thoughtbox",
    uri: "thoughtbox://tests/thoughtbox",
    description: "Behavioral tests for the thoughtbox thinking tool (17 tests covering forward/backward thinking, branching, revisions, linked structure, auto-assignment)",
    content: `# Thoughtbox Tool - Behavioral Tests

Workflows for Claude to execute when verifying the thoughtbox thinking tool functions correctly.

**Response Modes:** Default responses are minimal (thoughtNumber, sessionId). Set \`verbose: true\` to get full metadata including branches, revisions, and guides. Session exports always include full linked structure.

## Test 1: Basic Forward Thinking Flow

**Goal:** Verify sequential thought progression works.

**Steps:**
1. Call \`thoughtbox\` with thought 1 of 3, nextThoughtNeeded: true
2. Verify response includes thoughtNumber, totalThoughts, nextThoughtNeeded
3. Call thought 2 of 3
4. Call thought 3 of 3 with nextThoughtNeeded: false
5. Verify patterns cookbook is embedded at thought 1 (guide only at thought 1 or when \`includeGuide: true\`)

**Expected:** Clean progression with guide at thought 1

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
4. Set \`verbose: true\` and verify response includes both branches in branches array
5. Create synthesis thought 5

**Expected:** Multiple branches tracked, visible in verbose responses

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

## Test 7: Validation Flow (SIL-102)

**Goal:** Verify input validation and auto-assignment behavior.

**Steps:**
1. Call without required field (thought) - should error
2. Call without thoughtNumber - should auto-assign and succeed
3. Verify thoughtNumber is assigned sequentially when omitted
4. Call with thoughtNumber > totalThoughts - should auto-adjust totalThoughts
5. Call with invalid types - should error with clear message

**Expected:** Clear validation errors, auto-assignment for forward reasoning, graceful edge case handling

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

---

## Test 16: Backward Thinking Requires Explicit thoughtNumber (SIL-102)

**Goal:** Verify backward reasoning (N→1) requires explicit thought numbers.

**Steps:**
1. Create thought with \`thoughtNumber: 5, totalThoughts: 5\`
2. Create thought with \`thoughtNumber: 4, totalThoughts: 5\`
3. Omit thoughtNumber on next call - verify auto-assignment gives 6 (not 3)
4. Verify backward progression requires explicit numbers to work correctly

**Expected:** Auto-assignment always increments. Backward thinking needs explicit control.

---

## Test 17: Sparse Thought Gaps Work with Explicit Numbers (SIL-102)

**Goal:** Verify sparse reasoning patterns work with explicit thought numbers.

**Steps:**
1. Create thought 1 of 10 (explicit)
2. Create thought 5 of 10 (explicit - skipping 2-4)
3. Create thought 8 of 10 (explicit - skipping 6-7)
4. Omit thoughtNumber - verify auto-assignment gives 9 (next sequential)
5. Verify chain maintains sparse pattern: 1→5→8→9

**Expected:** Explicit numbers allow gaps. Auto-assignment picks up from highest.
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
    name: "test-knowledge",
    uri: "thoughtbox://tests/knowledge",
    description: "Behavioral tests for the knowledge graph toolhost (12 tests covering entities, relations, observations, graph queries)",
    content: `# Knowledge Graph - Behavioral Tests

Workflows for Claude to execute when verifying the knowledge graph functions correctly.

The Knowledge Graph stores structured information as entities, relations, and observations that can be traversed and queried.

**Available Operations:** \`create_entity\`, \`get_entity\`, \`list_entities\`, \`add_observation\`, \`create_relation\`, \`query_graph\`, \`stats\`

**Entity Types:** Insight, Concept, Workflow, Decision, Agent

**Relation Types:** RELATES_TO, BUILDS_ON, CONTRADICTS, EXTRACTED_FROM, APPLIED_IN, LEARNED_BY, DEPENDS_ON, SUPERSEDES, MERGED_FROM

---

## Entity Tests

### Test 1: Entity Creation Flow

**Goal:** Verify entities can be created with different types.

**Steps:**
1. Call \`knowledge\` with action \`create_entity\`, args:
   - name: "test-insight-001"
   - type: "Insight"
   - label: "Always validate input at boundaries"
   - properties: { domain: "security", confidence: 0.9 }
2. Verify response includes entity_id, name, type, created_at
3. Create another entity with type "Concept"
4. Verify both entity types work

**Expected:** Entities created with unique IDs, retrievable by ID

---

### Test 2: Entity Retrieval Flow

**Goal:** Verify entities can be retrieved by ID.

**Steps:**
1. Create an entity and capture entity_id from response
2. Call action \`get_entity\` with args: { entity_id: "<captured-id>" }
3. Verify response includes full entity with all fields:
   - id, name, type, label, properties
   - created_at, updated_at, created_by
   - visibility, access_count, importance_score

**Expected:** Full entity data returned with metadata

---

### Test 3: Entity Listing and Filtering Flow

**Goal:** Verify entity discovery with filters.

**Steps:**
1. Create multiple entities with different types (Insight, Concept, Workflow)
2. Call action \`list_entities\` with no filters
3. Verify all entities returned with count
4. Call \`list_entities\` with args: { types: ["Insight"] }
5. Verify only Insight entities returned
6. Call \`list_entities\` with args: { name_pattern: "test-" }
7. Verify only entities matching pattern returned

**Expected:** Filtering by type and name pattern works

---

### Test 4: Observation Addition Flow

**Goal:** Verify observations can be added to entities.

**Steps:**
1. Create an entity
2. Call action \`add_observation\` with args:
   - entity_id: "<captured-id>"
   - content: "This pattern was successfully applied in session ABC"
   - source_session: "abc-123"
3. Verify response includes observation_id, entity_id, added_at
4. Add another observation to same entity
5. Get entity and verify observations are accumulated

**Expected:** Multiple observations can be added, tracked by timestamp

---

## Relation Tests

### Test 5: Relation Creation Flow

**Goal:** Verify relations can link entities.

**Steps:**
1. Create two entities (entity A and entity B)
2. Call action \`create_relation\` with args:
   - from_id: "<entity-a-id>"
   - to_id: "<entity-b-id>"
   - relation_type: "BUILDS_ON"
   - properties: { strength: 0.8 }
3. Verify response includes relation_id, from_id, to_id, type, created_at
4. Create another relation with type "CONTRADICTS"
5. Verify different relation types work

**Expected:** Relations created with typed edges between entities

---

### Test 6: Graph Query Flow

**Goal:** Verify graph traversal works with depth limits.

**Steps:**
1. Create a chain: Entity A → Entity B → Entity C
   - Create 3 entities
   - Create relation A→B (BUILDS_ON)
   - Create relation B→C (BUILDS_ON)
2. Call action \`query_graph\` with args:
   - start_entity_id: "<entity-a-id>"
   - max_depth: 2
3. Verify response includes:
   - entity_count: 3
   - relation_count: 2
   - entities array with all 3 entities
   - relations array with both relations

**Expected:** Traversal follows edges up to max_depth

---

### Test 7: Multi-Hop Graph Query

**Goal:** Verify complex graph traversal.

**Steps:**
1. Create a tree structure:
   - Root entity R
   - R → A (BUILDS_ON)
   - R → B (BUILDS_ON)
   - A → C (DEPENDS_ON)
   - B → D (DEPENDS_ON)
2. Query from R with max_depth: 2
3. Verify all 5 entities discovered
4. Verify all 4 relations discovered
5. Query with max_depth: 1
6. Verify only R, A, B discovered (depth limit enforced)

**Expected:** Breadth-first traversal with configurable depth

---

### Test 8: Stats Operation Flow

**Goal:** Verify graph statistics are accurate.

**Steps:**
1. Call action \`stats\` with no args
2. Verify response includes entity count and relation count
3. Create several entities and relations
4. Call \`stats\` again
5. Verify counts increased correctly

**Expected:** Real-time statistics reflect current graph state

---

## Error Handling Tests

### Test 9: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Call \`create_entity\` without required field (name) - should error
2. Call \`create_entity\` without type - should error
3. Call \`get_entity\` with nonexistent entity_id - should error "Entity not found"
4. Call \`create_relation\` with invalid from_id - should error
5. Call unknown action - should error with available actions list

**Expected:** Clear error messages, validation prevents bad data

---

## Advanced Query Tests

### Test 10: Relation Type Filtering

**Goal:** Verify queries can filter by relation type.

**Steps:**
1. Create entities A, B, C, D
2. Create relations:
   - A → B (BUILDS_ON)
   - A → C (CONTRADICTS)
   - A → D (RELATES_TO)
3. Query from A with relation_types: ["BUILDS_ON"]
4. Verify only B discovered (not C or D)
5. Query with relation_types: ["BUILDS_ON", "CONTRADICTS"]
6. Verify B and C discovered (not D)

**Expected:** Relation type filters control traversal

---

## Persistence Tests

### Test 11: Data Persistence Flow

**Goal:** Verify data survives across sessions.

**Steps:**
1. Create entities and relations
2. Note the entity IDs
3. Restart the server (if testing across restarts)
4. Call \`list_entities\` and verify previous entities still present
5. Call \`get_entity\` with previous IDs and verify data intact

**Expected:** SQLite database persists entities and relations

---

### Test 12: Complex Knowledge Structure

**Goal:** Verify realistic knowledge graph usage.

**Steps:**
1. Create a learning scenario:
   - Insight entity: "Orchestrator pattern reduces coupling"
   - Concept entity: "Message Queue"
   - Workflow entity: "Async Processing Pattern"
   - Decision entity: "Use RabbitMQ over Kafka for this project"
2. Create relations:
   - Insight BUILDS_ON Concept
   - Workflow DEPENDS_ON Concept
   - Decision APPLIED_IN Workflow
   - Insight EXTRACTED_FROM session_123
3. Add observations to Insight:
   - "Successfully used in project X"
   - "Reduced latency by 40%"
4. Query from Concept with max_depth: 2
5. Verify entire knowledge cluster discovered

**Expected:** Complex graphs support real-world knowledge modeling
`
  }
} as const;

export type BehavioralTestKey = keyof typeof BEHAVIORAL_TESTS;
