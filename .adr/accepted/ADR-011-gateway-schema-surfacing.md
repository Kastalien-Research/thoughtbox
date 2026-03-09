# ADR-011: Gateway Operation Schema Surfacing

**Status**: Accepted
**Date**: 2026-03-08
**Deciders**: Thoughtbox development team

## Context

The Thoughtbox MCP server gateway tool (`thoughtbox_gateway`) declares its `args` parameter as `Record<string, unknown>` -- an opaque bag. Per-operation schemas exist in dedicated `operations.ts` files across 7 modules (gateway, init, sessions, notebook, hub, knowledge, mental-models), but the current surfacing mechanism has two problems:

1. **Schemas are surfaced too late.** An agent only sees the schema for an operation after successfully calling it. The schema is appended as a resource block to the response (gateway-handler.ts lines 384-410). There is no way for an agent to discover what arguments an operation accepts before calling it.

2. **Schemas are surfaced too often.** The resource block is appended to every successful response, not just the first. The `thought` operation schema is ~5,000 characters of JSON. A 10-thought reasoning session wastes ~50,000 characters of repeated schema -- negating the token savings from the cipher notation system.

### Token waste measurement

The `thought` operation's `inputSchema` in `src/gateway/operations.ts` declares 18 properties including nested objects (`actionResult`, `beliefs`, `assumptionChange`, `contextData`, `progressData`). Serialized with 2-space indent, the full operation definition is ~5,000 characters. The `read_thoughts` schema adds ~1,200 characters. A typical session calling `thought` 10 times and `read_thoughts` 3 times embeds ~53,600 characters of schema that the agent already received on the first call.

### Existing infrastructure

Per-operation resource templates already exist for all 7 modules:
- `thoughtbox://gateway/operations/{op}` (registered in server-factory.ts line 1356)
- `thoughtbox://init/operations/{op}` (line 1367)
- `thoughtbox://session/operations/{op}` (line 1378)
- `thoughtbox://knowledge/operations/{op}` (line 1389)
- `thoughtbox://hub/operations/{op}` (line 1400)
- `thoughtbox://notebook/operations/{op}` (line 1411)

Each handler module exports `getOperation(name)` and `getOperationsCatalog()` with a consistent `OperationDefinition` interface.

The gateway handler tracks per-session state via maps: `sessionStages`, `sessionAgentIds`, `sessionAgentNames` (gateway-handler.ts lines 205-210).

### Constraints from existing ADRs

- **ADR-002 Pattern #6 (self-describing responses)**: STILL VALID. The principle that responses should help agents understand what to do next is sound. ADR-011 refines WHEN the schema is embedded: first call only, not every call. The standalone catalog tool provides an additional discovery path that satisfies the same principle.
- **ADR-009 (passthrough rule)**: STILL VALID. No new fields flow through the gateway in this change. The passthrough rule (handler + type cast + schema declaration) applies to future changes, not this one.

## Decision

Two-part fix:

### Part 1: First-call-only schema embedding

Add a `sessionSchemasSeen: Map<string, Set<string>>` to `GatewayHandler`. Track which operations have had their schema resource block embedded per MCP session. On each successful call:
- If the operation has NOT been seen for this session: embed the schema resource block (existing behavior) and add the operation to the seen set.
- If the operation HAS been seen: skip the resource block.

Clean up the seen set when `cleanupSession()` is called.

This preserves ADR-002 Pattern #6 for the first encounter while eliminating the waste on subsequent calls.

### Part 2: Standalone operations catalog tool

Register a new MCP tool called `thoughtbox_operations` at Stage 0 (always available, no session required). This tool provides three operations:

- **`list`** -- All operations grouped by module with name, title, description, category. No inputSchema (lightweight).
- **`get`** -- Full schema for a single operation by name, including inputSchema and example.
- **`search`** -- Case-insensitive keyword search across operation names, titles, and descriptions.

The tool aggregates the 7 existing `getOperationsCatalog()` / `getOperation()` functions. It does not duplicate schema data -- it reads from the same `OperationDefinition` arrays that the resource templates use.

This is a standalone tool, not embedded in `get_state` responses. Agents can call it proactively before their first gateway call to understand the full API surface.

### Why a tool and not just resources

MCP resource templates (`thoughtbox://gateway/operations/{op}`) exist but have limited utility:
1. Most MCP clients (Claude Desktop, Claude Code) do not proactively browse resource templates.
2. Agents must know the exact URI to read a resource -- they cannot search or browse.
3. A tool appears in the tool list, which agents inspect on connection. A resource template does not.

The tool provides active discoverability. The resource templates remain as a passive fallback.

## Consequences

### Positive

- **Token savings**: A 10-thought session saves ~45,000 characters of repeated schema (9 repetitions * ~5,000 chars).
- **Proactive discovery**: Agents can call `thoughtbox_operations { operation: "list" }` immediately after connecting to understand the full API surface. No trial-and-error required.
- **Search**: `thoughtbox_operations { operation: "search", args: { query: "branch" } }` finds branching-related operations across all modules -- something the resource templates cannot do.
- **Backward compatible**: First-call embedding preserves the self-describing behavior for agents that do not call `thoughtbox_operations`. Existing resource templates are unchanged.

### Tradeoffs

- One more tool in the tool list (mitigated: registered at Stage 0, lightweight, no session state).
- Hub catalog is large (27 operations). The `list` operation returns summaries without inputSchema to keep the response size manageable. Full schemas are available on demand via `get`.
- Agents that depend on seeing the schema on every response will see it only once. This is intentional -- the schema does not change within a session.

### Follow-ups

- Consider extending `thoughtbox_operations` with a `changes` operation that lists operations added or modified since a given server version (for upgrade discovery).
- If token waste analysis shows that even first-call embedding is too expensive, add a server config flag to disable all automatic schema embedding, relying entirely on `thoughtbox_operations`.

## Hypotheses

### Hypothesis 1: First-call-only schema embedding reduces per-session token waste by >80%

**Prediction**: In a 10-thought session with 3 `read_thoughts` calls, total schema bytes embedded drops from ~53,600 characters (13 embeddings) to ~6,200 characters (2 embeddings: 1 for `thought`, 1 for `read_thoughts`). This is an 88% reduction.
**Validation**: Run a 10-thought + 3-read session via MCP. Count resource blocks with URI matching `thoughtbox://*/operations/*` in all 13 responses. Expect exactly 2 resource blocks total (1 in the first thought response, 1 in the first read_thoughts response).
**Outcome**: VALIDATED — Live test: 3-thought session confirmed schema on thought #1 only, omitted on #2 and #3. Unit tests (5/5) cover first-call, second-call, cross-operation, cleanup, and cross-session isolation.

### Hypothesis 2: Standalone operations catalog tool returns complete data from all 7 modules

**Prediction**: Calling `thoughtbox_operations { operation: "list" }` returns a `modules` array with 7 entries (gateway, init, session, notebook, hub, knowledge, mental-models). The `totalOperations` count matches the sum of all `*_OPERATIONS` arrays across the 7 modules.
**Validation**: Call `list`, count modules and operations. Cross-reference with `GATEWAY_OPERATIONS.length` (5) + `INIT_OPERATIONS.length` (7) + `SESSION_OPERATIONS.length` (8) + `NOTEBOOK_OPERATIONS.length` + `HUB_OPERATIONS.length` (27) + `KNOWLEDGE_OPERATIONS.length` + mental-models count.
**Outcome**: VALIDATED — Live: `list` returned 7 modules, 69 total operations. Unit tests (16/16) verify all modules, counts, get, search, and error handling.

### Hypothesis 3: Operations tool is callable at Stage 0 without session initialization

**Prediction**: Immediately after MCP connection (before `init`, `start_new`, or `cipher`), calling `thoughtbox_operations { operation: "get", args: { name: "thought" } }` returns the full `thought` operation schema with inputSchema, example, and module fields.
**Validation**: Connect to MCP server, call `thoughtbox_operations` as the first tool call (before any gateway call). Verify the response contains the `thought` inputSchema with all 18 properties.
**Outcome**: VALIDATED — Live: called `thoughtbox_operations` before any gateway calls, returned full thought schema. Registration test confirms STAGE_0_ENTRY.

### Hypothesis 4: Search finds operations across module boundaries

**Prediction**: Calling `thoughtbox_operations { operation: "search", args: { query: "session" } }` returns matches from at least 3 modules: init (`list_sessions`), session (`list`, `get`, `search`, `resume`, `export`, `analyze`), and gateway (`read_thoughts` -- description mentions "session").
**Validation**: Call `search` with query "session". Verify matches span at least 3 distinct modules.
**Outcome**: VALIDATED — Live: 14 matches across 3 modules (gateway, init, session). Unit tests confirm cross-module search.

## Spec

[SPEC-GW-011: Gateway Schema Surfacing](../../.specs/SPEC-GW-011-gateway-schema-surfacing.md)

## Links

- [ADR-002: Key Patterns](../accepted/ADR-002-key-patterns.md) -- Pattern #6 (self-describing responses): disposition STILL VALID, refined by this ADR
- [ADR-009: Merge Auditability Experiments](../accepted/ADR-009-merge-auditability-experiments.md) -- passthrough rule: disposition STILL VALID, not applicable to this change
- [ADR-010: Observatory Structured Rendering](../accepted/ADR-010-observatory-structured-rendering.md) -- unrelated but contemporaneous
- `src/gateway/gateway-handler.ts` -- schema embedding logic (lines 384-410)
- `src/gateway/operations.ts` -- gateway operations catalog
- `src/server-factory.ts` -- tool and resource registration
- `src/tool-registry.ts` -- progressive disclosure stages
