# SPEC-DB-002: MCP Session Accessor

> **Status**: Draft
> **Priority**: CRITICAL
> **Phase**: 0.2 (Session Loading)
> **Estimated Effort**: 1-2 hours

## Summary

Create a session accessor module that allows MCP tool handlers to load notebook sessions and retrieve cell content by ID.

## Problem Statement

The `cell_execute` MCP tool receives `sessionId` and `cellId` parameters but has no way to:
1. Load the session from storage
2. Find the cell within the session
3. Extract the cell's source code for execution

Currently, the tool returns hardcoded stub data because it cannot access actual session content.

## Scope

### In Scope
- Create `packages/api/mcp/server/session-accessor.mts`
- Expose functions to load session and find cell by ID
- Handle error cases (session not found, cell not found)
- Integrate with existing session storage (`packages/api/srcbook/index.mts`)

### Out of Scope
- Cell execution (SPEC-DB-004)
- Session creation/modification via MCP
- WebSocket session sync

## Requirements

### R1: Session Loading
- Load session by ID from storage
- Return session object with cells array
- Handle missing session gracefully (return null or throw typed error)

### R2: Cell Lookup
- Find cell within session by `cellId`
- Return cell object including `source` property
- Handle missing cell gracefully

### R3: Type Safety
- Export TypeScript types for session and cell structures
- Match existing types from `packages/api/srcbook/` where applicable

### R4: Error Handling
```typescript
interface SessionAccessError {
  code: 'SESSION_NOT_FOUND' | 'CELL_NOT_FOUND' | 'STORAGE_ERROR';
  sessionId: string;
  cellId?: string;
  message: string;
}
```

## Technical Approach

### Interface Design

```typescript
// packages/api/mcp/server/session-accessor.mts

import { loadSrcbook } from '../srcbook/index.mts';

export interface SessionAccessResult {
  session: Srcbook;
  cell: Cell;
}

export interface SessionAccessError {
  code: 'SESSION_NOT_FOUND' | 'CELL_NOT_FOUND' | 'STORAGE_ERROR';
  sessionId: string;
  cellId?: string;
  message: string;
}

/**
 * Load a session and find a specific cell within it.
 *
 * @param sessionId - The srcbook session ID
 * @param cellId - The cell ID within the session
 * @returns SessionAccessResult or throws SessionAccessError
 */
export async function getSessionCell(
  sessionId: string,
  cellId: string
): Promise<SessionAccessResult>;

/**
 * Load a session by ID.
 *
 * @param sessionId - The srcbook session ID
 * @returns Srcbook or throws SessionAccessError
 */
export async function getSession(
  sessionId: string
): Promise<Srcbook>;

/**
 * Find a cell within a session by ID.
 *
 * @param session - The loaded srcbook session
 * @param cellId - The cell ID to find
 * @returns Cell or throws SessionAccessError
 */
export function findCell(
  session: Srcbook,
  cellId: string
): Cell;
```

### Integration Point

In `tools.mts`, the `cell_execute` handler will use:

```typescript
import { getSessionCell } from './session-accessor.mts';

// Inside cell_execute handler:
const { session, cell } = await getSessionCell(sessionId, cellId);
const sourceCode = cell.source;
// ... execute sourceCode
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `packages/api/mcp/server/session-accessor.mts` | Session/cell lookup |
| `packages/api/mcp/server/session-accessor.test.mts` | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `packages/api/srcbook/index.mts` | May need to export additional helpers |

## Acceptance Criteria

- [ ] `getSessionCell(sessionId, cellId)` returns session and cell for valid IDs
- [ ] `getSessionCell` throws `SESSION_NOT_FOUND` for invalid sessionId
- [ ] `getSessionCell` throws `CELL_NOT_FOUND` for invalid cellId in valid session
- [ ] Types are exported and match existing session/cell structures
- [ ] Unit tests cover happy path and error cases

## Test Cases

### Unit Tests

```typescript
describe('session-accessor', () => {
  describe('getSessionCell', () => {
    it('returns session and cell for valid IDs', async () => {
      // Setup: Create test session with known cell
      const { session, cell } = await getSessionCell('test-session', 'test-cell');
      expect(session.id).toBe('test-session');
      expect(cell.id).toBe('test-cell');
      expect(cell.source).toBeDefined();
    });

    it('throws SESSION_NOT_FOUND for invalid sessionId', async () => {
      await expect(getSessionCell('nonexistent', 'any-cell'))
        .rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
    });

    it('throws CELL_NOT_FOUND for invalid cellId', async () => {
      // Setup: Create test session
      await expect(getSessionCell('valid-session', 'nonexistent-cell'))
        .rejects.toMatchObject({ code: 'CELL_NOT_FOUND' });
    });
  });
});
```

## Dependencies

- SPEC-DB-001 (TypeScript compilation must pass)
- Existing session storage API (`packages/api/srcbook/index.mts`)

## Blocked By

- SPEC-DB-001

## Blocks

- SPEC-DB-004 (Cell Execute Wiring needs session access)

---

**Created**: 2026-01-19
**Source**: plans/feat-distbook-phase-zero-mcp-execution.md (Gap 2)
