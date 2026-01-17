# Zod 4 Breaking Changes

Comprehensive list of breaking changes from Zod 3 to Zod 4, ordered by impact.

---

## High Impact

### z.record() Requires Two Arguments

The single-argument form is removed. Always provide both key and value schemas.

```typescript
// Zod 3
z.record(z.number());

// Zod 4
z.record(z.string(), z.number());
```

**Migration**: Search for `z.record(` with single argument and add `z.string(),` as first arg.

---

### .strict() and .passthrough() Removed

Use the new object constructors instead.

```typescript
// Zod 3
z.object({ name: z.string() }).strict();
z.object({ name: z.string() }).passthrough();
z.object({ name: z.string() }).strip();

// Zod 4
z.strictObject({ name: z.string() });  // Rejects unknown keys
z.looseObject({ name: z.string() });   // Allows unknown keys
z.object({ name: z.string() });        // Strips unknown keys (default)
```

---

### .default() Behavior Change

In Zod 4, `.default()` short-circuits when input is `undefined`:
- Returns the default value directly (not parsed)
- Default must be assignable to the **output** type

```typescript
// Zod 3: default matched INPUT type, was parsed
z.string().transform(s => s.length).default("hello");
// parse(undefined) → "hello" → 5

// Zod 4: default must match OUTPUT type
z.string().transform(s => s.length).default(0);
// parse(undefined) → 0 (not parsed)

// To get Zod 3 behavior, use .prefault()
z.string().transform(s => s.length).prefault("hello");
// parse(undefined) → "hello" → 5
```

---

### ZodError Methods Deprecated

```typescript
// Zod 3
error.format();
error.flatten();
error.addIssue(issue);
error.addIssues(issues);

// Zod 4
z.treeifyError(error);
error.issues.push(issue);
error.issues.push(...issues);
```

---

## Medium Impact

### z.coerce Input Type Changed

The inferred input type for coerced schemas changed from `string` to `unknown`.

```typescript
const schema = z.coerce.string();
type Input = z.input<typeof schema>;
// Zod 3: string
// Zod 4: unknown
```

---

### ZodIssue Types Renamed

Issue types moved to `z.core` namespace with new names:

| Zod 3 | Zod 4 |
|-------|-------|
| `z.ZodInvalidTypeIssue` | `z.core.$ZodIssueInvalidType` |
| `z.ZodTooBigIssue` | `z.core.$ZodIssueTooBig` |
| `z.ZodTooSmallIssue` | `z.core.$ZodIssueTooSmall` |
| `z.ZodInvalidStringIssue` | `z.core.$ZodIssueInvalidStringFormat` |
| `z.ZodNotMultipleOfIssue` | `z.core.$ZodIssueNotMultipleOf` |
| `z.ZodUnrecognizedKeysIssue` | `z.core.$ZodIssueUnrecognizedKeys` |
| `z.ZodInvalidUnionIssue` | `z.core.$ZodIssueInvalidUnion` |
| `z.ZodCustomIssue` | `z.core.$ZodIssueCustom` |

---

### Merged/Removed Issue Types

| Zod 3 | Zod 4 |
|-------|-------|
| `z.ZodInvalidEnumValueIssue` | Merged into `z.core.$ZodIssueInvalidValue` |
| `z.ZodInvalidLiteralIssue` | Merged into `z.core.$ZodIssueInvalidValue` |
| `z.ZodInvalidDateIssue` | Merged into `invalid_type` |
| `z.ZodNotFiniteIssue` | Removed (infinite = `invalid_type`) |
| `z.ZodInvalidUnionDiscriminatorIssue` | Throws Error at schema creation |
| `z.ZodInvalidArgumentsIssue` | `z.function` throws ZodError directly |
| `z.ZodInvalidReturnTypeIssue` | `z.function` throws ZodError directly |
| `z.ZodInvalidIntersectionTypesIssue` | Throws regular Error |

---

## Low Impact

### .describe() Deprecated

Use `.meta()` instead:

```typescript
// Zod 3
z.string().describe("User email");

// Zod 4 (preferred)
z.string().meta({ description: "User email" });

// .describe() still works but is deprecated
```

---

### Symbol Keys Not Supported

`z.record()` no longer validates symbol keys. Only string keys are supported.

---

### .merge() Deprecated

Use spread or `.extend()` instead:

```typescript
// Zod 3
const merged = schema1.merge(schema2);

// Zod 4
const merged = schema1.extend(schema2.shape);
// or
const merged = z.object({
  ...schema1.shape,
  ...schema2.shape
});
```

---

### .strip() Removed

`.strip()` was the default behavior and is now implicit:

```typescript
// Zod 3
z.object({ name: z.string() }).strip();

// Zod 4 - just use z.object (strips by default)
z.object({ name: z.string() });
```

---

## TypeScript Changes

### Minimum TypeScript Version

Zod 4 requires TypeScript 4.5 or higher.

### Improved Type Inference

Zod 4 has ~100x reduction in TypeScript instantiations, resulting in faster compilation and better IDE performance.
