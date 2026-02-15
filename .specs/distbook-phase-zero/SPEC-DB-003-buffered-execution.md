# SPEC-DB-003: Buffered Execution Mode

> **Status**: Draft
> **Priority**: HIGH
> **Phase**: 0.3 (Execution Wiring)
> **Estimated Effort**: 1-1.5 hours

## Summary

Add a buffered execution mode to `exec.mts` that collects all stdout/stderr output and returns it as a single result, enabling MCP tools to return structured execution results.

## Problem Statement

The current execution infrastructure uses streaming callbacks:

```typescript
export function spawnCall(
  command: string,
  args: string[],
  options: CallOptions,
  onStdout: (data: string) => void,  // WebSocket streaming
  onStderr: (data: string) => void
): Promise<SpawnResult>
```

This is designed for real-time WebSocket streaming to the UI. MCP tools need a different pattern:

1. Execute code
2. Wait for completion
3. Return all output at once in structured format

## Scope

### In Scope
- Add `executeAndCapture()` function to `exec.mts`
- Buffer stdout/stderr during execution
- Track execution time
- Return structured result object
- Support TypeScript (`tsx()`) and JavaScript (`node()`) execution

### Out of Scope
- Streaming output via MCP (future enhancement)
- Task system integration (SPEC-DB-004 may use tasks)
- Security sandboxing changes

## Requirements

### R1: Buffered Execution Function

```typescript
export interface CapturedExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;  // milliseconds
}

export async function executeAndCapture(
  code: string,
  language: 'typescript' | 'javascript',
  options: ExecutionOptions
): Promise<CapturedExecutionResult>;
```

### R2: Execution Options

```typescript
export interface ExecutionOptions {
  cwd: string;           // Working directory
  env?: NodeJS.ProcessEnv;  // Environment variables
  timeout?: number;      // Timeout in ms (default: 30000)
}
```

### R3: Timeout Handling
- Kill process if timeout exceeded
- Return partial output captured before timeout
- Set exitCode to special value (e.g., -1 or 124) for timeout

### R4: Output Limits
- Truncate stdout/stderr if they exceed reasonable limit (e.g., 1MB)
- Include truncation indicator in output

## Technical Approach

### Implementation

```typescript
// packages/api/exec.mts

export async function executeAndCapture(
  code: string,
  language: 'typescript' | 'javascript',
  options: ExecutionOptions
): Promise<CapturedExecutionResult> {
  const startTime = Date.now();
  let stdout = '';
  let stderr = '';

  // Use existing execution functions with buffer callbacks
  const execFn = language === 'typescript' ? tsx : node;

  try {
    const result = await execFn(
      code,
      options.cwd,
      options.env,
      (data) => { stdout += data; },  // Buffer stdout
      (data) => { stderr += data; },  // Buffer stderr
      options.timeout
    );

    return {
      stdout: truncateIfNeeded(stdout),
      stderr: truncateIfNeeded(stderr),
      exitCode: result.exitCode,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    // Handle timeout or other execution errors
    return {
      stdout: truncateIfNeeded(stdout),
      stderr: truncateIfNeeded(stderr + `\nExecution error: ${error.message}`),
      exitCode: -1,
      executionTime: Date.now() - startTime,
    };
  }
}

function truncateIfNeeded(output: string, maxLength = 1024 * 1024): string {
  if (output.length > maxLength) {
    return output.substring(0, maxLength) + '\n[Output truncated]';
  }
  return output;
}
```

### Integration with Existing Code

The implementation wraps existing `tsx()` and `node()` functions, which already:
- Handle process spawning
- Support timeout
- Manage working directory
- Pass through environment variables

## Files

### Modified Files
| File | Changes |
|------|---------|
| `packages/api/exec.mts` | Add `executeAndCapture()` function |

### Test Files
| File | Purpose |
|------|---------|
| `packages/api/exec.test.mts` | Add buffered execution tests |

## Acceptance Criteria

- [ ] `executeAndCapture()` function exported from `exec.mts`
- [ ] Returns structured `CapturedExecutionResult`
- [ ] Captures complete stdout/stderr from successful execution
- [ ] Handles TypeScript (`tsx`) execution
- [ ] Handles JavaScript (`node`) execution
- [ ] Respects timeout option
- [ ] Truncates oversized output
- [ ] Unit tests pass

## Test Cases

### Unit Tests

```typescript
describe('executeAndCapture', () => {
  it('captures stdout from simple script', async () => {
    const result = await executeAndCapture(
      'console.log("hello world")',
      'javascript',
      { cwd: '/tmp' }
    );
    expect(result.stdout).toContain('hello world');
    expect(result.exitCode).toBe(0);
  });

  it('captures stderr from erroring script', async () => {
    const result = await executeAndCapture(
      'console.error("error message"); process.exit(1)',
      'javascript',
      { cwd: '/tmp' }
    );
    expect(result.stderr).toContain('error message');
    expect(result.exitCode).toBe(1);
  });

  it('handles TypeScript execution', async () => {
    const result = await executeAndCapture(
      'const x: number = 42; console.log(x)',
      'typescript',
      { cwd: '/tmp' }
    );
    expect(result.stdout).toContain('42');
    expect(result.exitCode).toBe(0);
  });

  it('respects timeout', async () => {
    const result = await executeAndCapture(
      'while(true) {}',
      'javascript',
      { cwd: '/tmp', timeout: 1000 }
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.executionTime).toBeLessThan(2000);
  });

  it('truncates large output', async () => {
    const result = await executeAndCapture(
      'for(let i=0; i<1000000; i++) console.log("x".repeat(100))',
      'javascript',
      { cwd: '/tmp' }
    );
    expect(result.stdout.length).toBeLessThanOrEqual(1024 * 1024 + 50);
    expect(result.stdout).toContain('[Output truncated]');
  });
});
```

## Dependencies

- SPEC-DB-001 (TypeScript compilation must pass)
- Existing `tsx()` and `node()` functions in `exec.mts`

## Blocked By

- SPEC-DB-001

## Blocks

- SPEC-DB-004 (Cell Execute Wiring needs buffered execution)

---

**Created**: 2026-01-19
**Source**: plans/feat-distbook-phase-zero-mcp-execution.md (Gap 3)
