# SPEC-RLM-001: Recursive Language Model REPL via MCP

**Status**: Draft
**Priority**: P1 (Feature)
**Complexity**: High (3 phases)
**Dependencies**: None (standalone tool)
**Source Paper**: "Recursive Language Models" — Zhang, Kraska, Khattab (arXiv 2512.24601v2, ICML 2026)

---

## Abstract

This specification defines an `rlm_repl` MCP tool that implements the Recursive Language Model (RLM) inference paradigm within Thoughtbox. RLM treats the LLM as an interpreter executing code in a REPL environment where intermediate state lives in _environment variables_ — outside the context window — and recursive sub-calls spawn fresh LLM invocations with isolated context.

MCP tools serve as the REPL interface. Claude Code already speaks MCP, so MCP tool operations become REPL primitives (`peek`, `store`, `execute`, `sub_call`). No new transport or protocol is needed.

---

## Motivation

### Problem

Standard LLM agent loops suffer from three limitations:

1. **Context window saturation**: Intermediate results accumulate in the conversation, consuming tokens and eventually degrading coherence.
2. **No variable isolation**: The model cannot "set aside" a working result and return to it later without it occupying context.
3. **No recursive decomposition**: The model cannot spawn a fresh sub-call with a clean context window to reason about a sub-problem, then integrate the result.

### Paper Insight

The RLM paper identifies three design choices that distinguish recursive from standard inference:

| Design Choice | Standard Agent Loop | RLM |
|---|---|---|
| Prompt storage | In context window | In environment variable |
| Output destination | Streamed to user | Stored in environment variable |
| Sub-problem handling | Same context, growing | Fresh `sub_call()` with isolated context |

### Why MCP

MCP tools are already a REPL interface — the client (Claude Code) sends a tool call, the server executes it, and returns a result. The RLM REPL maps cleanly onto this:

| RLM Primitive | MCP Mapping |
|---|---|
| `store(name, value)` | `rlm_repl { operation: "store", args: { name, value } }` |
| `peek(name)` | `rlm_repl { operation: "peek", args: { name } }` |
| `execute(code)` | `rlm_repl { operation: "execute", args: { code } }` |
| `sub_call(prompt)` | Inside `execute`, the injected `sub_call()` function |

### Codebase Context

Thoughtbox already has a `subagent-summarize` prompt (see `src/server-factory.ts:673-724`) that uses context isolation informally — the RLM REPL formalizes this pattern with proper variable management and budget enforcement.

---

## Requirements

### Functional Requirements

#### Phase 1: REPL Primitives

**REQ-001**: Variable Storage
- `store` operation creates or overwrites a named variable
- Variables are key-value pairs where both key and value are strings
- Each variable tracks: name, value, created timestamp, updated timestamp, character count
- Multiple variables can coexist in a session

**REQ-002**: Variable Retrieval
- `peek` operation returns the full value of a named variable
- `peek` with `start`/`end` character offsets returns a substring slice
- Slicing enables working with variables larger than can fit in a single response
- `get` operation is an alias for `peek` (paper compatibility)

**REQ-003**: Variable Listing
- `list_vars` operation returns all variable names with their sizes and timestamps
- No variable values are returned (metadata only)

**REQ-004**: Variable Deletion
- `delete_var` operation removes a variable by name
- Frees the memory budget consumed by that variable

**REQ-005**: Session Lifecycle
- `finish` operation marks the session as complete and sets a final result value
- After `finish`, no further `store` or `execute` operations are accepted
- `peek` and `list_vars` remain available after `finish` (read-only access)

**REQ-006**: Session Status
- `status` operation returns session metadata: variable count, total stored characters, session age, budget remaining, session state (active/finished)

**REQ-007**: Budget Enforcement
- Maximum variables per session (default: 100)
- Maximum total characters across all variables (default: 1,000,000)
- Maximum characters per individual variable (default: 100,000)
- `store` operations that would exceed any limit return an error (not a crash)
- Budget remaining is reported via `status`

**REQ-008**: Lazy Session Initialization
- No explicit "create session" operation needed
- First operation on a connection creates the session automatically
- One session per MCP connection (in-memory, not persisted to disk)

#### Phase 2: Sandboxed Execution

**REQ-009**: Code Execution
- `execute` operation runs JavaScript code in a sandboxed `vm.createContext()` environment
- The sandbox injects REPL functions as globals: `peek()`, `store()`, `get()`, `vars()`, `print()`, `FINAL()`, `FINAL_VAR()`
- Code runs as an async IIFE to support `await` expressions
- Timeout of 60 seconds prevents infinite loops

**REQ-010**: Recursive Sub-Calls
- Inside `execute`, a `sub_call(prompt, opts?)` function is available
- `sub_call()` invokes the Anthropic Messages API with a fresh context
- Default model: `claude-sonnet-4-5-20250929` (configurable via `opts.model`)
- Returns the text content of the assistant response
- `llm_query()` is an alias for `sub_call()` (paper compatibility)

**REQ-011**: Execution Budget
- Per-call token limit (default: 4,096 max_tokens)
- Total token budget across all sub-calls in a session (default: 100,000)
- Maximum sub-call count per session (default: 50)
- Exceeding any limit returns a descriptive error

**REQ-012**: Execution Output
- `print()` function appends to an execution log (array of strings)
- `FINAL(answer)` terminates execution and sets the session result
- `FINAL_VAR(varName)` terminates execution and sets the session result from a stored variable
- Return value includes: execution log, result (if FINAL called), tokens used, calls made

**REQ-013**: Security Boundaries
- `vm.createContext()` isolates code from Node.js globals
- No access to `process`, `require`, `fs`, `__dirname`, `__filename`, `Buffer`, `setTimeout`, `setInterval`
- Only injected REPL functions + `JSON` + `Math` + `String`/`Array`/`Object` built-ins are available
- This is NOT a true security sandbox — it is sufficient for Claude-generated code within a trusted context

**REQ-014**: Graceful SDK Degradation
- `@anthropic-ai/sdk` is a devDependency, not a production dependency
- `execute` with `sub_call()` attempts dynamic `import("@anthropic-ai/sdk")`
- If the SDK is unavailable, `sub_call()` returns a clear error: "sub_call requires @anthropic-ai/sdk — install it with npm install @anthropic-ai/sdk"
- All Phase 1 operations work without the SDK installed
- `execute` with code that does not call `sub_call()` works without the SDK

#### Phase 3: Claude Code Integration

**REQ-015**: Claude Code Skill
- A `.claude/skills/rlm/SKILL.md` file teaches Claude Code when and how to use the RLM REPL
- Covers: when to use RLM (vs. standard reasoning), the core pattern (load → work → sub-call → finish), operation reference, budget awareness

**REQ-016**: MCP Resource Templates
- `rlm://vars/{name}` resource returns variable content as `text/plain`
- Enables clients that support resource reading to introspect variables without a tool call

**REQ-017**: MCP Prompt Template
- An `rlm-session` prompt template injects an adapted version of the RLM system prompt (Appendix C of the paper)
- Teaches the agent the REPL primitives and the recursive decomposition pattern

**REQ-018**: Thoughtbox Integration (Optional)
- `finish` operation accepts an optional `saveAsThought: true` flag
- When set, the result is saved as a Thoughtbox thought with tags `["rlm", "recursive-reasoning"]`
- Requires an active Thoughtbox session (graceful no-op if no session exists)

### Non-Functional Requirements

**REQ-019**: No Persistence
- Session state is in-memory only, scoped to the MCP connection lifetime
- Rationale: matches the paper's model; persistent state would complicate the lifecycle

**REQ-020**: Type Checking
- All new code must pass `npx tsc --noEmit` without errors
- Zod schemas for all input validation

**REQ-021**: No New Production Dependencies
- Phase 1 requires only `zod` (already a dependency)
- Phase 2 uses Node.js built-in `vm` module + optional `@anthropic-ai/sdk` (already a devDependency)
- Phase 3 adds no dependencies

**REQ-022**: Tool Response Format
- All operations return `{ content: [{ type: "text", text: "..." }], isError?: boolean }`
- Consistent with existing Thoughtbox MCP tool response format

---

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ Claude Code (MCP Client)                            │
│                                                     │
│  rlm_repl { operation: "store", args: {...} }       │
│  rlm_repl { operation: "execute", args: { code } }  │
└──────────────────────┬──────────────────────────────┘
                       │ MCP tool call
                       ▼
┌─────────────────────────────────────────────────────┐
│ src/server-factory.ts                               │
│                                                     │
│  server.registerTool("rlm_repl", ...)               │
│  → rlmHandler.handle(args)                          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ src/rlm/rlm-handler.ts                              │
│                                                     │
│  RlmHandler                                         │
│  ├── session: RlmSession (in-memory)                │
│  ├── budget: RlmBudget                              │
│  │                                                  │
│  ├── handleStore(name, value)                       │
│  ├── handlePeek(name, start?, end?)                 │
│  ├── handleListVars()                               │
│  ├── handleDeleteVar(name)                          │
│  ├── handleFinish(result, saveAsThought?)           │
│  ├── handleStatus()                                 │
│  └── handleExecute(code)  ──────────────────┐       │
└─────────────────────────────────────────────┼───────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────┐
│ src/rlm/rlm-executor.ts                             │
│                                                     │
│  vm.createContext() sandbox:                        │
│  ├── peek(name) → string                           │
│  ├── store(name, value) → void                     │
│  ├── get(name) → string         (alias: peek)      │
│  ├── vars() → Record<string, number>               │
│  ├── print(...args) → void                         │
│  ├── FINAL(answer) → throws FinalSignal            │
│  ├── FINAL_VAR(varName) → throws FinalSignal       │
│  ├── sub_call(prompt, opts?) → Promise<string>     │
│  ├── llm_query(prompt, opts?) → Promise<string>    │
│  ├── JSON, Math (safe built-ins)                   │
│  └── console.log → print redirect                  │
│                                                     │
│  sub_call() implementation:                         │
│  └── @anthropic-ai/sdk Messages API (dynamic import)│
└─────────────────────────────────────────────────────┘
```

### File Structure

```
src/rlm/
├── index.ts            # Barrel exports
├── rlm-types.ts        # Core types: RlmVariable, RlmSession, RlmBudget, RlmOperation
├── rlm-handler.ts      # Operation router + session state management
├── rlm-executor.ts     # vm.createContext() sandbox + sub_call implementation
└── operations.ts       # Zod schemas + human-readable descriptions per operation

.claude/skills/rlm/
└── SKILL.md            # Claude Code skill document
```

### Type Definitions (`src/rlm/rlm-types.ts`)

```typescript
export interface RlmVariable {
  name: string;
  value: string;
  created: string;    // ISO 8601 timestamp
  updated: string;    // ISO 8601 timestamp
  size: number;       // value.length (character count)
}

export interface RlmSession {
  id: string;                            // UUID
  variables: Map<string, RlmVariable>;
  created: string;                       // ISO 8601
  totalStoredChars: number;              // sum of all variable sizes
  status: "active" | "finished";
  result?: string;                       // set by finish operation
}

export interface RlmBudget {
  maxVariables: number;       // default: 100
  maxTotalChars: number;      // default: 1_000_000
  maxVarSize: number;         // default: 100_000 chars per variable
}

export interface RlmExecutionBudget {
  maxTokensPerCall: number;   // default: 4_096
  maxTotalTokens: number;     // default: 100_000
  maxCalls: number;           // default: 50
  tokensUsed: number;         // running total
  callsMade: number;          // running total
}

export type RlmOperation =
  | "load"        // alias for store (paper terminology)
  | "store"       // create/overwrite a variable
  | "peek"        // read a variable (or slice)
  | "get"         // alias for peek (paper compatibility)
  | "list_vars"   // list all variable names + sizes
  | "delete_var"  // remove a variable
  | "execute"     // run JavaScript in sandbox
  | "finish"      // mark session complete, set result
  | "status";     // session metadata + budget remaining

export interface SubCallOpts {
  model?: string;           // override default model
  maxTokens?: number;       // override per-call token limit
  system?: string;          // system prompt for sub-call
  temperature?: number;     // 0-1, default 0
}

export interface ExecutionResult {
  log: string[];            // print() output
  result?: string;          // set by FINAL() or FINAL_VAR()
  tokensUsed: number;       // tokens consumed by sub_calls in this execution
  callsMade: number;        // number of sub_calls made in this execution
  error?: string;           // if execution failed
}
```

### Handler Pattern (`src/rlm/rlm-handler.ts`)

Follows the `ObservabilityGatewayHandler` pattern in `src/observability/gateway-handler.ts`:

- Zod input schema with `operation` enum + `args` record
- `handle(input: unknown): Promise<ToolResult>` entry point
- Input validated with `zod`, then routed by operation name
- Errors caught at top level, returned as `{ isError: true }` (never thrown to MCP layer)

Session is lazily created on first operation and stored as an instance field (one per handler instance, one handler instance per MCP connection).

### Execution Model (`src/rlm/rlm-executor.ts`)

```
User code string
    │
    ▼
Wrap in async IIFE: `(async () => { ${code} })()`
    │
    ▼
vm.Script compilation (syntax check)
    │
    ▼
vm.createContext with injected globals
    │
    ▼
Promise.race([
  script.runInContext(ctx),   // the code
  timeout(60_000)            // 60 second deadline
])
    │
    ├── FINAL(x) thrown → catch FinalSignal → set result
    ├── FINAL_VAR(x) thrown → catch FinalSignal → peek(x) → set result
    ├── Normal completion → return execution log
    ├── Timeout → return error "Execution timed out after 60s"
    └── Error → return error message
```

`FINAL()` and `FINAL_VAR()` work by throwing a special `FinalSignal` sentinel object (not an Error). The executor catches `FinalSignal` specifically and treats it as successful termination, not an error.

### Server Registration (`src/server-factory.ts`)

Follows the standalone tool pattern used by `observability_gateway` at lines 448-470:

```typescript
import { createRlmHandler, rlmInputSchema } from "./rlm/index.js";

// One handler per MCP connection (in-memory session state)
const rlmHandler = createRlmHandler();

server.registerTool("rlm_repl", {
  description: RLM_DESCRIPTION,
  inputSchema: rlmInputSchema,
}, async (toolArgs) => {
  const result = await rlmHandler.handle(toolArgs);
  return {
    content: result.content.map((block) => ({
      type: "text" as const,
      text: block.text,
    })),
    isError: result.isError,
  };
});
```

### MCP Resources (Phase 3)

Variable introspection via resource templates:

```typescript
server.registerResource(
  "rlm-var",
  new ResourceTemplate("rlm://vars/{name}", { list: undefined }),
  {
    description: "Read an RLM session variable",
    mimeType: "text/plain",
  },
  async (uri, { name }) => {
    const value = rlmHandler.peekVariable(name as string);
    return {
      contents: [{
        uri: uri.href,
        mimeType: "text/plain",
        text: value ?? "",
      }],
    };
  }
);
```

---

## Acceptance Criteria

### Phase 1: REPL Primitives

**AC-001**: Store and retrieve a variable
```
rlm_repl { operation: "store", args: { name: "ctx", value: "Hello world" } }
→ { stored: "ctx", size: 11 }

rlm_repl { operation: "peek", args: { name: "ctx" } }
→ { name: "ctx", value: "Hello world", size: 11 }
```

**AC-002**: Slice a large variable
```
rlm_repl { operation: "store", args: { name: "doc", value: "A".repeat(10000) } }
rlm_repl { operation: "peek", args: { name: "doc", start: 0, end: 500 } }
→ { name: "doc", value: "AAA...A" (500 chars), slice: [0, 500], totalSize: 10000 }
```

**AC-003**: List variables
```
rlm_repl { operation: "list_vars" }
→ { variables: [{ name: "ctx", size: 11, updated: "..." }, { name: "doc", size: 10000, updated: "..." }] }
```

**AC-004**: Delete a variable
```
rlm_repl { operation: "delete_var", args: { name: "doc" } }
→ { deleted: "doc" }

rlm_repl { operation: "peek", args: { name: "doc" } }
→ { error: "Variable 'doc' not found" }
```

**AC-005**: Finish session
```
rlm_repl { operation: "finish", args: { result: "The answer is 42" } }
→ { status: "finished", result: "The answer is 42" }

rlm_repl { operation: "store", args: { name: "x", value: "y" } }
→ { error: "Session is finished. Only peek, list_vars, and status are available." }
```

**AC-006**: Budget enforcement
```
rlm_repl { operation: "store", args: { name: "big", value: "X".repeat(200000) } }
→ { error: "Variable size 200000 exceeds maximum of 100000 characters" }
```

**AC-007**: Status reporting
```
rlm_repl { operation: "status" }
→ {
    sessionId: "...",
    status: "active",
    variableCount: 2,
    totalStoredChars: 10011,
    budget: { maxVariables: 100, maxTotalChars: 1000000, maxVarSize: 100000 },
    budgetRemaining: { variables: 98, totalChars: 989989 },
    sessionAge: "PT3M22S"
  }
```

**AC-008**: `npx tsc --noEmit` passes

### Phase 2: Sandboxed Execution

**AC-009**: Execute simple code with variable manipulation
```
rlm_repl { operation: "execute", args: { code: 'store("x", "hello"); FINAL(peek("x"))' } }
→ { log: [], result: "hello", tokensUsed: 0, callsMade: 0 }
```

**AC-010**: Execute code with sub_call
```
rlm_repl { operation: "execute", args: {
  code: 'const answer = await sub_call("What is 2+2? Reply with just the number."); FINAL(answer)'
} }
→ { log: [], result: "4", tokensUsed: ~50, callsMade: 1 }
```

**AC-011**: Budget enforcement on sub-calls
```
// After exhausting call budget
→ { error: "Sub-call budget exceeded: 50/50 calls used" }
```

**AC-012**: Timeout on infinite loop
```
rlm_repl { operation: "execute", args: { code: "while(true){}" } }
→ { error: "Execution timed out after 60 seconds" }
```

**AC-013**: Security — no access to Node globals
```
rlm_repl { operation: "execute", args: { code: "FINAL(typeof process)" } }
→ { result: "undefined" }

rlm_repl { operation: "execute", args: { code: "require('fs')" } }
→ { error: "require is not defined" }
```

**AC-014**: print() captured in log
```
rlm_repl { operation: "execute", args: { code: 'print("step 1"); print("step 2"); FINAL("done")' } }
→ { log: ["step 1", "step 2"], result: "done", tokensUsed: 0, callsMade: 0 }
```

**AC-015**: Graceful error when SDK unavailable
```
// When @anthropic-ai/sdk is not installed:
rlm_repl { operation: "execute", args: { code: 'await sub_call("hello")' } }
→ { error: "sub_call requires @anthropic-ai/sdk — install it with: npm install @anthropic-ai/sdk" }
```

**AC-016**: `npx tsc --noEmit` passes

### Phase 3: Integration

**AC-017**: Skill file exists and is discoverable
```
.claude/skills/rlm/SKILL.md exists and contains usage guidance
```

**AC-018**: Resource template returns variable content
```
Read resource: rlm://vars/ctx
→ "Hello world"
```

**AC-019**: Prompt template produces valid session instructions
```
Get prompt: rlm-session
→ Messages containing RLM system prompt
```

**AC-020**: Finish with saveAsThought creates a Thoughtbox thought
```
rlm_repl { operation: "finish", args: { result: "Analysis complete", saveAsThought: true } }
→ thought saved with tags ["rlm", "recursive-reasoning"]
```

---

## Implementation Phases

### Phase 1: REPL Primitives (Foundation)

**New files**:
- `src/rlm/rlm-types.ts`
- `src/rlm/rlm-handler.ts`
- `src/rlm/operations.ts`
- `src/rlm/index.ts`

**Modified files**:
- `src/server-factory.ts` — register `rlm_repl` tool

**Scope**: REQ-001 through REQ-008, AC-001 through AC-008

**Commit**: `feat(rlm): add REPL primitives as MCP tool`

### Phase 2: Sandboxed Execution (Execute + Sub-Call)

**New files**:
- `src/rlm/rlm-executor.ts`

**Modified files**:
- `src/rlm/rlm-handler.ts` — add `execute` operation routing
- `src/rlm/rlm-types.ts` — add execution-related types
- `src/rlm/operations.ts` — add `execute` operation schema

**Scope**: REQ-009 through REQ-014, AC-009 through AC-016

**Commit**: `feat(rlm): add sandboxed execution with sub_call`

### Phase 3: Claude Code Integration (Skill + Resources + Prompt)

**New files**:
- `.claude/skills/rlm/SKILL.md`

**Modified files**:
- `src/rlm/rlm-handler.ts` — Thoughtbox thought integration in `finish`
- `src/server-factory.ts` — register resource template + prompt

**Scope**: REQ-015 through REQ-018, AC-017 through AC-020

**Commit**: `feat(rlm): add Claude Code skill, resources, and prompt`

---

## Architecture Decisions

### ADR-001: Standalone Tool (not Gateway Operation)

**Decision**: Register `rlm_repl` as a standalone MCP tool, not as an operation inside `thoughtbox_gateway`.

**Rationale**:
- RLM sessions have a distinct lifecycle (no progressive disclosure, no init flow)
- Variable state is independent of Thoughtbox reasoning sessions
- No dependency on init/cipher/session handlers
- Follows the `observability_gateway` precedent for self-contained tools

**Consequences**: Separate tool name in client tool lists. No stage enforcement needed.

### ADR-002: In-Memory State Only

**Decision**: Session state lives in memory for the duration of the MCP connection. No disk persistence.

**Rationale**:
- Paper treats execution context as ephemeral
- Persisting variable state would require serialization strategy for arbitrarily large values
- Session results can be saved to Thoughtbox thoughts via `finish(saveAsThought: true)` if persistence is desired
- Simpler lifecycle — no cleanup, no stale state, no migration

**Consequences**: Closing the MCP connection loses all variables. This is intentional.

### ADR-003: JavaScript Execution (not Python)

**Decision**: The `execute` sandbox runs JavaScript, not Python.

**Rationale**:
- Native to the Node.js runtime (no external interpreter needed)
- `vm.createContext()` provides built-in sandboxing
- The paper's examples use Python but the paradigm is language-agnostic
- Claude generates JavaScript fluently

**Consequences**: Users expecting Python syntax from the paper will need to translate. The skill document should note this.

### ADR-004: Dynamic SDK Import

**Decision**: `@anthropic-ai/sdk` is loaded via dynamic `import()` at runtime, not a static import.

**Rationale**:
- SDK is currently a devDependency in package.json
- Moving to production dependency adds weight for users who don't need `execute`
- Dynamic import allows Phase 1 to work without the SDK
- Clear error message guides users to install if needed

**Consequences**: First `sub_call()` invocation incurs a small dynamic import cost. Subsequent calls reuse the cached module.

### ADR-005: vm.createContext Security Model

**Decision**: Use `vm.createContext()` for sandboxing, acknowledging it is NOT a true security boundary.

**Rationale**:
- Only Claude-generated code runs in the sandbox (not arbitrary user code)
- The sandbox prevents _accidental_ access to Node internals
- A true sandbox (isolated-vm, quickjs-emscripten) would add a native dependency
- The budget system (timeout, call limits, token limits) is the primary safety mechanism

**Consequences**: Do not run untrusted third-party code in the executor. Document this limitation.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `vm.createContext()` escape — code accesses Node internals | Low | High | Only Claude-generated code runs; explicit global deny-list; document limitation |
| Sub-call cost runaway — unexpected API bills | Medium | High | Hard budget: 50 calls max, 100K tokens max; per-call limit of 4096 tokens |
| Variable memory bloat — server OOM | Low | Medium | 1M char total limit per session; single session per connection |
| Async timeout race — execution hangs | Low | Medium | `Promise.race()` with 60s deadline; no `setTimeout`/`setInterval` in sandbox |
| SDK unavailable — Phase 2 non-functional | Low | Low | Graceful error; Phase 1 fully independent; clear install instructions |
| Prototype pollution via sandbox | Low | Medium | Freeze injected objects; no `__proto__` access in sandbox context |

---

## Example: End-to-End Usage

This example shows how Claude Code would use the RLM REPL to analyze a large document by decomposing it recursively.

### Step 1: Load the Problem

```
rlm_repl { operation: "store", args: {
  name: "document",
  value: "<10,000 word research paper>"
}}

rlm_repl { operation: "store", args: {
  name: "task",
  value: "Extract the 5 most important findings from this paper"
}}
```

### Step 2: Chunk and Process

```
rlm_repl { operation: "peek", args: { name: "document", start: 0, end: 2000 } }
// Read first 2000 chars → process mentally → store finding

rlm_repl { operation: "store", args: {
  name: "findings_section1",
  value: "1. Finding about X\n2. Finding about Y"
}}
```

### Step 3: Use Sub-Call for Fresh Reasoning

```
rlm_repl { operation: "execute", args: {
  code: `
    const section = peek("document").slice(4000, 8000);
    const findings = await sub_call(
      "Analyze this section and extract key findings:\\n" + section
    );
    store("findings_section2", findings);
    print("Section 2 processed");
  `
}}
```

### Step 4: Synthesize and Finish

```
rlm_repl { operation: "execute", args: {
  code: `
    const f1 = peek("findings_section1");
    const f2 = peek("findings_section2");
    const synthesis = await sub_call(
      "Synthesize these findings into a ranked top-5 list:\\n" + f1 + "\\n" + f2
    );
    FINAL(synthesis);
  `
}}
```

### Step 5: Save Result

```
rlm_repl { operation: "finish", args: {
  result: "<<synthesis from FINAL>>",
  saveAsThought: true
}}
```

---

## Dependencies

**Required** (already in project):
- `zod` — input validation
- Node.js `vm` module — sandboxed execution (built-in)
- Node.js `crypto` — UUID generation (built-in)

**Optional** (devDependency, already in project):
- `@anthropic-ai/sdk` — sub_call implementation

**None added**.

---

## References

- Zhang, S., Kraska, T., & Khattab, O. (2026). Recursive Language Models. _Proceedings of ICML 2026_. arXiv:2512.24601v2.
- Thoughtbox `observability_gateway` pattern: `src/observability/gateway-handler.ts`
- Thoughtbox `subagent-summarize` prompt: `src/server-factory.ts:673-724`
- MCP Tool Registration: `@modelcontextprotocol/sdk` McpServer.registerTool()
- Node.js `vm` module: https://nodejs.org/api/vm.html

---

**Ready for Implementation**: YES (after review)
**Estimated Effort**: 3-5 sessions (one per phase + testing)
**Confidence Score**: 0.85

---

**Last Updated**: 2026-02-13
**Author**: Claude Opus 4.6 + glassBead
