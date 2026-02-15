# SPEC-SIL-102: Server-Assigned Thought Numbers

> **Status**: Draft
> **Priority**: CRITICAL (First Iteration Bootstrap)
> **Week**: 0 (Pre-SIL)
> **Phase**: Multi-Agent Enabler
> **Estimated Effort**: 1-2 hours
> **Source**: 200-thought exploration S99-100, S155, S187

## Summary

Make `thoughtNumber` optional in thought tool input. When omitted, server assigns the next number automatically. Simplifies agent interface and enables parallel-safe multi-agent writes.

## Problem Statement

Currently, agent must:
1. Track `currentThoughtNumber` locally
2. Increment for each thought
3. Specify `thoughtNumber` in every call
4. Risk race conditions with other agents

This is problematic:
- Agent burden: tedious tracking requirement
- Session split: number resets when MCP session changes (S96)
- Race conditions: two agents might assign same number (S99)
- Errors: agent might miscalculate number

With server-assigned numbers:
- Agent just sends thought content
- Server assigns authoritative number
- No race conditions—server is single source of truth
- Session continuity simpler—server maintains state

## Scope

### In Scope
- Make `thoughtNumber` optional in schema
- Server assigns next number when omitted
- Return assigned number in response
- Maintain backward compatibility (explicit number still works)

### Out of Scope
- Full parallel-safe locking (future enhancement)
- Distributed number assignment
- Number reservation system

### Concurrency Note

While JavaScript is single-threaded, async/await can interleave operations. In rare cases with rapid parallel requests, two thoughts could read the same `currentThoughtNumber` before either writes.

**Current scope**: This implementation handles typical single-agent use cases reliably. The single-threaded nature of Node.js event loop provides natural serialization for most scenarios.

**Multi-agent scenarios**: When multiple agents write to the same session concurrently, they should either:
1. Use explicit `thoughtNumber` to avoid races, or
2. Accept that the server will assign unique numbers (no collisions) but order may vary

True parallel-safe locking with distributed consensus is deferred to a future enhancement.

## Requirements

### R1: Schema Change

```typescript
// In server-factory.ts thought tool schema
{
  type: "object",
  properties: {
    thought: { type: "string" },
    thoughtNumber: {
      type: "number",
      description: "Optional. If omitted, server assigns next number automatically."
    },
    totalThoughts: { type: "number" },
    nextThoughtNeeded: { type: "boolean" },
    // ... other fields
  },
  required: ["thought", "totalThoughts", "nextThoughtNeeded"]
  // Note: thoughtNumber removed from required
}
```

### R2: Server Assignment Logic

```typescript
// In thought-handler.ts
const assignedThoughtNumber = validatedInput.thoughtNumber
  ?? (this.currentThoughtNumber + 1);

this.currentThoughtNumber = assignedThoughtNumber;
```

### R3: Response Always Includes Number

Whether agent specified number or server assigned it, response always includes `thoughtNumber`:

```typescript
{
  thoughtNumber: assignedThoughtNumber,  // Always present
  sessionId: this.currentSessionId
}
```

### R4: Validation When Explicit

If agent provides `thoughtNumber`, validate it makes sense:
- Must be > 0
- Should not skip numbers (warning, not error)
- Should not reuse numbers (error)

## Technical Approach

### Task 1: Update JSON Schema

In `server-factory.ts`, remove `thoughtNumber` from required array:

```typescript
// Around line 175
required: ["thought", "totalThoughts", "nextThoughtNeeded"]
// Note: thoughtNumber is now optional
```

Update description:

```typescript
thoughtNumber: {
  type: "number",
  description: "Thought sequence number. Optional - if omitted, server assigns next number automatically. Useful for multi-agent scenarios."
}
```

### Task 2: Update Zod Schema

```typescript
// Around line 400
const ThoughtInputSchema = z.object({
  thought: z.string(),
  thoughtNumber: z.number().optional(),  // Now optional
  totalThoughts: z.number(),
  nextThoughtNeeded: z.boolean(),
  // ... other fields
});
```

### Task 3: Update Handler Logic

In `thought-handler.ts`:

```typescript
// Around line 200, in processThought

// Assign number: use provided or auto-assign
const providedNumber = validatedInput.thoughtNumber;
const autoNumber = this.currentThoughtNumber + 1;
const assignedNumber = providedNumber ?? autoNumber;

// Validate if provided
if (providedNumber !== undefined) {
  if (providedNumber <= 0) {
    throw new Error('thoughtNumber must be positive');
  }
  if (providedNumber !== autoNumber) {
    // Log warning but allow (might be resuming session)
    console.warn(`Thought number mismatch: expected ${autoNumber}, got ${providedNumber}`);
  }
}

// Update internal state
this.currentThoughtNumber = assignedNumber;

// Continue with thought processing...
```

### Task 4: Ensure Response Includes Number

Response always includes assigned number so agent knows what was used:

```typescript
// In response construction
{
  thoughtNumber: assignedNumber,
  sessionId: this.currentSessionId
}
```

## Files

### Modified Files
| File | Changes |
|------|---------|
| `src/server-factory.ts` | Remove `thoughtNumber` from required, update description |
| `src/thought-handler.ts` | Auto-assign when not provided, validation |

### New Files
None

## Acceptance Criteria

- [ ] `thoughtNumber` is optional in schema
- [ ] Omitting `thoughtNumber` results in server assignment
- [ ] Assigned number is sequential (current + 1)
- [ ] Response always includes assigned number
- [ ] Explicit `thoughtNumber` still works (backward compatible)
- [ ] Invalid explicit numbers are rejected

## Test Cases

```typescript
describe('Server-Assigned Thought Numbers', () => {
  it('assigns number when omitted', async () => {
    // First thought
    const response1 = await callThoughtTool({
      thought: 'First thought',
      totalThoughts: 5,
      nextThoughtNeeded: true
      // Note: no thoughtNumber
    });

    expect(JSON.parse(response1).thoughtNumber).toBe(1);

    // Second thought
    const response2 = await callThoughtTool({
      thought: 'Second thought',
      totalThoughts: 5,
      nextThoughtNeeded: true
    });

    expect(JSON.parse(response2).thoughtNumber).toBe(2);
  });

  it('accepts explicit number', async () => {
    const response = await callThoughtTool({
      thought: 'Explicit number',
      thoughtNumber: 42,
      totalThoughts: 100,
      nextThoughtNeeded: true
    });

    expect(JSON.parse(response).thoughtNumber).toBe(42);
  });

  it('rejects invalid explicit number', async () => {
    await expect(callThoughtTool({
      thought: 'Bad number',
      thoughtNumber: -1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    })).rejects.toThrow('thoughtNumber must be positive');
  });

  it('handles concurrent requests safely', async () => {
    // Two parallel calls without explicit numbers
    const [response1, response2] = await Promise.all([
      callThoughtTool({ thought: 'A', totalThoughts: 10, nextThoughtNeeded: true }),
      callThoughtTool({ thought: 'B', totalThoughts: 10, nextThoughtNeeded: true })
    ]);

    const num1 = JSON.parse(response1).thoughtNumber;
    const num2 = JSON.parse(response2).thoughtNumber;

    // Numbers should be different (no collision)
    expect(num1).not.toBe(num2);
  });
});
```

## Gates

### Entry Gate
- Thought tool working
- SPEC-SIL-100 baseline established

### Exit Gate
- All behavioral tests pass
- Backward compatibility verified
- Concurrent access doesn't collide

## Dependencies

- SPEC-SIL-100 (Benchmark Harness)

## Blocked By

- SPEC-SIL-100

## Blocks

- Multi-agent workflows (enables safe parallel writes)
- SPEC-SIL-103 (Session Continuity - simpler with server-assigned numbers)

## Multi-Agent Impact

This change is foundational for multi-agent scenarios:

```
Before:
  Agent A: thought #5 → stored as #5
  Agent B: thought #5 → ERROR or overwrites A's thought

After:
  Agent A: thought (no number) → server assigns #5
  Agent B: thought (no number) → server assigns #6
  No collision, both thoughts preserved
```

---

**Created**: 2026-01-20
**Source**: 200-thought exploration S99-100 (parallel-safe writes), S155 (multi-agent cluster), S187 (first iteration recommendation)
