# Distbook Phase 0: Complete MCP Execution Path

> **Feature**: Enable real code execution through MCP tools
> **Branch**: `feat/self-improvement-loop`
> **Status**: Planning
> **Created**: 2026-01-19

## Summary

Complete the MCP execution infrastructure in Distbook so that notebook cells can be executed via MCP tools, returning structured results (stdout, stderr, exitCode, executionTime). This enables Distbook to serve as the benchmark execution environment for the self-improvement loop.

## Background

Distbook is a fork of Srcbook that implements an **MCP peer** architecture - acting as both MCP client AND server simultaneously. The infrastructure exists but is functionally stubbed:

- **MCP Server**: Running, but `cell_execute` returns hardcoded empty results
- **MCP Client**: Configured, but transport code is commented out
- **Execution Engine**: Complete via `exec.mts` - just not wired to MCP
- **Task System**: Complete via `mcp/tasks/` - ready for long-running operations

## Critical Gaps Identified

### Gap 1: Cell Execution Not Wired (CRITICAL)

**Location**: `packages/api/mcp/server/tools.mts:497-529`

**Current State**:
```typescript
// Returns hardcoded stub data
return {
  content: [{
    type: "text",
    text: JSON.stringify({
      stdout: "",  // Always empty
      stderr: "",  // Always empty
      exitCode: 0,
      executionTime: 0
    })
  }]
};
```

**Required State**: Wire to `exec.mts` functions (`tsx()`, `node()`) for real execution.

**Key Files**:
- `packages/api/mcp/server/tools.mts` - Tool registration (stub)
- `packages/api/exec.mts` - Actual execution infrastructure (complete)

---

### Gap 2: Session Loading Missing (CRITICAL)

**Location**: `packages/api/mcp/server/tools.mts` (cell_execute handler)

**Current State**: Tool receives `sessionId` and `cellId` but has no way to load the actual session/cell content.

**Required State**: Use existing session management (`packages/api/srcbook/index.mts`) to:
1. Load session by ID
2. Find cell by ID within session
3. Extract cell source code
4. Pass to execution engine

**Key Files**:
- `packages/api/srcbook/index.mts` - Session CRUD operations
- `packages/api/mcp/server/tools.mts` - Tool handler needing session access

---

### Gap 3: Output Capture for MCP Path (HIGH)

**Location**: `packages/api/exec.mts:41-121`

**Current State**: `spawnCall()` uses callbacks for stdout/stderr, designed for WebSocket streaming:
```typescript
export function spawnCall(
  command: string,
  args: string[],
  options: CallOptions,
  onStdout: (data: string) => void,  // WebSocket-oriented
  onStderr: (data: string) => void
): Promise<SpawnResult>
```

**Required State**: Add buffered execution mode that collects all output and returns it:
```typescript
export async function executeAndCapture(
  command: string,
  args: string[],
  options: CallOptions
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}>
```

**Key Files**:
- `packages/api/exec.mts` - Needs buffer-mode execution

---

### Gap 4: MCP Client Transport (MEDIUM)

**Location**: `packages/api/mcp/client/index.mts:135-162`

**Current State**: Transport initialization completely commented out:
```typescript
// All transport code commented out with TODO
// this.transport = new StreamableHTTPClientTransport(...)
```

**Required State**: Implement `StreamableHTTPClientTransport` connection to external MCP servers (including Thoughtbox at `localhost:1731/mcp`).

**Key Files**:
- `packages/api/mcp/client/index.mts` - Client implementation
- `.mcp.json` - Server configuration (Thoughtbox already configured)

---

### Gap 5: TypeScript Compilation Errors (BLOCKING)

**Location**: Throughout `packages/api/mcp/`

**Current State**: 121+ TypeScript errors:
- 63 errors in production code
- 58 errors in test files

**Required State**: Clean compilation before any feature work.

**Root Causes** (likely):
- MCP SDK version mismatches
- Incomplete type definitions
- Stale imports after partial refactoring

**Key Files**:
- `packages/api/mcp/**/*.ts` - All MCP-related code

---

## Implementation Plan

### Phase 0.1: Foundation (Unblocking)

| Task | Est. | Dependencies | Files |
|------|------|--------------|-------|
| Fix TypeScript errors | 1-2h | None | `packages/api/mcp/**/*.ts` |
| Verify existing tests pass | 30m | TS errors fixed | `packages/api/**/*.test.ts` |

**Acceptance**: `pnpm --filter @srcbook/api build` succeeds

---

### Phase 0.2: Session Loading

| Task | Est. | Dependencies | Files |
|------|------|--------------|-------|
| Create session accessor for MCP | 1h | Phase 0.1 | New: `packages/api/mcp/server/session-accessor.mts` |
| Wire accessor to cell_execute | 30m | Accessor | `packages/api/mcp/server/tools.mts` |
| Add cell lookup by ID | 30m | Accessor | `packages/api/srcbook/index.mts` |

**Acceptance**: `cell_execute` can retrieve cell source from sessionId + cellId

---

### Phase 0.3: Execution Wiring

| Task | Est. | Dependencies | Files |
|------|------|--------------|-------|
| Add buffered execution mode | 1h | None | `packages/api/exec.mts` |
| Wire cell_execute to tsx/node | 1h | Phase 0.2, buffered exec | `packages/api/mcp/server/tools.mts` |
| Add execution timeout handling | 30m | Execution wired | `packages/api/mcp/server/tools.mts` |
| Return structured results | 30m | All above | `packages/api/mcp/server/tools.mts` |

**Acceptance**: `cell_execute` returns real stdout/stderr/exitCode from actual code execution

---

### Phase 0.4: MCP Client (Optional for Phase 0)

| Task | Est. | Dependencies | Files |
|------|------|--------------|-------|
| Implement StreamableHTTPClientTransport | 2h | Phase 0.1 | `packages/api/mcp/client/index.mts` |
| Add connection lifecycle management | 1h | Transport | `packages/api/mcp/client/index.mts` |
| Test Thoughtbox connectivity | 30m | All above | Integration test |

**Acceptance**: Distbook can connect to Thoughtbox MCP server and call tools

---

## Test Strategy

### Unit Tests

1. **Session Loading**
   - Load valid session by ID
   - Handle missing session gracefully
   - Find cell within session by ID
   - Handle missing cell gracefully

2. **Execution Capture**
   - Capture stdout from simple script
   - Capture stderr from erroring script
   - Return correct exit codes
   - Respect timeout limits

3. **Tool Integration**
   - cell_execute with valid session/cell returns output
   - cell_execute with invalid session returns error
   - cell_execute respects timeout parameter

### Integration Tests

1. **End-to-End Execution**
   - Create session via API
   - Add cell with executable code
   - Call cell_execute via MCP
   - Verify output matches expected

2. **MCP Client (Phase 0.4)**
   - Connect to Thoughtbox server
   - List available tools
   - Call a tool and receive response

---

## Architecture Notes

### MCP Peer Pattern

```
┌─────────────────────────────────────────────────────────┐
│                       DISTBOOK                          │
│                                                         │
│  ┌─────────────┐           ┌─────────────────────────┐ │
│  │ MCP SERVER  │           │      EXECUTION ENGINE   │ │
│  │             │           │                         │ │
│  │ cell_execute├──────────►│ exec.mts                │ │
│  │ cell_create │           │  └─ tsx()              │ │
│  │ cell_update │           │  └─ node()             │ │
│  │ notebook_*  │           │  └─ spawnCall()        │ │
│  └─────────────┘           └─────────────────────────┘ │
│        ▲                                               │
│        │ MCP Protocol                                  │
│        ▼                                               │
│  ┌─────────────┐                                       │
│  │ MCP CLIENT  │◄──── Connects to external servers    │
│  │             │      (Thoughtbox, etc.)              │
│  └─────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### Task System for Long-Running Operations

The existing task system (`packages/api/mcp/tasks/`) implements SEP-1686 "call now, fetch later":

```typescript
// Create task for long-running execution
const taskId = await createTask(async () => {
  return await executeCell(sessionId, cellId);
});

// Return task ID immediately
return { taskId };

// Client polls for result
const result = await getTaskResult(taskId);
```

Consider using this for cell execution with long timeouts.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TS errors deeper than expected | Medium | High | Time-box to 2h, escalate if not resolved |
| Session loading architecture mismatch | Low | Medium | Existing session API is well-documented |
| Execution security concerns | Medium | High | Use existing sandbox patterns from exec.mts |
| MCP SDK version conflicts | Medium | Medium | Pin versions, test compatibility |

---

## Success Criteria

**Phase 0 Complete When**:

1. [ ] TypeScript compiles cleanly (`pnpm --filter @srcbook/api build`)
2. [ ] `cell_execute` returns real execution results
3. [ ] Unit tests pass for session loading + execution
4. [ ] Integration test: MCP client → cell_execute → real output
5. [ ] Documentation updated with MCP peer architecture

---

## File Index

### Core Files to Modify

| File | Purpose | Gap |
|------|---------|-----|
| `packages/api/mcp/server/tools.mts` | Tool definitions | Gaps 1, 2 |
| `packages/api/exec.mts` | Process execution | Gap 3 |
| `packages/api/mcp/client/index.mts` | Client transport | Gap 4 |
| `packages/api/srcbook/index.mts` | Session management | Gap 2 |

### New Files to Create

| File | Purpose |
|------|---------|
| `packages/api/mcp/server/session-accessor.mts` | Bridge MCP to session storage |

### Test Files

| File | Coverage |
|------|----------|
| `packages/api/mcp/server/tools.test.mts` | Tool execution |
| `packages/api/exec.test.mts` | Buffered execution |
| `packages/api/mcp/client/index.test.mts` | Client transport |

---

## References

- [MCP SDK Documentation](https://modelcontextprotocol.io/docs)
- [SEP-1686: Task Primitive](https://github.com/modelcontextprotocol/specification/pull/1686)
- [Distbook Repository](https://github.com/Kastalien-Research/distbook)
- [Self-Improvement Loop Plan](../self-improvement/PLAN-cost-effective-self-improvement-loop.md)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-19 | Initial plan created from research findings |
