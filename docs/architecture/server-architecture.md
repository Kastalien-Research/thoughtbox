# Server Architecture

## Overview

Thoughtbox is a Node.js MCP server that exposes two tools over Streamable HTTP transport. Clients connect to `POST /mcp` and interact using the MCP protocol (JSON-RPC over HTTP with server-sent events).

Package: `@kastalien-research/thoughtbox` v1.2.2
Runtime: Node 22, ESM only, TypeScript

## MCP Tool Surface

The server uses **Code Mode** — instead of exposing dozens of individual tools, it exposes two:

| Tool | Purpose |
|------|---------|
| `thoughtbox_search` | Query the operation/prompt/resource catalog. Returns matching operations with their schemas. |
| `thoughtbox_execute` | Execute JavaScript code against the `tb` SDK to chain operations. |

The client discovers available operations via `thoughtbox_search`, then writes JavaScript that calls them via `thoughtbox_execute`. This keeps the tool count minimal while exposing the full API surface.

### Operations available through Code Mode

The operations are organized by domain:

**Thought operations**: Record structured thoughts (reasoning, decisions, actions, beliefs, assumptions, context, progress), get thoughts, continue chains, revise thoughts, branch.

**Session operations**: Create sessions, list sessions, get session details, complete/abandon sessions, export, merge, tag, search.

**Knowledge operations**: Create entities, add observations, create relations, query graph, search observations (full-text), open/close entities, delete entities/relations.

**Notebook operations**: Literate programming notebooks — create, add cells, execute, get results.

**Protocol operations (Theseus + Ulysses)**: Start/end protocol sessions, manage scope, grant visas, run audits, record history.

**Observability operations**: Gateway for monitoring data.

**Hub operations**: Multi-agent collaboration — workspaces, problems, proposals, consensus, channels.

## Storage Backends

The server supports three storage backends, selected by `THOUGHTBOX_STORAGE` env var:

| Backend | Env value | When | Knowledge graph |
|---------|-----------|------|-----------------|
| FileSystem | `fs` (default) | Local/self-hosted | No |
| Supabase | `supabase` | Deployed (Cloud Run) | Yes |
| In-Memory | `memory` | Testing | No |

### Supabase storage (deployed)

When `THOUGHTBOX_STORAGE=supabase`:
- Storage is instantiated **per-request** with the resolved `workspaceId`
- `SupabaseStorage` handles sessions and thoughts
- `SupabaseKnowledgeStorage` handles entities, relations, observations
- All queries include `workspace_id` for tenant isolation
- Uses `service_role` key (bypasses RLS)

### FileSystem storage (local)

When `THOUGHTBOX_STORAGE=fs`:
- Data stored under `~/.thoughtbox` (or `THOUGHTBOX_DATA_DIR`)
- Sessions as JSON files, partitioned monthly
- No workspace scoping (single-user)
- No knowledge graph support

## Request Lifecycle

```
1. HTTP request arrives at /mcp
2. Extract API key (Bearer header or ?key= query param)
3. Resolve key -> workspace_id
   - tbx_* prefix: lookup in api_keys table, bcrypt verify
   - Static key match: 'default-workspace'
   - No key + supabase mode: 401
4. Look up existing MCP session (via mcp-session-id header)
   - Found: route to existing transport
   - Not found: create new session
5. Instantiate workspace-scoped storage
6. Create MCP server with tools bound to that storage
7. Handle MCP request (JSON-RPC)
8. Return response (or SSE stream for notifications)
```

## Session Management

MCP sessions are held in-memory (`Map<string, SessionEntry>`). Each session has:
- A `StreamableHTTPServerTransport` (handles the HTTP<->MCP bridge)
- A configured `McpServer` instance with tools bound to workspace-scoped storage

Sessions are created on first request and destroyed on HTTP DELETE or transport close.

**Important**: Because sessions are in-memory, Cloud Run must route repeat requests to the same instance. This is handled by `sessionAffinity: true` in the Cloud Run config. With `maxScale: 1`, all requests hit the same instance. Scaling beyond 1 requires externalizing session state (e.g., Redis).

## Source Layout

```
src/
  index.ts              Entry point — HTTP server, auth, session management
  server-factory.ts     Creates MCP server instances with tools
  types.ts              Shared type definitions
  database.types.ts     Generated Supabase types

  auth/                 API key resolution
  code-mode/            Code Mode search + execute tools
  thought/              Thought recording and retrieval
  sessions/             Session CRUD
  knowledge/            Knowledge graph (entities, relations, observations)
  notebook/             Literate programming notebooks
  protocol/             Theseus + Ulysses protocol handlers
  hub/                  Multi-agent collaboration (workspaces, problems, proposals)
  channel/              Hub event channels (SSE)
  persistence/          Storage backends (FS, Supabase, in-memory)
  observatory/          Debug UI server (optional)
  evaluation/           LangSmith tracing integration
  multi-agent/          Agent identity and attribution
  audit/                Audit trail
  events/               Event system
  resources/            MCP resources
  prompts/              MCP prompts
```
