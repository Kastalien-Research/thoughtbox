# Spec: Auto-Numbering Surfacing

## Title
Auto-Numbering Surfacing for Thought Numbers

## Status
Draft

## Target State

### Type Hierarchy Restructuring

The key insight is that **client input types** and **server output types** have different constraints:

- **Client Input (`ThoughtInput`)**: Fields the client MAY set when submitting
- **Server Output (`Thought`)**: Fields the server ALWAYS provides after persisting

```typescript
/**
 * Client-facing input type for thought submission.
 * These fields are what the client is allowed to provide.
 */
interface ThoughtInput {
  thought: string;
  thoughtType: ThoughtType;
  nextThoughtNeeded: boolean;

  /**
   * EXPLICITLY FORBIDDEN: Server-auto-assigned.
   * Using `never` makes this field impossible to set at the type level.
   */
  thoughtNumber?: never;

  /**
   * EXPLICITLY FORBIDDEN: Server-auto-assigned.
   */
  timestamp?: never;

  // ... other client-provided fields
}

/**
 * Server-persisted thought type.
 * All fields are guaranteed to be present after persistence.
 */
interface Thought extends ThoughtInput {
  thoughtNumber: number;    // Now guaranteed present
  timestamp: string;        // Now guaranteed present
  contentHash?: string;     // Server-computed
}
```

### SDK Type Definitions

The `ThoughtInput` interface in the SDK types clearly documents that `thoughtNumber` and `timestamp` are **server-auto-assigned**:

```typescript
interface ThoughtInput {
  thought: string;
  thoughtType: ThoughtType;
  nextThoughtNeeded: boolean;

  /**
   * Server-auto-assigned. Client should NOT set this field.
   * The server assigns sequential thought numbers on write.
   */
  thoughtNumber?: never;

  /**
   * Server-auto-assigned. Client should NOT set this field.
   * The server assigns ISO 8601 timestamps on write.
   */
  timestamp?: never;

  // ... other fields
}
```

### Documentation and Examples

All SDK documentation, code examples, and tutorials show `thoughtNumber` omitted from thought submissions. When developers attempt to pass `thoughtNumber` in their code:

1. TypeScript compilation fails with a type error ("thoughtNumber is declared as `never`")
2. Runtime validation rejects the field with a clear error message

### Gotchas Documentation

The "Common Pitfalls" section in developer documentation is reframed to correctly characterize the behavior:

**Before (incorrect framing):**
> "Don't forget to manually increment thoughtNumber for each new thought"

**After (correct framing):**
> "The server automatically assigns sequential thought numbers. Do not attempt to set thoughtNumber manually."

### Validation Behavior

When a thought is returned from the server, `thoughtNumber` is always present and correctly sequential. The client can read it but never write it.

---

## Design Rationale

### Making Illegal States Unrepresentable

The `thoughtNumber` and `timestamp` fields represent canonical ordering metadata assigned by the server. Making them `never` in client input types creates a compile-time guarantee that clients cannot attempt to manipulate server-assigned values.

### Type Hierarchy Separation

The original `ThoughtInput extends ThoughtData` model was backwards:
- `ThoughtData` described persisted thoughts (with required fields)
- `ThoughtInput` inherited these required fields, contradicting the "optional client input" intent

The correct model:
- `ThoughtInput` describes what clients CAN send (server-assigned fields are `never`)
- `Thought` describes what servers return (server-assigned fields are required)
- `ThoughtInput` is NOT an extension of `Thought`

### Semantic Correctness

By declaring `thoughtNumber` and `timestamp` as `never` in the input type, we make the immutability contract explicit at compile time rather than relying on documentation alone. This is the essence of "making illegal states unrepresentable."

---

## Validation

1. **Type Check**: TypeScript compilation fails when `thoughtNumber` is included in a `ThoughtInput` object
2. **Type Check**: TypeScript compilation fails when `timestamp` is included in a `ThoughtInput` object
3. **Runtime Rejection**: API returns 400 error if `thoughtNumber` is present in submitted thought payload
4. **Runtime Rejection**: API returns 400 error if `timestamp` is present in submitted thought payload
5. **Return Presence**: Every thought retrieved from the API includes a valid, sequential `thoughtNumber`
6. **Return Presence**: Every thought retrieved from the API includes a valid ISO 8601 `timestamp`
7. **Documentation Audit**: All examples in docs, tutorials, and SDK READMEs omit `thoughtNumber` and `timestamp`
8. **Type Hierarchy**: `ThoughtInput` does NOT extend `Thought` (or `ThoughtData`)

---

## Implementation Notes

### Zod Schema Alignment

The Zod schema in `src/thought/tool.ts` should be updated:

```typescript
// BEFORE (current)
export const thoughtToolInputSchema = z.object({
  thoughtNumber: z.number().optional(), // Wrong - allows client to set
  // ...
});

// AFTER (correct)
export const thoughtToolInputSchema = z.object({
  // Explicitly using never() would be redundant in Zod - omitting achieves same effect
  // as the type system will prevent setting it
  // ...
}).strict(); // Enable strict mode to reject unexpected keys
```

### Persistence Layer

The persistence layer (`src/persistence/types.ts`) should maintain `ThoughtData` with required fields, but it should NOT be the parent of `ThoughtInput`.
