# Type System Principles Applied to Cognitive Harness Specs

This document summarizes the type system refinements applied across the cognitive-harness-improvements specs, organized by principle.

---

## Principle 1: Making Illegal States Unrepresentable

### Definition
Use the type system to prevent invalid states from being representable in code. If a state is illegal, the type system should make it impossible to construct.

### Applications

#### Spec 01: Auto-Numbering Surfacing
**Problem**: `thoughtNumber` was typed as optional (`number | undefined`) allowing clients to attempt to set it.

**Solution**: Use `never` type to forbid the field entirely in client input types:
```typescript
interface ThoughtInput {
  thoughtNumber?: never;  // Cannot be set by client
  timestamp?: never;      // Cannot be set by client
}
```
TypeScript will now error if any code attempts to set `thoughtNumber`.

#### Spec 07: Deliberation Without Commitment
**Problem**: `options: Array<{ label: string; selected: boolean }>` allowed multiple options to have `selected: true`.

**Solution**: Use discriminated union to make multiple selections impossible:
```typescript
type DecisionOption = 
  | { label: string; selected?: false }
  | { label: string; selected: true; reason?: string };
```
Now TypeScript prevents code like:
```typescript
// COMPILE ERROR - can't have two selected: true:
const options: DecisionOption = [
  { label: "A", selected: true },
  { label: "B", selected: true }  // Error!
];
```

#### Spec 06: Cipher Mode Toggle
**Problem**: `cipherMode: "off"` could be overridden by per-thought `cipher: true`, making "off" not actually mean "off".

**Solution**: Make per-thought `cipher` flag conditionally effective only in `"manual"` mode:
```typescript
type EffectiveCipherDecision =
  | { decision: "cipher"; reason: "auto_signal" | "manual_request" }
  | { decision: "skip"; reason: "auto_signal_clear" | "manual_opt_out" | "mode_off" };
```
When `cipherMode === "off"`, the per-thought flag is ignored. This makes the semantics consistent.

#### Spec 09: Named Checkpoints
**Problem**: Labels were plain `string`, allowing empty strings, spaces, uppercase, etc.

**Solution**: Use branded type with validation:
```typescript
type CheckpointLabel = string & {
  readonly __brand: "CheckpointLabel";
  readonly __pattern: /^[a-z0-9][a-z0-9_-]*$/;
};
```
Now only URL-safe lowercase labels are valid.

---

## Principle 2: Facilitating Representation of Useful States

### Definition
Ensure that valid, useful states ARE representable and ergonomically expressible. The type system should guide developers toward correct usage.

### Applications

#### Spec 02: Terse Shorthand (`tb.t()` and `tb.end()`)
**Enhancement**: Added explicit return types:
```typescript
interface TB {
  t(content: string): Promise<ThoughtResult>;
  end(content: string): Promise<ThoughtResult>;
}
```
Clear return types help developers understand what they get back.

#### Spec 03: Mid-Session Recall Primitives
**Enhancement**: Added `readonly` to return arrays:
```typescript
recentThoughts(count?: number): Promise<readonly Thought[]>;
searchWithin(query: string, options?: SearchWithinOptions): Promise<readonly Thought[]>;
```
`readonly` arrays prevent accidental mutation of session data.

#### Spec 04: Subagent Session Attachment
**Enhancement**: Complete type definitions for `SubagentOutput`:
```typescript
interface SubagentOutput {
  content: string;
  summary?: string;
  metadata?: Readonly<Record<string, unknown>>;
  completedAt: string;
  durationMs?: number;
  model?: string;
}
```
Explicit fields with `Readonly` metadata prevent mutation.

#### Spec 08: Per-Session Type Audit
**Enhancement**: Define `SessionType` as a closed union:
```typescript
type SessionType = 
  | "research" 
  | "decision" 
  | "implementation" 
  | "debugging" 
  | "exploration";
```
Closed unions prevent typos and invalid combinations.

#### Spec 11: Structured Return Schemas
**Enhancement**: Complete `ValidatedOutput<T>` success type:
```typescript
interface ValidatedOutput<T> {
  readonly success: true;
  readonly data: T;
  readonly schema: JSONSchema;
  readonly validatedAt: string;
}
```
Typed data makes working with validated output ergonomic.

---

## Principle 3: Explicit Error States

### Definition
When errors CAN occur, make them explicit and typed rather than implicit and unstructured.

### Applications

#### Spec 10: Knowledge Graph Persistence
**Enhancement**: Structured `KGPersistError`:
```typescript
interface KGPersistError {
  code: KGPersistErrorCode;
  message: string;
  details?: {
    attemptedName?: string;
    attemptedRelationTo?: string;
    existingEntityId?: string;
  };
  timestamp: string;
}

type KGPersistErrorCode =
  | "ENTITY_NAME_CONFLICT"
  | "RELATION_TARGET_NOT_FOUND"
  | "VISIBILITY_DENIED"
  | "STORAGE_ERROR"
  | "UNKNOWN_ERROR";
```
Error codes enable programmatic handling and querying.

#### Spec 11: Structured Return Schemas
**Enhancement**: Complete `StructuredOutputError`:
```typescript
interface StructuredOutputError {
  readonly type: "structured_output_error";  // Discriminant
  readonly message: string;
  readonly rawOutput: string;
  readonly validationErrors: readonly ValidationError[];
  readonly expectedSchema: JSONSchema;
  readonly timestamp: string;
  readonly parsingError?: ParsingError;
};
```
The `type` discriminant enables type-safe error handling.

---

## Principle 4: Type Hierarchy Separation

### Definition
Client input types and server output types have different constraints. They should NOT inherit from each other.

### Application

#### Spec 01: Auto-Numbering Surfacing
**Problem**: `ThoughtInput extends ThoughtData` where `ThoughtData` has required `thoughtNumber` and `timestamp`.

**Solution**: Separate the hierarchies:
```typescript
// Client input - server-assigned fields are forbidden
interface ThoughtInput {
  thoughtNumber?: never;  // Not allowed
  timestamp?: never;     // Not allowed
  // ... client-provided fields
}

// Server output - server-assigned fields are required
interface Thought extends ThoughtInput {
  thoughtNumber: number;   // Always present
  timestamp: string;       // Always present
}
```
`ThoughtInput` is NOT an extension of `Thought`.

---

## Principle 5: Explicit Return Types

### Definition
Methods should explicitly declare their return types rather than relying on inference. This documents intent and catches mismatches.

### Application

#### Spec 05: Hook Suppression
```typescript
interface SessionOperations {
  isActive(): Promise<boolean>;  // Explicit!
}
```

#### Spec 03: Recall Primitives
```typescript
getThought(n: number): Promise<Thought | null>;  // null is explicit
recentThoughts(count?: number): Promise<readonly Thought[]>;  // readonly is explicit
```

---

## Summary Table

| Spec | Principle | Technique | Illegal State Prevented |
|------|-----------|-----------|------------------------|
| 01 | Unrepresentable | `?: never` | Client setting server fields |
| 01 | Type Separation | Separate interfaces | `ThoughtInput extends ThoughtData` |
| 06 | Unrepresentable | Conditional effectiveness | `"off"` + `cipher: true` contradiction |
| 07 | Unrepresentable | Discriminated union | Multiple selected options |
| 08 | Facilitating | Closed union | Invalid session types |
| 09 | Unrepresentable | Branded type + regex | Invalid checkpoint labels |
| 10 | Explicit Errors | Structured error codes | Untyped KG persistence failures |
| 11 | Explicit Errors | Discriminated error type | Untyped validation failures |

---

## Implementation Priority

1. **Spec 01** (Foundational): Separates input/output types - should be implemented first
2. **Spec 07** (High Impact): Prevents invalid decision states at compile time
3. **Spec 06** (Semantic Fix): Resolves contradictory cipher mode behavior
4. **Spec 09** (Quality of Life): Enforces naming conventions via types
5. **Spec 08** (Audit Enhancement): Closed union for session types
6. **Spec 10/11** (Error Handling): Structured error types for better debugging
