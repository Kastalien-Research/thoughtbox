# Spec: Mid-Session Recall Primitives

## Title
Session-Internal Thought Retrieval Operations

## Status
Draft

## Target State

### New SDK Operations

The SDK exposes three new operations for retrieving thoughts within the current session:

#### `tb.session.getThought(thoughtNumber: number): Promise<Thought | null>`

Retrieves a specific thought by its ordinal number.
- Returns `null` if `thoughtNumber` is out of bounds or session has no such thought
- O(1) lookup by index
- Return type explicitly includes `null` for the "not found" case

#### `tb.session.recentThoughts(count?: number): Promise<readonly Thought[]>`

Returns the most recent thoughts in the session.
- Default: returns last 10 thoughts
- Ordered from oldest to newest within the returned slice
- `tb.session.recentThoughts(1)` returns the single most recent thought
- Returns `readonly Thought[]` to prevent mutation of session data

#### `tb.session.searchWithin(query: string, options?: SearchWithinOptions): Promise<readonly Thought[]>`

Full-text search across thoughts in the current session.
- Case-insensitive substring match on `thought.content`
- Optional `limit` (default: 20, max: 100)
- Optional `thoughtTypes` filter restricts search to specific thought types
- Returns thoughts ordered from newest to oldest
- Returns `readonly Thought[]` to prevent mutation

### Supporting Types

```typescript
/**
 * Options for session search.
 */
interface SearchWithinOptions {
  /**
   * Maximum number of results to return.
   * @default 20
   * @max 100
   */
  limit?: number;

  /**
   * Filter to only include thoughts of these types.
   * If not provided, all thought types are searched.
   */
  thoughtTypes?: readonly ThoughtType[];
}

/**
 * The server-persisted thought type.
 * All server-assigned fields are guaranteed present.
 */
interface Thought {
  thoughtNumber: number;     // Server-assigned, always present
  thought: string;
  thoughtType: ThoughtType;
  nextThoughtNeeded: boolean;
  timestamp: string;          // Server-assigned ISO 8601
  // ... all other ThoughtData fields
}

/**
 * Union of all valid thought types.
 */
type ThoughtType = 
  | "reasoning"
  | "decision_frame"
  | "action_report"
  | "belief_snapshot"
  | "assumption_update"
  | "context_snapshot"
  | "progress"
  | "action_receipt";
```

### Return Type Precision and Ordering

All three operations return typed results. The two array-returning operations differ in their result ordering — this is **intentional, not a bug** — because the natural reading order differs between the use cases:

| Operation | Return Type | Result Order | Why this order |
|-----------|-------------|--------------|----------------|
| `getThought(n)` | `Promise<Thought \| null>` | n/a (single result) | `null` for out-of-bounds |
| `recentThoughts(n)` | `Promise<readonly Thought[]>` | **oldest-to-newest within the slice** | Callers almost always want to *read forward* through the recent past ("show me the last 10 thoughts as they unfolded"). Chronological order is the natural fit. |
| `searchWithin(q, opts)` | `Promise<readonly Thought[]>` | **newest-to-oldest** | Search results are ranked by recency; when a caller asks "find thoughts about X," the most recent matches are usually the most relevant. |

The asymmetry matters when chaining the two — a caller doing both `recentThoughts(20)` and `searchWithin("X", { limit: 20 })` receives results in opposite directions. To unify, the caller should explicitly sort or `.reverse()` one side.

If a future caller needs a different ordering (e.g., search results in chronological order), an `order?: "asc" | "desc"` option can be added to `SearchWithinOptions`. v1 omits this option to keep the API surface small; add when a real use case appears.

`readonly` on both array return types prevents mutation of session data.

### Usage Examples

```typescript
// Check what I just concluded
const last = await tb.session.getThought(session.thoughtCount);
// or equivalently:
const last = await tb.session.recentThoughts(1).then(r => r[0] ?? null);

// Review my recent reasoning chain
const recent = await tb.session.recentThoughts(5);

// Find all decision frames I made
const decisions = await tb.session.searchWithin("", {
  thoughtTypes: ["decision_frame"]
});

// Find thoughts about a specific topic
const relevant = await tb.session.searchWithin("authentication");

// Get all recent belief snapshots (up to 50)
const beliefs = await tb.session.searchWithin("", {
  thoughtTypes: ["belief_snapshot"],
  limit: 50
});
```

### Operations Catalog Entry

These operations appear in the Thoughtbox operations catalog under the `session` module:

```typescript
session: {
  getThought: {
    title: "Get Thought by Number",
    description: "Retrieves a specific thought by its ordinal number. Returns null if not found."
  };
  recentThoughts: {
    title: "Get Recent Thoughts",
    description: "Returns the most recent N thoughts, ordered oldest-to-newest within the slice."
  };
  searchWithin: {
    title: "Search Session Thoughts",
    description: "Full-text search across thoughts in the current session."
  };
}
```

---

## Design Rationale

### Explicit Null Handling

`getThought` returning `Thought | null` makes the "not found" case explicit. Callers must handle both possibilities, preventing null pointer exceptions from being surprise runtime errors.

### Readonly Return Types

Using `readonly Thought[]` for collection returns prevents callers from accidentally mutating session data. This follows the principle of **making illegal states unrepresentable** - if you can't mutate the returned data, you can't introduce inconsistencies.

### Facilitating Useful States

These primitives enable:
- **Reflection**: "What did I just conclude?"
- **Self-correction**: "Let me review my recent reasoning before continuing"
- **Context-sensitive continuation**: "Find my thoughts about X to build on them"
- **Type-specific retrieval**: "Show me only my decision frames"

---

## Validation

1. **getThought Valid**: Returns correct `Thought` for valid `thoughtNumber`
2. **getThought Null**: Returns `null` for out-of-bounds `thoughtNumber`
3. **recentThoughts Count**: Returns exactly `count` thoughts (or default 10)
4. **recentThoughts Order**: Ordered oldest-to-newest within slice
5. **searchWithin Match**: Returns thoughts matching the query under the configured search mode (full-text by default; substring when `mode: "substring"`)
6. **searchWithin Filters**: `thoughtTypes` filter correctly restricts results
7. **searchWithin Limit**: Respects `limit` option (default 20, max 100)
8. **Readonly Guarantee**: Returned arrays are `readonly` and mutations throw
9. **Catalog Presence**: All three operations appear in the Thoughtbox catalog under `session`
10. **Session-Scoped FTS**: `searchWithin` returns matches only from the specified session; never bleeds across sessions
11. **Index Used**: `EXPLAIN ANALYZE` on the `searchWithin` query shows GIN index usage on `to_tsvector('english', thought)` for full-text mode

---

## Implementation Notes

### Lookup Characteristics by Operation

| Operation | Complexity | Backing Index |
|-----------|-----------|---------------|
| `getThought(N)` | O(1) | Existing unique index on `thoughts(session_id, thought_number)` — no new work needed |
| `recentThoughts(n)` | O(n), n ≤ 100 | Same unique index, scanned `ORDER BY thought_number DESC LIMIT n` |
| `searchWithin(query)` | O(log T + matches) where T = thoughts in session | New GIN index on `to_tsvector('english', thought)` |

### Search Backing Index (Postgres FTS)

```sql
-- Migration: full-text search index on thought content
CREATE INDEX idx_thoughts_content_fts
  ON thoughts USING GIN (to_tsvector('english', thought));
```

```sql
-- Query (full-text mode, default)
SELECT thought_number, thought_type, thought, timestamp, metadata, ...
FROM thoughts
WHERE session_id = $1
  AND to_tsvector('english', thought) @@ websearch_to_tsquery('english', $2)
  AND ($3::text[] IS NULL OR thought_type = ANY($3))
ORDER BY thought_number DESC
LIMIT $4;

-- Query (substring mode, optional)
SELECT thought_number, thought_type, thought, timestamp, metadata, ...
FROM thoughts
WHERE session_id = $1
  AND thought ILIKE '%' || $2 || '%'
  AND ($3::text[] IS NULL OR thought_type = ANY($3))
ORDER BY thought_number DESC
LIMIT $4;
```

### `SearchWithinOptions.mode`

To support both natural-language matching and exact-substring matching, extend the options:

```typescript
interface SearchWithinOptions {
  limit?: number;              // default 20, max 100
  thoughtTypes?: readonly ThoughtType[];

  /**
   * Search mode.
   * - "fulltext" (default): tsvector match with stemming + stopwords; English locale
   * - "substring": case-insensitive ILIKE match; no stemming; useful for exact phrase
   */
  mode?: "fulltext" | "substring";
}
```

The default `"fulltext"` matches the agent's natural-language phrasing ("authentication" finds "authenticated", "auth", etc.). Use `"substring"` when an agent needs to find an exact identifier or phrase.

### Performance Targets

| Session size | `searchWithin` p99 (with GIN index) |
|--------------|--------------------------------------|
| ≤ 500 thoughts | < 20 ms |
| ≤ 5,000 thoughts | < 50 ms |
| ≤ 50,000 thoughts | < 200 ms |

Substring mode without index assistance is acceptable up to ~1,000 thoughts; beyond that it should fall back to GIN trigram matching (`pg_trgm` extension, optional follow-up).

### Why Postgres FTS, Not a Separate Search Service

- `searchWithin` is always session-scoped. There is no need for a global cross-session search index.
- A dedicated search service (Elasticsearch, MeiliSearch, Typesense) would add operational overhead — sync pipelines, schema drift, infra cost — with no benefit at the scale a Thoughtbox session reaches.
- Postgres FTS ships in core, requires one migration, and meets the performance targets above for realistic session sizes.

### Recommended Application-Layer Session Size Limits

Sessions over a few thousand thoughts almost always indicate a missing session-end. Recommended posture:

- **Soft warning at 1,000 thoughts**: surface a UI/log warning suggesting the session be closed.
- **Hard cap at 10,000 thoughts**: refuse new submissions, force `nextThoughtNeeded: false`.

These limits are policy, not infrastructure; the GIN index handles much larger sessions if a future use case demands it.

### Session ID Resolution in the SDK

The Code Mode SDK methods accept `sessionId` implicitly when called inside a `tb.think()` chain context (see Spec 02). When called directly on `tb.session.*` outside a chain, the active session is inferred from the execution context; if no active session exists, the call throws `NoActiveSessionError`.
