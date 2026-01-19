# SPEC-SRC-006: Session Recovery via MCP Root

> **Status**: Draft
> **Priority**: P0 (Critical - fixes data loss during long reasoning)
> **Dependencies**: None
> **Source**: 2026-01-17 incident where 67 thoughts were lost due to MCP client session timeout

## Summary

Automatically recover the most recent thoughtbox session based on MCP root (project directory), eliminating dependency on agent memory for session continuity.

## Motivation

During extended agent reasoning (e.g., 200-thought exploration), Claude Code's MCP client creates new sessions approximately every 15 minutes. When this happens:

1. Agent context may be compacted/lost
2. MCP session ID changes
3. Agent cannot reliably remember which thoughtbox session to resume
4. Thoughts from previous MCP session become orphaned

**Current behavior**: `init` → `load_context` requires the agent to provide a session ID.

**Problem**: Agent can't reliably remember session IDs across MCP session boundaries.

**Solution**: Use MCP root (project directory) as stable identifier. Automatically find most recent session for that root.

## Design

### MCP Root as Project Identifier

MCP roots are stable across:
- Claude Code session restarts
- Agent memory compaction
- MCP client session timeouts
- Multiple agent conversations about same project

```typescript
// MCP root example
{
  uri: "file:///Users/dev/my-project",
  name: "my-project"
}
```

### Session Storage Schema Change

Add `mcpRootUri` to session metadata:

```typescript
interface SessionMetadata {
  id: string;
  title: string;
  tags: string[];
  thoughtCount: number;
  branchCount: number;
  createdAt: string;
  updatedAt: string;
  // NEW: Link to MCP root
  mcpRootUri?: string;  // e.g., "file:///Users/dev/my-project"
}
```

### Modified `load_context` Behavior

When `init` → `load_context` is called:

```typescript
// Current: requires sessionId
{ operation: "load_context", sessionId: "abc-123" }

// New: sessionId optional, falls back to MCP root lookup
{ operation: "load_context" }  // Auto-find most recent for current root
{ operation: "load_context", sessionId: "abc-123" }  // Explicit still works
```

### Auto-Discovery Algorithm

```typescript
async function findSessionForRoot(mcpRootUri: string): Promise<Session | null> {
  // 1. Get all sessions with matching mcpRootUri
  const sessions = await storage.listSessions({ mcpRootUri });

  if (sessions.length === 0) {
    return null;  // No sessions for this project
  }

  // 2. Sort by updatedAt descending (most recent first)
  sessions.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // 3. Return most recent
  return sessions[0];
}
```

### Init Handler Changes

```typescript
// In handleLoadContext():

async function handleLoadContext(params: LoadContextParams) {
  const { sessionId, mcpRootUri } = params;

  let session: Session | null = null;

  if (sessionId) {
    // Explicit session ID provided - use it
    session = await storage.getSession(sessionId);
  } else if (mcpRootUri) {
    // No session ID - find most recent for this root
    session = await findSessionForRoot(mcpRootUri);

    if (session) {
      console.log(`[Init] Auto-recovered session ${session.id} for root ${mcpRootUri}`);
    }
  }

  if (!session) {
    return {
      success: false,
      message: sessionId
        ? `Session ${sessionId} not found`
        : `No sessions found for project. Use start_new to begin.`
    };
  }

  // Load session and restore state...
  return loadSession(session);
}
```

### Binding MCP Root on Session Creation

When `init` → `start_new` creates a session:

```typescript
async function handleStartNew(params: StartNewParams) {
  const { mcpRootUri, title, domain } = params;

  const session = await storage.createSession({
    title: title || `Session ${Date.now()}`,
    mcpRootUri,  // Capture the root at creation time
    // ... other fields
  });

  return session;
}
```

### Client-Side: Passing MCP Root

The init tool already receives MCP roots via `list_roots`. Pass the bound root to operations:

```typescript
// After bind_root operation succeeds:
state.boundRoot = selectedRoot.uri;

// Include in subsequent operations:
{ operation: "start_new", mcpRootUri: state.boundRoot, ... }
{ operation: "load_context", mcpRootUri: state.boundRoot }
```

## User Experience

### Before (Fragile)

```
Agent: "I'll continue with session abc-123..."
[MCP session timeout, agent memory compacted]
Agent: "Let me start a new session..."
[Previous 67 thoughts orphaned]
```

### After (Robust)

```
Agent: "Let me load the context for this project..."
[Calls init → load_context with no sessionId]
Server: "Auto-recovered session abc-123 (47 thoughts, last updated 2 min ago)"
Agent: "Continuing where we left off at thought 47..."
```

## Edge Cases

### Multiple Active Sessions for Same Root

If a project has multiple sessions (e.g., different reasoning tasks):

1. Default: Return most recent
2. Optional: `list_sessions` filtered by root, let agent choose
3. Future: Session "pinning" to mark one as primary

### No MCP Root Available

If client doesn't support MCP roots:
- Fall back to current behavior (require explicit sessionId)
- Log warning suggesting root binding

### Session from Different Root

If agent explicitly provides sessionId for a session with different mcpRootUri:
- Allow it (explicit intent)
- Log info for debugging

## Files to Modify

| File | Change |
|------|--------|
| `src/persistence/types.ts` | Add `mcpRootUri` to SessionMetadata |
| `src/persistence/storage.ts` | Add `listSessions({ mcpRootUri })` filter |
| `src/init/tool-handler.ts` | Implement auto-discovery in `handleLoadContext` |
| `src/init/state-manager.ts` | Track bound root, pass to operations |

## Test Scenarios

1. **Auto-recovery after MCP session change**
   - Create session with root binding
   - Add thoughts
   - Simulate MCP session timeout (new session ID)
   - Call `load_context` without sessionId
   - Verify: Previous session auto-discovered, thoughts accessible

2. **Multiple sessions, most recent wins**
   - Create session A for root X
   - Create session B for root X (newer)
   - Call `load_context` for root X
   - Verify: Session B returned

3. **Explicit sessionId still works**
   - Create sessions A and B
   - Call `load_context` with sessionId: A
   - Verify: Session A returned (not most recent B)

4. **No sessions for root**
   - Call `load_context` for new root
   - Verify: Graceful error, suggests `start_new`

## Acceptance Criteria

- [ ] Sessions store `mcpRootUri` on creation
- [ ] `load_context` auto-discovers session when no sessionId provided
- [ ] Most recent session for root is selected
- [ ] Explicit sessionId still works (backward compatible)
- [ ] Works across MCP client session boundaries
- [ ] Agent memory not required for session continuity

## Future Enhancements

- **Session pinning**: Mark a session as "primary" for a root
- **Session archiving**: Old sessions auto-archive, only recent discoverable
- **Cross-root linking**: Sessions that span multiple projects
- **Session naming**: User-provided names for easier identification

## References

- Incident: `.claude/rules/lessons/2026-01-17-branchid-requires-branchfromthought.md` (MCP Session Timeout section)
- Related: `.claude/rules/lessons/2026-01-16-progressive-disclosure-not-persisted.md`
- MCP Roots: https://modelcontextprotocol.io/docs/concepts/roots
