# Zod 4 New Features

Complete guide to new features and improvements in Zod 4.

---

## File Validation

New `z.file()` schema for validating JavaScript `File` instances:

```typescript
const imageSchema = z.file()
  .min(1024)              // Minimum 1KB
  .max(5 * 1024 * 1024)   // Maximum 5MB
  .mime(["image/png", "image/jpeg", "image/webp"]);

// Usage
const file = new File([data], "image.png", { type: "image/png" });
imageSchema.parse(file);
```

---

## Template Literal Types

New `z.templateLiteral()` for validating template literal patterns:

```typescript
// CSS units
const cssValue = z.templateLiteral([
  z.number(),
  z.enum(["px", "em", "rem", "%"])
]);
// Type: `${number}px` | `${number}em` | `${number}rem` | `${number}%`

cssValue.parse("16px");    // OK
cssValue.parse("1.5rem");  // OK
cssValue.parse("100%");    // OK
cssValue.parse("16");      // Error

// Email pattern with length constraints
const email = z.templateLiteral([
  z.string().min(1),
  "@",
  z.string().min(1).max(64)
]);

// Semantic versioning
const semver = z.templateLiteral([
  z.number().int(),
  ".",
  z.number().int(),
  ".",
  z.number().int()
]);
```

---

## Schema Metadata

### .meta() Method

Add JSON Schema-compatible metadata to any schema:

```typescript
const userSchema = z.object({
  email: z.string().email().meta({
    title: "Email Address",
    description: "User's primary email",
    examples: ["user@example.com"]
  }),
  age: z.number().int().positive().meta({
    title: "Age",
    minimum: 0,
    maximum: 150
  })
}).meta({
  id: "user_schema",
  title: "User",
  description: "User data structure"
});
```

### Global Registry

Centrally manage schema metadata:

```typescript
// Register schema globally
z.globalRegistry.add(userSchema, {
  id: "user",
  title: "User Schema",
  version: "1.0.0"
});

// Retrieve metadata
const meta = z.globalRegistry.get(userSchema);
```

---

## Internationalization (i18n)

Built-in localization for error messages:

```typescript
import { z } from "zod";
import { en } from "zod/locales/en";
import { es } from "zod/locales/es";
import { fr } from "zod/locales/fr";

// Configure locale globally
z.config(en());  // English
z.config(es());  // Spanish
z.config(fr());  // French

// Now all error messages use the configured locale
const schema = z.string().min(5);
schema.parse("hi");
// Error message will be in the configured language
```

---

## Object Schema Variants

### z.strictObject()

Rejects any unknown keys:

```typescript
const strict = z.strictObject({
  name: z.string(),
  age: z.number()
});

strict.parse({ name: "Alice", age: 30 });           // OK
strict.parse({ name: "Alice", age: 30, extra: 1 }); // Error!
```

### z.looseObject()

Allows and passes through unknown keys:

```typescript
const loose = z.looseObject({
  name: z.string()
});

const result = loose.parse({ name: "Alice", extra: "data" });
// { name: "Alice", extra: "data" }
```

---

## Error Handling

### z.treeifyError()

New error formatting function:

```typescript
try {
  schema.parse(invalidData);
} catch (err) {
  if (err instanceof z.ZodError) {
    const tree = z.treeifyError(err);
    console.log(tree);
  }
}
```

---

## .prefault()

Replicate Zod 3's `.default()` behavior where the default value is parsed:

```typescript
const schema = z.string()
  .transform(s => s.toUpperCase())
  .prefault("hello");

schema.parse(undefined);  // "HELLO" (parsed and transformed)
schema.parse("world");    // "WORLD"
```

---

## Zod Mini

A smaller, tree-shakable alternative import:

```typescript
import * as z from "zod/mini";

// Functional API
const schema = z.pipe(
  z.string(),
  z.minLength(1),
  z.maxLength(100),
  z.trim()
);

// Available checks
z.lt(n);           // Less than
z.lte(n);          // Less than or equal (alias: z.maximum)
z.gt(n);           // Greater than
z.gte(n);          // Greater than or equal (alias: z.minimum)
z.positive();
z.negative();
z.nonpositive();
z.nonnegative();
z.multipleOf(n);
z.minSize(n);      // For arrays/sets
z.maxSize(n);
z.size(n);
z.minLength(n);    // For strings
z.maxLength(n);
z.length(n);
z.regex(pattern);
z.lowercase();
z.uppercase();
z.includes(str);
z.startsWith(str);
z.endsWith(str);
z.property(key, schema);  // For objects
z.mime(types);            // For files

// Overwrites (transform without type change)
z.overwrite(fn);
z.normalize();
z.trim();
z.toLowerCase();
z.toUpperCase();
```

---

## Performance Improvements

Zod 4 delivers significant performance gains:

| Benchmark | Improvement |
|-----------|-------------|
| Object parsing | ~65x faster |
| TypeScript instantiations | ~100x reduction |
| Bundle size (mini) | ~50% smaller |

---

## Core Extension API

Build custom schemas using the core API:

```typescript
import { z } from "zod/v4/core";

// Create custom schema types
// (Advanced - see Zod documentation for details)
```

---

## JSON Schema Improvements

Better JSON Schema generation with improved recursive object support:

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const schema = z.object({
  name: z.string().meta({ title: "Name" }),
  children: z.lazy(() => schema).array().optional()
});

const jsonSchema = zodToJsonSchema(schema);
```
