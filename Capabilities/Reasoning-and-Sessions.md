 # Reasoning and Sessions
 
 This document covers the structured reasoning capabilities and session lifecycle exposed through `thoughtbox_gateway` (and the underlying handlers).
 
 ## Core reasoning (`thought` operation)
 
 The Thoughtbox reasoning engine supports:
 
 - Sequential reasoning with optional thought numbering and auto-assignment.
 - Branching from any prior thought using `branchFromThought` + `branchId`.
 - Revisions of previous thoughts with `isRevision` + `revisesThought`.
 - Optional critique via MCP sampling (`critique: true`).
 - Optional RLM (recursive language model) runs (`rlm: true`, `rlmQuery` required).
 - Minimal or verbose responses (`verbose: true` for full metadata).
 - Automatic session creation on first thought if no session is active.
 
 Thought history is persisted, with linked nodes that track `prev`, `next`, `revisesNode`, and `branchOrigin` for structural queries.

## Phase 3: Autonomous sampling loops

Thoughtbox supports two advanced reasoning features that leverage MCP's `sampling/createMessage` primitive to invoke external LLMs autonomously:

### Critique mechanism

When `critique: true` is passed to a thought operation, Thoughtbox automatically:

1. Sends the thought content to an external LLM configured as a critical thinking expert
2. Receives constructive feedback on logical fallacies, assumptions, edge cases, and improvements
3. Returns the critique alongside the thought response for agent consideration

**Purpose**: Quality improvement through automated peer review
**Implementation**: `sampling/handler.ts` (CRITIC_SYSTEM_PROMPT, critique logic)
**Use case**: Complex reasoning where systematic error-checking adds value

### RLM (Recursive Language Model)

When `rlm: true` and `rlmQuery` are provided, Thoughtbox executes a recursive depth-1 LLM orchestration:

1. **Root LLM**: Operates in a JavaScript REPL sandbox with access to context
2. **Sub-LLM calls**: Root can invoke `llm_query(prompt)` for sub-queries (max 12 iterations)
3. **Execution**: Root writes `repl` code blocks that are executed in a VM
4. **Finalization**: Root returns result via `FINAL(value)` or `FINAL_VAR(varName)`

**Purpose**: Complex multi-step reasoning requiring external knowledge lookups or decomposition
**Implementation**: `sampling/rlm.ts` (ROOT_SYSTEM_PROMPT, REPL orchestration, iteration management)
**Use case**: Research tasks, fact verification, multi-source synthesis

**RLM constraints**:
- Maximum 12 iterations (configurable)
- 5-second execution timeout per REPL block
- No network/filesystem access (sandboxed VM)
- Sub-queries are metered and logged

Both features are optional and independent - thoughts can use critique alone, RLM alone, both, or neither.

 ## Cipher protocol
 
 The cipher is a formal protocol for compact, structured thought content. It defines:
 
 - Typed thought markers (H/E/C/Q/R/P/O/A/X).
 - Reference syntax (e.g., `[S1]`, `^[S2]`).
 - Logical operators and confidence markers.
 
 Accessed through:
 
 - `thoughtbox_gateway` operation: `cipher`
 - Resource: `thoughtbox://cipher`
 
 ## Session lifecycle
 
 Sessions are persistent reasoning workspaces. Capabilities include:
 
 - Auto-creation on first thought.
 - Load and resume existing sessions.
 - Export to JSON/Markdown/Cipher formats.
 - Auto-export on session completion.
 - Integrity checks before loading (filesystem mode).
 
 When `nextThoughtNeeded` is `false`, sessions are closed and auto-exported to `~/.thoughtbox/exports/`.

## Session continuity (SIL-103)

When loading an existing session via `load_context`, Thoughtbox automatically restores the full reasoning state:

- **Thought history**: All previous thoughts and their metadata
- **Current thought number**: Picks up where the session left off
- **Branch structure**: Preserves all branch points and branch IDs
- **Next thought assignment**: The next thought will be auto-numbered correctly

This enables true session resumption - agents can continue thinking seamlessly across multiple interactions without losing context or breaking thought numbering.

**Implementation**: `gateway-handler.ts:290-308`

**Usage pattern**:
1. User starts session, thinks through thoughts 1-5, sets `nextThoughtNeeded: true`
2. Session is stored but remains "active"
3. Later, user calls `load_context` with the session ID
4. Server restores thought handler state automatically
5. Next thought call will be correctly numbered as thought 6

This differs from simple session retrieval - the internal thought handler is fully reconstituted, not just the data structure.

 ## Session operations (via `thoughtbox_gateway` → `session`)
 
 - `list`: list sessions with pagination and tag filters
 - `get`: retrieve full session details (thoughts and branches)
 - `search`: search sessions by title/tags
 - `resume`: load a session into the active ThoughtHandler
 - `export`: export to `markdown`, `cipher`, or `json`
 - `analyze`: structural analysis (linearity, revision rate, depth, density)
 - `extract_learnings`: produce patterns/anti-patterns/signals for evolution
 - `discovery`: list/hide/show discovered tools (SPEC-009)
 
 Export supports optional anchor resolution to cross-reference other sessions.
 
 ## Gateway reasoning helpers
 
 `thoughtbox_gateway` exposes helper operations for working with active sessions:
 
 - `read_thoughts`: read previous thoughts (single, range, branch, or last N)
 - `get_structure`: retrieve graph topology (main chain, branches, revisions)
 - `deep_analysis`: derive pattern/cognitive-load/decision-point summaries
 
 ## Cross-session references (SPEC-003)
 
 Thought content can include anchor syntax (`@keyword:S42` or `@keyword:S1-S3`).
 
 - Anchor parsing and resolution is used during export (`format: json`, `resolveAnchors: true`)
 - Resolution strategies: aliases, tags, title similarity
 
 ## Thought graph resources (SPEC-001)
 
 Resource templates expose thought queries:
 
 - `thoughtbox://thoughts/{sessionId}/{type}`
 - `thoughtbox://thoughts/{sessionId}/range/{start}-{end}`
 - `thoughtbox://references/{sessionId}/{thoughtNumber}`
 - `thoughtbox://revisions/{sessionId}/{thoughtNumber}`
 
 These queries use the linked export structure for type/range/revision lookups.
 
 ## Session analysis resources
 
 - `thoughtbox://session-analysis-guide` explains qualitative analysis workflow
 - Session analysis metrics are designed to feed DGM evolution workflows
 
 ## Behavioral tests
 
 Behavioral tests are available as both prompts and resources:
 
 - `test-thoughtbox` / `thoughtbox://tests/thoughtbox`
 - `test-memory` / `thoughtbox://tests/knowledge`
 
 These specify intended behavior for sequential thinking, branching, revisions, and auto-assignment.
