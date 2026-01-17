# Zod 3 to Zod 4 Migration Checklist

Step-by-step guide for migrating a codebase from Zod 3 to Zod 4.

---

## Pre-Migration

- [ ] **Backup your code** or ensure clean git state
- [ ] **Check TypeScript version** - Zod 4 requires TS 4.5+
- [ ] **Review test coverage** - ensure you have tests for validation logic

---

## Phase 1: Update Dependencies

```bash
# Update to Zod 4
npm install zod@^4.0.0

# Or with specific version
npm install zod@4.0.0
```

- [ ] Update `package.json` to `zod@^4.0.0`
- [ ] Run `npm install` or `yarn install`
- [ ] Verify installation: `npm list zod`

---

## Phase 2: Fix Breaking Changes (Priority Order)

### 2.1 Fix z.record() Calls

Search for single-argument `z.record()` calls:

```bash
# Find occurrences
grep -r "z\.record(" --include="*.ts" --include="*.tsx"
```

Fix pattern:
```typescript
// Before
z.record(z.string())
z.record(z.number())
z.record(mySchema)

// After
z.record(z.string(), z.string())
z.record(z.string(), z.number())
z.record(z.string(), mySchema)
```

- [ ] Search for `z.record(` with single argument
- [ ] Add key schema (usually `z.string()`) as first argument
- [ ] Test each updated record schema

### 2.2 Fix Strict/Passthrough Objects

Search for `.strict()` and `.passthrough()`:

```bash
grep -r "\.strict()" --include="*.ts" --include="*.tsx"
grep -r "\.passthrough()" --include="*.ts" --include="*.tsx"
```

Fix pattern:
```typescript
// Before
z.object({ name: z.string() }).strict()
z.object({ name: z.string() }).passthrough()

// After
z.strictObject({ name: z.string() })
z.looseObject({ name: z.string() })
```

- [ ] Replace `.strict()` with `z.strictObject()`
- [ ] Replace `.passthrough()` with `z.looseObject()`
- [ ] Remove any `.strip()` calls (now default behavior)

### 2.3 Fix Error Handling

Search for deprecated error methods:

```bash
grep -r "\.format()" --include="*.ts" --include="*.tsx"
grep -r "\.flatten()" --include="*.ts" --include="*.tsx"
grep -r "\.addIssue" --include="*.ts" --include="*.tsx"
```

Fix pattern:
```typescript
// Before
if (err instanceof z.ZodError) {
  const formatted = err.format();
  const flat = err.flatten();
}

// After
if (err instanceof z.ZodError) {
  const tree = z.treeifyError(err);
}
```

- [ ] Replace `err.format()` with `z.treeifyError(err)`
- [ ] Replace `err.flatten()` with custom logic or `z.treeifyError()`
- [ ] Replace `err.addIssue()` with `err.issues.push()`

### 2.4 Fix .default() with Transforms

Search for `.default()` used after `.transform()`:

```bash
grep -r "\.transform.*\.default" --include="*.ts" --include="*.tsx"
```

Check if default value matches output type:
```typescript
// If default matches INPUT type (breaks in v4)
z.string().transform(s => s.length).default("hello")
// Change to .prefault()
z.string().transform(s => s.length).prefault("hello")

// Or if default should match OUTPUT type
z.string().transform(s => s.length).default(0)
```

- [ ] Find `.transform(...).default(...)` patterns
- [ ] Check if default matches output type
- [ ] Use `.prefault()` if default needs to be parsed

---

## Phase 3: Update Type References

### 3.1 ZodIssue Types

If you reference specific issue types:

```typescript
// Before
import { ZodInvalidTypeIssue, ZodTooBigIssue } from "zod";

// After
import { z } from "zod";
type InvalidType = z.core.$ZodIssueInvalidType;
type TooBig = z.core.$ZodIssueTooBig;
```

- [ ] Update imported issue type names
- [ ] Update type guards that check issue types

### 3.2 z.coerce Type Changes

If you rely on coerce input types:

```typescript
// Check if any code assumes coerce input is string
type MyInput = z.input<typeof z.coerce.number()>;
// Was: string
// Now: unknown
```

- [ ] Review code that uses `z.input<>` with coerced schemas
- [ ] Update type assertions if needed

---

## Phase 4: Optional Improvements

### 4.1 Adopt New Features

Consider using new Zod 4 features:

- [ ] Replace `.describe()` with `.meta()` for richer metadata
- [ ] Use `z.file()` for file validation (if applicable)
- [ ] Use `z.templateLiteral()` for pattern strings
- [ ] Consider `zod/mini` for smaller bundle size

### 4.2 Replace .merge() with .extend()

```typescript
// Before
const merged = schema1.merge(schema2);

// After
const merged = schema1.extend(schema2.shape);
```

- [ ] Replace `.merge()` calls with `.extend()`

---

## Phase 5: Testing

- [ ] Run full test suite
- [ ] Test all validation paths
- [ ] Test error handling
- [ ] Test edge cases (undefined, null, empty objects)
- [ ] Check TypeScript compilation (no type errors)

---

## Phase 6: Cleanup

- [ ] Remove any compatibility shims
- [ ] Update documentation
- [ ] Remove unused imports
- [ ] Run linter

---

## Automated Migration

Consider using the community codemod:

```bash
npx zod-v3-to-v4
```

This automates many of the changes above but may not catch everything.

---

## Troubleshooting

### TypeScript Errors After Migration

1. **Clear TypeScript cache**: `rm -rf node_modules/.cache`
2. **Restart TS server** in your IDE
3. **Check for outdated @types packages**

### Runtime Errors

1. **"Expected 2 arguments, got 1"**: Fix `z.record()` calls
2. **"Property does not exist"**: Check for removed methods
3. **Type mismatch on default**: Check `.default()` vs `.prefault()`

### Build Errors

1. **Verify Zod version**: `npm list zod`
2. **Check for conflicting Zod versions**: `npm ls zod`
3. **Update zod-to-json-schema** if using JSON Schema generation
