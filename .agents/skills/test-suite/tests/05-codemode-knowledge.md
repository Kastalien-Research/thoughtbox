# 05 — Knowledge Graph via `tb.knowledge.*`

Purpose: Verify entity CRUD, observations, relations, graph traversal, and stats through Code Mode.

---

## Test 1: Entity Creation and Retrieval

**Goal:** Verify entity lifecycle.

**Steps:**
1. Call:
   ```js
   async () => {
     const created = await tb.knowledge.createEntity({ name: "test-concept-001", type: "Concept", label: "Test Concept" });
     const retrieved = await tb.knowledge.getEntity(created.entity_id);
     return { created, retrieved };
   }
   ```
2. Verify `created` has `entity_id`, `name`, `type`
3. Verify `retrieved` matches created entity

**Expected:** Entity created with UUID, retrievable by ID.

---

## Test 2: List and Filter Entities

**Goal:** Verify listing and type filtering.

**Steps:**
1. Call:
   ```js
   async () => {
     await tb.knowledge.createEntity({ name: "test-insight-001", type: "Insight", label: "Test Insight" });
     await tb.knowledge.createEntity({ name: "test-decision-001", type: "Decision", label: "Test Decision" });
     const all = await tb.knowledge.listEntities();
     const concepts = await tb.knowledge.listEntities({ types: ["Concept"] });
     return { allCount: all.count ?? all.entities?.length, conceptCount: concepts.count ?? concepts.entities?.length };
   }
   ```
2. Verify `conceptCount < allCount`

**Expected:** Type filter narrows results.

---

## Test 3: Add Observation

**Goal:** Verify attaching observations to entities.

**Steps:**
1. Call:
   ```js
   async () => {
     const entity = await tb.knowledge.createEntity({ name: "test-obs-entity", type: "Concept", label: "Observable" });
     const obs = await tb.knowledge.addObservation({ entity_id: entity.entity_id, content: "This entity was observed during testing" });
     const retrieved = await tb.knowledge.getEntity(entity.entity_id);
     return { obs, retrieved };
   }
   ```
2. Verify observation was created (`obs` has `observation_id`)
3. Check if `retrieved` includes the observation

**Expected:** Observation attached. If `getEntity` doesn't return observations, note as known gap.

---

## Test 4: Create Relations and Traverse Graph

**Goal:** Verify directed relations and graph traversal.

**Steps:**
1. Call:
   ```js
   async () => {
     const a = await tb.knowledge.createEntity({ name: "graph-node-a", type: "Concept", label: "Node A" });
     const b = await tb.knowledge.createEntity({ name: "graph-node-b", type: "Insight", label: "Node B" });
     const c = await tb.knowledge.createEntity({ name: "graph-node-c", type: "Decision", label: "Node C" });
     const rel1 = await tb.knowledge.createRelation({ from_id: a.entity_id, to_id: b.entity_id, relation_type: "BUILDS_ON" });
     const rel2 = await tb.knowledge.createRelation({ from_id: b.entity_id, to_id: c.entity_id, relation_type: "BUILDS_ON" });
     const graph = await tb.knowledge.queryGraph({ start_entity_id: a.entity_id, max_depth: 2 });
     return { rel1, rel2, graph };
   }
   ```
2. Verify graph contains all 3 entities and 2 relations

**Expected:** A → B → C traversal works.

---

## Test 5: Graph Stats

**Goal:** Verify aggregate statistics.

**Steps:**
1. Call:
   ```js
   async () => {
     const stats = await tb.knowledge.stats();
     return stats;
   }
   ```
2. Verify entity count and relation count present and > 0

**Expected:** Accurate counts reflecting current graph state.
