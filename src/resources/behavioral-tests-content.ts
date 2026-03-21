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

**Goal:** Verify pnpm dependencies can be installed.

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
    description: "Behavioral tests for the thoughtbox_knowledge tool (12 tests covering entities, observations, relations, graph traversal, stats)",
    content: `# Knowledge Graph - Behavioral Tests

Workflows for verifying the \`thoughtbox_knowledge\` tool functions correctly.

**Tool:** \`thoughtbox_knowledge\`
**Operations:** \`knowledge_create_entity\`, \`knowledge_get_entity\`, \`knowledge_list_entities\`, \`knowledge_add_observation\`, \`knowledge_create_relation\`, \`knowledge_query_graph\`, \`knowledge_stats\`
**Entity types:** Insight, Concept, Workflow, Decision, Agent
**Relation types:** RELATES_TO, BUILDS_ON, CONTRADICTS, EXTRACTED_FROM, APPLIED_IN, LEARNED_BY, DEPENDS_ON, SUPERSEDES, MERGED_FROM

---

## Test 1: Entity Creation

**Goal:** Verify entity creation with name, type, and label.

**Steps:**
1. Call \`thoughtbox_knowledge\` with:
   \`{ operation: "knowledge_create_entity", name: "test-entity-001", type: "Concept", label: "Test Entity" }\`
2. Verify response includes:
   - \`entity_id\` (UUID)
   - \`name\` matches \`"test-entity-001"\`
   - \`type\` matches \`"Concept"\`
   - \`created_at\` (timestamp)

**Expected:** Entity created with UUID, returned with correct fields

---

## Test 2: Entity Retrieval

**Goal:** Verify entity retrieval by ID.

**Steps:**
1. Create an entity, capture the \`entity_id\`
2. Call \`{ operation: "knowledge_get_entity", entity_id: "<id>" }\`
3. Verify response includes all entity fields:
   - \`id\`, \`name\`, \`type\`, \`label\`
   - \`created_at\`, \`updated_at\`
   - \`properties\` (may be empty object)
   - \`visibility\` (default)
   - \`observations\` array (may be empty)

**Expected:** Full entity object returned with all fields

---

## Test 3: List Entities

**Goal:** Verify listing and filtering entities.

**Steps:**
1. Create 2+ entities with different types (Concept, Insight, Decision)
2. Call \`{ operation: "knowledge_list_entities" }\`
3. Verify \`count\` >= 2, \`entities\` array present
4. Call \`{ operation: "knowledge_list_entities", types: ["Concept"] }\`
5. Verify only Concept entities returned
6. Call with \`name_pattern: "test-entity"\`
7. Verify only matching entities returned

**Expected:** Unfiltered returns all; each filter narrows results correctly

---

## Test 4: Add Observation

**Goal:** Verify adding an atomic fact to an entity.

**Steps:**
1. Create an entity, capture \`entity_id\`
2. Call \`{ operation: "knowledge_add_observation", entity_id: "<id>", content: "This entity was tested" }\`
3. Verify response includes:
   - \`observation_id\` (UUID)
   - \`entity_id\` matches
   - \`added_at\` (timestamp)
4. Call \`knowledge_get_entity\` with the entity ID
5. Verify the observation appears in the entity's observations array

**Expected:** Observation attached to entity, retrievable via get_entity

---

## Test 5: Create Relation

**Goal:** Verify linking two entities with a typed relation.

**Steps:**
1. Create entity A (type: Concept) and entity B (type: Insight)
2. Call \`{ operation: "knowledge_create_relation", from_id: "<B-id>", to_id: "<A-id>", relation_type: "BUILDS_ON" }\`
3. Verify response includes:
   - \`relation_id\` (UUID)
   - \`from_id\` matches entity B
   - \`to_id\` matches entity A
   - \`type\` matches \`"BUILDS_ON"\`
   - \`created_at\` (timestamp)

**Expected:** Relation created linking the two entities directionally

---

## Test 6: Graph Traversal

**Goal:** Verify graph traversal from a start entity.

**Steps:**
1. Create entities A and B with a BUILDS_ON relation (A → B)
2. Call \`{ operation: "knowledge_query_graph", start_entity_id: "<A-id>" }\`
3. Verify response includes:
   - \`entity_count\` >= 2
   - \`relation_count\` >= 1
   - \`entities\` array containing both A and B
   - \`relations\` array containing the BUILDS_ON relation

**Expected:** Traversal discovers connected entities and relations

---

## Test 7: Graph Traversal with max_depth

**Goal:** Verify depth-limited traversal.

**Steps:**
1. Create entities A, B, C with relations A→B→C
2. Call \`{ operation: "knowledge_query_graph", start_entity_id: "<A-id>", max_depth: 1 }\`
3. Verify only A and B returned (not C)
4. Call with \`max_depth: 2\`
5. Verify A, B, and C all returned

**Expected:** max_depth limits how far traversal reaches

---

## Test 8: Graph Traversal with relation_types Filter

**Goal:** Verify traversal follows only specified relation types.

**Steps:**
1. Create entities A, B, C
2. Create relation A → B type BUILDS_ON
3. Create relation A → C type CONTRADICTS
4. Call \`{ operation: "knowledge_query_graph", start_entity_id: "<A-id>", relation_types: ["BUILDS_ON"] }\`
5. Verify B is in results but C is NOT
6. Call with \`relation_types: ["CONTRADICTS"]\`
7. Verify C is in results but B is NOT

**Expected:** Only specified relation types are traversed

---

## Test 9: Stats

**Goal:** Verify knowledge graph statistics.

**Steps:**
1. Call \`{ operation: "knowledge_stats" }\`
2. Verify response includes entity count and relation count
3. Create a new entity
4. Call \`knowledge_stats\` again
5. Verify entity count increased by 1

**Expected:** Accurate counts reflecting current graph state

---

## Test 10: Error Handling

**Goal:** Verify clear errors for invalid operations.

**Steps:**
1. Call \`knowledge_create_entity\` without required \`name\` field — should error
2. Call \`knowledge_get_entity\` with nonexistent \`entity_id\` — should error "not found"
3. Call \`knowledge_create_relation\` with nonexistent \`from_id\` — should error
4. Call \`knowledge_add_observation\` with nonexistent \`entity_id\` — should error

**Expected:** Each error is specific, actionable, and non-destructive

---

## Test 11: UNIQUE Collision on create_entity

**Goal:** Verify duplicate entity name+type returns existing entity.

**Steps:**
1. Create entity with name "collision-test", type "Concept", label "First"
2. Create entity with same name "collision-test", type "Concept", label "Second"
3. Verify second call returns the SAME entity_id as the first
4. Use \`knowledge_add_observation\` to add corroborating evidence to the existing entity

**Expected:** No error on collision; existing entity returned for deduplication

---

## Test 12: Full Workflow End-to-End

**Goal:** Verify complete knowledge graph lifecycle.

**Steps:**
1. **Create entities:**
   - Entity A: \`{ operation: "knowledge_create_entity", name: "arch-patterns", type: "Concept", label: "Architecture Patterns" }\`
   - Entity B: \`{ operation: "knowledge_create_entity", name: "microservices-insight", type: "Insight", label: "Microservices Trade-offs" }\`
   - Entity C: \`{ operation: "knowledge_create_entity", name: "monolith-decision", type: "Decision", label: "Stay Monolith" }\`
2. **Add observations:**
   - On A: \`"Common patterns include microservices, monolith, serverless"\`
   - On B: \`"Microservices add network complexity but improve team autonomy"\`
3. **Create relations:**
   - B → A: BUILDS_ON
   - C → B: BUILDS_ON
   - C → A: CONTRADICTS
4. **Query graph:**
   - From C, default depth: verify all 3 entities and 3 relations
   - From C, relation_types: ["BUILDS_ON"]: verify only B found
   - From C, max_depth: 1: verify only B found
5. **Verify stats:** entity_count >= 3, relation_count >= 3
6. **Verify consistency:**
   - \`knowledge_get_entity\` for each verifies observations attached
   - \`knowledge_list_entities\` with types: ["Decision"] returns only C

**Expected:** Complete lifecycle — create, observe, link, traverse, query, stats all consistent
`
  },
  hub: {
    name: "test-hub",
    uri: "thoughtbox://tests/hub",
    description: "Behavioral tests for the Hub multi-agent collaboration tool (6 tests covering identity registry, shared sessions, proposal review, and cross-agent workflows)",
    content: `# Hub Tool - Behavioral Tests

Workflows for verifying Hub multi-agent collaboration, with focus on the
connection-scoped identity registry that allows multiple agents to share
a single MCP session while maintaining distinct identities.

## Test 1: Multi-Agent Registration in Shared Session

**Goal:** Verify two agents can register in the same MCP session and keep distinct identities.

**Steps:**
1. Call \`thoughtbox_hub\` with operation \`register\`, args: { name: "coordinator" }
2. Note the returned agentId (call it coordId)
3. Call \`register\` again with args: { name: "auditor" }
4. Note the returned agentId (call it auditorId)
5. Call \`whoami\` with args: { agentId: coordId }
6. Call \`whoami\` with args: { agentId: auditorId }

**Expected:**
- coordId !== auditorId
- Each whoami returns the correct agent's identity
- First register becomes the session default

---

## Test 2: Per-Call Identity Override

**Goal:** Verify agents identify themselves per-call via args.agentId.

**Steps:**
1. Register "alice" and "bob" in the same session
2. Alice creates a workspace (default identity or explicit agentId)
3. Bob joins via \`join_workspace\` with args: { agentId: bobId, workspaceId: ... }
4. Bob creates a problem with args: { agentId: bobId, workspaceId: ..., title: ..., description: ... }
5. Alice posts a message with args: { agentId: aliceId, workspaceId: ..., problemId: ..., content: ... }

**Expected:** Each operation attributed to the correct agent

---

## Test 3: Cross-Agent Proposal Review (The Core Bug)

**Goal:** Verify the exact scenario that was broken — proposal review across agents sharing a session.

**Steps:**
1. Register "coordinator" and "auditor" in the same session
2. Coordinator creates workspace and problem
3. Auditor joins, claims problem, and creates a proposal
4. Coordinator reviews the proposal with args: { agentId: coordId, ..., verdict: "approve" }
5. Coordinator merges the proposal

**Expected:**
- Review succeeds (no self-review error)
- Merge succeeds (coordinator is recognized as coordinator, not auditor)
- Problem status becomes "resolved"
- Proposal status becomes "merged"

---

## Test 4: Unregistered Agent ID Rejection

**Goal:** Verify the anti-spoofing guard rejects unknown agentIds.

**Steps:**
1. Register "alice" in a session
2. Call \`whoami\` with args: { agentId: "fake-agent-id" }

**Expected:** Error: "Agent fake-agent-id not registered in this session. Call register first."

---

## Test 5: quick_join Identity Registration

**Goal:** Verify quick_join adds the agent to the session identity registry.

**Steps:**
1. Register "coordinator", create a workspace
2. Call \`quick_join\` with args: { name: "debugger", workspaceId: ... }
3. Call \`whoami\` with args: { agentId: debuggerAgentId }
4. Debugger creates a problem using its own agentId

**Expected:**
- quick_join returns a distinct agentId
- Debugger can use its agentId in subsequent calls
- Operations are attributed to the debugger, not the coordinator

---

## Test 6: Env-Var Agent Coexistence

**Goal:** Verify env-var-resolved agents coexist with dynamically registered agents.

**Steps:**
1. Create handler with envAgentId and envAgentName set
2. Verify env agent can call \`whoami\` without explicit register
3. Register a second agent ("sub-agent") in the same session
4. Sub-agent calls operations with args: { agentId: subAgentId }
5. Env agent calls operations with args: { agentId: envAgentId }

**Expected:** Both agents operate independently, neither overwrites the other
`
  }
} as const;

export type BehavioralTestKey = keyof typeof BEHAVIORAL_TESTS;
