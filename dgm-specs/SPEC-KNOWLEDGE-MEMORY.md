# SPEC: Knowledge Memory System

**Status**: Proposed
**Author**: Claude
**Date**: 2026-01-21
**Related Sessions**:
- `4850e331-6a4a-4185-b4ff-81f3cbc4af0e` - Multi-agent collaboration patterns
- `16d6f94f-e954-4266-ab17-eb5afd7f8748` - Persistent memory architecture

---

## Abstract

This specification proposes adding a **Knowledge Graph Memory System** to Thoughtbox, enabling persistent storage and semantic retrieval of insights, domain knowledge, and learned patterns. This provides multi-agent systems with institutional memory that accumulates across sessions and tasks.

**Key Capabilities**:

1. **Persistent Knowledge Storage** (Phase 1): Insights extracted from reasoning sessions persist beyond container lifetime
2. **Semantic Retrieval** (Phase 3): Agents query knowledge using natural language via embedding-based search
3. **Temporal Awareness** (Phase 4): Knowledge evolves over time with validity tracking
4. **Multi-Agent Learning** (Phase 2+): Agents learn from each other's experiences across sessions
5. **Cross-Session Synthesis** (Phase 2+): References to prior reasoning sessions via `@keyword:SN` anchor syntax

**MVP (Phase 1)**: JSONL + SQLite storage, manual entity creation, graph traversal queries. No embeddings, no auto-extraction.

---

## Motivation

### Current Limitation

Thoughtbox sessions capture structured reasoning excellently, but knowledge remains session-scoped:

- **No persistent memory**: Insights from Session A don't inform Session B
- **Agent amnesia**: Each agent rediscovers patterns independently
- **Knowledge duplication**: Similar problems solved repeatedly without learning
- **Limited to Docker container**: Knowledge lost when container removed

### Research Foundation

> **Session**: `@collaborative-reasoning:S1-S37` explored multi-agent collaboration, revealing that memory architecture is critical for preventing work duplication (MongoDB study: agents duplicate work without shared memory; G-Memory: 38.6% performance improvement with structured memories).

### Ecosystem Validation

Research in Session `16d6f94f-e954-4266-ab17-eb5afd7f8748` identified 30+ knowledge graph memory MCP servers (Dec 2025-Jan 2026), validating the need and showing convergence on:
- SQLite + embeddings for local deployments
- Entities + Relations + Observations model (Anthropic's reference implementation)
- Semantic search via vector embeddings
- Project-scoped persistent storage

---

## Design

### Core Architecture

**Three-Layer Storage**:

```
┌─────────────────────────────────────┐
│  Layer 1: JSONL (Source of Truth)   │  ← Append-only, git-friendly
├─────────────────────────────────────┤
│  Layer 2: SQLite (Query Index)      │  ← Fast structured queries
├─────────────────────────────────────┤
│  Layer 3: sqlite-vec (Embeddings)   │  ← Semantic search via KNN
└─────────────────────────────────────┘
```

**Why This Stack**:
1. **JSONL**: Append-only, git-friendly, human-readable source of truth
2. **SQLite**: ACID transactions, portable, zero-config, already used in Thoughtbox
3. **sqlite-vec**: Local embeddings (no API deps), SIMD-accelerated, <100k vectors optimal

### Directory Structure

```
~/.thoughtbox/
├── {project-name}/
│   ├── sessions/              # Existing
│   ├── tasks/                 # From SPEC-REASONING-TASKS
│   └── memory/                # NEW
│       ├── graph.jsonl        # Source of truth (git-tracked)
│       ├── memory.db          # SQLite index (generated, .gitignore)
│       └── .embedding-cache/  # Model cache (generated)
└── knowledge/                 # Existing (different scope)
```

**Scoping**: Project-level (not global, not task-level). Knowledge accumulates across all work in a project, enabling cross-task learning and institutional memory.

---

## Data Model

### Entities

```typescript
interface Entity {
  // Identity
  id: string;                    // UUID
  name: string;                  // Unique within type (e.g., "orchestrator-worker-pattern")
  type: EntityType;

  // Content
  label: string;                 // Human-readable title
  properties: Record<string, any>; // Type-specific properties

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by?: string;           // Agent ID

  // Access control
  visibility: 'public' | 'agent-private' | 'user-private' | 'team-private';

  // Temporal validity
  valid_from: Date;
  valid_to?: Date;               // null = currently valid
  superseded_by?: string;        // Entity ID that replaces this

  // Metrics
  access_count: number;
  last_accessed_at: Date;
  importance_score: number;      // Computed from access, centrality, recency
}

type EntityType =
  | 'Insight'      // Key learning from session
  | 'Concept'      // Domain knowledge term
  | 'Pattern'      // Successful/failed workflow
  | 'Decision'     // Architectural choice with rationale
  | 'Agent';       // Agent profile with specializations
```

### Type-Specific Properties

```typescript
// Insight
{
  key_learning: string;
  confidence: number;           // 0.0-1.0
  evidence_sessions: string[];  // Session IDs
  validated_by: string[];       // Agent IDs
}

// Pattern
{
  situation: string;
  actions: string[];
  outcome: 'success' | 'failure';
  success_rate: number;
  applied_count: number;
}

// Concept
{
  definition: string;
  domain: string;               // e.g., 'multi-agent-systems', 'authentication'
  related_concepts: string[];   // Entity IDs
}

// Decision
{
  question: string;
  options: string[];
  chosen: string;
  rationale: string;
  decided_by: string;           // Agent ID
  reversible: boolean;
}

// Agent
{
  role: string;
  specialization: string;
  tasks_completed: number;
  avg_quality: number;
  learned_patterns: string[];   // Entity IDs of patterns this agent knows
}
```

### Relations

```typescript
interface Relation {
  id: string;
  from_id: string;              // Source entity UUID
  to_id: string;                // Target entity UUID
  type: RelationType;
  properties: Record<string, any>;
  created_at: Date;
  created_by?: string;
}

type RelationType =
  | 'RELATES_TO'        // Generic conceptual connection
  | 'BUILDS_ON'         // Extends or refines
  | 'CONTRADICTS'       // Conflicts with
  | 'EXTRACTED_FROM'    // Links to source session
  | 'APPLIED_IN'        // Used in task
  | 'LEARNED_BY'        // Agent acquired knowledge
  | 'DEPENDS_ON'        // Prerequisite knowledge
  | 'SUPERSEDES'        // Replaces obsolete entity
  | 'MERGED_FROM';      // Consolidated from duplicate
```

### Observations

```typescript
interface Observation {
  id: string;
  entity_id: string;            // FK to entity
  content: string;              // Atomic fact
  source_session?: string;      // Session that contributed this
  added_by?: string;            // Agent ID
  added_at: Date;

  // Temporal validity
  valid_from: Date;
  valid_to?: Date;
  superseded_by?: string;       // Observation ID
}
```

### Embeddings

```typescript
interface Embedding {
  entity_id: string;            // FK to entity
  embedding: Float32Array;      // Vector representation
  model: string;                // e.g., 'all-MiniLM-L6-v2'
  model_version: string;
  computed_at: Date;
}
```

---

## Storage Implementation

### SQLite Schema

```sql
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  properties TEXT,              -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by TEXT,
  visibility TEXT DEFAULT 'public',
  valid_from INTEGER NOT NULL,
  valid_to INTEGER,
  superseded_by TEXT,
  access_count INTEGER DEFAULT 0,
  last_accessed_at INTEGER,
  importance_score REAL DEFAULT 0.5,
  UNIQUE(name, type)
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_visibility ON entities(visibility);
CREATE INDEX idx_entities_valid ON entities(valid_from, valid_to);
CREATE INDEX idx_entities_importance ON entities(importance_score DESC);

CREATE TABLE relations (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  type TEXT NOT NULL,
  properties TEXT,              -- JSON
  created_at INTEGER NOT NULL,
  created_by TEXT,
  FOREIGN KEY (from_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_relations_from ON relations(from_id);
CREATE INDEX idx_relations_to ON relations(to_id);
CREATE INDEX idx_relations_type ON relations(type);

CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  content TEXT NOT NULL,
  source_session TEXT,
  added_by TEXT,
  added_at INTEGER NOT NULL,
  valid_from INTEGER NOT NULL,
  valid_to INTEGER,
  superseded_by TEXT,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_observations_entity ON observations(entity_id);
CREATE INDEX idx_observations_session ON observations(source_session);
CREATE INDEX idx_observations_valid ON observations(valid_from, valid_to);

-- Full-text search for observations
CREATE VIRTUAL TABLE observations_fts USING fts5(
  content,
  content=observations,
  content_rowid=rowid
);

-- Vector embeddings (requires sqlite-vec extension)
CREATE VIRTUAL TABLE embeddings USING vec0(
  entity_id TEXT PRIMARY KEY,
  embedding FLOAT[384],         -- all-MiniLM-L6-v2 dimensions
  model TEXT,
  model_version TEXT,
  computed_at INTEGER
);
```

### JSONL Format

Each line is a JSON object representing either an entity or relation:

```jsonl
{"type":"entity","id":"abc-123","name":"orchestrator-worker-pattern","entityType":"Pattern","label":"Orchestrator-Worker Pattern","properties":{"situation":"Multi-agent coordination","actions":["Main agent decomposes task","Sub-agents execute in parallel","Main agent synthesizes results"],"outcome":"success","success_rate":0.95},"created_at":"2026-01-21T12:00:00Z","visibility":"public"}
{"type":"relation","id":"def-456","from_id":"abc-123","to_id":"xyz-789","relationType":"EXTRACTED_FROM","created_at":"2026-01-21T12:01:00Z"}
```

---

## MCP Integration

### Gateway Operations

Add `knowledge` operation to `thoughtbox_gateway`:

```typescript
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: KnowledgeAction,
    // Action-specific parameters
  }
})

type KnowledgeAction =
  | 'create_entity'
  | 'add_observation'
  | 'create_relation'
  | 'query_semantic'      // Embedding-based search
  | 'query_graph'         // Graph traversal
  | 'query_temporal'      // Time-filtered retrieval
  | 'traverse'            // BFS/DFS from entity
  | 'extract_from_session' // Auto-extract insights
  | 'invalidate_fact'     // Mark knowledge obsolete
  | 'merge_entities'      // Consolidate duplicates
  | 'export'              // Export to various formats
  | 'stats';              // Graph metrics
```

### Tool Examples

#### Create Entity

```typescript
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: 'create_entity',
    name: 'orchestrator-worker-pattern',
    type: 'Pattern',
    label: 'Orchestrator-Worker Pattern for Multi-Agent Systems',
    properties: {
      situation: 'Multi-agent task coordination',
      actions: [
        'Main agent decomposes task into subtasks',
        'Sub-agents execute tasks in parallel',
        'Main agent synthesizes results'
      ],
      outcome: 'success',
      success_rate: 0.95
    },
    observations: [
      'Optimal for Claude Code collaboration',
      'Main agent must be single coordination point',
      'Prevents context explosion from duplicate state reads'
    ],
    source_session: '4850e331-6a4a-4185-b4ff-81f3cbc4af0e'
  }
})
// Returns: { entityId: 'abc-123', ... }
```

#### Semantic Query

```typescript
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: 'query_semantic',
    query: 'How should agents coordinate for code review?',
    limit: 5,
    filters: {
      types: ['Pattern', 'Insight'],
      min_confidence: 0.7,
      max_age_days: 90
    }
  }
})
// Returns: {
//   results: [
//     {
//       entity: { ... },
//       similarity: 0.92,
//       observations: [...],
//       related: [...],
//       source_sessions: ['sess-1', 'sess-2']
//     }
//   ]
// }
```

#### Extract from Session

```typescript
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: 'extract_from_session',
    session_id: '4850e331-6a4a-4185-b4ff-81f3cbc4af0e',
    entity_types: ['Insight', 'Pattern'],
    auto_link: true              // Automatically create relations
  }
})
// System analyzes session thoughts, creates entities from:
// - Conclusion thoughts (type C)
// - Synthesis thoughts (type X)
// - Plan thoughts (type P) that worked well
// Returns: { created: 5, linked: 12, skipped: 2 }
```

#### Graph Traversal

```typescript
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: 'traverse',
    start_entity: 'multi-agent-collaboration',
    relation_types: ['RELATES_TO', 'BUILDS_ON'],
    max_depth: 3,
    filter: { types: ['Concept', 'Pattern'] }
  }
})
// Returns: Graph of related concepts and patterns
```

---

## Semantic Search Implementation (Phase 3+)

**Note**: Phase 1 uses FTS5 text search and graph traversal only. Semantic search is an optional enhancement.

### Embedding Model

**Default**: `all-MiniLM-L6-v2` (SentenceTransformers via @xenova/transformers)
- **Dimensions**: 384
- **Size**: 120MB
- **Speed**: ~3000 sentences/sec on CPU (target, not validated)
- **Quality**: State-of-the-art for semantic similarity

**Fallback Chain**:
1. Local model (all-MiniLM-L6-v2) - preferred
2. FTS5 text search on observations - if embeddings unavailable
3. Graph traversal only - basic mode

**Configuration**:
```typescript
// ~/.thoughtbox/config.json
{
  "memory": {
    "embedding_model": "all-MiniLM-L6-v2",
    "embedding_batch_size": 32,
    "cache_embeddings": true,
    "lazy_compute": true         // Compute embeddings in background
  }
}
```

### Query Ranking

Results ranked by composite score:

```typescript
score = semantic_similarity * 0.50 +
        recency_score * 0.20 +
        access_frequency * 0.15 +
        source_quality * 0.15;

recency_score = 1.0 / (1 + days_since_creation / 30);
access_frequency = log(1 + access_count) / 10;
source_quality = avg(
  session.quality.isComplete ? 1.0 : 0.5,
  session.structure.linearityScore
);
```

---

## Session Extraction (Phase 2)

**Note**: Phase 1 only supports manual entity creation. Auto-extraction comes in Phase 2.

### Automatic Extraction Triggers

1. **Session complete**: Extract from conclusion/synthesis thoughts
2. **Task complete**: Extract from all linked sessions
3. **Agent explicit save**: `kg.store_insight()` during reasoning
4. **Conflict resolution**: Create Decision entity with rationale

### Extraction Logic

```typescript
async function extractFromSession(sessionId: string): Promise<ExtractionResult> {
  const thoughts = await storage.getThoughts(sessionId);
  const entities: Entity[] = [];

  // Extract from Conclusion thoughts (type C)
  const conclusions = thoughts.filter(t => t.thought.match(/^S\d+\|C\|/));
  for (const thought of conclusions) {
    entities.push({
      type: 'Insight',
      name: generateName(thought.thought),
      label: extractKeyLearning(thought.thought),
      properties: {
        key_learning: thought.thought,
        confidence: 0.8,          // Default, increases with validation
        evidence_sessions: [sessionId]
      }
    });
  }

  // Extract from Synthesis thoughts (type X)
  const syntheses = thoughts.filter(t => t.thought.match(/^S\d+\|X\|/));
  for (const thought of syntheses) {
    entities.push({
      type: 'Pattern',
      name: generateName(thought.thought),
      properties: extractPatternProperties(thought.thought)
    });
  }

  // Create relations between extracted entities and concepts
  await autoLinkEntities(entities);

  return { created: entities.length, ... };
}
```

### Manual Extraction

Agents can explicitly save knowledge during reasoning:

```typescript
// Within a thought, agent references:
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: 'create_entity',
    type: 'Insight',
    label: 'Main agent must be single coordination point',
    observations: [
      'Sub-agents reading all shared state causes context explosion',
      'Increased context window from 15-20 min to 2+ hours',
      'From Ilyas Ibrahim production experience'
    ],
    source_session: getCurrentSessionId()
  }
})
```

---

## Temporal Knowledge

### Validity Tracking

Knowledge evolves. Facts have lifespans:

```typescript
interface TemporalEntity extends Entity {
  valid_from: Date;
  valid_to?: Date;              // null = currently valid
  superseded_by?: string;       // Entity that replaces this
}
```

**Example**:
```json
{
  "id": "insight-001",
  "label": "Use Docker for deployment",
  "valid_from": "2025-01-01",
  "valid_to": "2025-06-01",
  "superseded_by": "insight-042"
}
{
  "id": "insight-042",
  "label": "Use Kubernetes for deployment",
  "valid_from": "2025-06-01",
  "valid_to": null
}
```

### Automatic Conflict Detection (Phase 4)

**Note**: Requires embeddings from Phase 3. For Phase 1-2, conflicts are not auto-detected.

When new entity contradicts existing:

```typescript
async function detectConflicts(newEntity: Entity): Promise<Conflict[]> {
  // Find similar entities via embedding
  const similar = await querySemantic(newEntity.label, { min_similarity: 0.85 });

  const conflicts = [];
  for (const existing of similar) {
    // TODO: Define conclusionsDiffer() algorithm
    // Suggested: Compare semantic similarity of conclusions
    if (conclusionsDiffer(newEntity, existing)) {
      conflicts.push({
        existing_id: existing.id,
        new_entity: newEntity,
        similarity: existing.similarity,
        action: 'supersede' | 'merge' | 'flag'
      });
    }
  }

  return conflicts;
}
```

**Resolution**:
- **Supersede**: Mark old entity `valid_to = now`, link via `SUPERSEDES`
- **Merge**: Combine observations if conclusions align
- **Flag**: Create `ConflictResolution` record (from SPEC-REASONING-TASKS), trigger deliberation

---

## Multi-Agent Integration

### Knowledge-Informed Task Planning

When orchestrator receives task:

```typescript
// Step 1: Query knowledge for similar past tasks
const relevantKnowledge = await kg.query_semantic(taskDescription, {
  types: ['Pattern', 'Decision', 'Insight'],
  limit: 10
});

// Step 2: Use knowledge to inform decomposition
const taskGraph = decompose(task, {
  knownPatterns: relevantKnowledge.patterns,
  pastDecisions: relevantKnowledge.decisions,
  avoidAntiPatterns: relevantKnowledge.failures
});

// Step 3: Present context to agent
return {
  task,
  graph: taskGraph,
  context: `Based on past work, consider: ${summarize(relevantKnowledge)}`
};
```

### Agent-Specific Memory

Each agent accumulates role-specific knowledge:

```typescript
// Query what security-agent has learned
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: 'query_graph',
    start_entity: 'agent:security-specialist',
    relation_types: ['LEARNED_BY'],
    return_types: ['Pattern', 'Insight']
  }
})
// Returns patterns/insights this agent has internalized
```

### Cross-Agent Learning

Pattern from Session `@collaborative-reasoning:S43-S45`:

```typescript
// Security agent finds SQL injection vulnerability
await kg.create_entity({
  type: 'Insight',
  label: 'SQL injection risk in user input handlers',
  observations: [
    'Use parameterized queries instead of string concatenation',
    'Validate and sanitize all user input',
    'Found in session abc-123 during code review'
  ]
});

await kg.create_relation({
  from: 'insight:sql-injection-risk',
  to: 'agent:security-specialist',
  type: 'LEARNED_BY'
});

// Later: Code review agent queries "security best practices"
// System retrieves this insight via semantic search
// Agent benefits from security-agent's past discoveries!
```

---

## Git Integration

### Collaborative Knowledge Building

**JSONL is git-tracked**, enabling team collaboration:

```bash
# Developer A extracts knowledge from session
# Commits graph.jsonl
git add .thoughtbox/myproject/memory/graph.jsonl
git commit -m "feat(knowledge): Add orchestrator-worker pattern"

# Developer B pulls changes
git pull
# Thoughtbox rebuilds memory.db from graph.jsonl
# Both devs now share knowledge!
```

**Conflict Resolution**:
- JSONL merge conflicts: append-only nature minimizes conflicts
- SQLite index: Regenerated from merged JSONL (not tracked in git)
- Embeddings: Recomputed as needed (cached locally)

### Knowledge as Code

Version control for knowledge evolution:

```bash
# Experimental knowledge in branch
git checkout -b experiment/new-architecture-pattern
# Add entities during exploration
# Decide: merge to main (validated) or discard (didn't work)

# Rollback bad knowledge
git revert abc123  # Remove incorrect insight
```

---

## Advanced Features

### Confidence Evolution

When same insight extracted from multiple sessions:

```typescript
// First extraction
{ confidence: 0.7, supporting_sessions: ['sess-1'] }

// Second extraction (similar insight)
// Auto-merge increases confidence
{ confidence: 0.85, supporting_sessions: ['sess-1', 'sess-2'] }

// Formula
confidence = (supporting / (supporting + contradicting)) *
             (1 + log10(total_sessions)) / 2;
```

### Entity Lifecycle Management

Prevent knowledge graph bloat:

```typescript
// Importance scoring
importance = access_count * 0.4 +
             recency_score * 0.3 +
             centrality * 0.3;

centrality = (in_degree + out_degree) / max_degree_in_graph;

// Monthly cleanup
if (importance < 0.3 && age > 90_days && access_count < 3) {
  await kg.archive(entityId, 'graph-archive.jsonl');
}
```

Archived entities can be restored if needed.

### Privacy & Access Control

```typescript
// Entity visibility affects queries
const results = await kg.query_semantic(query, {
  requesting_agent: 'agent-id-123',
  visibility_filter: true  // Only returns entities agent can see
});

// Visibility rules
switch (entity.visibility) {
  case 'public':        return true;
  case 'agent-private': return entity.created_by === requesting_agent;
  case 'user-private':  return entity.created_by.startsWith(current_user);
  case 'team-private':  return isTeamMember(requesting_agent);
}
```

---

## Use Cases

### Use Case 1: Multi-Agent Code Review Learning

```text
Session 1: Security-agent reviews code, finds SQL injection
→ Creates Insight('sql-injection-risk') with observations
→ Links to Concept('input-validation'), Concept('database-security')

Session 2 (3 weeks later): Different agent reviews new code
→ Queries: "security best practices for database queries"
→ Retrieves sql-injection-risk insight
→ Applies learned pattern proactively
→ Finds vulnerability before deployment!
```

### Use Case 2: Pattern Recognition & Reuse

```text
After 5 collaboration sessions:
→ KG contains Pattern('parallel-specialists') with success_rate=0.9
→ KG contains Pattern('distributed-research') with success_rate=0.85

New complex task arrives
→ Orchestrator queries: "effective collaboration patterns"
→ Retrieves patterns with metadata (when they work, agent combinations)
→ Applies proven pattern instead of experimenting
→ Higher success rate, faster completion
```

### Use Case 3: Domain Knowledge Building

```text
Project: ML Classifier
Sessions extract concepts: Entity('confusion-matrix'), Entity('precision-recall-tradeoff')
Relations: DEPENDS_ON, RELATES_TO

New agent joins project
→ Queries: "what domain knowledge exists?"
→ Gets project knowledge graph as onboarding
→ Understands context immediately
→ Institutional memory!
```

---

## Integration with SPEC-REASONING-TASKS

Knowledge Memory completes the multi-agent collaboration stack:

```
┌────────────────────────────────────────────┐
│  TASKS (SPEC-REASONING-TASKS)              │
│  Coordinate work, track progress           │
└────────────────┬───────────────────────────┘
                 │ spawns
                 ▼
┌────────────────────────────────────────────┐
│  SESSIONS (Existing Thoughtbox)            │
│  Capture structured reasoning              │
└────────────────┬───────────────────────────┘
                 │ extracts
                 ▼
┌────────────────────────────────────────────┐
│  KNOWLEDGE (This Spec)                     │
│  Persist learnings, enable retrieval       │
└────────────────┬───────────────────────────┘
                 │ informs
                 ▼ (loop back to TASKS)
```

**Circular Knowledge Flow**:
1. Task spawns Session
2. Session produces Insights
3. Insights stored in Knowledge Graph
4. KG queried when planning new Tasks
5. Self-improving system!

From Session `@collaborative-reasoning:S56`: "Tasks = shared state, Sessions = agent-specific reasoning, Knowledge = accumulated wisdom."

---

## Dependencies

### Required (Phase 1)

```bash
npm install better-sqlite3
```

**Note**: `better-sqlite3` requires native compilation. Ensure you have:
- Node.js >=22.0.0
- Python 3.x
- C/C++ compiler (Xcode on macOS, build-essential on Linux)

### Optional (Phase 2+)

```bash
npm install @xenova/transformers  # For semantic search (~150MB with models)
```

### Gateway Integration

Add `knowledge` operation to gateway enum:

```typescript
// src/gateway/gateway-handler.ts:30
operation: z.enum([
  // ... existing ...
  'knowledge',  // ADD THIS
]),

// src/gateway/gateway-handler.ts:82
const OPERATION_REQUIRED_STAGE = {
  // ... existing ...
  knowledge: DisclosureStage.STAGE_2_CIPHER_LOADED,
};
```

---

## Implementation Phases

### Phase 1: Minimal MVP (Start Here)

**Goal**: Basic knowledge storage with JSONL + SQLite. No embeddings, no AI features.

1. Add `better-sqlite3` dependency
2. Create `src/knowledge/storage.ts` with SQLite schema (entities, relations, observations)
3. Implement JSONL append-only writes to `~/.thoughtbox/{project}/memory/graph.jsonl`
4. Rebuild SQLite index from JSONL on server start
5. Add `knowledge` operation to `thoughtbox_gateway` with basic actions:
   - `create_entity` - Manual entity creation
   - `add_observation` - Add facts to entities
   - `create_relation` - Link entities
   - `query_graph` - Traverse relations by type
   - `stats` - Entity/relation counts
6. Add MCP resource: `thoughtbox://knowledge/stats`

**Deliverable**: Agents can manually store structured knowledge and query via graph traversal. Everything persists to git-trackable JSONL.

**Skip for MVP**:
- ❌ Embeddings (no @xenova/transformers)
- ❌ Semantic search (no `query_semantic`)
- ❌ Auto-extraction from sessions
- ❌ Conflict detection
- ❌ Access control (everything public for now)

### Phase 2: Session Extraction

1. Implement `extract_from_session` analyzer
2. Parse thought types (C, P, X) for insights/patterns
3. Simple keyword matching for auto-linking
4. Add extraction to session completion workflow

**Deliverable**: Knowledge automatically grows from reasoning sessions

**Still Skip**:
- ❌ Embeddings
- ❌ Semantic search
- ❌ Conflict detection

### Phase 3: Semantic Search

1. Add `@xenova/transformers` dependency
2. Implement model download + caching to `~/.thoughtbox/.embedding-cache/`
3. Lazy compute embeddings for entities
4. Add `query_semantic` action with basic cosine similarity ranking
5. Add embedding table to SQLite (optional - only if model available)

**Deliverable**: Natural language queries retrieve relevant knowledge

**Fallback**: If embeddings unavailable, fall back to FTS5 text search on observations.

### Phase 4: Advanced Features

1. Conflict detection via embedding similarity
2. Auto-merge similar entities
3. Temporal validity + superseding
4. Entity lifecycle management (archival)
5. Access control enforcement
6. Observability resources

**Deliverable**: Production-ready knowledge system

---

## Performance Characteristics

### Expected Scale

**Typical Thoughtbox Project**:
- Sessions: 10-100
- Entities: 1,000-10,000
- Relations: 5,000-50,000
- Queries/day: 50-200

### Query Performance (Goals, Not Validated)

| Operation | Target Latency | Phase | Notes |
|-----------|----------------|-------|-------|
| Create entity | <10ms | 1 | SQLite insert + JSONL append |
| Graph traversal (3 hops) | <100ms | 1 | SQLite with proper indices |
| FTS search on observations | <50ms | 1 | Built-in SQLite FTS5 |
| Full graph read | 50-500ms | 1 | Depends on size (1k-10k entities) |
| Extract from session | 2-5s | 2 | Analyze 20-50 thoughts, create 3-10 entities |
| Semantic query (warm) | <50ms | 3+ | Cached embeddings, sqlite-vec KNN |
| Semantic query (cold) | 1-2s | 3+ | Embedding computation required |

### Storage

**Phase 1 (JSONL + SQLite only)**:
- JSONL: ~500 bytes per entity
- SQLite: ~800 bytes per entity (with indices)

**10,000 entities**: ~13MB total

**Phase 3+ (With Embeddings)**:
- Add: 384 floats per entity = 1.5KB
- **10,000 entities**: ~13MB + 15MB embeddings = **~28MB total**

---

## Migration Strategy

### From Current Thoughtbox

**No Breaking Changes**: Knowledge Memory is additive

1. Existing sessions work unchanged
2. KG is opt-in feature (enable auto-extraction per project)
3. Retroactive extraction: `kg.extract_from_session()` works on old sessions
4. Gradual knowledge accumulation

### Scaling Path

Start with SQLite, migrate if needed:

**Trigger Migration** when:
- Entity count >50,000
- Average query latency >500ms
- Graph depth >8 hops common
- Multiple projects sharing knowledge

**Migration Target**: Neo4j via Docker
- Export JSONL → Cypher import script
- Minimal code changes (same entity/relation model)
- Performance gain: 10-100x for deep traversals

---

## Security & Privacy

### Access Control

```typescript
interface EntityAccess {
  visibility: VisibilityLevel;
  created_by: string;
  allowed_agents?: string[];    // Whitelist for team-private
  allowed_users?: string[];
}

type VisibilityLevel =
  | 'public'         // All agents in project
  | 'agent-private'  // Only creating agent
  | 'user-private'   // Only creating user's agents
  | 'team-private';  // Specified team members
```

### PII Detection

Automatic scanning for sensitive data:

```typescript
async function scanForPII(observation: string): Promise<PIIReport> {
  const patterns = {
    email: /\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/,
    api_key: /\b[A-Za-z0-9]{32,}\b/,
    // ... more patterns
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(observation)) {
      return { found: true, type, action: 'flag' };
    }
  }

  return { found: false };
}
```

Flagged observations not added to KG (or redacted).

---

## Observability

### MCP Resources

```
thoughtbox://knowledge/entities              # List all entities
thoughtbox://knowledge/entities/{type}       # Filter by type
thoughtbox://knowledge/{entity-id}           # Full entity + relations
thoughtbox://knowledge/search?q=X            # Semantic search results
thoughtbox://knowledge/stats                 # Graph metrics
thoughtbox://knowledge/recent                # Recently accessed
```

### Metrics

```typescript
interface KnowledgeStats {
  entity_counts: Record<EntityType, number>;
  relation_counts: Record<RelationType, number>;
  total_observations: number;
  avg_observations_per_entity: number;
  graph_density: number;        // edges / possible_edges
  largest_component_size: number;
  avg_clustering_coefficient: number;
  knowledge_growth_rate: {
    entities_per_week: number;
    observations_per_week: number;
  };
  quality_indicators: {
    avg_confidence: number;
    validation_rate: number;    // % of insights validated by multiple sessions
    conflict_rate: number;
  };
}
```

### Visualization Export

```typescript
thoughtbox_gateway({
  operation: 'knowledge',
  args: {
    action: 'export',
    format: 'graphviz' | 'd3' | 'cytoscape',
    filters: { types: ['Pattern', 'Concept'] }
  }
})
// Returns DOT, JSON, or Cytoscape.js format
// Visualize: entity clusters, relation types, temporal validity
```

---

## Open Questions

1. **Entity Type Naming**: Current codebase has `KnowledgePattern` (Markdown-based). Spec proposes `Pattern` entity type (structured). Should we:
   - Rename spec's `Pattern` to `Workflow` or `CollaborationPattern`?
   - Migrate existing `KnowledgePattern` to new Entity model?
   - Keep both and clarify distinction?

2. **Access Control Integration**: Thoughtbox has no user authentication. Should visibility enforcement use:
   - MCP session ID as agent identity only?
   - External auth provider via environment variable?
   - Skip access control for MVP?

3. **Storage Abstraction**: Should knowledge operations:
   - Extend existing `ThoughtboxStorage` interface?
   - Be separate `KnowledgeStorage` with coordinated transactions?

4. **Embedding Model Choice** (Phase 3+): Should we support multiple embedding models simultaneously for different entity types?

5. **Knowledge Pruning**: What's the right threshold for archiving low-value entities? Should it be configurable?

6. **Cross-Project Knowledge**: Should there be a global knowledge base for general patterns (above project level)?

7. **Knowledge Import**: Should we support importing from external ontologies (OWL, RDF)?

8. **Conflict Voting** (Phase 4): For 3+ agents extracting contradicting insights, use voting or deliberation?

9. **Embedding Versioning** (Phase 3+): When upgrading embedding model, re-embed all entities or maintain both versions?

10. **Knowledge Quality Gates**: Should entities require validation before becoming "public" knowledge?

11. **Real-Time Sync**: For team KGs, should there be webhook-based sync instead of git-based?

---

## Research References

### Academic

- **Multi-Agent Memory**: G-Memory (arXiv 2506.07398) - Hierarchical memory for MAS, 38.6% improvement
- **Temporal Knowledge**: TempQA (2026) - Time-aware graph question answering
- **Semantic Retrieval**: RAPTOR (Frontiers 2026) - Semantic chunking + adaptive clustering

### Production Systems

- **Anthropic**: Knowledge Graph Memory MCP Server (Nov 2024)
- **MongoDB**: Why Multi-Agent Systems Need Memory Engineering (Sep 2025)
- **Zep Graphiti**: Temporal knowledge graphs with auto fact invalidation

### Thoughtbox Sessions

- `@collaborative-reasoning:S1-S37` - Multi-agent collaboration patterns exploration
- Session `16d6f94f-e954-4266-ab17-eb5afd7f8748` - This memory architecture exploration
- Session `3db6b7c6-77e4-4a3f-b13f-41d84ea30737` - SPEC-REASONING-TASKS design

---

## Appendix: Comparison with Existing Solutions

| Feature | Anthropic KG | Thoughtbox KG | Notes |
|---------|--------------|---------------|-------|
| Storage | JSONL only | JSONL + SQLite + vec | Multi-layer for performance |
| Embeddings | No | Yes (optional) | Semantic search capability |
| Temporal | No | Yes | Knowledge versioning |
| Session linking | No | Yes | Provenance tracking |
| Agent attribution | No | Yes | Who learned what |
| Auto-extraction | No | Yes | From thought analysis |
| Conflict detection | No | Yes | Via embedding similarity |
| Task integration | No | Yes | With SPEC-REASONING-TASKS |

**Strategy**: Fork Anthropic's implementation, add Thoughtbox-specific enhancements.
