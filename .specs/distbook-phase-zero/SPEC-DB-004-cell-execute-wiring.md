# SPEC-DB-004: Cell Execute Wiring

> **Status**: Draft
> **Priority**: CRITICAL
> **Phase**: 0.3 (Execution Wiring)
> **Estimated Effort**: 1.5-2 hours

## Summary

Wire the `cell_execute` MCP tool to actual code execution, replacing the current stub implementation with real execution via the session accessor and buffered execution modules.

## Problem Statement

The `cell_execute` tool currently returns hardcoded stub data:

```typescript
// packages/api/mcp/server/tools.mts:497-529
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

This makes the MCP server functionally useless for code execution.

## Scope

### In Scope
- Integrate session accessor (SPEC-DB-002) into `cell_execute`
- Integrate buffered execution (SPEC-DB-003) into `cell_execute`
- Determine cell language (TypeScript vs JavaScript)
- Return real execution results
- Handle errors gracefully

### Out of Scope
- Other MCP tools (notebook_*, cell_create, etc.)
- Task-based async execution (may be future enhancement)
- Streaming output
- Security sandboxing (use existing patterns)

## Requirements

### R1: Session/Cell Loading
- Use `getSessionCell()` to load session and cell
- Handle SESSION_NOT_FOUND error with informative message
- Handle CELL_NOT_FOUND error with informative message

### R2: Language Detection
- Determine if cell is TypeScript or JavaScript
- Use cell metadata or file extension heuristics
- Default to TypeScript if ambiguous (Distbook default)

### R3: Execution
- Pass cell source to `executeAndCapture()`
- Use appropriate working directory (session directory)
- Apply default timeout (30 seconds)
- Allow timeout override via tool parameter

### R4: Result Formatting
- Return structured JSON result in MCP response
- Match expected schema: `{ stdout, stderr, exitCode, executionTime }`

### R5: Error Handling
- Return error in stderr for execution failures
- Use appropriate exit codes (non-zero for failures)
- Never throw - always return structured result

## Technical Approach

### Implementation

```typescript
// packages/api/mcp/server/tools.mts - cell_execute handler

import { getSessionCell, SessionAccessError } from './session-accessor.mts';
import { executeAndCapture } from '../../exec.mts';

// Inside the cell_execute tool handler:
async function handleCellExecute(params: {
  sessionId: string;
  cellId: string;
  timeout?: number;
}): Promise<McpToolResponse> {
  const { sessionId, cellId, timeout = 30000 } = params;

  try {
    // 1. Load session and cell
    const { session, cell } = await getSessionCell(sessionId, cellId);

    // 2. Determine language
    const language = detectLanguage(cell);

    // 3. Get execution context
    const cwd = getSessionDirectory(session);

    // 4. Execute with buffered capture
    const result = await executeAndCapture(
      cell.source,
      language,
      { cwd, timeout }
    );

    // 5. Return structured result
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          executionTime: result.executionTime,
        })
      }]
    };

  } catch (error) {
    if (isSessionAccessError(error)) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            stdout: "",
            stderr: `Error: ${error.code} - ${error.message}`,
            exitCode: 1,
            executionTime: 0,
          })
        }]
      };
    }

    // Unexpected error
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          stdout: "",
          stderr: `Unexpected error: ${error.message}`,
          exitCode: 1,
          executionTime: 0,
        })
      }]
    };
  }
}

function detectLanguage(cell: Cell): 'typescript' | 'javascript' {
  // Check cell metadata
  if (cell.language === 'javascript') return 'javascript';
  if (cell.language === 'typescript') return 'typescript';

  // Check file extension heuristics
  if (cell.filename?.endsWith('.js')) return 'javascript';

  // Default to TypeScript (Distbook convention)
  return 'typescript';
}

function getSessionDirectory(session: Srcbook): string {
  // Return the directory where the session's files are stored
  return session.dir;
}

function isSessionAccessError(error: unknown): error is SessionAccessError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['SESSION_NOT_FOUND', 'CELL_NOT_FOUND', 'STORAGE_ERROR'].includes(
      (error as any).code
    )
  );
}
```

### Tool Schema Update

Ensure tool schema includes timeout parameter:

```typescript
{
  name: "cell_execute",
  description: "Execute a notebook cell and return the result",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "The session/notebook ID"
      },
      cellId: {
        type: "string",
        description: "The cell ID to execute"
      },
      timeout: {
        type: "number",
        description: "Execution timeout in milliseconds (default: 30000)",
        default: 30000
      }
    },
    required: ["sessionId", "cellId"]
  }
}
```

## Files

### Modified Files
| File | Changes |
|------|---------|
| `packages/api/mcp/server/tools.mts` | Replace stub with real implementation |

### Test Files
| File | Purpose |
|------|---------|
| `packages/api/mcp/server/tools.test.mts` | Integration tests |

## Acceptance Criteria

- [ ] `cell_execute` loads session and cell via session accessor
- [ ] `cell_execute` executes cell code via buffered execution
- [ ] Returns real stdout from executed code
- [ ] Returns real stderr from executed code
- [ ] Returns correct exit codes
- [ ] Returns accurate execution time
- [ ] Handles missing session with informative error
- [ ] Handles missing cell with informative error
- [ ] Respects timeout parameter
- [ ] Integration tests pass

## Test Cases

### Integration Tests

```typescript
describe('cell_execute tool', () => {
  let testSessionId: string;
  let testCellId: string;

  beforeEach(async () => {
    // Create test session with a cell
    const session = await createTestSession();
    testSessionId = session.id;
    testCellId = await addTestCell(session, 'console.log("test output")');
  });

  it('executes cell and returns stdout', async () => {
    const result = await callMcpTool('cell_execute', {
      sessionId: testSessionId,
      cellId: testCellId,
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.stdout).toContain('test output');
    expect(parsed.exitCode).toBe(0);
  });

  it('returns stderr for errors', async () => {
    const errorCellId = await addTestCell(
      testSessionId,
      'throw new Error("test error")'
    );

    const result = await callMcpTool('cell_execute', {
      sessionId: testSessionId,
      cellId: errorCellId,
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.stderr).toContain('test error');
    expect(parsed.exitCode).not.toBe(0);
  });

  it('handles missing session', async () => {
    const result = await callMcpTool('cell_execute', {
      sessionId: 'nonexistent-session',
      cellId: 'any-cell',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.stderr).toContain('SESSION_NOT_FOUND');
    expect(parsed.exitCode).toBe(1);
  });

  it('handles missing cell', async () => {
    const result = await callMcpTool('cell_execute', {
      sessionId: testSessionId,
      cellId: 'nonexistent-cell',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.stderr).toContain('CELL_NOT_FOUND');
    expect(parsed.exitCode).toBe(1);
  });

  it('respects timeout', async () => {
    const infiniteCellId = await addTestCell(
      testSessionId,
      'while(true) {}'
    );

    const result = await callMcpTool('cell_execute', {
      sessionId: testSessionId,
      cellId: infiniteCellId,
      timeout: 1000,
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.exitCode).not.toBe(0);
    expect(parsed.executionTime).toBeLessThan(2000);
  });
});
```

## Dependencies

- SPEC-DB-001 (TypeScript compilation)
- SPEC-DB-002 (Session Accessor)
- SPEC-DB-003 (Buffered Execution)

## Blocked By

- SPEC-DB-001
- SPEC-DB-002
- SPEC-DB-003

## Blocks

- End-to-end MCP execution testing
- Self-improvement loop benchmark execution

---

**Created**: 2026-01-19
**Source**: plans/feat-distbook-phase-zero-mcp-execution.md (Gap 1)
