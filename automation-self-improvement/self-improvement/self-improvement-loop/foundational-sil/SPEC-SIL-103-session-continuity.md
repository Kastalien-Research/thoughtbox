# SPEC-SIL-103: Session Continuity

> **Status**: Draft
> **Priority**: CRITICAL (First Iteration Bootstrap)
> **Week**: 0 (Pre-SIL)
> **Phase**: Reliability
> **Estimated Effort**: 2-3 hours
> **Source**: 200-thought exploration S96-97, S152, S161-164, S192

## Summary

When `init` → `load_context` specifies an existing session, fully restore ThoughtHandler state including `thoughtHistory`, `currentThoughtNumber`, and `branches`. Fixes the MCP session split bug where reconnection loses thought continuity.

## Problem Statement

Currently, when MCP connection resets:
1. New MCP session created
2. New ThoughtHandler instantiated with empty state
3. `load_context` returns session metadata but doesn't restore handler state
4. Agent's next thought starts from #1 again
5. Thoughts split across two sessions

Experienced directly during 200-thought exploration (S96):
> "New session created (d0bd4ea5) despite loading existing context. This is MCP session split in action."

With session continuity:
- `load_context` fully restores handler state
- `currentThoughtNumber` = max(existing) + 1
- New thoughts link to existing chain
- Session reconnection is seamless

## Scope

### In Scope
- Restore `thoughtHistory` from stored session
- Restore `currentThoughtNumber` to continue sequence
- Restore `branches` map
- Restore session metadata (title, tags)

### Out of Scope
- MCP-level session persistence (client responsibility)
- Cross-server session migration
- Session merge (combining split sessions)

## Requirements

### R1: State Restoration Method

```typescript
// In ThoughtHandler
interface RestoredState {
  thoughtHistory: ThoughtData[];
  currentThoughtNumber: number;
  branches: Record<string, BranchData>;
  sessionId: string;
  sessionMetadata: SessionMetadata;
}

async restoreFromSession(sessionId: string): Promise<RestoredState> {
  // Load all thoughts from storage
  // Rebuild internal state
  // Return restored state for confirmation
}
```

### R2: InitHandler Integration

When `load_context` is called with existing session:

```typescript
// In InitHandler.handleLoadContext
if (existingSession) {
  // Restore thought handler state
  await this.thoughtHandler.restoreFromSession(sessionId);
}
```

### R3: Thought Number Continuity

After restoration:
- `currentThoughtNumber` = max number in restored thoughts
- Next thought assigned = `currentThoughtNumber + 1`
- No gaps in sequence

### R4: Storage Requirements

Storage must support:
- Loading all thoughts for a session: `getLinkedList(sessionId)`
- Loading session metadata: `getSession(sessionId)`
- Already exists in FileSystemStorage

## Technical Approach

### Task 1: Add restoreFromSession to ThoughtHandler

```typescript
// src/thought-handler.ts

async restoreFromSession(sessionId: string): Promise<void> {
  // 1. Load session from storage
  const session = await this.storage.getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // 2. Load all thoughts
  const linkedList = await this.storage.getLinkedList(sessionId);
  const thoughts = linkedList.nodes;

  // 3. Restore thought history
  this.thoughtHistory = thoughts.map(node => ({
    thought: node.thought,
    thoughtNumber: node.thoughtNumber,
    branchId: node.branchId,
    branchFromThought: node.branchFromThought,
    isRevision: node.isRevision,
    revisesThought: node.revisesThought,
    timestamp: node.timestamp
  }));

  // 4. Restore current thought number
  this.currentThoughtNumber = Math.max(
    0,
    ...thoughts.map(t => t.thoughtNumber)
  );

  // 5. Restore branches
  this.branches = {};
  for (const thought of thoughts) {
    if (thought.branchId && !this.branches[thought.branchId]) {
      this.branches[thought.branchId] = {
        branchId: thought.branchId,
        branchFromThought: thought.branchFromThought || 0,
        firstThought: thought.thoughtNumber
      };
    }
  }

  // 6. Set session ID
  this.currentSessionId = sessionId;

  // 7. Log restoration
  console.log(`Restored session ${sessionId}: ${thoughts.length} thoughts, current #${this.currentThoughtNumber}`);
}
```

### Task 2: Update InitHandler.handleLoadContext

```typescript
// src/init/tool-handler.ts

async handleLoadContext(args: LoadContextArgs): Promise<InitResult> {
  const { sessionId } = args;

  // Existing: Load session metadata
  const session = await this.storage.getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // NEW: Restore thought handler state
  if (this.thoughtHandler) {
    await this.thoughtHandler.restoreFromSession(sessionId);
  }

  // Existing: Update state manager, return context
  this.stateManager.setActiveSession(sessionId);

  return {
    success: true,
    sessionId,
    thoughtCount: session.thoughtCount,
    restored: true  // New flag indicating state was restored
  };
}
```

### Task 3: Ensure ThoughtHandler Access

InitHandler needs reference to ThoughtHandler. If not already available, add during server setup:

```typescript
// src/index.ts or server setup

const thoughtHandler = new ThoughtHandler(storage);
const initHandler = new InitHandler(storage, stateManager, thoughtHandler);
```

### Task 4: Verification Response

Include restoration confirmation in load_context response:

```typescript
// Updated response format
{
  "success": true,
  "sessionId": "abc123",
  "restored": {
    "thoughtCount": 84,
    "currentThoughtNumber": 84,
    "branchCount": 3,
    "message": "Session state fully restored. Next thought will be #85."
  }
}
```

## Files

### Modified Files
| File | Changes |
|------|---------|
| `src/thought-handler.ts` | Add `restoreFromSession()` method |
| `src/init/tool-handler.ts` | Call `restoreFromSession()` in `handleLoadContext()` |
| `src/index.ts` | Ensure InitHandler has ThoughtHandler reference |

### New Files
None

## Acceptance Criteria

- [ ] `load_context` with existing session restores thought history
- [ ] `currentThoughtNumber` continues from last thought
- [ ] New thoughts link properly to restored chain
- [ ] Branches are restored correctly
- [ ] Session metadata (title, tags) preserved
- [ ] Works across MCP reconnection

## Test Cases

```typescript
describe('Session Continuity', () => {
  it('restores thought number after reconnect', async () => {
    // Create session with 10 thoughts
    await initSession('test-session');
    for (let i = 1; i <= 10; i++) {
      await addThought(`Thought ${i}`);
    }

    // Simulate reconnection (new ThoughtHandler)
    const newHandler = new ThoughtHandler(storage);
    await newHandler.restoreFromSession('test-session');

    // Next thought should be #11
    const response = await newHandler.addThought({
      thought: 'After reconnect',
      totalThoughts: 20,
      nextThoughtNeeded: true
    });

    expect(response.thoughtNumber).toBe(11);
  });

  it('restores branches', async () => {
    // Create session with branch
    await initSession('branch-test');
    await addThought('Main thought 1');
    await addThought('Main thought 2');
    await addThought('Branch thought', { branchFromThought: 2, branchId: 'alt' });

    // Reconnect
    const newHandler = new ThoughtHandler(storage);
    await newHandler.restoreFromSession('branch-test');

    expect(newHandler.branches).toHaveProperty('alt');
    expect(newHandler.branches['alt'].branchFromThought).toBe(2);
  });

  it('links new thoughts to existing chain', async () => {
    // Create and restore
    await initSession('chain-test');
    await addThought('Thought 1');
    await addThought('Thought 2');

    const newHandler = new ThoughtHandler(storage);
    await newHandler.restoreFromSession('chain-test');
    await newHandler.addThought({
      thought: 'Thought 3',
      totalThoughts: 10,
      nextThoughtNeeded: true
    });

    // Export and verify chain
    const exported = await storage.exportSession('chain-test', 'linked');
    expect(exported.mainChain[2].prev).toBe(2);  // Links to thought 2
  });
});
```

## Gates

### Entry Gate
- Storage has session data
- ThoughtHandler instantiable
- SPEC-SIL-100 baseline established

### Exit Gate
- MCP reconnection preserves continuity
- No thought number gaps after restore
- Behavioral tests pass

## Dependencies

- SPEC-SIL-100 (Benchmark Harness)
- SPEC-SIL-102 (Server-Assigned Numbers) - synergy: server assigns, so restore just needs max

## Blocked By

- SPEC-SIL-100

## Blocks

- Long reasoning sessions (makes them reliable)
- Multi-session workflows

## Real-World Impact

This spec directly addresses the bug experienced during 200-thought exploration:

**Before**:
```
Thought 1-84 in session A
MCP reconnects
Thought 1 (should be 85) in session B  ← WRONG
```

**After**:
```
Thought 1-84 in session A
MCP reconnects
load_context → restores state
Thought 85 in session A  ← CORRECT
```

---

**Created**: 2026-01-20
**Source**: 200-thought exploration S96-97 (session split bug), S152 (session continuity cluster), S161-164 (implementation sketch), S192 (pain point)
