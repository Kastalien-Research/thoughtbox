# Knowledge Graph - Behavioral Tests

Workflows for verifying the `thoughtbox_gateway` knowledge graph operations.

**Replaces:** `memory-behavioral.md` (outdated patterns/scratchpad API)

**Tool:** `thoughtbox_gateway`
**Operation:** `knowledge` (with sub-action via `args.action`)
**Required stage:** Stage 2 (cipher_loaded)
**Actions:** `create_entity`, `get_entity`, `list_entities`, `add_observation`, `create_relation`, `query_graph`, `stats`

**Entity types:** `Insight`, `Concept`, `Workflow`, `Decision`, `Agent`
**Relation types:** `RELATES_TO`, `BUILDS_ON`, `CONTRADICTS`, `EXTRACTED_FROM`, `APPLIED_IN`, `LEARNED_BY`, `DEPENDS_ON`, `SUPERSEDES`, `MERGED_FROM`

---

## KG-001: create_entity

**Goal:** Verify entity creation with name, type, and label.

**Prerequisite:** Stage 2.

**Steps:**
1. Advance to Stage 2 (start_new → cipher)
2. Call `{ operation: "knowledge", args: { action: "create_entity", name: "test-entity-001", type: "Concept", label: "Test Entity" } }`
3. Verify response includes:
   - `entity_id` (UUID)
   - `name` matches `"test-entity-001"`
   - `type` matches `"Concept"`
   - `created_at` (timestamp)
4. Verify no error

**Expected:** Entity created with UUID, returned with correct fields

---

## KG-002: get_entity

**Goal:** Verify entity retrieval by ID.

**Prerequisite:** An entity exists (from KG-001).

**Steps:**
1. Advance to Stage 2
2. Create an entity, capture the `entity_id`
3. Call `{ operation: "knowledge", args: { action: "get_entity", entity_id: "<id>" } }`
4. Verify response includes all entity fields:
   - `id`, `name`, `type`, `label`
   - `created_at`, `updated_at`
   - `properties` (may be empty object)
   - `visibility` (default)
   - `observations` array (may be empty)

**Expected:** Full entity object returned with all fields

---

## KG-003: list_entities

**Goal:** Verify listing all entities.

**Prerequisite:** At least 2 entities exist.

**Steps:**
1. Advance to Stage 2
2. Create 2+ entities with different types
3. Call `{ operation: "knowledge", args: { action: "list_entities" } }`
4. Verify response includes:
   - `count` (integer ≥ 2)
   - `entities` array
   - Each entity has `id`, `name`, `type`, `label`

**Expected:** All entities returned with summaries

---

## KG-004: list_entities with Filters

**Goal:** Verify filtering by types, visibility, name_pattern, and date range.

**Prerequisite:** Multiple entities of different types exist.

**Steps:**
1. Advance to Stage 2
2. Create entities: one `Concept`, one `Insight`, one `Decision`
3. Call `{ operation: "knowledge", args: { action: "list_entities", types: ["Concept"] } }`
4. Verify only Concept entities returned
5. Call with `{ action: "list_entities", name_pattern: "test-entity" }`
6. Verify only entities matching the pattern returned
7. Call with `{ action: "list_entities", visibility: "public" }`
8. Verify visibility filter works

**Expected:** Each filter narrows results correctly

---

## KG-005: add_observation

**Goal:** Verify adding an atomic fact to an entity.

**Prerequisite:** An entity exists.

**Steps:**
1. Advance to Stage 2
2. Create an entity, capture `entity_id`
3. Call `{ operation: "knowledge", args: { action: "add_observation", entity_id: "<id>", content: "This entity was tested on 2025-01-01" } }`
4. Verify response includes:
   - `observation_id` (UUID)
   - `entity_id` matches
   - `added_at` (timestamp)
5. Call `get_entity` with the entity ID
6. Verify the observation appears in the entity's observations array

**Expected:** Observation attached to entity, retrievable via get_entity

---

## KG-006: create_relation

**Goal:** Verify linking two entities with a typed relation.

**Prerequisite:** Two entities exist.

**Steps:**
1. Advance to Stage 2
2. Create entity A (type: `Concept`, name: `"base-concept"`)
3. Create entity B (type: `Insight`, name: `"derived-insight"`)
4. Call `{ operation: "knowledge", args: { action: "create_relation", from_id: "<entity-B-id>", to_id: "<entity-A-id>", relation_type: "BUILDS_ON" } }`
5. Verify response includes:
   - `relation_id` (UUID)
   - `from_id` matches entity B
   - `to_id` matches entity A
   - `type` matches `"BUILDS_ON"`
   - `created_at` (timestamp)

**Expected:** Relation created linking the two entities directionally

---

## KG-007: query_graph Basic Traversal

**Goal:** Verify graph traversal from a start entity.

**Prerequisite:** At least 2 entities linked by a relation.

**Steps:**
1. Advance to Stage 2
2. Create entities A → B (A BUILDS_ON B via relation)
3. Call `{ operation: "knowledge", args: { action: "query_graph", start_entity_id: "<entity-A-id>" } }`
4. Verify response includes:
   - `entity_count` (≥ 2, including start entity)
   - `relation_count` (≥ 1)
   - `entities` array containing both A and B
   - `relations` array containing the BUILDS_ON relation

**Expected:** Traversal discovers connected entities and relations

---

## KG-008: query_graph with max_depth

**Goal:** Verify depth-limited traversal.

**Prerequisite:** A chain of 3+ linked entities (A → B → C).

**Steps:**
1. Advance to Stage 2
2. Create entities A, B, C with relations A→B→C
3. Call `{ operation: "knowledge", args: { action: "query_graph", start_entity_id: "<A-id>", max_depth: 1 } }`
4. Verify only A and B returned (not C — depth limited to 1 hop)
5. Call with `max_depth: 2`
6. Verify A, B, and C all returned

**Expected:** max_depth limits how far traversal reaches

---

## KG-009: query_graph with relation_types Filter

**Goal:** Verify traversal follows only specified relation types.

**Prerequisite:** Entities with different relation types.

**Steps:**
1. Advance to Stage 2
2. Create entities A, B, C
3. Create relation A → B type `BUILDS_ON`
4. Create relation A → C type `CONTRADICTS`
5. Call `{ operation: "knowledge", args: { action: "query_graph", start_entity_id: "<A-id>", relation_types: ["BUILDS_ON"] } }`
6. Verify B is in results but C is NOT (only BUILDS_ON followed)
7. Call with `relation_types: ["CONTRADICTS"]`
8. Verify C is in results but B is NOT

**Expected:** Only specified relation types are traversed

---

## KG-010: stats

**Goal:** Verify knowledge graph statistics.

**Prerequisite:** Some entities and relations exist.

**Steps:**
1. Advance to Stage 2
2. Call `{ operation: "knowledge", args: { action: "stats" } }`
3. Verify response includes:
   - Entity count (integer ≥ 0)
   - Relation count (integer ≥ 0)
4. Create a new entity
5. Call `stats` again
6. Verify entity count increased by 1

**Expected:** Accurate counts reflecting current graph state

---

## KG-011: Error Handling

**Goal:** Verify clear errors for invalid operations.

**Steps:**
1. Advance to Stage 2
2. Call `create_entity` without required `name` field
3. Verify error message specifies which field is missing
4. Call `get_entity` with nonexistent `entity_id: "nonexistent-uuid"`
5. Verify "not found" error (not a crash)
6. Call `create_relation` with nonexistent `from_id`
7. Verify error indicates entity not found
8. Call `add_observation` with nonexistent `entity_id`
9. Verify error indicates entity not found

**Expected:** Each error is specific, actionable, and non-destructive

---

## KG-012: Full Workflow End-to-End

**Goal:** Verify complete knowledge graph lifecycle.

**Steps:**
1. Advance to Stage 2
2. **Create entities:**
   - Entity A: `{ action: "create_entity", name: "architecture-patterns", type: "Concept", label: "Architecture Patterns" }`
   - Entity B: `{ action: "create_entity", name: "microservices-insight", type: "Insight", label: "Microservices Trade-offs" }`
   - Entity C: `{ action: "create_entity", name: "monolith-decision", type: "Decision", label: "Stay Monolith for Now" }`
3. **Add observations:**
   - On entity A: `"Common patterns include microservices, monolith, serverless"`
   - On entity B: `"Microservices add network complexity but improve team autonomy"`
4. **Create relations:**
   - B → A: `BUILDS_ON` (insight builds on concept)
   - C → B: `BUILDS_ON` (decision builds on insight)
   - C → A: `CONTRADICTS` (decision contradicts broader patterns)
5. **Query graph:**
   - From entity C, default depth: verify all 3 entities and all 3 relations found
   - From entity C, `relation_types: ["BUILDS_ON"]`: verify only B found (not A via CONTRADICTS)
   - From entity C, `max_depth: 1`: verify only B found (not A at depth 2)
6. **Verify stats:**
   - Call `stats`, verify entity_count ≥ 3, relation_count ≥ 3
7. **Verify consistency:**
   - `get_entity` for each entity verifies observations are attached
   - `list_entities` with `types: ["Decision"]` returns only entity C

**Expected:** Complete lifecycle works — create, observe, link, traverse, query, stats all consistent

---

## Running These Tests

All knowledge tests require Stage 2 (cipher loaded). Execute by calling `thoughtbox_gateway` with `operation: "knowledge"` and action in `args.action`.

**Clean slate:** Knowledge graph is persistent. For isolated testing, use unique entity names per test run (e.g., include timestamp in name).
