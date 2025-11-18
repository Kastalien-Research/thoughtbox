# Memory Tools - Behavioral Tests

Workflows for Claude to execute when verifying the knowledge graph memory tools function correctly.

## Test 1: Entity Creation Flow

**Goal:** Verify entities can be created and retrieved.

**Steps:**
1. Call `memory_create_entities` with entities array:
   ```json
   [{
     "name": "test_project",
     "entityType": "project",
     "observations": ["A test project for behavioral tests", "Created for verification"]
   }]
   ```
2. Verify success response
3. Call `memory_read_graph`
4. Verify entity appears in graph with correct type and observations

**Expected:** Entity persisted, retrievable

---

## Test 2: Relation Creation Flow

**Goal:** Verify relations connect entities.

**Steps:**
1. Create two entities: "entity_a" and "entity_b"
2. Call `memory_create_relations` with:
   ```json
   [{ "from": "entity_a", "to": "entity_b", "relationType": "depends_on" }]
   ```
3. Call `memory_read_graph`
4. Verify relation appears with correct from/to/type

**Expected:** Directed relation created between entities

---

## Test 3: Search Flow

**Goal:** Verify search finds relevant entities.

**Steps:**
1. Create entities with different types and observations
2. Call `memory_search_nodes` with query matching one entity's name
3. Verify only matching entity returned
4. Search by observation content
5. Verify entities with matching observations returned

**Expected:** Search matches names, types, and observation content

---

## Test 4: Open Nodes Flow

**Goal:** Verify retrieving specific entities with relations.

**Steps:**
1. Create entities A, B, C with relations A→B, B→C
2. Call `memory_open_nodes` with names: ["entity_b"]
3. Verify entity B returned with its observations
4. Verify related entities or relations included in response

**Expected:** Targeted retrieval with relationship context

---

## Test 5: Add Observations Flow

**Goal:** Verify observations can be added to existing entities.

**Steps:**
1. Create entity with initial observations
2. Call `memory_add_observations` with:
   ```json
   [{ "entityName": "test_entity", "contents": ["New observation 1", "New observation 2"] }]
   ```
3. Call `memory_open_nodes` for that entity
4. Verify both old and new observations present

**Expected:** Observations append, don't replace

---

## Test 6: Delete Observations Flow

**Goal:** Verify specific observations can be removed.

**Steps:**
1. Create entity with multiple observations
2. Call `memory_delete_observations` with exact observation string to remove
3. Verify that observation gone, others remain

**Expected:** Surgical removal of specific facts

---

## Test 7: Delete Relations Flow

**Goal:** Verify relations can be removed.

**Steps:**
1. Create entities and relations
2. Call `memory_delete_relations` with exact relation to remove
3. Call `memory_read_graph`
4. Verify relation gone, entities still exist

**Expected:** Relation removed without affecting entities

---

## Test 8: Delete Entities Flow

**Goal:** Verify entities and their relations are removed.

**Steps:**
1. Create entities A, B with relation A→B
2. Call `memory_delete_entities` with entityNames: ["entity_a"]
3. Call `memory_read_graph`
4. Verify entity A gone
5. Verify relation A→B also gone (cascade)
6. Verify entity B still exists

**Expected:** Entity deletion cascades to relations

---

## Test 9: Persistence Flow

**Goal:** Verify data survives across sessions.

**Steps:**
1. Create entities and relations
2. Note the data
3. Restart the server (or start new session)
4. Call `memory_read_graph`
5. Verify all previously created data still present

**Expected:** JSONL persistence works, data survives restart

---

## Test 10: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Try to add observations to nonexistent entity
2. Try to create relation with nonexistent entity
3. Try to delete nonexistent entity

**Expected:** Clear error messages, no corruption of existing data

---

## Running These Tests

Execute by calling `memory_*` MCP tools. Data persists to ~/.thoughtbox/memory.jsonl by default. For clean slate, delete that file before testing.
