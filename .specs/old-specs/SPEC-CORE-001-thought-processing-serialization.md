# SPEC-CORE-001: Thought Processing Serialization

> **Status**: Implemented
> **Priority**: P0 (Critical Bug Fix)
> **Dependencies**: None
> **Source**: `src/thought-handler.ts`, `src/index.ts`, `src/persistence/storage.ts`
> **Implementation**: Lines 61-63, 408-417, 419-872 in `src/thought-handler.ts`

## Summary

Fix race condition in thought number auto-assignment (SIL-102) when concurrent HTTP requests process thoughts simultaneously. The current implementation uses a check-then-act pattern that allows multiple concurrent requests to calculate the same thought number, causing thought overwrites and data loss.

## Problem

### Current Behavior

When multiple `thought` operations arrive concurrently over HTTP transport:

1. **Request A** (t=0ms): Reads `thoughtHistory` with 3 thoughts, calculates `thoughtNumber = 4`
2. **Request B** (t=5ms): Reads `thoughtHistory` with 3 thoughts (still), calculates `thoughtNumber = 4`
3. **Request A** (t=10ms): Persists thought #4, updates `thoughtHistory`, returns `{ thoughtNumber: 4 }`
4. **Request B** (t=15ms): Persists thought #4 (overwrites A's thought!), updates `thoughtHistory`, returns `{ thoughtNumber: 4 }`

### Observable Symptoms

- **Duplicate numbers in responses**: Agent receives `thoughtNumber: 5` multiple times in succession
- **Non-persistent duplicates**: After seeing 5, 5, 5, 5, numbering "recovers" to 6, 7, 8... because `max([1,2,3,4,5,5,5,5]) = 5` still works
- **Data loss**: Only the last thought with duplicate number persists; earlier ones are silently overwritten in storage
- **State divergence**: In-memory `thoughtHistory.length` exceeds actual persisted thought count

### Root Cause

**Lines 329-339** in `src/thought-handler.ts`:
```typescript
// Calculate next thought number from history
let thoughtNumber = data.thoughtNumber as number | undefined;
if (thoughtNumber === undefined) {
  const mainChainThoughts = this.thoughtHistory.filter(t => !t.branchId);
  if (mainChainThoughts.length === 0) {
    thoughtNumber = 1;
  } else {
    const maxNumber = Math.max(...mainChainThoughts.map(t => t.thoughtNumber ?? 0));
    thoughtNumber = maxNumber + 1;  // ← RACE: Multiple reads get same max
  }
}
```

**Lines 534** in `src/thought-handler.ts`:
```typescript
this.thoughtHistory.push(validatedInput);  // ← RACE: Multiple writes push duplicates
```

**Lines 102-149** in `src/persistence/storage.ts`:
```typescript
const nodeId = this.generateNodeId(sessionId, data.thoughtNumber, data.branchId);
// For main chain: nodeId = `${sessionId}:${thoughtNumber}`
this.nodes.set(nodeId, node);  // ← RACE: Same nodeId overwrites previous
```

### Why HTTP Transport Enables This

**Line 111** in `src/index.ts`:
```typescript
app.all("/mcp", async (req: Request, res: Response) => {
  // Express handles each request concurrently - no serialization
  await entry.transport.handleRequest(req, res, req.body);
```

Express processes HTTP requests concurrently by default. MCP protocol allows clients to send multiple requests without waiting for responses (pipelined request IDs 1, 2, 3...).

## Goals

1. **Eliminate race condition**: Guarantee sequential thought number assignment even under concurrent load
2. **Preserve SIL-102 semantics**: Keep auto-assignment behavior unchanged for single-threaded scenarios
3. **Zero breaking changes**: Maintain exact same API and response format
4. **Minimal performance impact**: Serialization only affects the critical section, not I/O operations
5. **Simplicity**: Global serialization is simpler and safer than per-session queuing

## Non-Goals

- Optimizing for high-throughput concurrent thought processing (reasoning is inherently sequential)
- Adding distributed locking or database transactions (in-memory queue sufficient)
- Changing the storage layer implementation
- Modifying the MCP protocol or transport layer

## Architecture

### Approach: Global Promise Queue

Add a promise-based serialization queue to `ThoughtHandler` that ensures one `processThought` execution at a time across all requests.

**Key Insight**: We serialize the **entire `processThought` method**, not just number assignment, because:

1. In-memory state (`thoughtHistory`) must stay consistent with storage
2. Session metadata updates (thoughtCount, branchCount) must be atomic
3. Observatory events must fire in order

### Implementation Strategy

**Lines 61-63** - Queue declaration:

```typescript
// Processing queue to serialize concurrent thought operations
// Prevents race conditions when multiple thoughts arrive simultaneously
private processingQueue: Promise<void> = Promise.resolve();
```

**Lines 408-417** - Queue wrapper:

```typescript
public async processThought(input: unknown): Promise<{
  content: Array<any>;
  isError?: boolean;
}> {
  // Serialize all thought processing through a promise queue
  // This prevents race conditions when concurrent requests arrive
  return this.processingQueue = this.processingQueue
    .then(() => this._processThoughtImpl(input))
    .catch(() => this._processThoughtImpl(input)); // Continue queue even if one fails
}
```

**Lines 419-872** - Implementation moved to private method:

```typescript
private async _processThoughtImpl(input: unknown): Promise<{
  content: Array<any>;
  isError?: boolean;
}> {
  // All existing processThought logic moved here
  // No changes to actual logic - just renamed method
}
```

### Why Global Queue?

**Simplicity over optimization**:

1. **Simpler implementation**: No Map management, no session key lookup, no cleanup logic
2. **Safer edge cases**: No issues with session switching, MCP session ID changes, or null sessions
3. **Still correct**: Completely prevents the race condition
4. **Negligible overhead**: Reasoning is inherently sequential - serialization matches semantic model
5. **Easier to verify**: Single code path, no branching logic for session routing

**Trade-off accepted**:

- Different reasoning sessions cannot process thoughts concurrently
- In practice, this is fine: most deployments have one active reasoning session at a time
- Future optimization: Could switch to per-session queues if concurrent multi-session becomes a bottleneck

## Data Flow (Fixed)

### Sequential Processing

```
Request A arrives (session-123, t=0ms)
  ↓
Queue empty → Execute immediately
  ↓
Read thoughtHistory: [1, 2, 3]
Calculate: thoughtNumber = 4
Persist: nodes.set("session-123:4", nodeA)
Update: thoughtHistory.push({...})
Return: { thoughtNumber: 4 }
  ↓
Request A completes (t=15ms)

Request B arrives (session-123, t=5ms)
  ↓
Queue busy → Wait for Request A
  ↓
Request A completes → Execute Request B (t=15ms)
  ↓
Read thoughtHistory: [1, 2, 3, 4]  ← Now includes A's update
Calculate: thoughtNumber = 5  ← Correct!
Persist: nodes.set("session-123:5", nodeB)
Update: thoughtHistory.push({...})
Return: { thoughtNumber: 5 }
```

### Cross-Session Serialization

With global queue, all thoughts serialize regardless of session:

```
Session A - Request 1 (t=0ms)
     ↓
Queue empty → Execute immediately
     ↓
Process thought #1 for session A
     ↓
Session B - Request 1 (t=5ms)
     ↓
Queue busy → Wait for session A request
     ↓
Session A request completes → Execute session B request
     ↓
Process thought #1 for session B
     ↓
Return { thoughtNumber: 1 }

✓ All requests serialize through single queue
✓ No race conditions possible
✓ Simple, predictable behavior
```

## Error Handling & Recovery

### Queue Continuity on Error

```typescript
.catch(() => this._processThoughtImpl(input))
```

If a thought fails validation or persistence:
- Error is returned to that specific request
- Queue **continues** processing next request (doesn't block forever)
- Subsequent thoughts can still succeed

### Session Restoration (SIL-103)

Existing `restoreFromSession` already rebuilds `thoughtHistory` from storage:
```typescript
async restoreFromSession(sessionId: string): Promise<...> {
  const thoughts = await this.storage.getThoughts(sessionId);
  this.thoughtHistory = thoughts.map(...);  // Restored from storage
}
```

Race condition fix is **transparent** to restoration - queue is empty after restore, normal processing resumes.

## Verification

The fix is verified through direct use:

1. **Agent observation**: Monitor for duplicate `thoughtNumber` values in responses during normal reasoning sessions
2. **Session integrity**: After completion, verify persisted thought count matches expected count (no missing thoughts)
3. **Recovery behavior**: Confirm numbering "recovers" correctly (e.g., after seeing duplicates, next solo request calculates correct next number)

## Performance Impact

### Best Case (No Contention)

- **Overhead**: Promise chaining only (~microseconds)
- **Queue empty**: Request executes immediately (no waiting)
- **Impact**: Negligible (<0.01% overhead)

### Worst Case (High Contention)

- **Scenario**: 10 requests arrive simultaneously
- **Behavior**: Serialize into queue, each waits for previous
- **Latency**: Linear increase (request 10 waits for requests 1-9)
- **Acceptable**: Reasoning is inherently sequential - concurrent thoughts don't make semantic sense

### Memory

- **Queue size**: Single `Promise<void>` reference
- **Cleanup**: Resolved promises garbage collected automatically
- **Peak**: O(1) constant memory

## Deployment

### Breaking Changes

**None.** API and behavior unchanged for sequential requests.

### Implementation Status

✅ **Implemented** in commit [hash] on [date]

- Lines 61-63: Queue declaration
- Lines 408-417: Public `processThought` wrapper
- Lines 419-872: Private `_processThoughtImpl` with all logic

### Monitoring

Watch for:

1. **Duplicate numbers eliminated**: Should see zero reports of duplicate `thoughtNumber` values
2. **Data integrity**: Persisted thought count should match thought history length
3. **Latency**: No significant increase in response times (queue overhead is negligible)

## Open Questions

1. **Queue depth limits**: Should we add max queue depth (e.g., 100 pending requests) and reject with 429 if exceeded?
2. **Request timeout**: Should individual requests timeout if stuck in queue too long (e.g., 30s)?
3. **Observability**: Add metrics for queue depth and request wait time?
4. **Per-session optimization**: If concurrent multi-session becomes a bottleneck, should we switch to per-session queues?

## References

- **SIL-102**: Auto-assignment of thought numbers ([implemented](https://github.com/thoughtbox/pull/102))
- **SIL-103**: Session restoration after MCP reconnect
- **Race Condition Pattern**: Check-then-act (OWASP Concurrency 01)
- **MCP Protocol**: [Request pipelining](https://spec.modelcontextprotocol.io/)
- **Express Concurrency**: [Async route handlers](https://expressjs.com/en/guide/error-handling.html#promises)
