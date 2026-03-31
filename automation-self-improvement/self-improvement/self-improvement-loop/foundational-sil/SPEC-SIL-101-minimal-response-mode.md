# SPEC-SIL-101: Minimal Response Mode

> **Status**: Draft
> **Priority**: CRITICAL (First Iteration Bootstrap)
> **Week**: 0 (Pre-SIL)
> **Phase**: Token Efficiency
> **Estimated Effort**: 1-2 hours
> **Source**: 200-thought exploration S17, S153, S159-160

## Summary

Add `verbose` flag to thought tool that defaults to false. When false, response returns only essential IDs instead of echoing full content. Reduces token consumption on every thought call.

## Problem Statement

Currently, every `thought` tool call returns:
- Full thought content (already known to agent)
- Full session context
- Full branch information
- History length

This wastes tokens:
- Agent just wrote the thought content—doesn't need it echoed back
- Context bloats response, consumes agent's context window
- Long reasoning sessions become impractical due to accumulated overhead

With minimal response:
- Response contains only: `{thoughtNumber, sessionId}`
- Agent can request details when needed via `read_thoughts`
- Token savings compound across session
- Enables longer reasoning chains

## Scope

### In Scope
- Add `verbose?: boolean` parameter to thought tool schema
- Default `verbose` to `false`
- Return minimal response when `!verbose`
- Return full response when `verbose: true`

### Out of Scope
- Changing other tools (notebook, session, etc.)
- Response compression beyond field removal
- Lazy loading of response fields

## Requirements

### R1: Schema Change

```typescript
// In server-factory.ts thought tool schema
{
  type: "object",
  properties: {
    thought: { type: "string" },
    thoughtNumber: { type: "number" },
    totalThoughts: { type: "number" },
    nextThoughtNeeded: { type: "boolean" },
    // ... existing fields ...
    verbose: {
      type: "boolean",
      description: "If true, return full response with content and context. If false (default), return only {thoughtNumber, sessionId}."
    }
  },
  required: ["thought", "thoughtNumber", "totalThoughts", "nextThoughtNeeded"]
}
```

### R2: Minimal Response Format

When `verbose` is false or omitted:

```typescript
interface MinimalThoughtResponse {
  thoughtNumber: number;
  sessionId: string;
}
```

### R3: Full Response Format (unchanged)

When `verbose: true`:

```typescript
interface FullThoughtResponse {
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  branches: string[];
  thoughtHistoryLength: number;
  sessionId: string | null;
  sessionClosed?: boolean;
  closedSessionId?: string;
  exportPath?: string;
}
```

### R4: Response Size Reduction

Target: >80% reduction in response size for typical thought calls.

| Field | Bytes (typical) | Keep in Minimal |
|-------|-----------------|-----------------|
| thoughtNumber | 2-4 | Yes |
| sessionId | 36 | Yes |
| totalThoughts | 3-4 | No |
| nextThoughtNeeded | 4-5 | No |
| branches | 0-200 | No |
| thoughtHistoryLength | 2-4 | No |
| **Total** | ~50-250 | ~40 |

## Technical Approach

### Task 1: Update Schema

In `server-factory.ts`, add `verbose` to thought tool schema:

```typescript
// Around line 170 in thought tool definition
verbose: {
  type: "boolean",
  description: "Return full response (true) or minimal {thoughtNumber, sessionId} (false, default)"
}
```

### Task 2: Update Zod Validation

In `server-factory.ts`, update Zod schema:

```typescript
// Around line 400
const ThoughtInputSchema = z.object({
  thought: z.string(),
  thoughtNumber: z.number(),
  totalThoughts: z.number(),
  nextThoughtNeeded: z.boolean(),
  // ... existing fields ...
  verbose: z.boolean().optional().default(false)
});
```

### Task 3: Update Response Logic

In `thought-handler.ts`, modify response construction:

```typescript
// Around line 380, after processing thought

const response = validatedInput.verbose
  ? {
      thoughtNumber: newThoughtCount,
      totalThoughts: this.totalThoughts,
      nextThoughtNeeded: validatedInput.nextThoughtNeeded,
      branches: Object.keys(this.branches),
      thoughtHistoryLength: this.thoughtHistory.length,
      sessionId: this.currentSessionId,
      ...(sessionClosed && {
        sessionClosed: true,
        closedSessionId: closedSessionId,
        exportPath: exportPath
      })
    }
  : {
      thoughtNumber: newThoughtCount,
      sessionId: this.currentSessionId
    };

return {
  content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
};
```

## Files

### Modified Files
| File | Changes |
|------|---------|
| `src/server-factory.ts` | Add `verbose` to JSON schema (~line 170) and Zod schema (~line 400) |
| `src/thought-handler.ts` | Conditional response based on `verbose` flag (~line 380) |

### New Files
None

## Acceptance Criteria

- [ ] `verbose` parameter accepted by thought tool
- [ ] Default behavior (omit `verbose`) returns minimal response
- [ ] `verbose: true` returns full response (backward compatible)
- [ ] `verbose: false` returns `{thoughtNumber, sessionId}` only
- [ ] Behavioral tests pass with both modes
- [ ] Response size measurably reduced (>80%)

## Test Cases

```typescript
describe('Minimal Response Mode', () => {
  it('returns minimal response by default', async () => {
    const response = await callThoughtTool({
      thought: 'Test thought',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    });

    const parsed = JSON.parse(response);
    expect(Object.keys(parsed)).toEqual(['thoughtNumber', 'sessionId']);
  });

  it('returns full response when verbose: true', async () => {
    const response = await callThoughtTool({
      thought: 'Test thought',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      verbose: true
    });

    const parsed = JSON.parse(response);
    expect(parsed).toHaveProperty('branches');
    expect(parsed).toHaveProperty('thoughtHistoryLength');
  });

  it('measures response size reduction', async () => {
    const minimalResponse = await callThoughtTool({
      thought: 'Test thought',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      verbose: false
    });

    const fullResponse = await callThoughtTool({
      thought: 'Test thought',
      thoughtNumber: 2,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      verbose: true
    });

    const reduction = 1 - (minimalResponse.length / fullResponse.length);
    expect(reduction).toBeGreaterThan(0.5);  // At least 50% smaller
  });
});
```

## Gates

### Entry Gate
- Thought tool working
- SPEC-SIL-100 baseline established

### Exit Gate
- All behavioral tests pass
- Response size reduction verified via benchmark
- No regression in thought processing logic

## Dependencies

- SPEC-SIL-100 (Benchmark Harness) - to measure improvement

## Blocked By

- SPEC-SIL-100

## Blocks

- None (independent improvement)

## Metrics

**Before**: Typical thought response ~150-250 bytes
**After**: Minimal thought response ~40-50 bytes
**Reduction**: ~70-80%

**Token Impact**: For 200-thought session:
- Before: ~40,000-50,000 response tokens
- After: ~8,000-10,000 response tokens
- Savings: ~32,000-40,000 tokens (~80%)

---

**Created**: 2026-01-20
**Source**: 200-thought exploration S17 (minimal response target), S153 (token efficiency cluster), S159-160 (first iteration recommendation)
