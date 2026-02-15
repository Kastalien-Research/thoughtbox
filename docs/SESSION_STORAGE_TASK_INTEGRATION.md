# Session Storage Task Integration Specification

**Phase 3: Gateway Integration - Session Storage Modifications**

This document specifies the changes needed to integrate task linking into the session storage layer.

## Overview

Sessions need bidirectional linking with tasks to enable:
- Spawning sessions from tasks (task orchestration)
- Linking existing sessions to tasks (retrospective association)
- Querying sessions by task (finding all work done on a task)
- Cleaning up references when sessions/tasks are deleted

## Required Changes

### 1. ThoughtboxStorage Interface

**File**: `src/persistence/types.ts`

Add these methods to the `ThoughtboxStorage` interface:

```typescript
/**
 * Link a session to a task
 * @param sessionId - Session to link
 * @param taskId - Task to link to
 * @param role - How the session relates to the task
 */
linkToTask(sessionId: string, taskId: string, role: SessionTaskRole): Promise<void>;

/**
 * Unlink a session from its task
 * @param sessionId - Session to unlink
 */
unlinkFromTask(sessionId: string): Promise<void>;

/**
 * Get all sessions linked to a task
 * @param taskId - Task to query
 * @returns Array of sessions working on this task
 */
getSessionsByTask(taskId: string): Promise<Session[]>;
```

### 2. Session Interface Extension

**File**: `src/persistence/types.ts`

The `Session` interface already has the required fields (added in Phase 1):

```typescript
export interface Session {
  // ... existing fields ...

  /**
   * Task this session is working on (from SPEC-REASONING-TASKS.md)
   * Undefined for sessions not linked to tasks (backward compatible).
   */
  taskId?: string;

  /**
   * How this session relates to its task (from SPEC-REASONING-TASKS.md)
   * Undefined for sessions not linked to tasks (backward compatible).
   */
  taskRole?: SessionTaskRole;
}
```

✅ **No changes needed** - these fields were added in Phase 1.

### 3. Implementation (FileSystemStorage or InMemoryStorage)

#### SQL Schema Migration

If using SQLite-backed storage, add these columns:

```sql
-- Add task linking columns to sessions table
ALTER TABLE sessions ADD COLUMN task_id TEXT;
ALTER TABLE sessions ADD COLUMN task_role TEXT;

-- Add index for task queries
CREATE INDEX IF NOT EXISTS idx_sessions_task ON sessions(task_id);
```

#### Method Implementations

**linkToTask**:
```typescript
async linkToTask(sessionId: string, taskId: string, role: SessionTaskRole): Promise<void> {
  const session = await this.getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Update session with task link
  await this.updateSession(sessionId, {
    taskId,
    taskRole: role,
  });
}
```

**unlinkFromTask**:
```typescript
async unlinkFromTask(sessionId: string): Promise<void> {
  const session = await this.getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Remove task link
  await this.updateSession(sessionId, {
    taskId: undefined,
    taskRole: undefined,
  });
}
```

**getSessionsByTask**:
```typescript
async getSessionsByTask(taskId: string): Promise<Session[]> {
  // For SQLite implementation:
  const rows = this.db.prepare('SELECT * FROM sessions WHERE task_id = ?').all(taskId);

  // Convert rows to Session objects (same as listSessions)
  return rows.map(row => this.rowToSession(row));

  // For in-memory implementation:
  return this.sessions.filter(s => s.taskId === taskId);
}
```

### 4. Reference Integrity

**When a session is deleted**:
```typescript
async deleteSession(id: string): Promise<void> {
  const session = await this.getSession(id);

  if (session?.taskId) {
    // Notify task storage to remove session reference
    // This is handled by TaskStorage.removeSessionLink(sessionId)
    // Called from the gateway/orchestration layer
  }

  // ... proceed with deletion
}
```

**When a task is deleted**:
- The TaskStorage calls `removeSessionLink(sessionId)` for all linked sessions
- Sessions retain their `taskId` reference for historical analysis
- OR sessions can have `taskId` cleared - implementation choice

## Usage Example

From TaskHandler:

```typescript
// Spawn session from task
async handleSpawnSession(request: SpawnSessionRequest): Promise<{ sessionId: string; taskId: string }> {
  // 1. Create session
  const session = await this.sessionStorage.createSession({
    title: `${task.title} - ${request.role}`,
    tags: [request.role, `task:${task.id}`],
  });

  // 2. Link session → task (NEW METHOD)
  await this.sessionStorage.linkToTask(session.id, request.taskId, request.role);

  // 3. Link task → session (separate storage)
  task.linkedSessionIds.push(session.id);
  await this.taskStorage.updateTask(request.taskId, {
    linkedSessionIds: task.linkedSessionIds,
  });

  return { sessionId: session.id, taskId: request.taskId };
}
```

## Testing Checklist

After implementation, verify:

- [ ] Can create session and link to task
- [ ] Can link existing session to task
- [ ] Can query sessions by task ID
- [ ] Can unlink session from task
- [ ] Session deletion doesn't break task storage
- [ ] Task deletion handles session references gracefully
- [ ] SQL indexes work (query performance)
- [ ] Backward compatibility (sessions without tasks)

## Notes

- The `SessionTaskRole` type is imported from `src/tasks/types.ts`
- Bidirectional linking means both storages maintain references
- Reference cleanup can be async/fire-and-forget
- Consider adding these methods as optional first for gradual rollout
