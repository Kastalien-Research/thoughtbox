# SPEC-DATA-01: Supabase Product Schema

**ADR**: `.adr/staging/ADR-DATA-01-supabase-product-schema.md`
**Scope**: Product data only (sessions, thoughts, knowledge graph). SaaS platform schema (users, billing, API keys) is out of scope.

## Overview

Supabase Postgres schema and TypeScript implementation classes for the deployed Thoughtbox storage backend. The filesystem backend (`FileSystemStorage`, `FileSystemKnowledgeStorage`) remains unchanged for local/self-hosted use. Both backends implement the same interfaces (`ThoughtboxStorage`, `KnowledgeStorage`).

## Postgres Table Definitions

### sessions

Derived from `Session` interface in `src/persistence/types.ts:44-60`.

```sql
CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project    TEXT NOT NULL,
  title      TEXT NOT NULL,
  description TEXT,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  thought_count   INTEGER NOT NULL DEFAULT 0,
  branch_count    INTEGER NOT NULL DEFAULT 0,
  partition_path  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_project ON sessions(project);
CREATE INDEX idx_sessions_updated ON sessions(project, updated_at DESC);
CREATE INDEX idx_sessions_tags ON sessions USING GIN(tags);

-- Helper function for updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### thoughts

Derived from `ThoughtData` interface in `src/persistence/types.ts:93-154`. Stores the flattened thought data. The linked-list structure (ThoughtNode) is reconstructed from the relational columns.

```sql
CREATE TABLE thoughts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  project         TEXT NOT NULL,

  -- Core fields
  thought         TEXT NOT NULL,
  thought_number  INTEGER NOT NULL,
  total_thoughts  INTEGER NOT NULL,
  next_thought_needed BOOLEAN NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Revision/branch structure
  is_revision         BOOLEAN DEFAULT false,
  revises_thought     INTEGER,
  branch_from_thought INTEGER,
  branch_id           TEXT,
  needs_more_thoughts BOOLEAN,

  -- Operations mode
  thought_type    TEXT NOT NULL DEFAULT 'reasoning'
    CHECK (thought_type IN (
      'reasoning', 'decision_frame', 'action_report',
      'belief_snapshot', 'assumption_update',
      'context_snapshot', 'progress'
    )),

  -- Type-specific JSONB columns
  confidence      TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  options         JSONB,
  action_result   JSONB,
  beliefs         JSONB,
  assumption_change JSONB,
  context_data    JSONB,
  progress_data   JSONB,

  -- Multi-agent attribution
  agent_id        TEXT,
  agent_name      TEXT,

  -- Merkle chain
  content_hash    TEXT,
  parent_hash     TEXT,

  -- Critique metadata
  critique        JSONB,

  UNIQUE NULLS NOT DISTINCT (session_id, thought_number, branch_id)
);

CREATE INDEX idx_thoughts_session ON thoughts(session_id, thought_number);
CREATE INDEX idx_thoughts_project ON thoughts(project);
CREATE INDEX idx_thoughts_branch ON thoughts(session_id, branch_id)
  WHERE branch_id IS NOT NULL;
CREATE INDEX idx_thoughts_type ON thoughts(thought_type);
CREATE INDEX idx_thoughts_revision ON thoughts(session_id, revises_thought)
  WHERE revises_thought IS NOT NULL;

-- Trigger to maintain denormalized counts on sessions
CREATE OR REPLACE FUNCTION update_session_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sessions
    SET 
      thought_count = (SELECT count(*) FROM thoughts WHERE session_id = NEW.session_id AND branch_id IS NULL),
      branch_count = (SELECT count(DISTINCT branch_id) FROM thoughts WHERE session_id = NEW.session_id AND branch_id IS NOT NULL)
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sessions
    SET 
      thought_count = (SELECT count(*) FROM thoughts WHERE session_id = OLD.session_id AND branch_id IS NULL),
      branch_count = (SELECT count(DISTINCT branch_id) FROM thoughts WHERE session_id = OLD.session_id AND branch_id IS NOT NULL)
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_counts
AFTER INSERT OR DELETE ON thoughts
FOR EACH ROW EXECUTE FUNCTION update_session_counts();
```

### ThoughtNode Linked-List Mapping

The `ThoughtNode` interface (`src/persistence/types.ts:181-205`) uses in-memory linked-list pointers (`prev`, `next[]`, `revisesNode`, `branchOrigin`). In Postgres, these relationships are derived from relational columns rather than stored as explicit pointers:

| ThoughtNode field | Postgres derivation |
|---|---|
| `id` | `'{session_id}:{thought_number}'` or `'{session_id}:{branch_id}:{thought_number}'` (computed, not stored) |
| `prev` | Previous thought by `thought_number` within same `session_id` and `branch_id` (query-time via `LAG()` window function) |
| `next[]` | Next thoughts by `thought_number` within same `session_id` and `branch_id`, plus branch-origin lookups (query-time via `LEAD()` + branch query) |
| `revisesNode` | `revises_thought` column + same `session_id` |
| `branchOrigin` | `branch_from_thought` column + same `session_id` |
| `branchId` | `branch_id` column |
| `revisionMetadata` | Computed at query time from revision columns, same as `RevisionIndexBuilder` does in memory |

The `SupabaseStorage` implementation reconstructs `ThoughtNode` objects from query results using the same logic as `LinkedThoughtStore.addNode()`, computing `prev`/`next` pointers from ordered rows.

### entities

Derived from `Entity` interface in `src/knowledge/types.ts:17-44`. Direct translation from the SQLite schema at `src/knowledge/storage.ts:123-141`.

```sql
CREATE TABLE entities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project         TEXT NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL
    CHECK (type IN ('Insight', 'Concept', 'Workflow', 'Decision', 'Agent')),
  label           TEXT NOT NULL,
  properties      JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      TEXT,
  visibility      TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'agent-private', 'user-private', 'team-private')),
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to        TIMESTAMPTZ,
  superseded_by   UUID REFERENCES entities(id),
  access_count    INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  importance_score REAL NOT NULL DEFAULT 0.5,

  UNIQUE(project, name, type)
);

CREATE INDEX idx_entities_project ON entities(project);
CREATE INDEX idx_entities_type ON entities(project, type);
CREATE INDEX idx_entities_visibility ON entities(visibility);
CREATE INDEX idx_entities_valid ON entities(valid_from, valid_to);
CREATE INDEX idx_entities_importance ON entities(importance_score DESC);

CREATE TRIGGER trigger_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### relations

Derived from `Relation` interface in `src/knowledge/types.ts:72-80`. Matches the SQLite schema at `src/knowledge/storage.ts:148-158`.

```sql
CREATE TABLE relations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project     TEXT NOT NULL,
  from_id     UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
    CHECK (type IN (
      'RELATES_TO', 'BUILDS_ON', 'CONTRADICTS', 'EXTRACTED_FROM',
      'APPLIED_IN', 'LEARNED_BY', 'DEPENDS_ON', 'SUPERSEDES', 'MERGED_FROM'
    )),
  properties  JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  TEXT
);

CREATE INDEX idx_relations_project ON relations(project);
CREATE INDEX idx_relations_from ON relations(from_id);
CREATE INDEX idx_relations_to ON relations(to_id);
CREATE INDEX idx_relations_type ON relations(type);
```

### observations

Derived from `Observation` interface in `src/knowledge/types.ts:111-123`. Matches the SQLite schema at `src/knowledge/storage.ts:164-179`.

```sql
CREATE TABLE observations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project         TEXT NOT NULL,
  entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  source_session  UUID REFERENCES sessions(id),
  added_by        TEXT,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to        TIMESTAMPTZ,
  superseded_by   UUID REFERENCES observations(id)
);

CREATE INDEX idx_observations_project ON observations(project);
CREATE INDEX idx_observations_entity ON observations(entity_id);
CREATE INDEX idx_observations_session ON observations(source_session);
CREATE INDEX idx_observations_valid ON observations(valid_from, valid_to);
```

### Full-Text Search (FTS5 to tsvector/GIN)

The SQLite backend uses FTS5 virtual table on `observations.content` (`src/knowledge/storage.ts:182-186`). The Postgres equivalent uses a generated `tsvector` column with a GIN index:

```sql
ALTER TABLE observations
  ADD COLUMN content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX idx_observations_fts ON observations USING GIN(content_tsv);
```

Query translation: SQLite `observations_fts MATCH ?` becomes `content_tsv @@ plainto_tsquery('english', ?)`.

## Row-Level Security (RLS)

All five tables include a `project` column. RLS policies enforce project isolation:

```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Service role policy: filter by project claim in JWT
CREATE POLICY project_isolation ON sessions
  USING (project = auth.jwt() ->> 'project');

CREATE POLICY project_isolation ON thoughts
  USING (project = auth.jwt() ->> 'project');

CREATE POLICY project_isolation ON entities
  USING (project = auth.jwt() ->> 'project');

CREATE POLICY project_isolation ON relations
  USING (project = auth.jwt() ->> 'project');

CREATE POLICY project_isolation ON observations
  USING (project = auth.jwt() ->> 'project');
```

The `setProject()` method generates a short-lived JSON Web Token (JWT) using the `jsonwebtoken` library. The JWT payload contains `{ role: 'authenticated', project: '<project>' }`, and is signed using the `SUPABASE_JWT_SECRET`. The method then re-initializes the internal `SupabaseClient` to include this JWT in the `Authorization: Bearer <token>` header, ensuring that Supabase's REST API correctly enforces the RLS policies for that specific project.

## TypeScript Column Mapping Reference

### Session (TS) to sessions (Postgres)

| TypeScript field | Postgres column | Type mapping |
|---|---|---|
| `id: string` | `id UUID` | UUID |
| _(implicit)_ | `project TEXT` | Added for multi-tenancy |
| `title: string` | `title TEXT` | Direct |
| `description?: string` | `description TEXT` | Nullable |
| `tags: string[]` | `tags TEXT[]` | Postgres array |
| `thoughtCount: number` | `thought_count INTEGER` | snake_case |
| `branchCount: number` | `branch_count INTEGER` | snake_case |
| `partitionPath?: string` | `partition_path TEXT` | Nullable, less relevant for Supabase |
| `createdAt: Date` | `created_at TIMESTAMPTZ` | snake_case |
| `updatedAt: Date` | `updated_at TIMESTAMPTZ` | snake_case |
| `lastAccessedAt: Date` | `last_accessed_at TIMESTAMPTZ` | snake_case |

### ThoughtData (TS) to thoughts (Postgres)

| TypeScript field | Postgres column | Type mapping |
|---|---|---|
| `thought: string` | `thought TEXT` | Direct |
| `thoughtNumber: number` | `thought_number INTEGER` | snake_case |
| `totalThoughts: number` | `total_thoughts INTEGER` | snake_case |
| `nextThoughtNeeded: boolean` | `next_thought_needed BOOLEAN` | snake_case |
| `isRevision?: boolean` | `is_revision BOOLEAN` | snake_case |
| `revisesThought?: number` | `revises_thought INTEGER` | snake_case, nullable |
| `branchFromThought?: number` | `branch_from_thought INTEGER` | snake_case, nullable |
| `branchId?: string` | `branch_id TEXT` | snake_case, nullable |
| `needsMoreThoughts?: boolean` | `needs_more_thoughts BOOLEAN` | snake_case |
| `timestamp: string` | `timestamp TIMESTAMPTZ` | ISO string to timestamptz |
| `thoughtType` | `thought_type TEXT` | CHECK constraint enum |
| `confidence?: string` | `confidence TEXT` | CHECK constraint enum |
| `options?: Array<...>` | `options JSONB` | JSON serialized |
| `actionResult?: {...}` | `action_result JSONB` | JSON serialized |
| `beliefs?: {...}` | `beliefs JSONB` | JSON serialized |
| `assumptionChange?: {...}` | `assumption_change JSONB` | JSON serialized |
| `contextData?: {...}` | `context_data JSONB` | JSON serialized |
| `progressData?: {...}` | `progress_data JSONB` | JSON serialized |
| `agentId?: string` | `agent_id TEXT` | snake_case |
| `agentName?: string` | `agent_name TEXT` | snake_case |
| `contentHash?: string` | `content_hash TEXT` | snake_case |
| `parentHash?: string` | `parent_hash TEXT` | snake_case |
| `critique?: {...}` | `critique JSONB` | JSON serialized |

### Entity (TS) to entities (Postgres)

| TypeScript field | Postgres column | Type mapping |
|---|---|---|
| `id: string` | `id UUID` | UUID |
| _(implicit)_ | `project TEXT` | Added for multi-tenancy |
| `name: string` | `name TEXT` | Direct |
| `type: EntityType` | `type TEXT` | CHECK constraint enum |
| `label: string` | `label TEXT` | Direct |
| `properties: Record<string, any>` | `properties JSONB` | JSON serialized |
| `created_at: Date` | `created_at TIMESTAMPTZ` | Direct (already snake_case) |
| `updated_at: Date` | `updated_at TIMESTAMPTZ` | Direct |
| `created_by?: string` | `created_by TEXT` | Direct |
| `visibility: string` | `visibility TEXT` | CHECK constraint enum |
| `valid_from: Date` | `valid_from TIMESTAMPTZ` | Direct |
| `valid_to?: Date` | `valid_to TIMESTAMPTZ` | Nullable |
| `superseded_by?: string` | `superseded_by UUID` | FK to entities |
| `access_count: number` | `access_count INTEGER` | Direct |
| `last_accessed_at: Date` | `last_accessed_at TIMESTAMPTZ` | Direct |
| `importance_score: number` | `importance_score REAL` | Direct |

### Relation (TS) to relations (Postgres)

| TypeScript field | Postgres column | Type mapping |
|---|---|---|
| `id: string` | `id UUID` | UUID |
| _(implicit)_ | `project TEXT` | Added for multi-tenancy |
| `from_id: string` | `from_id UUID` | FK to entities |
| `to_id: string` | `to_id UUID` | FK to entities |
| `type: RelationType` | `type TEXT` | CHECK constraint enum |
| `properties: Record<string, any>` | `properties JSONB` | JSON serialized |
| `created_at: Date` | `created_at TIMESTAMPTZ` | Direct |
| `created_by?: string` | `created_by TEXT` | Direct |

### Observation (TS) to observations (Postgres)

| TypeScript field | Postgres column | Type mapping |
|---|---|---|
| `id: string` | `id UUID` | UUID |
| _(implicit)_ | `project TEXT` | Added for multi-tenancy |
| `entity_id: string` | `entity_id UUID` | FK to entities |
| `content: string` | `content TEXT` | Direct |
| `source_session?: string` | `source_session UUID` | FK to sessions |
| `added_by?: string` | `added_by TEXT` | Direct |
| `added_at: Date` | `added_at TIMESTAMPTZ` | Direct |
| `valid_from: Date` | `valid_from TIMESTAMPTZ` | Direct |
| `valid_to?: Date` | `valid_to TIMESTAMPTZ` | Nullable |
| `superseded_by?: string` | `superseded_by UUID` | FK to observations |

## Class Contracts

### SupabaseStorage

- **File**: `src/persistence/supabase-storage.ts` (new)
- **Implements**: `ThoughtboxStorage` (from `src/persistence/types.ts`)
- **Constructor**: `new SupabaseStorage(options: { supabaseUrl: string; supabaseKey: string })`
- **Dependencies**: `@supabase/supabase-js`, `jsonwebtoken`

Methods (all from `ThoughtboxStorage` interface):
- `initialize()` -- verifies connection, no schema creation (migrations are separate)
- `setProject(project)` -- stores project string, generates a new JWT signed with `SUPABASE_JWT_SECRET` containing `{ role: 'authenticated', project }`, and updates the Supabase client headers for subsequent queries
- `getProject()` -- returns stored project, throws `StorageNotScopedError` if unset
- `getConfig()` / `updateConfig()` -- reads/writes a `config` row scoped to the installation
- `createSession()` / `getSession()` / `updateSession()` / `deleteSession()` / `listSessions()` -- CRUD against `sessions` table
- `saveThought()` / `getThoughts()` / `getAllThoughts()` / `getThought()` -- CRUD against `thoughts` table
- `saveBranchThought()` / `getBranch()` / `getBranchIds()` -- branch-aware thought queries
- `updateThoughtCritique()` -- updates `critique` JSONB column
- `exportSession()` / `toLinkedExport()` -- reconstructs `ThoughtNode` linked structure from ordered rows
- `validateSessionIntegrity()` -- checks row counts match `thought_count`/`branch_count`; no filesystem checks

### SupabaseKnowledgeStorage

- **File**: `src/knowledge/supabase-storage.ts` (new)
- **Implements**: `KnowledgeStorage` (from `src/knowledge/types.ts`)
- **Constructor**: `new SupabaseKnowledgeStorage(options: { supabaseUrl: string; supabaseKey: string })`
- **Dependencies**: `@supabase/supabase-js`, `jsonwebtoken`

Methods (all from `KnowledgeStorage` interface):
- `initialize()` -- verifies connection
- `setProject(project)` -- stores project string, generates a new JWT signed with `SUPABASE_JWT_SECRET` containing `{ role: 'authenticated', project }`, and updates the Supabase client headers
- `createEntity()` / `getEntity()` / `listEntities()` / `deleteEntity()` -- CRUD against `entities` table
- `createRelation()` / `getRelationsFrom()` / `getRelationsTo()` / `deleteRelation()` -- CRUD against `relations` table
- `addObservation()` / `getObservations()` -- CRUD against `observations` table
- `traverseGraph()` -- recursive CTE query replacing the BFS loop in `FileSystemKnowledgeStorage`
- `getStats()` -- aggregate queries
- `rebuildIndexFromJsonl()` -- **no-op**. Supabase is the source of truth; there is no JSONL to rebuild from.

### createStorage() Extension

In `src/index.ts`, the `createStorage()` function currently supports `memory` and `fs`. Add `supabase` as a third option:

```
THOUGHTBOX_STORAGE=supabase -> SupabaseStorage + SupabaseKnowledgeStorage
```

The function reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` from environment variables. The knowledge storage instance is created alongside the main storage (same pattern as `FileSystemKnowledgeStorage` is created alongside `FileSystemStorage` elsewhere in the codebase).

## Migration Strategy

Schema changes are managed via Supabase CLI migrations (`supabase migration new`, `supabase db push`). Raw SQL, no ORM. Migration files live in `supabase/migrations/` at the repo root.

The initial migration creates all five tables, indexes, RLS policies, and the FTS column in a single migration file.

## Acceptance Criteria

1. `supabase/migrations/` contains a migration file that creates `sessions`, `thoughts`, `entities`, `relations`, `observations` tables with all columns, indexes, constraints, triggers, and RLS policies defined above.
2. `SupabaseStorage` class exists at `src/persistence/supabase-storage.ts`, implements `ThoughtboxStorage`, and passes the same test suite as `InMemoryStorage` (adapted for async Supabase calls).
3. `SupabaseKnowledgeStorage` class exists at `src/knowledge/supabase-storage.ts`, implements `KnowledgeStorage`, and passes entity/relation/observation CRUD tests.
4. **Testing must be performed against a live local Supabase instance spun up via `supabase start`. Module-level mocking of `@supabase/supabase-js` is completely forbidden** for the storage tests. Mocks cannot accurately test triggers, unique constraints, or RLS policies.
5. `createStorage()` in `src/index.ts` returns `SupabaseStorage` when `THOUGHTBOX_STORAGE=supabase`.
6. `rebuildIndexFromJsonl()` is a no-op on `SupabaseKnowledgeStorage`.
7. RLS policies enforce project isolation: a client configured with a JWT for `project = 'A'` returns zero rows from project `B` during live database testing.
8. Full-text search on observations returns results using `plainto_tsquery`.
9. `FileSystemStorage` and `FileSystemKnowledgeStorage` are unchanged and continue to pass all existing tests.
10. `@supabase/supabase-js` and `jsonwebtoken` are the new runtime dependencies added.
