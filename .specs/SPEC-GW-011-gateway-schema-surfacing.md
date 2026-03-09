# SPEC-GW-011: Gateway Operation Schema Surfacing

> **Status**: Draft
> **Priority**: High
> **Phase**: Optimization
> **Estimated Effort**: 4-6 hours
> **Source**: Token waste analysis -- repeated schema embedding on every successful gateway call
> **ADR**: ADR-011-gateway-schema-surfacing

## Summary

Two changes to how operation schemas reach agents: (1) embed per-operation schema resource blocks only on the first successful call per operation per MCP session, and (2) register a standalone `thoughtbox_operations` tool that lets agents discover schemas on demand without calling the operations themselves.

## Problem Statement

The gateway handler (lines 384-410 of `gateway-handler.ts`) appends a JSON resource block containing the full operation schema to every successful response. The `thought` operation schema alone is ~5,000 characters of JSON. In a 10-thought reasoning session, this produces ~50,000 characters of repeated schema data -- more than the cipher notation saves.

The schemas are valuable on first encounter (ADR-002 Pattern #6: self-describing responses). They are pure waste on subsequent calls to the same operation in the same session.

Additionally, agents cannot discover operation schemas before calling the operation. The existing MCP resource templates (`thoughtbox://gateway/operations/{op}`) require the agent to know the resource URI and issue a `resources/read` call -- a mechanism most MCP clients do not exercise proactively.

## Scope

### In Scope

1. First-call-only schema embedding in GatewayHandler
2. New `thoughtbox_operations` MCP tool with `list`, `get`, `search` operations
3. Aggregation of all 7 existing operations catalogs into the new tool

### Out of Scope

- Changing the schema content itself (operation definitions stay as-is)
- Modifying progressive disclosure stages
- Removing existing resource templates (they remain for clients that use `resources/read`)

## Requirements

### R1: First-Call-Only Schema Embedding

Add a per-session tracking map to GatewayHandler:

```typescript
private sessionSchemasSeen = new Map<string, Set<string>>();
```

On each successful gateway call:
1. Look up the MCP session ID in `sessionSchemasSeen`
2. If the operation has NOT been seen for this session, embed the schema resource block (existing behavior) and add the operation to the seen set
3. If the operation HAS been seen, skip the resource block entirely

Session cleanup: when `cleanupSession(mcpSessionId)` is called, delete the entry from `sessionSchemasSeen`.

### R2: `thoughtbox_operations` Tool

A new MCP tool registered at Stage 0 (always available, no session required). This tool aggregates the 7 existing operations catalogs:

| Catalog Module | Import Function |
|---|---|
| `src/gateway/operations.ts` | `getOperationsCatalog()`, `getOperation()` |
| `src/init/operations.ts` | `getOperationsCatalog()`, `getOperation()` |
| `src/sessions/operations.ts` | `getOperationsCatalog()`, `getOperation()` |
| `src/notebook/operations.ts` | `getOperationsCatalog()`, `getOperation()` |
| `src/hub/operations.ts` | `getOperationsCatalog()`, `getOperation()` |
| `src/knowledge/operations.ts` | `getOperationsCatalog()`, `getOperation()` |
| `src/mental-models/operations.ts` | `getOperationsCatalog()`, `getOperation()` |

#### Tool Definition

```typescript
{
  name: 'thoughtbox_operations',
  description: 'Discover available Thoughtbox operations and their schemas. Always available -- no session required.',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['list', 'get', 'search'],
        description: 'list: all operations grouped by module; get: full schema for one operation; search: find operations by keyword'
      },
      args: {
        type: 'object',
        description: 'Operation-specific arguments',
        properties: {
          name: {
            type: 'string',
            description: 'Operation name (required for get)'
          },
          query: {
            type: 'string',
            description: 'Search keyword (required for search)'
          },
          module: {
            type: 'string',
            enum: ['gateway', 'init', 'session', 'notebook', 'hub', 'knowledge', 'mental-models'],
            description: 'Filter to a specific module (optional for list and search)'
          }
        }
      }
    },
    required: ['operation']
  }
}
```

#### Operations

**`list`** -- Return all operations grouped by module. Each entry includes: `name`, `title`, `description`, `category`. Does NOT include `inputSchema` (use `get` for that). Optional `module` filter narrows to one module.

Response shape:
```json
{
  "modules": [
    {
      "module": "gateway",
      "operations": [
        { "name": "thought", "title": "Record Thought", "description": "...", "category": "reasoning" }
      ]
    }
  ],
  "totalOperations": 48
}
```

**`get`** -- Return full schema for a single operation by name. Includes `inputSchema`, `example`, `category`, `description`, and `module` (which catalog it belongs to). Returns error if operation name not found.

Response shape:
```json
{
  "name": "thought",
  "title": "Record Thought",
  "module": "gateway",
  "category": "reasoning",
  "description": "...",
  "inputSchema": { "..." : "..." },
  "example": { "..." : "..." }
}
```

**`search`** -- Case-insensitive keyword match against operation `name`, `title`, and `description`. Returns matching operations in `list` format (without inputSchema). Optional `module` filter.

Response shape:
```json
{
  "query": "session",
  "matches": [
    { "name": "list_sessions", "title": "List Sessions", "module": "init", "category": "navigation", "description": "..." }
  ],
  "totalMatches": 5
}
```

### R3: Implementation Location

| File | Action | Description |
|---|---|---|
| `src/gateway/gateway-handler.ts` | Modify | Add `sessionSchemasSeen` map; guard schema embedding with seen check; clean up on session end |
| `src/operations-tool/handler.ts` | Create | Handler for `thoughtbox_operations` tool -- aggregates catalogs, dispatches list/get/search |
| `src/operations-tool/index.ts` | Create | Barrel export |
| `src/server-factory.ts` | Modify | Import and register `thoughtbox_operations` tool at Stage 0 |

### R4: Data Flow

```
Agent calls thoughtbox_operations { operation: "get", args: { name: "thought" } }
  -> server-factory routes to OperationsToolHandler.handle()
    -> handler calls getOperation("thought") from gateway/operations.ts
    -> returns full OperationDefinition with inputSchema
```

```
Agent calls thoughtbox_gateway { operation: "thought", args: { ... } }
  -> gateway-handler processes thought
  -> checks sessionSchemasSeen for (mcpSessionId, "thought")
    -> NOT seen: embed schema resource block, add to seen set
    -> SEEN: skip resource block
  -> returns result
```

### R5: Operation Name Collisions

Some operation names exist in multiple modules (e.g., `list` appears in sessions and hub). The `get` operation resolves this by searching modules in a fixed priority order: gateway, init, session, notebook, hub, knowledge, mental-models. If the optional `module` filter is provided, it searches only that module.

The `list` and `search` operations always include the `module` field in results, so collisions are visible to the caller.

## Acceptance Criteria

1. **AC-1**: In a 10-thought session, the `thought` operation schema resource block appears in exactly 1 of 10 responses (the first).
2. **AC-2**: Calling `thoughtbox_operations { operation: "list" }` returns operations from all 7 modules with correct counts.
3. **AC-3**: Calling `thoughtbox_operations { operation: "get", args: { name: "thought" } }` returns the full inputSchema matching what `getOperation("thought")` from `gateway/operations.ts` returns.
4. **AC-4**: Calling `thoughtbox_operations { operation: "search", args: { query: "session" } }` returns operations from multiple modules (at minimum: init's `list_sessions`, session's `list`, session's `search`).
5. **AC-5**: `thoughtbox_operations` is callable at Stage 0 -- no `init`, `start_new`, or `cipher` required.
6. **AC-6**: Existing resource templates (`thoughtbox://gateway/operations/{op}` etc.) continue to work unchanged.
7. **AC-7**: `sessionSchemasSeen` is cleaned up when `cleanupSession()` is called (no memory leak).
8. **AC-8**: Second call to the same gateway operation in the same session does NOT contain a resource block with URI matching `thoughtbox://*/operations/*`.

## Files Referenced

- `src/gateway/gateway-handler.ts` -- schema embedding (lines 384-410), session maps (lines 205-210), cleanup
- `src/gateway/operations.ts` -- `GATEWAY_OPERATIONS`, `getOperation()`, `getOperationsCatalog()`
- `src/init/operations.ts` -- `INIT_OPERATIONS`, same API surface
- `src/sessions/operations.ts` -- `SESSION_OPERATIONS`, same API surface
- `src/notebook/operations.ts` -- `NOTEBOOK_OPERATIONS`, same API surface
- `src/hub/operations.ts` -- `HUB_OPERATIONS` (27 operations with stage metadata)
- `src/knowledge/operations.ts` -- `KNOWLEDGE_OPERATIONS`, same API surface
- `src/mental-models/operations.ts` -- mental models catalog, same API surface
- `src/server-factory.ts` -- tool registration, resource registration
- `src/tool-registry.ts` -- `DisclosureStage` enum, `ToolRegistry` class
