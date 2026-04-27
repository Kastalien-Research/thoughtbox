# Spec: Knowledge Graph Persistence Shortcut

## Title
Auto-Persistence of Beliefs and Assumptions via Thought Metadata

## Status
Draft

## Target State

### Where `persistAs` Lives in the Type Hierarchy

`persistAs` is **not** a field on the canonical `ThoughtInput` defined in Spec 01. It is added only on the discriminated subtypes that semantically support automatic knowledge-graph persistence — `BeliefSnapshotInput` and `AssumptionUpdateInput`. The full hierarchy looks like:

```typescript
/**
 * Spec 01's canonical client input type. `persistAs` is NOT defined here.
 */
interface ThoughtInput {
  thought: string;
  thoughtType: ThoughtType;
  nextThoughtNeeded: boolean;
  thoughtNumber?: never;   // server-assigned per Spec 01
  timestamp?: never;       // server-assigned per Spec 01
  // ... other base client-provided fields
}

/**
 * Discriminated subtypes by `thoughtType`. `persistAs` appears only on
 * BeliefSnapshotInput and AssumptionUpdateInput. Sending `persistAs` on
 * any other thoughtType is rejected at request time with VALIDATION_ERROR.
 */
type TypedThoughtInput =
  | ReasoningInput
  | DecisionFrameInput            // see Spec 07
  | ActionReportInput
  | BeliefSnapshotInput            // ← carries persistAs
  | AssumptionUpdateInput          // ← carries persistAs
  | ContextSnapshotInput
  | ProgressInput;
```

`persistAs` is **structurally scoped** to thought types where automatic KG persistence is semantically meaningful. Future specs that want to extend it to other types should add the field to those discriminated subtypes explicitly — do not promote it to the base `ThoughtInput`.

### `persistAs` Field on the Supporting Thought Types

```typescript
interface BeliefSnapshotInput extends ThoughtInput {
  thoughtType: "belief_snapshot";
  beliefs: BeliefSchema;  // existing per Spec 01

  /**
   * If provided, automatically creates a knowledge graph entity
   * representing this belief.
   */
  persistAs?: PersistAsConfig;
}

interface AssumptionUpdateInput extends ThoughtInput {
  thoughtType: "assumption_update";
  assumptionChange: AssumptionChangeSchema;  // existing per Spec 01

  /**
   * If provided, automatically creates/updates a knowledge graph entity
   * representing this assumption. Entity type follows the selection
   * criterion below (Concept vs Decision).
   */
  persistAs?: AssumptionPersistAsConfig;
}

/**
 * Configuration for persisting a belief as a KG entity.
 */
interface PersistAsConfig {
  name: string;              // Entity name in knowledge graph
  visibility?: Visibility;   // Defaults to "agent-private"
  relationTo?: string;      // Optional: existing entity ID to link via BUILDS_ON
}

/**
 * Configuration for persisting an assumption as a KG entity.
 * Extends PersistAsConfig with assumption-specific options.
 */
interface AssumptionPersistAsConfig extends PersistAsConfig {
  /**
   * The previous assumption status for change tracking.
   */
  previousStatus?: "believed" | "uncertain" | "refuted";
}
```

### Visibility Type

```typescript
type Visibility = "public" | "agent-private" | "user-private" | "team-private";
```

### Automatic Entity Creation

When `persistAs` is provided:

1. A knowledge graph entity is created (or updated for `assumption_update`)
2. Entity type follows the criterion below
3. Entity label: from `persistAs.name`
4. An observation is added referencing the thought
5. If `relationTo` is provided, a `BUILDS_ON` relation is created to the referenced entity

#### Entity Type Selection Criterion

| Source thought type | `persistAs` context | Resulting KG entity type |
|---------------------|---------------------|--------------------------|
| `belief_snapshot` | always | `"Concept"` |
| `assumption_update` with `assumptionChange.newStatus === "refuted"` | any | `"Decision"` |
| `assumption_update` from a thought reachable from a committed `decision_frame` (i.e., `decisionState: "committed"` exists earlier in the same session, with the assumption logically downstream of that decision per `assumptionChange.downstream` references) | any | `"Decision"` |
| `assumption_update` otherwise (status changes among `believed`/`uncertain`, no committed decision dependency) | any | `"Concept"` |

Rationale: `Decision` denotes an entity that records a chosen-among-alternatives commitment. A refuted assumption is itself a decision (we have decided this is no longer believed). An assumption that lives downstream of a committed decision inherits decision-shape because it's part of the decision's surface. All other beliefs and assumptions are general concepts.

The selection is computed server-side from the thought's content and prior session state; callers do not specify the entity type directly through `persistAs`.

### Usage Examples

```typescript
// Belief with automatic KG persistence
await tb.thought({
  thought: "PostgreSQL provides ACID guarantees essential for financial data.",
  thoughtType: "belief_snapshot",
  nextThoughtNeeded: true,
  persistAs: {
    name: "PostgreSQL-ACID-suitability",
    visibility: "team-private"
  }
});

// Assumption update that builds on existing entity
await tb.thought({
  thought: "The user's role determines which data they can access.",
  thoughtType: "assumption_update",
  nextThoughtNeeded: false,
  persistAs: {
    name: "RBAC-assumption",
    relationTo: "auth-module-entity-id"
  }
});
```

### Knowledge Graph Entity Structure

```typescript
// Created entity structure
interface KGEntity {
  id: string;
  name: string;         // e.g., "PostgreSQL-ACID-suitability"
  type: "Concept";      // or "Decision" for assumptions
  label: string;
  visibility: Visibility;
  created_by: "agent";
  observations: Array<{
    id: string;
    content: string;    // The thought content
    source_session: string;
    source_thought: number;  // Thought number
    added_at: string;   // ISO timestamp
  }>;
}
```

### Error Handling: Making Illegal States Explicit

When KG persistence fails, the thought is still submitted successfully, but the failure is captured explicitly:

```typescript
/**
 * Error codes for KG persistence failures.
 * These make the failure state explicit and queryable.
 */
type KGPersistErrorCode =
  | "ENTITY_NAME_CONFLICT"    // Entity with this name already exists
  | "RELATION_TARGET_NOT_FOUND" // relationTo references non-existent entity
  | "VISIBILITY_DENIED"       // Insufficient permissions for requested visibility
  | "STORAGE_ERROR"           // Underlying storage failure
  | "UNKNOWN_ERROR";         // Unexpected failure

/**
 * Detailed error information captured when KG persistence fails.
 * This is stored on the thought's metadata for debugging/auditing.
 */
interface KGPersistError {
  code: KGPersistErrorCode;
  message: string;           // Human-readable error description
  details?: {
    attemptedName?: string;   // The name we tried to create
    attemptedRelationTo?: string; // The entity ID we tried to link
    existingEntityId?: string; // If conflict, the existing entity
  };
  timestamp: string;         // When the error occurred (ISO 8601)
}

/**
 * Thought metadata with explicit KG persistence status.
 */
interface ThoughtMetadata {
  // ... other metadata fields
  kgPersistError?: KGPersistError;  // Present ONLY if KG persistence failed
  kgPersistSuccess?: {
    entityId: string;        // ID of created/updated entity
    entityName: string;      // Name of created/updated entity
    timestamp: string;       // When persistence succeeded
  };
}
```

### Behavior on Failure

```typescript
async function processThoughtWithPersist(input: ThoughtInput): Promise<Thought> {
  // First, save the thought (this always succeeds or throws)
  const thought = await saveThought(input);

  // Then attempt KG persistence (may fail)
  if (input.persistAs) {
    try {
      const entity = await createKGEntity(input.persistAs, thought);
      thought.metadata.kgPersistSuccess = {
        entityId: entity.id,
        entityName: entity.name,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Capture the error but don't fail the thought
      thought.metadata.kgPersistError = {
        code: categorizeError(error),
        message: error.message,
        details: extractDetails(error),
        timestamp: new Date().toISOString()
      };
      logger.warn("KG persistence failed", thought.metadata.kgPersistError);
    }
  }

  return thought;
}
```

### Querying Persistence Status

```typescript
// Find all thoughts where KG persistence succeeded
const successful = session.thoughts.filter(t => t.metadata.kgPersistSuccess);

// Find all thoughts where KG persistence failed
const failed = session.thoughts.filter(t => t.metadata.kgPersistError);

// Get thoughts with specific error code
const conflicts = session.thoughts.filter(
  t => t.metadata.kgPersistError?.code === "ENTITY_NAME_CONFLICT"
);
```

---

## Design Rationale

### Making Illegal States Explicit (Not Preventing Them)

Unlike other specs where we make illegal states **unrepresentable**, KG persistence failures are **inherently possible** (network issues, name conflicts, permissions). Instead of preventing them, we:

1. **Make them explicit** via `kgPersistError` metadata
2. **Make them queryable** via structured error codes
3. **Make them non-blocking** - thought submission succeeds regardless

### Facilitating Useful States

The `persistAs` shortcut enables:

- **Effortless knowledge capture**: `persistAs: { name: "my-insight" }` instead of separate API calls
- **Automatic linking**: `relationTo` creates `BUILDS_ON` relations automatically
- **Visibility control**: Per-entity visibility without separate API calls

### Error as Data

By storing `kgPersistError` on the thought metadata, we treat the error as **data** rather than just an exception to catch. This enables:
- Debugging: "Why didn't my entity get created?"
- Auditing: "Which entities failed to create?"
- Recovery: "I can retry creation for failed entities later"

---

## Validation

1. **Entity Creation**: `belief_snapshot` with `persistAs` creates a knowledge graph entity
2. **Entity Creation**: `assumption_update` with `persistAs` creates a knowledge graph entity
3. **Observation Link**: Created entity includes observation referencing the source thought
4. **Relation**: `relationTo` field creates a `BUILDS_ON` relation to specified entity
5. **Visibility**: Entity respects `visibility` option (defaults to `"agent-private"`)
6. **Thought Success**: Thought submission succeeds even if KG creation fails
7. **Error Metadata**: Failed KG creation populates `metadata.kgPersistError` with structured error
8. **Success Metadata**: Successful KG creation populates `metadata.kgPersistSuccess`
9. **Error Queryability**: Error codes allow filtering/finding failed persist operations
