# ADR 006: Mental Models and Knowledge Architecture

## Status
Verified

## Context
The `src/mental-models` and `src/knowledge` directories implement cognitive tools for the agent: structured reasoning scaffolds (mental models) and persistent long-term memory (knowledge graph).

## Architecture

### 1. Mental Models System
The Mental Models system provides structured prompts to guide agent reasoning.

-   **Handler**: `MentalModelsHandler` manages the lifecycle and tool operations [Source: `src/mental-models/index.ts:34`] [Status: VERIFIED].
-   **Filesystem Sync**: Models are synced to `~/.thoughtbox/mental-models` for inspection and reference. The sync process creates tag-based directories and writes models as Markdown files with frontmatter [Source: `src/mental-models/index.ts:46-73`] [Status: VERIFIED].
-   **Resource Access**: Models are exposed as MCP resources via the `thoughtbox://mental-models` URI scheme.
    -   Root: `thoughtbox://mental-models` (JSON listing)
    -   Tag: `thoughtbox://mental-models/{tag}` (JSON listing)
    -   Model: `thoughtbox://mental-models/{tag}/{model}` (Markdown content) [Source: `src/mental-models/index.ts:570-663`] [Status: VERIFIED].
-   **Tool Operations**: `get_model`, `list_models`, `list_tags`, and `get_capability_graph` allow agents to discover and retrieve models [Source: `src/mental-models/index.ts:86-94`] [Status: VERIFIED].

### 2. Knowledge Graph System
The Knowledge Graph system provides persistent storage for entities, relations, and observations.

-   **Dual Storage Architecture**:
    1.  **JSONL (Source of Truth)**: An append-only log (`graph.jsonl`) ensures data durability and git-trackability [Source: `src/knowledge/storage.ts:5`] [Status: VERIFIED].
    2.  **SQLite (Query Index)**: A `better-sqlite3` database (`memory.db`) is rebuilt from the JSONL log on initialization to support efficient querying [Source: `src/knowledge/storage.ts:6`] [Status: VERIFIED].
-   **Schema**:
    -   **Entities**: Nodes in the graph (id, name, type, properties) [Source: `src/knowledge/storage.ts:114-131`] [Status: VERIFIED].
    -   **Relations**: Edges between entities (from_id, to_id, type) [Source: `src/knowledge/storage.ts:138-148`] [Status: VERIFIED].
    -   **Observations**: Facts or notes attached to entities [Source: `src/knowledge/storage.ts:154-165`] [Status: VERIFIED].
-   **Operations**:
    -   **CRUD**: `createEntity`, `createRelation`, `addObservation` write to both JSONL and SQLite [Source: `src/knowledge/storage.ts:294`, `452`, `537`] [Status: VERIFIED].
    -   **Traversal**: `traverseGraph` performs BFS traversal to explore the graph [Source: `src/knowledge/storage.ts:603-635`] [Status: VERIFIED].
    -   **Search**: `listEntities` supports filtering by type, visibility, name pattern, and date [Source: `src/knowledge/storage.ts:393-438`] [Status: VERIFIED].

## Decision
The separation of Mental Models (static reasoning scaffolds) and Knowledge Graph (dynamic persistent memory) allows for specialized handling of each. The dual-storage approach for the Knowledge Graph combines the simplicity and recoverability of a log-based system (JSONL) with the performance of a relational database (SQLite).
