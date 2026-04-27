# Spec: Named Checkpoints

## Title
Labeled Session Progress Checkpoints

## Status
Draft

## Target State

### The Problem with Raw String Labels

Using `string` for checkpoint labels allows **illegal states**:

```typescript
// These are all "valid" strings but problematic as checkpoint labels:
const label1 = "";                    // Empty - useless
const label2 = "has spaces";          // Unusual for programmatic use
const label3 = "has/slashes";         // May cause path issues
const label4 = "UPPERCASE";           // Inconsistent casing
const label5 = "has    many   spaces"; // Unusual formatting
```

### Branded Type for Checkpoint Labels

We use TypeScript's **branded type** pattern to enforce constraints at the type level:

```typescript
/**
 * Branded type for URL-safe checkpoint labels.
 * Format: lowercase, alphanumeric, hyphens, underscores only.
 * Examples: "auth-analysis-complete", "data_model_finalized", "step-1-of-3"
 */
type CheckpointLabel = string & {
  readonly __brand: "CheckpointLabel";
  readonly __pattern: /^[a-z0-9][a-z0-9_-]*$/;
};

/**
 * Validate and coerce a string to CheckpointLabel.
 * Throws if the string doesn't match the pattern.
 */
function createCheckpointLabel(label: string): CheckpointLabel {
  const pattern = /^[a-z0-9][a-z0-9_-]*$/;
  if (!pattern.test(label)) {
    throw new Error(
      `Invalid checkpoint label "${label}". ` +
      `Must match pattern /^[a-z0-9][a-z0-9_-]*$/: ` +
      `lowercase alphanumeric, starting with letter or digit, ` +
      `with hyphens and underscores allowed.`
    );
  }
  return label as CheckpointLabel;
}

/**
 * Check if a string is a valid checkpoint label (without throwing).
 */
function isValidCheckpointLabel(label: string): label is CheckpointLabel {
  return /^[a-z0-9][a-z0-9_-]*$/.test(label);
}
```

### SDK Method Signatures (Creation and Retrieval)

```typescript
interface SessionOperations {
  // ----- Creation -----

  /**
   * Create a named progress checkpoint.
   *
   * @param label - URL-safe identifier (lowercase alphanumeric, hyphens, underscores)
   * @param summary - Optional human-readable description
   * @returns Promise<Thought> - The created checkpoint thought
   * @throws Error if label doesn't match /^[a-z0-9][a-z0-9_-]*$/
   */
  checkpoint(label: string, summary?: string): Promise<Thought>;

  /**
   * Create a checkpoint with type-safe label.
   * Use this when you have a pre-validated label.
   */
  checkpointWithLabel(label: CheckpointLabel, summary?: string): Promise<Thought>;

  // ----- Retrieval (Spec 09 §Checkpoint Retrieval) -----

  /**
   * Get all checkpoints in the current session, ordered by thought_number ASC.
   * Server-side filter on metadata.checkpoint — O(checkpoints) not O(thoughts).
   */
  checkpoints(): Promise<readonly CheckpointThought[]>;

  /**
   * Get a specific checkpoint by label. Returns the first match (oldest).
   * For all matches under the same label, use checkpointsByLabel().
   */
  getCheckpoint(label: string): Promise<CheckpointThought | null>;

  /**
   * Get all checkpoints with the given label, oldest first.
   * Multiple checkpoints with the same label are explicitly allowed (see
   * "Label Constraints" below).
   */
  checkpointsByLabel(label: string): Promise<readonly CheckpointThought[]>;
}
```

### `CheckpointThought` — The Type Returned by Creation and Retrieval

`CheckpointThought` is the explicit type produced by `tb.session.checkpoint()` and returned by all checkpoint retrieval operations (`checkpoints()`, `getCheckpoint(label)`, `checkpointsByLabel(label)`). It is a refinement of the base `Thought` (Spec 03) where `thoughtType` is narrowed to the literal `"progress"` and `metadata.checkpoint` is guaranteed to be present and well-formed:

```typescript
/**
 * The checkpoint metadata payload, always present on a CheckpointThought.
 */
interface CheckpointMetadata {
  /** Type-safe, URL-safe label. See "Branded Type for Checkpoint Labels" above. */
  label: CheckpointLabel;
  /** Human-readable summary, if provided at creation time. */
  summary?: string;
  /** Server-assigned ISO 8601 timestamp at which the checkpoint was created. */
  createdAt: string;
}

/**
 * A Thought that is also a checkpoint.
 *
 * Refines the base Thought (Spec 03) by:
 *   - narrowing `thoughtType` to the literal "progress"
 *   - guaranteeing `metadata.checkpoint: CheckpointMetadata` is present (not optional)
 *
 * All other fields inherited from Thought (thoughtNumber, timestamp, etc.)
 * retain their semantics from Spec 01 / Spec 03.
 */
interface CheckpointThought extends Thought {
  thoughtType: "progress";
  /** At creation time: `summary ?? \`Checkpoint: ${label}\``. */
  thought: string;
  metadata: Thought["metadata"] & {
    checkpoint: CheckpointMetadata;
  };
}
```

A plain `Thought` may or may not be a checkpoint; a `CheckpointThought` is statically guaranteed to be one. Code paths that hold a `CheckpointThought` reference can access `t.metadata.checkpoint.label` without optional chaining.

A type predicate is provided for narrowing from `Thought` to `CheckpointThought`:

```typescript
function isCheckpointThought(t: Thought): t is CheckpointThought {
  return t.thoughtType === "progress"
      && t.metadata?.checkpoint !== undefined
      && isValidCheckpointLabel(t.metadata.checkpoint.label);
}
```

### Usage Examples

```typescript
// ✅ Valid checkpoint labels
await tb.session.checkpoint("auth-analysis-complete");
await tb.session.checkpoint("data_model_finalized", "Entity relationships defined");
await tb.session.checkpoint("step1", "Initial setup done");
await tb.session.checkpoint("auth", "Authentication module complete");

// ❌ INVALID - these throw at runtime (and would fail type coercion)
await tb.session.checkpoint("");                        // Empty
await tb.session.checkpoint("Has Spaces");               // Contains spaces
await tb.session.checkpoint("has/slashes");              // Contains slash
await tb.session.checkpoint("UPPERCASE");                // Not lowercase
await tb.session.checkpoint("_starts-with-underscore");  // Starts with underscore
```

### Label Constraints (Runtime Enforcement)

| Constraint | Rule |
|------------|------|
| Non-empty | Label must have at least 1 character |
| Lowercase | All characters must be lowercase (a-z) |
| Alphanumeric | Must start with letter or digit (0-9) |
| Hyphens/Underscores | Allowed after first character |
| No consecutive separators | `--` or `__` are allowed (no semantic restriction) |
| No uniqueness | Multiple checkpoints with same label allowed |

### Checkpoint Retrieval

Use the dedicated retrieval primitives. They are backed by a JSONB GIN index (see Implementation Notes below) and scale to sessions of arbitrary size — `tb.session.checkpoints()` is O(checkpoints), not O(thoughts).

```typescript
// All checkpoints in current session, oldest first
const all = await tb.session.checkpoints();

// Get a checkpoint by label (returns first/oldest match)
const dataModel = await tb.session.getCheckpoint("data-model-finalized");

// Get all checkpoints sharing a label
const allInits = await tb.session.checkpointsByLabel("init");
```

**Do not use `searchWithin("Checkpoint:")` for this purpose.** Substring search of thought content is fragile (depends on a content prefix that the spec does not guarantee), O(thoughts) rather than O(checkpoints), and unindexed at scale.

#### Performance characteristics

| Operation | Complexity | Backing Index |
|-----------|-----------|---------------|
| `checkpoints()` | O(checkpoints in session) | Partial JSONB GIN on `metadata->'checkpoint'` |
| `getCheckpoint(label)` | O(log C) where C = checkpoints with this label in session | Same partial GIN, narrowed by `metadata->'checkpoint'->>'label'` equality |
| `checkpointsByLabel(label)` | O(matches in session) | Same partial GIN |

Even at 10,000-thought sessions with 100 checkpoints, retrieval is sub-millisecond — the partial index excludes non-checkpoint thoughts entirely from the lookup.

### Integration with Hooks

SessionStart hooks can be configured to fire when a session resumes after a specific checkpoint:

```typescript
// Hook configuration (external)
{
  trigger: "session_resume",
  checkpoint: "auth-analysis-complete",  // Matches checkpoint label
  action: "notify"
}
```

---

## Design Rationale

### Making Illegal States Unrepresentable

The branded `CheckpointLabel` type prevents illegal states from being represented:

1. **Empty strings**: The regex requires at least 1 character
2. **Mixed case**: Regex requires lowercase only
3. **Spaces and special chars**: Only `a-z`, `0-9`, `-`, `_` allowed

### Facilitating Useful States

The branded type still allows all useful label patterns:

- Semantic names: `auth-analysis-complete`, `database-schema-finalized`
- Short identifiers: `step1`, `init`, `done`
- Casing: `kebab-case` (recommended) and `snake_case` (allowed)

### Why Runtime Validation Still Exists

TypeScript's type system erases branded types at runtime. The `__brand` property exists only for type checking. Therefore:

1. **Compile time**: TypeScript prevents assigning invalid strings to `CheckpointLabel`
2. **Runtime**: `createCheckpointLabel()` validates and throws for invalid input

This is a defense-in-depth approach: type system for developer ergonomics, runtime for safety.

---

## Validation

1. **Type Safety**: `CheckpointLabel` only accepts strings matching `/^[a-z0-9][a-z0-9_-]*$/`
2. **Thought Type**: Created thought has `thoughtType: "progress"`
3. **Metadata Structure**: `metadata.checkpoint.label` is a valid `CheckpointLabel`
4. **Metadata Structure**: `metadata.checkpoint.summary` exists only if summary was provided
5. **Auto-Fields**: `thoughtNumber` is correctly auto-assigned, `createdAt` is server timestamp
6. **Generic Retrieval**: Checkpoints appear in `tb.session.recentThoughts()` and `tb.session.searchWithin()` (general-purpose primitives)
7. **Dedicated Retrieval — `checkpoints()`**: returns all checkpoints in the current session, ordered by `thought_number` ASC, sourced from the partial JSONB index, never returning non-checkpoint thoughts
8. **Dedicated Retrieval — `getCheckpoint(label)`**: returns the oldest checkpoint with the matching label, or `null` if none
9. **Dedicated Retrieval — `checkpointsByLabel(label)`**: returns all checkpoints with the matching label, oldest first
10. **Index Used**: `EXPLAIN ANALYZE` on `checkpoints()` and `checkpointsByLabel()` queries shows GIN index usage on `(metadata -> 'checkpoint')` partial index
11. **Multiple Checkpoints**: Multiple checkpoints with same label are allowed; all are retrievable via `checkpointsByLabel()`
12. **Validation Error**: Invalid labels throw descriptive errors at creation time

---

## Implementation Notes

### Backing Index (Postgres JSONB GIN, Partial)

The dedicated retrieval primitives are backed by a partial GIN index on the checkpoint metadata. The `WHERE metadata ? 'checkpoint'` predicate makes the index size proportional to checkpoint count, not total thought count.

```sql
-- Migration: partial JSONB GIN index covering only checkpoint thoughts
CREATE INDEX idx_thoughts_checkpoint
  ON thoughts USING GIN ((metadata -> 'checkpoint'))
  WHERE metadata ? 'checkpoint';
```

```sql
-- Used by tb.session.checkpoints()
SELECT thought_number, thought_type, thought, timestamp, metadata
FROM thoughts
WHERE session_id = $1
  AND metadata ? 'checkpoint'
ORDER BY thought_number ASC;

-- Used by tb.session.getCheckpoint(label) and tb.session.checkpointsByLabel(label)
SELECT thought_number, thought_type, thought, timestamp, metadata
FROM thoughts
WHERE session_id = $1
  AND metadata -> 'checkpoint' ->> 'label' = $2
ORDER BY thought_number ASC;
```

### Why JSONB Index, Not a Separate `session_checkpoints` Table

A normalized `session_checkpoints` table with `(session_id, label, thought_number, summary, created_at)` would also work. We choose the JSONB approach for v1 because:

- **Single source of truth** — the thought *is* the checkpoint, not a separate row referencing it. No dual-write consistency to maintain.
- **No schema migration beyond the index** — adding the index is one DDL statement; a separate table requires migrations, foreign keys, and ON DELETE cascades to keep the two stores in sync.
- **Adequate for in-session retrieval** — the partial GIN index meets the performance targets (sub-millisecond) for any realistic session size.

If a future use case demands cross-session checkpoint search at scale (e.g., "find every `auth-complete` checkpoint across the corpus"), a separate `session_checkpoints` table or materialized view becomes the right answer at that point. Don't pre-build it.

### Zod Schema

```typescript
const CheckpointLabelSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]*$/, {
    message:
      "Checkpoint label must match /^[a-z0-9][a-z0-9_-]*$/: " +
      "lowercase alphanumeric, starting with letter or digit, " +
      "with hyphens and underscores allowed",
  })
  .min(1, "Checkpoint label cannot be empty");
```

### TypeScript Utility Type

```typescript
/**
 * Utility type to extract the branded CheckpointLabel from any string
 * that has been validated at runtime.
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

type CheckpointLabel = Brand<string, "CheckpointLabel">;
```
