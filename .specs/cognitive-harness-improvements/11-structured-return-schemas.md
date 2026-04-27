# Spec: Structured Return Schemas

## Title
Schema-Validated Structured Output for Subagent Dispatch

## Status
Draft

## Related Specs

- **Spec 04 (Subagent Session Attachment)**: this spec is a coupled deliverable with Spec 04. Spec 11 describes how subagent output is *shaped and validated* against an `expectedReturn` schema; Spec 04 describes how the validated output *lands in the parent's reasoning session* via `tb.subagent.attach()`. Implementations should ship them together — Spec 11 without Spec 04 is a validator with nowhere to deliver, and Spec 04 without Spec 11 forces the parent to re-extract structured facts from prose (the friction this whole pair is designed to remove).
- **Spec 10 (Knowledge Graph Persistence)**: when validated subagent output is attached with an `entityName`, the resulting KG entity follows Spec 10's persistence and error model.

## Target State

### Subagent Dispatch with Expected Return Schema

The subagent dispatch operation accepts an `expectedReturn` JSON Schema:

```typescript
interface SubagentDispatchInput {
  prompt: string;
  expectedReturn?: {
    schema: JSONSchema;
    description?: string;
  };
}

// Usage
const result = await tb.subagent.run({
  prompt: "Analyze this error and return structured findings.",
  expectedReturn: {
    schema: {
      type: "object",
      properties: {
        rootCause: { type: "string" },
        severity: { type: "string", enum: ["low", "medium", "high"] },
        affectedComponents: { type: "array", items: { type: "string" } }
      },
      required: ["rootCause", "severity"]
    },
    description: "Bug analysis structured output"
  }
});
```

### Structured Output Validation

Before attaching subagent output to the session:

1. The subagent output is parsed as JSON (or extracted from structured delimiters if configured)
2. The parsed output is validated against the `expectedReturn.schema`
3. If validation fails, the output is rejected with a `StructuredOutputError`

### Complete Error Type Definition

```typescript
/**
 * Error thrown when subagent output fails schema validation.
 * This is a discriminated union error type for type-safe error handling.
 */
interface StructuredOutputError {
  readonly type: "structured_output_error";  // Discriminant for type narrowing

  /**
   * Human-readable error message.
   */
  readonly message: string;

  /**
   * The original subagent output that failed validation.
   * Useful for debugging and retry logic.
   */
  readonly rawOutput: string;

  /**
   * Detailed validation errors for each field that failed.
   */
  readonly validationErrors: readonly ValidationError[];

  /**
   * The JSON Schema that the output was validated against.
   */
  readonly expectedSchema: JSONSchema;

  /**
   * Timestamp when validation failed.
   */
  readonly timestamp: string;  // ISO 8601

  /**
   * Optional parsing error details.
   * Present when the output couldn't be parsed as JSON.
   */
  readonly parsingError?: ParsingError;
}

/**
 * Detailed error for a single validation failure.
 */
interface ValidationError {
  /**
   * JSON path to the invalid field.
   * Format: "$.rootCause" or "$.items[0].name"
   */
  readonly path: string;

  /**
   * The expected type or format per the schema.
   */
  readonly expected: string;

  /**
   * The actual value that was received.
   * Stored as unknown since it may not match expected type.
   */
  readonly received: unknown;

  /**
   * Optional reason for the failure.
   * Examples: "must be string", "must match pattern /^[A-Z]$/"
   */
  readonly reason?: string;
}

/**
 * Error details when JSON parsing failed.
 */
interface ParsingError {
  /**
   * Error message from the parser.
   */
  readonly message: string;

  /**
   * Character offset where parsing failed (if available).
   */
  readonly offset?: number;

  /**
   * Line and column where parsing failed (if available).
   */
  readonly line?: number;
  readonly column?: number;
}

/**
 * Success result type for validated structured output.
 */
interface ValidatedOutput<T> {
  readonly success: true;
  readonly data: T;  // Parsed and validated JSON, typed as T
  readonly schema: JSONSchema;
  readonly validatedAt: string;  // ISO 8601
}
```

### Behavior on Validation Failure

When structured output validation fails:

```typescript
try {
  const result = await tb.subagent.run({
    prompt: "Return a JSON object with fields x and y",
    expectedReturn: {
      schema: {
        type: "object",
        properties: {
          x: { type: "string" },
          y: { type: "number" }
        },
        required: ["x", "y"]
      }
    }
  });
  // result is ValidatedOutput<{x: string; y: number}>
  await tb.subagent.attach(result.data);
} catch (error) {
  if (error.type === "structured_output_error") {
    // Type-safe access to error details
    console.error(`Validation failed: ${error.message}`);
    console.error(`Raw output: ${error.rawOutput}`);

    for (const ve of error.validationErrors) {
      console.error(`  - ${ve.path}: expected ${ve.expected}, got ${JSON.stringify(ve.received)}`);
    }

    // Handle specific error codes if needed
    if (error.parsingError) {
      console.error(`Parse error at ${error.parsingError.line}:${error.parsingError.column}`);
    }
  }
  throw error;
}
```

### Success Path

On successful validation:

```typescript
const result = await tb.subagent.run({
  prompt: "Analyze the codebase and return metrics",
  expectedReturn: {
    schema: {
      type: "object",
      properties: {
        fileCount: { type: "number" },
        totalLines: { type: "number" },
        languages: { type: "array", items: { type: "string" } }
      },
      required: ["fileCount", "totalLines"]
    }
  }
});

// result is ValidatedOutput<{fileCount: number; totalLines: number; languages?: string[]}>
if (result.success) {
  // TypeScript knows data is validated
  const { fileCount, totalLines, languages } = result.data;

  // Attach to session with validated data
  await tb.subagent.attach({
    content: JSON.stringify(result.data),
    summary: `Codebase analysis: ${fileCount} files, ${totalLines} lines`,
    metadata: result.data
  });
}
```

### Schema Validation Implementation

- Uses JSON Schema draft-07 for validation
- Supports all standard JSON Schema keywords
- Custom keywords are NOT supported

---

## Design Rationale

### Type-Safe Error Handling

The `StructuredOutputError` interface is designed for **type-safe error handling**:

1. **`type: "structured_output_error"` discriminant**: Enables type narrowing with `if (error.type === "structured_output_error")`
2. **Readonly fields**: Errors should be immutable once thrown
3. **Detailed `validationErrors`**: Each failure is captured with path, expected, received, and optional reason
4. **Optional `parsingError`**: When JSON parsing fails, we capture parser details (offset, line, column)

### Making Errors Explicit and Actionable

The structured error allows agents to:

- **Debug**: See exactly which field failed and what was expected
- **Retry intelligently**: Know if the failure was parsing (bad JSON) vs validation (wrong structure)
- **Report accurately**: Line/column info helps pinpoint where in the output the problem is

### Facilitating Useful States

The `ValidatedOutput<T>` success type:
- Carries the **typed data** after validation (`data: T`)
- Includes the **schema** for reference
- Includes **validation timestamp** for debugging

---

## Validation

1. **Schema Acceptance**: `expectedReturn.schema` accepts valid JSON Schema objects
2. **Validation Success**: Valid output matching schema is returned as `ValidatedOutput<T>`
3. **Validation Failure**: Output not matching schema throws `StructuredOutputError`
4. **Error Detail**: `StructuredOutputError.validationErrors` contains path, expected, and received for each failure
5. **No Attachment on Failure**: Output that fails validation is NOT attached to session
6. **JSON Parsing**: Non-JSON output that cannot be parsed throws `StructuredOutputError` with `parsingError`
7. **Success Attachment**: Validated output can be successfully attached via `tb.subagent.attach()`
8. **Type Narrowing**: `error.type === "structured_output_error"` enables type-safe error handling

---

## Implementation Notes

### Zod Schema for Error Types

```typescript
const ValidationErrorSchema = z.object({
  path: z.string(),
  expected: z.string(),
  received: z.unknown(),
  reason: z.string().optional(),
});

const ParsingErrorSchema = z.object({
  message: z.string(),
  offset: z.number().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
});

const StructuredOutputErrorSchema = z.object({
  type: z.literal("structured_output_error"),
  message: z.string(),
  rawOutput: z.string(),
  validationErrors: z.array(ValidationErrorSchema),
  expectedSchema: z.any(), // JSON Schema is complex, use z.any() for flexibility
  timestamp: z.string(),
  parsingError: ParsingErrorSchema.optional(),
});
```
