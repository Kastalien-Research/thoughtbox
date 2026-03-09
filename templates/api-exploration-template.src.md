<!-- srcbook:{"language":"[LANGUAGE]"} -->

# API Exploration: [TOPIC]

**Target**: `[TOPIC]`
**Started**: [DATE]
**Status**: Exploring

---

## Exploration Checklist

- [ ] Phase 1: Identify API surface and assumptions
- [ ] Phase 2: Validate request/response shapes
- [ ] Phase 3: Test edge cases and error paths
- [ ] Phase 4: Document validated mental model
- [ ] Phase 5: Export evidence for implementation

---

# Phase 1: Assumptions Inventory

*Before writing any code, list what you THINK is true about this API:*

### Assumed Request Shapes

| Endpoint / Method | Expected Input | Expected Output | Confidence |
|-------------------|---------------|-----------------|------------|
|                   |               |                 |            |
|                   |               |                 |            |

### Assumed Behavior

1. **Auth**: How do you think auth works?
2. **Rate limits**: What are the expected constraints?
3. **Error format**: What shape do errors come in?
4. **Pagination**: How does it paginate (if applicable)?
5. **Idempotency**: Safe to retry?

### Known Unknowns

*What do you know you don't know?*

1.
2.
3.

---

# Phase 2: Shape Validation

*Test each assumption with the smallest possible code cell.*

## Cell 1: Basic Connectivity

*Can you reach the API at all? What does a minimal request look like?*

```typescript
// Minimal request — just prove connectivity and see raw response shape
// Replace with actual API call

const response = await fetch("https://api.example.com/v1/health");
console.log("Status:", response.status);
console.log("Headers:", Object.fromEntries(response.headers.entries()));
const body = await response.json();
console.log("Body shape:", JSON.stringify(body, null, 2));
```

---

## Cell 2: Primary Operation

*Test the main thing you'll actually use in production code.*

```typescript
// The primary API call your implementation depends on
// Validate: does the response match your assumed shape?

// After running, fill in:
// ACTUAL shape: { ... }
// MATCHES assumption? YES / NO / PARTIAL
// Surprises:
```

---

## Cell 3: Secondary Operation

*Test the second most important operation.*

```typescript
// Secondary API call
// Validate the response shape matches assumptions
```

---

# Phase 3: Edge Cases

*Now break it intentionally.*

## Cell 4: Error Handling

*What happens with bad input? Auth failures? Missing fields?*

```typescript
// Send malformed request — what does the error look like?
// Test: missing required field, invalid type, expired token, etc.

// ACTUAL error shape: { ... }
// Error codes seen:
// Retry-safe?
```

---

## Cell 5: Boundary Conditions

*Test limits, empty sets, large payloads, special characters.*

```typescript
// Test: empty list, max page size, unicode, null values
// What does the API do at its boundaries?

// Findings:
```

---

# Phase 4: Validated Mental Model

*Based on actual cell outputs, document what you NOW know:*

## Confirmed Facts

| Claim | Evidence (cell #) | Notes |
|-------|-------------------|-------|
|       |                   |       |
|       |                   |       |

## Refuted Assumptions

| Original Assumption | Actual Behavior | Impact on Implementation |
|---------------------|-----------------|--------------------------|
|                     |                 |                          |

## Discovered Unknowns

*Things you found during exploration that you didn't even know to ask about:*

1.
2.

## API Shape Reference

```typescript
// Paste actual TypeScript types derived from real responses
// These become your source of truth for implementation

interface ExampleResponse {
  // Fill from actual cell outputs
}
```

---

# Phase 5: Implementation Readiness

## Evidence Summary

*For each key implementation decision, cite the cell that validated it:*

1. **Auth approach**: [Validated in Cell N] — [summary]
2. **Error handling strategy**: [Validated in Cell N] — [summary]
3. **Response parsing**: [Validated in Cell N] — [summary]
4. **Edge case handling**: [Validated in Cell N] — [summary]

## Remaining Risks

*What couldn't be validated in the notebook? What needs production testing?*

1.
2.

## Ready to Implement?

- [ ] All primary operations validated with real responses
- [ ] Error shapes documented from actual errors
- [ ] At least one edge case tested per operation
- [ ] TypeScript types derived from real data (not docs)
- [ ] No unresolved blocking unknowns

If all boxes checked: **Exploration complete — proceed to implementation**
