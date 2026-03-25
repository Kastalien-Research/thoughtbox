# SPEC-CI-002: Knowledge Accumulation Layer

**Status**: Draft v0.2
**Generated**: 2026-02-11
**Author**: Agent-assisted (Claude Opus 4.6)
**Context**: Thoughtbox Continual Self-Improvement System
**Parent**: [00-overview.md](./00-overview.md) -- Gap 2
**Dependencies**: None (this spec is a soft dependency of [01-unified-loop-controller.md](./01-unified-loop-controller.md))

---

## Problem Statement

The Thoughtbox engineering system stores knowledge in 7 distinct locations:

| Store | Format | Location | What It Holds | Query Method |
|-------|--------|----------|---------------|-------------|
| **Thoughtbox Knowledge Graph** | JSONL + SQLite | `~/.thoughtbox/projects/{name}/memory/graph.jsonl` + `memory.db` | Entities (Insight, Concept, Workflow, Decision, Agent), Relations (9 types), Observations | Structured: `knowledge { action: "list_entities" }`, `query_graph`, `stats` |
| **MEMORY.md** | Flat Markdown | `.claude/agent-memory/{role}/MEMORY.md` (4 agent files) + `~/.claude/projects/.../MEMORY.md` (1 global) | Session learnings, gotchas, project structure, process violations, behavioral rules | Grep only. No structure beyond Markdown headers. |
| **Beads** | JSONL | `.beads/issues.jsonl` (synced via `beads-sync` branch) | Issues with IDs, titles, descriptions, status, priority, dependencies (`blocks`, `parent-child`), close reasons | CLI: `bd list`, `bd show <id>`, `bd search`. Programmatic: parse JSONL line by line. |
| **Git History** | Git objects | `.git/` + GitHub remote | Commits (conventional format), branches, PRs, code diffs, merge history | `git log`, `git diff`, `gh pr list`. No semantic indexing. |
| **Observatory** | In-memory + REST | Port 1729 (same as UI) | Hub events, session activity, workspace data, reasoning traces | 8 REST endpoints. Data lost on restart (InMemorySessionStore). |
| **LangSmith** | Cloud traces | Remote API | Run telemetry, token usage, cost tracking, latency | Dashboard + REST API. Requires `LANGSMITH_API_KEY`. |
| **Hub State** | JSON files | `~/.thoughtbox/projects/{name}/hub/` | Workspaces, problems (with `dependsOn[]`, `comments[]`), proposals (with `reviews[]`), consensus markers (with `agreedBy[]`), channels (with messages) | `thoughtbox_hub { operation: "list_*" }` per workspace. No cross-workspace search. |

These stores have **no cross-referencing**. Concrete failure modes from project history:

1. **MEMORY.md records "MCP Knowledge API Gotchas"** with 5 verified parameter corrections (`add_observation` uses `entity_id` + `content`, not `entityId`/`observation`). The knowledge graph has entities for these tools but none of the observations reference the MEMORY.md learning. An agent starting a new session must either read MEMORY.md manually or re-discover the gotchas through trial and error.

2. **Beads issue `thoughtbox-308`** ("Profile priming injects on every thought call") was filed, fixed (`close_reason: "Fixed in commit 7828402 - sessionsPrimed set guards once-per-session priming"`), and closed. But the knowledge graph has no entity for this pattern. The global MEMORY.md entry still marks it as a known bug (stale). There is no way to query "what bugs were fixed that MEMORY.md still lists as open?"

3. **Hub workspace `f927e88f`** coordinated a knowledge graph extraction session with 5 problems, 30+ channel messages, and a critic rating. The resulting 57 entities and 75 relations in the knowledge graph have no backlinks to the workspace that produced them. An agent exploring the knowledge graph cannot discover the coordination context.

4. **Agent asks "what does the system know about hub_wait?"** Today this requires 5 separate queries across 5 stores, each with different interfaces and result formats. No correlation between results.

**The cost**: Every agent session starts with partial context. Knowledge compounds slowly because each store compounds independently.

---

## Design Principle: Knowledge Graph as Backbone

The Thoughtbox knowledge graph (`src/knowledge/`) already provides the right abstraction:

- **Entities** with typed properties (`Entity` in `src/knowledge/types.ts`): `id`, `name` (unique within type), `type` (Insight/Concept/Workflow/Decision/Agent), `properties` (free-form), `visibility`, temporal validity (`valid_from`/`valid_to`/`superseded_by`), access metrics (`access_count`, `importance_score`)
- **Relations** (directed edges in `Relation`): 9 types including `RELATES_TO`, `BUILDS_ON`, `CONTRADICTS`, `EXTRACTED_FROM`, `APPLIED_IN`, `DEPENDS_ON`, `SUPERSEDES`
- **Observations** (timestamped atomic facts attached to entities in `Observation`): `entity_id`, `content`, `source_session`, temporal validity
- **Storage**: JSONL append-only source of truth (`graph.jsonl`) backed by SQLite with FTS5 for full-text search on observations (`FileSystemKnowledgeStorage` in `src/knowledge/storage.ts`)
- **Existing enforcement**: `UNIQUE(name, type)` on entities, cascade deletes on relations/observations, importance-ordered queries

The KAL does **not** replace any existing store. It uses the knowledge graph as the **index layer** -- the place where cross-references live. Each external store gets an **adapter** that can:

1. **Search**: Query the external store given a query, returning results in a normalized format.
2. **Resolve**: Given a cross-reference, fetch the full item from the external store.
3. **Ingest**: Create cross-reference entities and relations in the knowledge graph that point to items in the external store.

```
                    +--------------------------------------------+
                    |        UNIFIED QUERY INTERFACE              |
                    |   knowledge { action: "unified_search",    |
                    |     query: "hub_wait" }                    |
                    +--------------------+-----------------------+
                                         |
                    +--------------------+-----------------------+
                    |          QUERY ROUTER                      |
                    |   Decomposes query -> dispatches to        |
                    |   adapters -> merges + ranks results       |
                    +--+----+-----+------+------+------+--------+
                       |    |     |      |      |      |
                +------+-++-+---++-+----++-+---++-+--++-+------+
                | KG    || MEM  || BEADS || GIT  || HUB || LANG |
                | Adpt  || .md  || Adpt  || Adpt || Adpt|| Smith|
                |       || Adpt ||       ||      ||     || Adpt |
                +---+---++-+-+--++-+--+--++-+---++-+---++-+----+
                    |      |      |       |      |       |
                +---+---++-+--++-+----++-+---++-+---++-+----+
                | SQLite || .md  || JSONL || .git || JSON || Cloud|
                | +JSONL || file ||       || objs || file || API  |
                +--------++-----++------++------++-----++------+
```

---

## Knowledge Taxonomy

### 1. Entity Type Extensions

The existing knowledge graph supports 5 entity types. The KAL adds 4 cross-reference types:

```typescript
// Existing (unchanged) - from src/knowledge/types.ts line 46
type CoreEntityType = 'Insight' | 'Concept' | 'Workflow' | 'Decision' | 'Agent';

// New: cross-reference entity types for external store items
type CrossRefEntityType =
  | 'Issue'        // Maps to a Beads issue (e.g., thoughtbox-308)
  | 'Commit'       // Maps to a git commit (e.g., 7828402)
  | 'HubWorkspace' // Maps to a Hub workspace (e.g., f927e88f)
  | 'RunTrace';    // Maps to a LangSmith run trace

type EntityType = CoreEntityType | CrossRefEntityType;
```

Cross-reference entities are lightweight: they store the external ID, a summary, and freshness metadata in the `properties` field. The full content lives in the external store and is resolved on demand via the adapter.

### 2. Freshness Tags

Every entity carries freshness metadata in its `properties` object, implementing the DGM Continual Calibration principle from `.claude/rules/continual-calibration.md`:

```typescript
type FreshnessTag = 'HOT' | 'WARM' | 'COLD';

// Stored in entity.properties
interface FreshnessProperties {
  freshness_tag: FreshnessTag;
  freshness_last_validated: string;  // ISO 8601
  freshness_validation_count: number;
  freshness_last_used: string;       // ISO 8601
  freshness_use_count: number;
}
```

**Freshness transitions:**

| Transition | Trigger | Automatic? |
|-----------|---------|-----------|
| Any to HOT | Entity used and outcome was successful (via `record_usage`) | Yes |
| HOT to WARM | 14 days elapsed since `freshness_last_validated` with no new validation | Yes (daily decay) |
| WARM to COLD | 30 days elapsed since `freshness_last_validated` with no new validation | Yes (daily decay) |
| COLD to archived | Manual, or automated if `freshness_use_count == 0` and COLD for 90+ days | Semi-auto (escalate if use_count > 0) |
| Any to HOT | Entity contradicted by new evidence (marks the contradiction entity HOT, not the original) | Yes |

The existing `importance_score` field on entities (already in `src/knowledge/storage.ts` line 129) is repurposed: `importance_score = f(freshness_tag, use_count, access_count)`. This preserves the existing importance-ordered query behavior while incorporating freshness.

### 3. Source Store Tracking

Every entity tracks its origin:

```typescript
type SourceStore = 'knowledge_graph' | 'memory_md' | 'beads' | 'git' | 'hub' | 'langsmith';
```

Stored in `entity.properties.source_store`. Native knowledge graph entities have `source_store: 'knowledge_graph'`. Cross-reference entities have the corresponding external store value.

---

## Cross-Referencing Protocol

Cross-references are implemented as knowledge graph **relations** between entities. The existing 9 relation types are sufficient -- no new relation types are needed:

| Relation Type | Cross-Reference Use |
|--------------|-------------------|
| `EXTRACTED_FROM` | KG entity was extracted from a Hub workspace session |
| `APPLIED_IN` | A Workflow entity was applied in a specific commit |
| `RELATES_TO` | Generic link between a MEMORY.md learning and a Beads issue |
| `BUILDS_ON` | A Decision entity builds on an earlier Insight from a different store |
| `CONTRADICTS` | A new observation contradicts a MEMORY.md claim |
| `DEPENDS_ON` | A Beads issue depends on a Decision entity |
| `SUPERSEDES` | A new Insight supersedes an older one from MEMORY.md |

### Cross-Reference Entity Naming Convention

Entity names for cross-references use the format `{store}:{external_id}`:

| Store | Name Pattern | Example |
|-------|-------------|---------|
| Beads | `beads:{issue_id}` | `beads:thoughtbox-308` |
| Git | `git:{short_sha}` | `git:7828402` |
| Hub | `hub:{workspace_id}` | `hub:f927e88f` |
| MEMORY.md | `memory:{section_slug}` | `memory:knowledge-graph-extraction-complete` |
| LangSmith | `langsmith:{run_id}` | `langsmith:run-abc123` |

Since the knowledge graph enforces `UNIQUE(name, type)`, these names prevent duplicate cross-reference entities. Attempting to create a duplicate returns the existing entity (existing behavior in `FileSystemKnowledgeStorage.createEntity` at `src/knowledge/storage.ts` line 361).

### Cross-Reference Entity Shape

```typescript
// Example: Cross-reference entity for Beads issue thoughtbox-308
{
  name: "beads:thoughtbox-308",
  type: "Issue",
  label: "Profile priming injects on every thought call",
  properties: {
    source_store: "beads",
    external_id: "thoughtbox-308",
    status: "closed",
    priority: 1,
    issue_type: "bug",
    close_reason: "Fixed in commit 7828402 - sessionsPrimed set guards once-per-session priming",
    freshness_tag: "WARM",
    freshness_last_validated: "2026-02-07T17:31:18Z",
    freshness_validation_count: 1,
    freshness_last_used: "2026-02-07T17:31:18Z",
    freshness_use_count: 3,
  }
}

// Example: Cross-reference entity for git commit
{
  name: "git:7828402",
  type: "Commit",
  label: "fix(gateway): guard profile priming to once-per-session",
  properties: {
    source_store: "git",
    external_id: "7828402",
    author: "glassBead",
    date: "2026-02-07T17:30:00Z",
    files_changed: ["src/gateway/gateway-handler.ts"],
    conventional_type: "fix",
    conventional_scope: "gateway",
    freshness_tag: "WARM",
    freshness_last_validated: "2026-02-07T17:31:18Z",
    freshness_validation_count: 1,
    freshness_last_used: "2026-02-07T17:31:18Z",
    freshness_use_count: 1,
  }
}

// Example: Cross-reference entity for Hub workspace
{
  name: "hub:f927e88f",
  type: "HubWorkspace",
  label: "Knowledge Graph Extraction Session",
  properties: {
    source_store: "hub",
    external_id: "f927e88f",
    agent_count: 3,
    problem_count: 5,
    message_count: 30,
    freshness_tag: "HOT",
    freshness_last_validated: "2026-02-10T00:00:00Z",
    freshness_validation_count: 2,
    freshness_last_used: "2026-02-10T00:00:00Z",
    freshness_use_count: 5,
  }
}
```

---

## Store Adapters

### Common Adapter Interface

```typescript
// src/knowledge/adapters/types.ts

/**
 * Normalized search result from any store
 */
interface KnowledgeResult {
  source: SourceStore;
  entity_type: EntityType;
  cross_ref: string;          // e.g., "beads:thoughtbox-308"
  title: string;
  snippet: string;            // Max 500 chars, relevant to query
  relevance: number;          // 0-1, store-specific ranking normalized
  freshness?: FreshnessTag;
  timestamp: string;          // ISO 8601
  source_url?: string;        // Path or URL to source item
  kg_entity_id?: string;      // Knowledge graph entity ID if already indexed
}

/**
 * Adapter interface for each knowledge store
 */
interface KnowledgeStoreAdapter {
  readonly name: SourceStore;

  /** Whether this adapter is currently available */
  isAvailable(): Promise<boolean>;

  /** Search this store. Returns normalized results sorted by relevance descending. */
  search(query: string, opts?: {
    limit?: number;
    types?: EntityType[];
    freshness?: FreshnessTag[];
    since?: string;
  }): Promise<KnowledgeResult[]>;

  /** Resolve a cross-reference to full content. */
  resolve(crossRef: string): Promise<{
    content: string;
    metadata: Record<string, unknown>;
  } | null>;

  /** Ingest items into the knowledge graph as cross-reference entities. */
  ingest(opts?: {
    since?: string;
    limit?: number;
    force?: boolean;
  }): Promise<{ created: number; updated: number; skipped: number }>;
}
```

### Adapter 1: Knowledge Graph (`src/knowledge/adapters/kg-adapter.ts`)

The simplest adapter -- queries the existing storage directly.

**search**: Uses `listEntities` with `name_pattern` and entity type filters. For text queries, also searches observations via the existing FTS5 virtual table (`observations_fts` in `src/knowledge/storage.ts` line 173). Relevance derived from `importance_score`.

**resolve**: Uses `getEntity` + `getObservations` to return full entity details with all observations.

**ingest**: No-op (the knowledge graph is the backbone).

### Adapter 2: MEMORY.md (`src/knowledge/adapters/memory-adapter.ts`)

Parses MEMORY.md files into structured sections.

**File locations** (verified):
- `.claude/agent-memory/triage-fix/MEMORY.md` -- Triage-Fix agent memory
- `.claude/agent-memory/dependency-verifier/MEMORY.md` -- Dependency-Verifier agent memory
- `.claude/agent-memory/coordination-momentum/MEMORY.md` -- Coordination-Momentum agent memory
- `.claude/agent-memory/verification-judge/MEMORY.md` -- Verification-Judge agent memory
- `~/.claude/projects/-Users-b-c-nims-kastalien-research-thoughtboxes-parity-thoughtbox/memory/MEMORY.md` -- Global project memory

**search**: Reads all MEMORY.md files, splits on `## ` headers, performs substring + keyword matching against section content.

**Parsing rules**:
- `## ` headers define entry boundaries
- `### ` headers define sub-entries within a section
- The section header text becomes `title`
- Section content becomes `snippet` (truncated to 500 chars)
- Dates in headers (e.g., `(2026-02-10)`) set the `timestamp`
- Sections containing "CRITICAL", "MUST", "NEVER" get relevance boost

**resolve**: Returns the full section content for a `memory:{section_slug}` cross-reference.

**ingest**: Creates entities in the knowledge graph:
- Sections containing "Gotchas", "Bugs", "Violations" become `Insight` entities
- Sections containing "Lessons", "Patterns" become `Workflow` entities
- Sections describing project structure become `Concept` entities
- Creates `RELATES_TO` relations when MEMORY.md mentions Beads issue IDs (pattern: `thoughtbox-[a-z0-9]+`)
- Creates `CONTRADICTS` relations when a section explicitly negates another (detected by "NOT", "no longer", "was fixed")

**Freshness heuristic**: Extract dates from section headers. Within 7 days = HOT. Within 30 days = WARM. Older = COLD. No date = WARM.

### Adapter 3: Beads (`src/knowledge/adapters/beads-adapter.ts`)

Reads the Beads JSONL issue store directly.

**Data shape** (verified from `.beads/issues.jsonl`):
```typescript
interface BeadsIssue {
  id: string;                    // e.g., "thoughtbox-308"
  title: string;
  description?: string;
  notes?: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: number;              // 1 = highest
  issue_type: 'bug' | 'feature' | 'task' | 'epic';
  created_at: string;            // ISO 8601
  updated_at: string;
  closed_at?: string;
  close_reason?: string;
  created_by: string;
  dependencies?: Array<{
    issue_id: string;
    depends_on_id: string;
    type: 'blocks' | 'parent-child';
    created_at: string;
    created_by: string;
  }>;
}
```

**search**: Parses `.beads/issues.jsonl` line by line. Matches `title`, `description`, `notes`, `close_reason` fields against the query. Relevance boosted for open issues and high-priority issues.

**resolve**: Returns full issue entry formatted as Markdown with status, dependencies, close reason.

**ingest**: Creates `Issue` cross-reference entities. Creates `DEPENDS_ON` relations mirroring the Beads dependency graph. Creates `RELATES_TO` relations when `close_reason` references a commit SHA (regex: `/\b[0-9a-f]{7,40}\b/`). Freshness: open = HOT, closed < 14 days = WARM, closed > 14 days = COLD.

### Adapter 4: Git (`src/knowledge/adapters/git-adapter.ts`)

Queries git history for relevant commits.

**search**: Runs `git log --all --oneline --grep="{query}" --max-count={limit} --after="{90 days ago}"` plus `git log --all --oneline --diff-filter=ACDMR -- "*{query}*" --max-count={limit}` for file path matching. Parses conventional commit messages (`type(scope): description`). Relevance boosted for recent commits and for commits whose conventional type matches the query context.

**resolve**: Runs `git show {sha} --stat` and `git show {sha} --format="%B"` for full commit details.

**ingest**: Processes recent commits:
- Parses conventional commit messages into `Commit` entities
- Creates `APPLIED_IN` relations from KG entities whose names appear in commit messages or changed file paths
- Scans commit messages for Beads issue references (`thoughtbox-[a-z0-9]+`) and creates `RELATES_TO` relations to corresponding `Issue` entities

### Adapter 5: Hub (`src/knowledge/adapters/hub-adapter.ts`)

Queries Hub state for workspaces, problems, and coordination artifacts.

**Hub storage access**: Imports `HubStorage` interface from `src/hub/hub-types.ts` (line 222). Uses `listWorkspaces()`, `listProblems(workspaceId)`, `listProposals(workspaceId)`, `listConsensusMarkers(workspaceId)`, `getChannel(workspaceId, problemId)`.

**search**: Searches workspace `name`/`description`, problem `title`/`description`/`resolution`, proposal `title`/`description`, channel message `content`. Relevance boosted for active workspaces and unresolved problems.

**resolve**: Returns full workspace state including agent list (`WorkspaceAgent[]`), problem dependency graph, proposal review status (`Review[]` with `verdict` and `reasoning`), and consensus markers (`ConsensusMarker` with `agreedBy[]`).

**ingest**: Creates `HubWorkspace` cross-reference entities. For workspaces with resolved problems, creates `EXTRACTED_FROM` relations to KG entities created during that workspace's session. Detects thought references (`thoughtRef` fields in `ConsensusMarker`, `ref` fields in `ChannelMessage`) and creates `RELATES_TO` relations.

### Adapter 6: LangSmith (`src/knowledge/adapters/langsmith-adapter.ts`)

Queries LangSmith cloud traces for run telemetry.

**search**: Calls LangSmith API (`GET /api/v1/runs`) filtered by name/tags matching the query. Returns run summaries with cost, duration, status. Available only when `LANGSMITH_API_KEY` is set.

**resolve**: Fetches full run details including input/output, token counts, child runs.

**ingest**: Creates `RunTrace` cross-reference entities for significant runs (cost > $0.01, or tagged with `sil`, `agentops`, `improvement`). Creates `RELATES_TO` relations when run names reference Beads issue IDs or KG entity names.

**Graceful degradation**: `isAvailable()` returns `false` if the API key is not configured. The unified query omits LangSmith results silently.

---

## Unified Query Interface

### New Actions on the `knowledge` Operation

The KAL adds 4 new actions to the existing `knowledge` operation handler (`src/knowledge/handler.ts`), keeping everything routed through the existing gateway (`src/gateway/gateway-handler.ts` already routes `knowledge` to `KnowledgeHandler`):

#### Action: `unified_search`

```typescript
{
  name: "unified_search",
  title: "Unified Knowledge Search",
  description: "Search across ALL knowledge stores simultaneously: knowledge graph, MEMORY.md, Beads issues, git history, Hub state, and LangSmith traces. Returns ranked results from every available store.",
  category: "unified-query",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (e.g., 'hub_wait race condition', 'profile priming bug')"
      },
      stores: {
        type: "array",
        items: {
          type: "string",
          enum: ["knowledge_graph", "memory_md", "beads", "git", "hub", "langsmith"]
        },
        description: "Limit to specific stores. Omit to search all available."
      },
      types: {
        type: "array",
        items: {
          type: "string",
          enum: ["Insight", "Concept", "Workflow", "Decision", "Agent",
                 "Issue", "Commit", "HubWorkspace", "RunTrace"]
        },
        description: "Filter by entity type"
      },
      freshness: {
        type: "array",
        items: { type: "string", enum: ["HOT", "WARM", "COLD"] },
        description: "Filter by freshness tag"
      },
      since: {
        type: "string",
        description: "Only results after this date (ISO 8601)"
      },
      limit: {
        type: "number",
        description: "Maximum total results across all stores (default: 20)"
      },
      include_cross_refs: {
        type: "boolean",
        description: "Include cross-referenced entities from other stores (default: true)"
      }
    },
    required: ["query"]
  }
}
```

**Invocation**:
```
thoughtbox_gateway {
  operation: "knowledge",
  args: {
    action: "unified_search",
    query: "hub_wait",
    freshness: ["HOT", "WARM"],
    limit: 15
  }
}
```

#### Action: `record_usage`

```typescript
{
  name: "record_usage",
  title: "Record Knowledge Usage",
  description: "Record that a knowledge entity was used in a decision. Updates freshness metadata. Successful usage promotes toward HOT.",
  inputSchema: {
    properties: {
      entity_id: { type: "string", description: "Knowledge graph entity ID" },
      outcome: { type: "string", enum: ["success", "failure", "neutral"] },
      context: { type: "string", description: "Brief description of how it was used" }
    },
    required: ["entity_id", "outcome"]
  }
}
```

#### Action: `ingest`

```typescript
{
  name: "ingest",
  title: "Ingest External Knowledge",
  description: "Ingest items from external stores into the knowledge graph as cross-reference entities with relations.",
  inputSchema: {
    properties: {
      stores: {
        type: "array",
        items: { type: "string", enum: ["memory_md", "beads", "git", "hub", "langsmith"] },
        description: "Which stores to ingest from. Omit to ingest from all."
      },
      since: { type: "string", description: "Only items after this date (ISO 8601)" },
      limit: { type: "number", description: "Max items to ingest per store (default: 50)" },
      force: { type: "boolean", description: "Re-ingest even if cross-ref entity exists (default: false)" }
    }
  }
}
```

#### Action: `decay_freshness`

```typescript
{
  name: "decay_freshness",
  title: "Decay Freshness Tags",
  description: "Run freshness decay across all entities. Demotes HOT->WARM->COLD based on elapsed time since last validation. Intended for ULC daily aggregation or manual use.",
  inputSchema: {
    properties: {
      dry_run: { type: "boolean", description: "Preview without applying (default: false)" }
    }
  }
}
```

### Response Shape

```typescript
interface UnifiedSearchResponse {
  query: string;
  total_results: number;
  stores_queried: SourceStore[];
  stores_unavailable: SourceStore[];
  results: KnowledgeResult[];      // Sorted by relevance descending, interleaved
  cross_references: Array<{
    from: string;                  // cross_ref of source result
    to: string;                    // cross_ref of target result
    relation_type: string;
  }>;
  freshness_summary: {
    HOT: number;
    WARM: number;
    COLD: number;
  };
}
```

---

## Query Routing Algorithm

When `unified_search` is called:

### Step 1: Adapter Selection

If `stores` is provided, use only those adapters. Otherwise, call `isAvailable()` on all adapters and use those that return `true`.

### Step 2: Parallel Dispatch

Execute `adapter.search(query, opts)` on all selected adapters using `Promise.allSettled`. Failed adapters are logged and omitted. The query gracefully degrades.

### Step 3: Result Merging with Source Weighting

Each adapter returns results with relevance 0-1. The router applies source weighting to prevent any single store from dominating:

```typescript
const SOURCE_WEIGHT: Record<SourceStore, number> = {
  knowledge_graph: 1.0,  // Native store, highest trust
  beads: 0.9,            // Structured, reliable
  hub: 0.85,             // Structured but workspace-scoped
  git: 0.8,              // Factual but noisy
  memory_md: 0.75,       // Valuable but unstructured, may be stale
  langsmith: 0.7,        // Telemetry, less directly useful
};

// Effective relevance = adapter_relevance * source_weight
```

### Step 4: Cross-Reference Resolution

After merging, check the knowledge graph for existing relations between returned results (by their `cross_ref` names). Include these in the `cross_references` array.

If `include_cross_refs` is `true` (default), follow one hop of relations from KG entities in the result set to include related entities from other stores not in the original results.

### Step 5: Freshness Filtering and Summary

If `freshness` filter is specified, exclude non-matching results. Compute `freshness_summary` from the final result set.

### Step 6: Ranking and Truncation

Sort by effective relevance descending. Truncate to `limit`.

---

## Ingestion Pipeline

### Path 1: On-Demand Ingestion

An agent or automation calls `knowledge { action: "ingest", stores: [...] }`. Adapters scan their stores and create/update cross-reference entities.

**Ingestion order** (dependency-aware):
1. **Beads** first (issues are the most stable references)
2. **Git** second (commits reference issues)
3. **Hub** third (workspaces reference sessions and thoughts)
4. **MEMORY.md** fourth (learnings reference all of the above)
5. **LangSmith** last (traces reference runs which may reference issues)

**Deduplication**: The knowledge graph `UNIQUE(name, type)` constraint prevents duplicate cross-references. `createEntity` returns the existing entity on collision (verified: `src/knowledge/storage.ts` line 361). The adapter counts this as `skipped`.

### Path 2: Lazy Marking on Search

When `unified_search` returns results from external stores without existing KG cross-reference entities, the response marks them with `kg_entity_id: null`. The caller can then explicitly call `ingest` for specific items. Search itself is read-only and side-effect-free.

### Path 3: ULC-Triggered Periodic Ingestion

The Unified Loop Controller daily aggregation workflow (from spec 01) triggers `ingest` and `decay_freshness` as part of its daily bookkeeping. This keeps cross-references reasonably current without requiring real-time event processing.

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**New files:**
- `src/knowledge/adapters/types.ts` -- `KnowledgeStoreAdapter`, `KnowledgeResult`, freshness types
- `src/knowledge/adapters/kg-adapter.ts` -- Knowledge graph native adapter
- `src/knowledge/adapters/memory-adapter.ts` -- MEMORY.md parser and adapter
- `src/knowledge/adapters/beads-adapter.ts` -- Beads JSONL reader and adapter
- `src/knowledge/unified-search.ts` -- Query router, merger, ranker

**Modified files:**
- `src/knowledge/types.ts` -- Add `CrossRefEntityType` to `EntityType` union, add `FreshnessProperties` interface
- `src/knowledge/operations.ts` -- Add `unified_search`, `record_usage`, `ingest`, `decay_freshness` to `KNOWLEDGE_OPERATIONS` array
- `src/knowledge/handler.ts` -- Add routing for new actions: `case 'unified_search':`, `case 'record_usage':`, `case 'ingest':`, `case 'decay_freshness':`

**No changes needed to:**
- `src/gateway/gateway-handler.ts` -- Already routes `knowledge` to `KnowledgeHandler`
- `src/knowledge/storage.ts` -- Entity creation with properties already supports arbitrary JSON

**Tests:**
- `src/knowledge/__tests__/unified-search.test.ts` -- Query routing and result merging
- `src/knowledge/__tests__/memory-adapter.test.ts` -- MEMORY.md parsing against actual project files
- `src/knowledge/__tests__/beads-adapter.test.ts` -- Beads JSONL reading against actual `.beads/issues.jsonl`

### Phase 2: Git and Hub Adapters (Week 2)

**New files:**
- `src/knowledge/adapters/git-adapter.ts`
- `src/knowledge/adapters/hub-adapter.ts`
- `src/knowledge/__tests__/git-adapter.test.ts`
- `src/knowledge/__tests__/hub-adapter.test.ts`
- `src/knowledge/__tests__/cross-reference.test.ts` -- Integration tests for cross-store linking

### Phase 3: Freshness, LangSmith, and Ingestion (Week 2-3)

**New files:**
- `src/knowledge/freshness.ts` -- Decay algorithm, usage recording, importance score recalculation
- `src/knowledge/adapters/langsmith-adapter.ts`
- `src/knowledge/__tests__/freshness.test.ts`
- `src/knowledge/__tests__/langsmith-adapter.test.ts`

### Phase 4: ULC Integration (Week 3)

Wire the KAL into the Unified Loop Controller from spec 01:
- Session end hook emits richer signals by running `unified_search` for context
- AgentOps daily brief consumes KG entities as an additional signal source
- SIL Discovery phase uses `unified_search` to find related prior work
- Daily aggregation triggers `decay_freshness` and `ingest` from all stores

---

## Governance and Safety

### Read-Only by Default

`unified_search` is read-only. It searches existing stores without modifying them. The knowledge graph is only written to during explicit `ingest` or `record_usage` calls.

### No External Store Modification

Adapters have read-only access to external stores. The KAL never modifies MEMORY.md, Beads issues, git history, Hub state, or LangSmith traces. It only reads from them and writes cross-reference metadata to the knowledge graph.

### Non-Destructive Freshness Decay

`decay_freshness` only modifies `properties.freshness_tag` on entities. It never deletes entities. Archival requires human approval.

### Zero LLM Cost

All KAL operations are local computation (JSONL parsing, SQLite queries, git commands, JSON file reads). The LangSmith adapter makes HTTP API calls but these are read-only. The KAL adds zero LLM cost to the system.

### Scope Constraint

**CANNOT**: Modify any external store, create/close Beads issues, make git commits, modify Hub state, delete KG entities.

**CAN**: Read from all stores, create entities/relations/observations in the knowledge graph, update freshness properties, return unified search results.

---

## Success Criteria

### Phase 1: Unified Search Works (Week 1)

- [ ] `unified_search { query: "hub_wait" }` returns results from knowledge graph, MEMORY.md, and Beads simultaneously
- [ ] Results are ranked by relevance with source weighting applied
- [ ] Unavailable stores (LangSmith without API key) are gracefully skipped
- [ ] Response includes `stores_queried` and `stores_unavailable` arrays

### Phase 2: Cross-References Exist (Week 2)

- [ ] `ingest { stores: ["beads"] }` creates `Issue` entities for all Beads issues
- [ ] `ingest { stores: ["git"] }` creates `Commit` entities for recent commits
- [ ] Cross-references between Beads issues and git commits are detected via commit message scanning
- [ ] `unified_search` results include `cross_references` array showing inter-store links

### Phase 3: Freshness Tracking Works (Week 3)

- [ ] `record_usage { entity_id: "...", outcome: "success" }` promotes entity to HOT
- [ ] `decay_freshness {}` demotes HOT entities older than 14 days to WARM
- [ ] `unified_search { freshness: ["HOT"] }` returns only recently validated knowledge

### Quantitative Targets (3-month horizon)

| Metric | Baseline (current) | Target |
|--------|-------------------|--------|
| Queries to answer "what does the system know about X?" | 5 (one per store) | 1 |
| Cross-referenced entities in knowledge graph | 0 | > 100 |
| KG entities with freshness metadata | 0 | > 80% |
| Stale MEMORY.md entries detectable by freshness mismatch | 0 | > 90% |

---

## Risks

### Risk 1: MEMORY.md Parsing Fragility

**Threat**: MEMORY.md files have no enforced schema. Sections may use inconsistent header levels.

**Mitigation**: Conservative parser: split on `## ` only. Everything between headers is one section. Truncate snippets at 500 chars. Test against actual project MEMORY.md files (snapshot-based tests).

### Risk 2: Beads JSONL Growth

**Threat**: As issues accumulate, parsing the entire JSONL on every search becomes slow.

**Mitigation**: Build in-memory index on first read, rebuild when file mtime changes. At current ~30 issues this is negligible. At 10,000+ issues, switch to querying the Beads SQLite directly.

### Risk 3: Git Log Performance

**Threat**: `git log --grep` on large repositories can be slow.

**Mitigation**: Default to last 90 days (`--after`). The `since` parameter further constrains. Current project with ~500 commits returns in < 100ms.

### Risk 4: Knowledge Graph Bloat from Ingestion

**Threat**: Hundreds of lightweight cross-reference entities clutter the knowledge graph.

**Mitigation**: Cross-reference entities use distinct types (`Issue`, `Commit`, `HubWorkspace`, `RunTrace`) easily filtered out. Existing `listEntities` supports type filtering. Agents querying for `Insight` or `Workflow` are not affected. `unified_search` response clearly marks each result's source.

### Risk 5: Stale Cross-References

**Threat**: A Beads issue is reopened but its KG cross-reference still shows `status: "closed"`.

**Mitigation**: `ingest` re-reads external stores and updates cross-reference entity properties. Running `ingest` daily via ULC keeps references fresh. `unified_search` queries external stores live -- cross-references are for linking, not as authoritative copies.

### Risk 6: Per-Adapter Timeout

**Threat**: A slow adapter (LangSmith API, large git repo) blocks the entire unified search.

**Mitigation**: Each adapter gets a 2-second timeout in `Promise.allSettled`. Timed-out adapters are listed in `stores_unavailable`. Results from faster adapters are returned immediately.

---

## Appendix A: Relationship to Existing Specs

| Spec | Relationship |
|------|-------------|
| `dgm-specs/SPEC-KNOWLEDGE-MEMORY.md` | KAL builds on the Phase 1 MVP knowledge graph. Extends it with cross-reference types and freshness. |
| `specs/continual-improvement/01-unified-loop-controller.md` | ULC consumes KAL. Signal payloads enriched by unified search. Daily aggregation triggers ingestion and decay. |
| `specs/continual-improvement/03-automated-pattern-evolution.md` | DGM fitness tracking maps to freshness tags. `record_usage` feeds fitness data. |
| `specs/continual-improvement/04-cross-session-continuity.md` | Session continuity benefits from cross-referenced knowledge that persists across sessions. |
| `.claude/rules/continual-calibration.md` | Freshness tags (HOT/WARM/COLD) are a direct implementation of the Continual Calibration principle. |
| `staging/docs/adr/002-mcp-hub-staging-adr.md` | Hub data model defines the structures the Hub adapter reads. |

## Appendix B: Full Example -- "What does the system know about hub_wait?"

**Before KAL** (5 queries, 5 formats, manual correlation):

```
1. knowledge { action: "list_entities", args: { name_pattern: "%hub_wait%" } }
   -> 2 entities (Concept, Workflow)

2. grep "hub_wait" across 5 MEMORY.md files
   -> 1 hit in global MEMORY.md

3. bd search "hub_wait"
   -> 1 issue (thoughtbox-6d2: closed, "Implemented hub_wait with 15 tests")

4. git log --all --oneline --grep hub_wait
   -> 3 commits

5. thoughtbox_hub { operation: "list_problems" } across N workspaces
   -> 1 problem in workspace abd65cd4
```

Agent must manually correlate: issue thoughtbox-6d2 was implemented by the 3 commits, the KG entities describe the pattern, MEMORY.md mentions a separate race condition, the Hub problem was part of the coordination session.

**After KAL** (1 query):

```
knowledge { action: "unified_search", args: { query: "hub_wait" } }
```

Returns all 8 items ranked by relevance, with `cross_references` showing:
- `beads:thoughtbox-6d2` RELATES_TO `git:commit-abc` (issue references commit in close_reason)
- `git:commit-abc` APPLIED_IN `kg:hub-wait-long-polling` (commit implements the pattern)
- `kg:hub-wait-long-polling` EXTRACTED_FROM `hub:abd65cd4` (pattern emerged from workspace)
- `memory:hub-wait-race-condition` has no cross-references (distinct unresolved issue)

The agent sees the full picture in one response. No manual correlation needed.

## Appendix C: File Inventory (New Files)

```
src/knowledge/
  adapters/
    types.ts                    # KnowledgeStoreAdapter, KnowledgeResult, FreshnessProperties
    kg-adapter.ts               # Knowledge graph native adapter
    memory-adapter.ts           # MEMORY.md parser and adapter
    beads-adapter.ts            # Beads JSONL reader and adapter
    git-adapter.ts              # Git history adapter
    hub-adapter.ts              # Hub state adapter
    langsmith-adapter.ts        # LangSmith REST API adapter (optional)
  unified-search.ts             # Query router, merger, ranker
  freshness.ts                  # Decay algorithm, usage recording
  __tests__/
    unified-search.test.ts
    memory-adapter.test.ts
    beads-adapter.test.ts
    git-adapter.test.ts
    hub-adapter.test.ts
    langsmith-adapter.test.ts
    cross-reference.test.ts
    freshness.test.ts
```
