# 04 — thoughtbox_knowledge

Stage: STAGE_1_INIT_COMPLETE (requires init)
Operations: knowledge_create_entity, knowledge_get_entity, knowledge_list_entities, knowledge_add_observation, knowledge_create_relation, knowledge_query_graph, knowledge_stats
Entity types: Insight, Concept, Workflow, Decision, Agent
Relation types: RELATES_TO, BUILDS_ON, CONTRADICTS, EXTRACTED_FROM, APPLIED_IN, LEARNED_BY, DEPENDS_ON, SUPERSEDES, MERGED_FROM

---

## Test 1: Entity Creation

**Goal:** Verify entity creation with name, type, and label.

**Steps:**
1. Call `thoughtbox_knowledge { operation: "knowledge_create_entity", name: "test-entity-001", type: "Concept", label: "Test Entity" }`
2. Verify response includes `entity_id` (UUID), `name`, `type`, `created_at`

**Expected:** Entity created with UUID, correct fields returned

---

## Test 2: Entity Retrieval

**Goal:** Verify entity retrieval by ID.

**Steps:**
1. Create an entity, capture `entity_id`
2. Call `{ operation: "knowledge_get_entity", entity_id: "<id>" }`
3. Verify all fields: `id`, `name`, `type`, `label`, `created_at`, `updated_at`, `properties`, `visibility`, `observations`

**Expected:** Full entity object with all fields

---

## Test 3: List and Filter Entities

**Goal:** Verify listing and filtering.

**Steps:**
1. Create entities with different types (Concept, Insight, Decision)
2. Call `{ operation: "knowledge_list_entities" }` — verify all returned
3. Call with `types: ["Concept"]` — verify only Concepts
4. Call with `name_pattern: "test-entity"` — verify substring match

**Expected:** Filters narrow results correctly

---

## Test 4: Add Observation

**Goal:** Verify attaching observations to entities.

**Steps:**
1. Create entity, capture `entity_id`
2. Call `{ operation: "knowledge_add_observation", entity_id: "<id>", content: "This entity was tested" }`
3. Verify response includes `observation_id`, `entity_id`, `added_at`
4. Call `knowledge_get_entity` — verify observation in observations array

**Expected:** Observation attached, retrievable via get_entity

---

## Test 5: Create Relation

**Goal:** Verify directed relations between entities.

**Steps:**
1. Create entity A (Concept) and entity B (Insight)
2. Call `{ operation: "knowledge_create_relation", from_id: "<B-id>", to_id: "<A-id>", relation_type: "BUILDS_ON" }`
3. Verify response includes `relation_id`, `from_id`, `to_id`, `type`

**Expected:** Directed relation created linking the two entities

---

## Test 6: Graph Traversal

**Goal:** Verify graph traversal from a start entity.

**Steps:**
1. Create entities A, B with BUILDS_ON relation (A → B)
2. Call `{ operation: "knowledge_query_graph", start_entity_id: "<A-id>" }`
3. Verify response includes both entities and the relation
4. Note: query_graph only follows OUTGOING relations

**Expected:** Connected entities and relations discovered

---

## Test 7: Depth-Limited Traversal

**Goal:** Verify max_depth limits traversal.

**Steps:**
1. Create chain A → B → C
2. Call with `start_entity_id: "<A-id>", max_depth: 1` — verify only A and B
3. Call with `max_depth: 2` — verify A, B, and C

**Expected:** Depth limit respected

---

## Test 8: Relation Type Filter

**Goal:** Verify traversal follows only specified types.

**Steps:**
1. Create A → B (BUILDS_ON) and A → C (CONTRADICTS)
2. Call with `start_entity_id: "<A-id>", relation_types: ["BUILDS_ON"]`
3. Verify B found, C not found

**Expected:** Only specified relation types traversed

---

## Test 9: Graph Stats

**Goal:** Verify aggregate statistics.

**Steps:**
1. Call `{ operation: "knowledge_stats" }`
2. Verify entity count and relation count present
3. Create a new entity
4. Call stats again — verify count increased

**Expected:** Accurate counts reflecting current graph state

---

## Test 10: UNIQUE Collision

**Goal:** Verify duplicate name+type returns existing entity.

**Steps:**
1. Create entity with name "collision-test", type "Concept"
2. Create again with same name and type but different label
3. Verify same `entity_id` returned both times

**Expected:** No error; existing entity returned for deduplication

---

## Test 11: Error Handling

**Goal:** Verify clear errors for invalid operations.

**Steps:**
1. `knowledge_get_entity` with nonexistent ID — should error "not found"
2. `knowledge_create_relation` with nonexistent `from_id` — should error
3. `knowledge_add_observation` with nonexistent `entity_id` — should error

**Expected:** Specific, actionable errors

---

## Test 12: End-to-End Workflow

**Goal:** Complete knowledge graph lifecycle.

**Steps:**
1. Create 3 entities (Concept, Insight, Decision)
2. Add observations to each
3. Create relations: Insight BUILDS_ON Concept, Decision BUILDS_ON Insight, Decision CONTRADICTS Concept
4. Query graph from Decision — verify all 3 entities and 3 relations
5. Verify stats match
6. List entities with type filter — verify correct results

**Expected:** Full lifecycle consistent
