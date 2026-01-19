# SPEC-MM-001: Mental Models Tag Array Filtering

> **Status**: Draft
> **Priority**: High
> **Effort**: Small (< 1 hour)

---

## Summary

Fix the mental models `list_models` operation to support filtering by an array of tags instead of a single tag string. This requires updating both the JSON schema and the implementation logic.

## Problem Statement

### Root Cause Analysis

Two bugs working together cause tag filtering to fail completely:

1. **Schema Bug** ([mental-models/index.ts:449](src/mental-models/index.ts#L449)): The tool schema defines `tag` (singular string) instead of `tags` (array of strings)
2. **Implementation Bug** ([mental-models/index.ts:90](src/mental-models/index.ts#L90)): The code reads `args.tag` which is undefined when caller passes `tags` (plural)

**Failure Chain:**
1. Caller sends: `{ operation: "list_models", tags: ["debugging"] }`
2. Schema expects: `tag` (singular), not `tags` (plural)
3. Code at line 90: `handleListModels(args.tag)` → receives `undefined`
4. Code at line 206: `if (tag)` → evaluates to `false` because `tag` is `undefined`
5. Code at line 227: Never filters, returns all 15 models

**Empirical Evidence:**
- Test with `tags: ["phenomenology"]` → returned all 15 models
- Test with `tags: ["debugging"]` → returned all 15 models (should be 2)
- Test with no tags → returned all 15 models
- All three requests produced identical responses

## Requirements

### Functional Requirements

1. **Support Tag Array Filtering**
   - `list_models` operation MUST accept `tags` parameter as an array of strings
   - When `tags` provided, return only models that have ALL specified tags (AND logic)
   - When `tags` is empty array or undefined, return all models
   - Invalid tags in array MUST return error with available tags list

2. **Backward Compatibility**
   - Continue to support single `tag` parameter for compatibility (deprecated)
   - If both `tag` and `tags` provided, `tags` takes precedence
   - Schema should accept both forms but document `tags` as preferred

3. **Gateway Integration**
   - Gateway must pass `tags` array through to handler correctly
   - No changes needed to gateway (already passes args.args through)

### Non-Functional Requirements

1. **Performance**: Filtering should be O(n*m) where n=models, m=tags in filter
2. **Error Handling**: Clear error messages for invalid tags
3. **Testing**: Must include test cases for tag array filtering

## Implementation Details

### Files to Modify

| File | Lines | Changes Required |
|------|-------|------------------|
| `src/mental-models/index.ts` | 90, 200-226, 449-453 | Update schema + handler logic |
| `src/mental-models/types.ts` | N/A | Add interface for args (if needed) |

### Schema Changes

**Current (WRONG):**
```typescript
// Line 449-453
tag: {
  type: "string",
  enum: getTagNames(),
  description: "Tag to filter models by (for list_models)",
}
```

**Fixed:**
```typescript
tag: {
  type: "string",
  enum: getTagNames(),
  description: "Tag to filter models by (for list_models) - DEPRECATED, use tags instead",
},
tags: {
  type: "array",
  items: {
    type: "string",
    enum: getTagNames()
  },
  description: "Array of tags to filter models by (for list_models). Returns models matching ALL tags (AND logic).",
}
```

### Handler Changes

**Current (WRONG):**
```typescript
// Line 90
case "list_models":
  return this.handleListModels(args.tag);

// Line 200-226
private handleListModels(tag?: string): {
  // ...
  let models = MENTAL_MODELS;

  if (tag) {
    if (!getTagNames().includes(tag)) {
      return { /* error */ };
    }
    models = getModelsByTag(tag);
  }
  // ...
}
```

**Fixed:**
```typescript
// Line 90
case "list_models":
  return this.handleListModels(args.tag, args.tags);

// Line 200-226
private handleListModels(tag?: string, tags?: string[]): {
  // ...
  let models = MENTAL_MODELS;

  // Prefer tags array over single tag
  const filterTags = tags || (tag ? [tag] : undefined);

  if (filterTags && filterTags.length > 0) {
    // Validate all tags exist
    const invalidTags = filterTags.filter(t => !getTagNames().includes(t));
    if (invalidTags.length > 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: `Unknown tags: ${invalidTags.join(", ")}`,
            availableTags: getTagNames(),
          }, null, 2)
        }],
        isError: true,
      };
    }

    // Filter models that have ALL specified tags (AND logic)
    models = MENTAL_MODELS.filter(m =>
      filterTags.every(tag => m.tags.includes(tag))
    );
  }

  const response: ListModelsResponse = {
    models: models.map((m) => ({
      name: m.name,
      title: m.title,
      description: m.description,
      tags: m.tags,
    })),
    count: models.length,
    filter: filterTags,
  };
  // ...
}
```

## Test Cases

### Test 1: Filter by Single Tag (Array)
```typescript
input: { operation: "list_models", tags: ["debugging"] }
expected: 2 models (rubber-duck, five-whys)
```

### Test 2: Filter by Multiple Tags (AND Logic)
```typescript
input: { operation: "list_models", tags: ["planning", "architecture"] }
expected: 2 models (decomposition, constraint-relaxation)
```

### Test 3: Invalid Tag in Array
```typescript
input: { operation: "list_models", tags: ["nonexistent"] }
expected: Error with available tags list
```

### Test 4: Empty Array
```typescript
input: { operation: "list_models", tags: [] }
expected: All 15 models
```

### Test 5: No Tags Parameter
```typescript
input: { operation: "list_models" }
expected: All 15 models
```

### Test 6: Backward Compatibility (Single tag)
```typescript
input: { operation: "list_models", tag: "debugging" }
expected: 2 models (rubber-duck, five-whys)
```

### Test 7: Both tag and tags (tags wins)
```typescript
input: { operation: "list_models", tag: "planning", tags: ["debugging"] }
expected: 2 models from tags parameter (rubber-duck, five-whys)
```

## Acceptance Criteria

- [ ] Schema accepts `tags` as array of strings
- [ ] Schema still accepts `tag` for backward compatibility
- [ ] `handleListModels` filters by ALL tags in array (AND logic)
- [ ] Invalid tags return clear error message
- [ ] Empty/undefined tags return all models
- [ ] All 7 test cases pass
- [ ] Response includes `filter` field showing which tags were applied

## Rollout Plan

1. **Deploy**: Update schema and handler in single commit
2. **Test**: Run all 7 test cases via MCP tool calls
3. **Verify**: Check that existing callers still work (backward compat)
4. **Document**: Update mental models documentation to show `tags` array usage

## Risk Assessment

**Low Risk:**
- Isolated change to mental models handler
- Backward compatible (still accepts single `tag`)
- No database or state changes
- Easy to test via direct MCP calls

**Mitigation:**
- Keep single `tag` parameter for backward compatibility
- Add comprehensive test cases before merge

---

## Related Issues

- Discovered during live testing session 2026-01-19
- Affects all callers using tag filtering (currently broken)
- No existing workaround (filtering doesn't work at all)
