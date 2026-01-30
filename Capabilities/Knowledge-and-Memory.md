 # Knowledge Graph and Memory
 
 Thoughtbox includes a lightweight knowledge graph for structured memory. It is accessed through the `knowledge` operation on `thoughtbox_gateway`.
 
 ## Operations
 
 - `create_entity`: create a typed entity with properties
 - `get_entity`: retrieve entity by ID
 - `list_entities`: list entities with filters
 - `add_observation`: append observations/facts to an entity
 - `create_relation`: link entities with typed edges
 - `query_graph`: traverse the graph from a starting entity
 - `stats`: entity/relation/observation counts
 
 ## Storage model
 
 - JSONL append-only source of truth (`graph.jsonl`)
 - SQLite index for query performance (`memory.db`)
 - Project-scoped storage under `~/.thoughtbox/projects/{project}/memory/`
 
 ## Data types
 
 - Entities: `id`, `name`, `type`, `label`, `properties`, `created_at`, `updated_at`, `visibility`
 - Observations: `id`, `entity_id`, `content`, `source_session`, `added_at`
 - Relations: `id`, `from_id`, `to_id`, `type`, `properties`
 
 ## Resources and tests
 
 - `thoughtbox://knowledge/stats` — graph statistics resource
 - `test-memory` / `thoughtbox://tests/knowledge` — behavioral tests
