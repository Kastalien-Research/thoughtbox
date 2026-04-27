# Spec: Subagent Session Attachment

## Title
Attaching Subagent Outputs to Parent Session

## Status
Draft

## Related Specs

- **Spec 11 (Structured Return Schemas)**: defines how `SubagentOutput.metadata` is produced and validated. The two specs are a coupled deliverable — Spec 04 describes how a subagent's output lands in the parent's reasoning chain; Spec 11 describes how that output is shaped and verified before attachment. Implementations should ship them together.
- **Spec 02 (Terse Shorthand)**: the parent's `tb.subagent.attach()` and `tb.subagent.run()` are typically called from inside a chain context (`chain.t(...)` between dispatches), so chain semantics from Spec 02 apply.
- **Spec 10 (Knowledge Graph Persistence)**: when `AttachOptions.entityName` is provided, an automatic knowledge-graph entity is created. Visibility and error semantics follow Spec 10's `KGPersistError` model.

## Target State

### `tb.subagent.attach()` Method

The SDK provides a method to attach subagent outputs to the parent Thoughtbox session:

```typescript
interface SubagentOperations {
  /**
   * Attach a subagent output to the parent session.
   *
   * @param output - The subagent output to attach
   * @param options - Optional configuration for the attachment
   * @returns Promise<Thought> - The created thought
   */
  attach(output: SubagentOutput, options?: AttachOptions): Promise<Thought>;

  /**
   * Run a subagent and optionally attach its output.
   */
  run(input: SubagentDispatchInput): Promise<SubagentOutput>;
}
```

### SubagentOutput Structure

```typescript
/**
 * Output produced by a subagent execution.
 * This is the result of tb.subagent.run().
 */
interface SubagentOutput {
  /**
   * Raw text output from the subagent.
   */
  content: string;

  /**
   * Optional one-line summary of the output.
   * Useful for concise display in timelines.
   */
  summary?: string;

  /**
   * Optional structured metadata from the subagent.
   * Structure depends on the subagent's expectedReturn schema.
   */
  metadata?: Readonly<Record<string, unknown>>;

  /**
   * When the subagent finished execution.
   */
  completedAt: string;  // ISO 8601

  /**
   * Duration of subagent execution in milliseconds.
   */
  durationMs?: number;

  /**
   * Model used by the subagent (if applicable).
   */
  model?: string;
}
```

### AttachOptions

```typescript
/**
 * Options for attaching a subagent output to the session.
 */
interface AttachOptions {
  /**
   * Thought type for the attachment.
   * Default: "context_snapshot"
   */
  thoughtType?: ThoughtType;

  /**
   * Visibility for any knowledge graph entities created.
   * Default: "agent-private"
   */
  visibility?: Visibility;

  /**
   * If provided, creates a knowledge graph entity with this name
   * linking to the thought.
   */
  entityName?: string;
}

/**
 * Visibility level for knowledge graph entities.
 */
type Visibility = "public" | "agent-private" | "user-private" | "team-private";

/**
 * All valid thought types for type checking.
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

### Resulting Thought

The attached thought has:
- `thoughtType: "context_snapshot"` (or override)
- `thought` field contains the subagent output content (or summary if provided)
- `metadata.subagentOutput` contains the full original output and any structured metadata

```typescript
/**
 * Metadata attached to a thought created from subagent output.
 */
interface SubagentOutputMetadata {
  /**
   * The original subagent output.
   */
  subagentOutput: SubagentOutput;

  /**
   * The thought type used for the attachment.
   */
  thoughtType: ThoughtType;

  /**
   * Visibility of any created KG entity (if applicable).
   */
  visibility?: Visibility;

  /**
   * ID of created KG entity (if entityName was provided).
   */
  entityId?: string;
}
```

### Usage Example

```typescript
// Run a subagent and attach its output to the session
const analysis = await tb.subagent.run({
  prompt: "Analyze the authentication flow for vulnerabilities."
});

// Attach as context_snapshot with structured metadata
const thought = await tb.subagent.attach(analysis, {
  thoughtType: "context_snapshot",
  entityName: "auth-vulnerability-analysis",
  visibility: "team-private",
  metadata: {
    findingCount: analysis.metadata?.findingCount,
    severity: analysis.metadata?.severity
  }
});

// The thought.metadata.subagentOutput contains the original output
console.log(thought.metadata.subagentOutput.content);
```

### Knowledge Graph Integration

If `entityName` is provided, a knowledge graph entity is automatically created:

- Entity type: `"Insight"`
- Label: `entityName`
- Observation: references the attached thought
- Visibility: as specified in options (defaults to `"agent-private"`)

---

## Design Rationale

### Explicit Type Definitions

Rather than using `Record<string, unknown>` for all output structures, we define `SubagentOutput` with explicit fields:

- `content`: Required - the raw text output
- `summary`: Optional - for concise display
- `metadata`: Optional but typed as `Readonly<Record<string, unknown>>` for flexibility
- `completedAt`: Required - ISO timestamp for audit trail
- `durationMs`: Optional - for performance tracking
- `model`: Optional - for reproducibility

### Readonly Metadata

`metadata: Readonly<Record<string, unknown>>` prevents mutation of subagent-provided metadata after attachment. This maintains data integrity.

### Type-Safe ThoughtType

The `thoughtType` option is typed as `ThoughtType` union rather than generic `string`, enabling:
- IDE autocomplete for valid options
- Compile-time checking of invalid thought types
- Self-documenting code

---

## Validation

1. **Attachment Creation**: `tb.subagent.attach()` creates a thought in the parent session
2. **Thought Type**: Default thought type is `context_snapshot` when not overridden
3. **Metadata Preservation**: Original `SubagentOutput` appears in `thought.metadata.subagentOutput`
4. **Entity Creation**: When `entityName` is provided, a knowledge graph entity exists with the given name
5. **Visibility**: Entity respects the `visibility` option (defaults to `"agent-private"`)
6. **Type Safety**: `thoughtType` option only accepts valid `ThoughtType` values
7. **Readonly Metadata**: `metadata` field on `SubagentOutput` is `Readonly`
