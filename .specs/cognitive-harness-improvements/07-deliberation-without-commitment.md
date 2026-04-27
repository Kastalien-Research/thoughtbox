# Spec: Deliberation Without Commitment

## Title
Decision Frames with Optional Selection and Deliberation State

## Status
Draft

## Target State

### The Problem with `selected: boolean` on Each Option

A naive representation of decision options looks like:

```typescript
options: Array<{
  label: string;
  selected: boolean;  // PROBLEM: Multiple options can have selected: true
}>
```

This allows **illegal states** like:
```typescript
{
  options: [
    { label: "PostgreSQL", selected: true },
    { label: "MongoDB", selected: true },   // ILLEGAL: Multiple selections!
    { label: "DynamoDB", selected: false }
  ]
}
```

### Type-Safe Option Representation

We use a **discriminated union** pattern to make illegal states unrepresentable:

```typescript
/**
 * Base option type with just a label (unselected state)
 */
interface UnselectedOption {
  label: string;
  selected?: false;  // Must be false or undefined
}

/**
 * Selected option - distinguished by selected: true
 */
interface SelectedOption {
  label: string;
  selected: true;
  reason?: string;   // Why this was selected
}

/**
 * Option in a decision - either selected or unselected
 */
type DecisionOption = UnselectedOption | SelectedOption;

/**
 * Options array is a single-selected set.
 * Type system guarantees: at most one option has selected: true
 */
type DecisionOptionSet = DecisionOption[];
```

### Extended Decision Frame Structure

```typescript
interface DecisionFrameInput extends ThoughtInput {
  thoughtType: "decision_frame";

  /**
   * Options being considered.
   * - Empty array: deliberation in progress, no options yet enumerated
   * - Non-empty: options under consideration
   *
   * Type system guarantee: at most one option has selected: true
   */
  options: DecisionOptionSet;

  /**
   * Current state of the decision process.
   * - "deliberating": Still weighing options, no commitment yet
   * - "committed": A decision has been made (exactly one option MUST be selected)
   */
  decisionState: "deliberating" | "committed";
}
```

### Valid States Matrix

| State | Options | Selected Count | Valid |
|-------|---------|----------------|-------|
| `deliberating` | `[]` | 0 | ✅ |
| `deliberating` | `[{label: "A"}, {label: "B"}]` | 0 | ✅ |
| `deliberating` | `[{label: "A", selected: true}, {label: "B"}]` | 1 | ✅ (can preview selection) |
| `committed` | `[{label: "A", selected: true}, {label: "B"}]` | 1 | ✅ |
| `deliberating` | `[{label: "A", selected: true}, {label: "B", selected: true}]` | 2 | ❌ Type error! |
| `committed` | `[{label: "A"}, {label: "B"}]` | 0 | ❌ Runtime validation error |
| `committed` | `[]` | 0 | ❌ Runtime validation error |

### Type System Enforcement (and its limits)

The discriminated union makes per-element typing self-documenting and lets TypeScript narrow once a single option is inspected. **However, TypeScript cannot enforce array-wide invariants such as "at most one element has `selected: true`" through the structural type system alone** — each element of the array is independently typed, and the type checker has no mechanism to express "at most N elements satisfy predicate P".

What the type system **does** catch:

```typescript
// ✅ Compile-time error - 'selected: "yes"' is not assignable to literal types:
const bad1: DecisionOptionSet = [
  { label: "PostgreSQL", selected: "yes" }
];

// ✅ Compile-time error - 'selected: true' without label is invalid in either branch:
const bad2: DecisionOptionSet = [
  { selected: true }
];

// ✅ Type narrowing works for individual elements:
const opt: DecisionOption = options[0];
if (opt.selected) {
  // TypeScript knows opt is SelectedOption here; opt.reason is in scope
  console.log(opt.reason);
}
```

What the type system **does not** catch (must be enforced at runtime):

```typescript
// ❌ NOT a compile-time error - both elements are independently valid:
const bad3: DecisionOptionSet = [
  { label: "PostgreSQL", selected: true },
  { label: "MongoDB", selected: true }   // Type-checks fine; runtime rejects
];
```

The "at most one selected" invariant is **enforced at runtime** by the Zod `refine` step (see Implementation Notes), which is the appropriate layer for cross-element constraints. The type system's contribution is making each individual option self-documenting and enabling clean narrowing — not preventing the multi-selection case.

### Additional Validation (Runtime)

Even though the type system prevents multiple `selected: true`, runtime validation enforces business rules:

```typescript
function validateDecisionFrame(input: DecisionFrameInput): void {
  const selectedCount = input.options.filter(o => o.selected).length;

  if (input.decisionState === "committed" && selectedCount !== 1) {
    throw new DecisionValidationError(
      `Committed decision must have exactly one selected option, got ${selectedCount}`
    );
  }

  // selectedCount > 1 is prevented by type system, but we validate for safety
  if (selectedCount > 1) {
    throw new DecisionValidationError(
      "Multiple options selected - this should be prevented by the type system"
    );
  }
}
```

### Usage Examples

```typescript
// Still gathering options, no decision yet
await tb.thought({
  thought: "We need to decide on a database approach",
  thoughtType: "decision_frame",
  options: [],  // No options enumerated yet
  decisionState: "deliberating",
  nextThoughtNeeded: true
});

// Options enumerated, still deliberating
await tb.thought({
  thought: "Comparing three database options",
  thoughtType: "decision_frame",
  options: [
    { label: "PostgreSQL" },
    { label: "MongoDB" },
    { label: "DynamoDB" }
  ],
  decisionState: "deliberating",
  nextThoughtNeeded: true
});

// Decision made - exactly one selected, committed state
await tb.thought({
  thought: "Decision: Using PostgreSQL for relational integrity",
  thoughtType: "decision_frame",
  options: [
    { label: "PostgreSQL", selected: true, reason: "ACID compliance and relational modeling" },
    { label: "MongoDB" },
    { label: "DynamoDB" }
  ],
  decisionState: "committed",
  nextThoughtNeeded: false
});
```

### Backward Compatibility

For existing decision_frame thoughts that don't include `decisionState`:
- Treat as `decisionState: "committed"` if any option is selected
- Treat as `decisionState: "deliberating"` if no options are selected

---

## Design Rationale

### Making Illegal States Unrepresentable (Per-Element)

The original `options: Array<{ label: string; selected: boolean }>` design allowed each element to carry an arbitrary boolean payload, with no type-level distinction between "selected with a reason" and "unselected." Replacing it with a discriminated union where `selected: true` is a distinct branch (with required `label` and optional `reason`) makes each option self-documenting at the type level and enables clean narrowing.

The cross-element invariant — "at most one option in the array has `selected: true`" — is **not** expressible in TypeScript's structural type system without phantom-type encoding that we judge to be more complex than its benefit. That invariant is enforced at runtime by Zod's `refine` step (see Implementation Notes), which is the appropriate layer for cross-element constraints.

See "Type System Enforcement (and its limits)" above for a precise account of what the type system catches versus what runtime validation catches.

### Facilitating Useful States

The discriminated union still allows:
- **Preview selection** during deliberation: `{ label: "A", selected: true }` to show which way you're leaning
- **Clean committed state**: Exactly one selected when `decisionState: "committed"`
- **Empty deliberation**: `[]` options when you haven't enumerated choices yet

### Why Runtime Validation Still Exists

Type system enforcement applies to **per-element structure** (each option is either selected-with-optional-reason or unselected). Runtime validation enforces **cross-element and cross-field invariants** that TypeScript's structural type system cannot express:

- "At most one option has `selected: true`" — array-wide invariant
- "`decisionState: \"committed\"` requires exactly 1 selection" — cross-field invariant tying `options` to `decisionState`

These are complementary: the type system catches per-element structural errors at compile time; Zod `refine` catches cross-element and cross-field business rules at request time.

---

## Validation

1. **Per-Element Type Safety (compile time, scope = a single option)**: For any single `DecisionOption` value, TypeScript rejects: (a) values where `selected` is anything other than a literal `true` or absent/`false`; (b) values with `selected: true` lacking the required `label`; (c) extra unknown fields when strict mode is enabled. This validation is **per-element only** — it does not, and cannot, constrain combinations across the array.
2. **Cross-Element Runtime Rejection (request time, scope = the options array)**: An array containing two or more elements with `selected: true` is rejected at runtime by the Zod `refine` step. The type system alone does not catch the cross-element case — see "Type System Enforcement (and its limits)" in Target State for the precise account of what compile-time vs runtime catches.
3. **Empty Options**: `decision_frame` with empty `options` and `decisionState: "deliberating"` is valid
4. **Deliberating State**: `decision_frame` with multiple unselected options and `decisionState: "deliberating"` is valid
5. **Committed State**: `decision_frame` with exactly one `selected: true` and `decisionState: "committed"` is valid
6. **Committed Without Selection — Runtime Rejection**: `decision_frame` with `decisionState: "committed"` and no selection is rejected at runtime
7. **Backward Compatibility**: Existing decision_frame thoughts without `decisionState` are parsed correctly
8. **Option Narrowing**: Inside an `if (option.selected)` block, TypeScript narrows the type to `SelectedOption` and `option.reason` is in scope

---

## Implementation Notes

### Zod Schema

```typescript
const UnselectedOptionSchema = z.object({
  label: z.string(),
  selected: z.literal(false).optional(),
});

const SelectedOptionSchema = z.object({
  label: z.string(),
  selected: z.literal(true),
  reason: z.string().optional(),
});

const DecisionOptionSchema: z.ZodType<DecisionOption> = z.union([
  SelectedOptionSchema,
  UnselectedOptionSchema,
]);

const DecisionFrameInputSchema = z.object({
  // ... base thought fields
  thoughtType: z.literal("decision_frame"),
  options: z.array(DecisionOptionSchema),
  decisionState: z.enum(["deliberating", "committed"]),
})
  // Cross-element invariant: at most one option may be selected.
  // TypeScript's structural type system cannot express this; Zod enforces it.
  .refine(
    (data) => data.options.filter(o => o.selected === true).length <= 1,
    {
      message: "At most one option may have selected: true",
      path: ["options"],
    }
  )
  // Cross-field invariant: committed state requires exactly one selection.
  .refine(
    (data) => {
      if (data.decisionState === "committed") {
        return data.options.filter(o => o.selected === true).length === 1;
      }
      return true;
    },
    {
      message: "Committed decision must have exactly one selected option",
      path: ["decisionState"],
    }
  );
```
