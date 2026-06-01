# Runtime And Tool Surface Map

## Entrypoints

- Package scripts make `src/index.ts` the dev server and `dist/index.js` the
  production server. See `package.json`.
- `src/index.ts` creates an Express MCP app and mounts `/mcp`.
- Storage is selected in `src/index.ts`: `supabase`, `memory`, or filesystem.
- `src/index.ts` creates a per-session `McpServer` through
  `src/server-factory.ts`.
- Docker uses the same HTTP entrypoint.
- The observability MCP sidecar is separate and proxies JSON-RPC POST upstream.
- The Claude Code channel plugin is a separate stdio MCP bridge, not the main
  server.

High-level flow:

```text
pnpm dev / node dist/index.js
  -> src/index.ts startHttpServer()
  -> createStorage()
  -> createMcpExpressApp()
  -> app.all("/mcp")
  -> auth/workspace resolution
  -> createMcpServer()
  -> StreamableHTTPServerTransport
  -> tools/prompts/resources
```

## Actual Public MCP Tools

The current public tool surface is exactly three tools:

- `thoughtbox_search`
- `thoughtbox_execute`
- `thoughtbox_peer_notebook`

`src/server-factory.ts` registers these three tools. Direct older tool classes
such as thought/session/knowledge/notebook are implementation dependencies
behind `thoughtbox_execute`, not public MCP tools.

## Code Mode

`thoughtbox_search`:

- Owner: `src/code-mode/search-tool.ts`.
- Input: JavaScript async arrow function over a frozen catalog.
- Catalog owner: `src/code-mode/search-index.ts`.
- Catalog modules: `session`, `thought`, `knowledge`, `notebook`, `theseus`,
  `ulysses`, `observability`, `branch`.
- Important absence: legacy `init` and `hub` are intentionally absent from the
  Code Mode catalog text.

`thoughtbox_execute`:

- Owner: `src/code-mode/execute-tool.ts`.
- Input: JavaScript async arrow function over `tb`.
- `tb` exposes `thought`, `session`, `knowledge`, `notebook`, `theseus`,
  `ulysses`, `observability`, and `branch`.
- Important absence: no verified `tb.hub`.
- It uses `node:vm` as an execution sandbox with result/log limits.

## Peer Notebook Pilot

`thoughtbox_peer_notebook`:

- Owner: `src/peer-notebook/tool.ts`.
- Handler: `src/peer-notebook/handler.ts`.
- Repository contract: `src/peer-notebook/repositories.ts`.
- Supabase repository: `src/peer-notebook/supabase-repository.ts`.
- Bootstrap peer: `claim-extractor`.
- Bootstrap exposed tool: `extract_claims`.
- Active runtime provider today: `mock`.

Operations:

- `peer_artifact_seed`
- `peer_invoke`
- `peer_get_invocation`
- `peer_list_trace_events`
- `peer_get_artifact`

The resource `thoughtbox://peer-notebook/pilot` accurately describes this as a
pilot with mock runtime and several deferred production paths.

## Prompts And Resources

Prompts and resources are live MCP surfaces:

- Prompts are registered in `src/server-factory.ts`.
- Static resources and resource templates are registered in
  `src/server-factory.ts`.
- Custom list handlers override resource/resource-template listing.

Important drift:

- `list_mcp_assets` says 3 public tools, but its counts for prompts/resources
  are stale.
- Some prompt/resource text still mentions old direct tools.
- `thoughtbox://gateway/operations` appears in resource listing metadata, but
  no matching read handler was found in this pass.

## Apparently Orphaned Or Stale Tool Surfaces

- `thoughtbox_operations` has a handler in `src/operations-tool/handler.ts` and
  is discussed in ADR/spec material, but no registration was found in
  `src/server-factory.ts`.
- Hub has mature operation catalog/schema/handler code under `src/hub`, but no
  public MCP registration and no `tb.hub`.
- `package.json` has `start:stateful` pointing to `dist/http-stateful.js`, but
  no corresponding `src/http-stateful.ts` was found.
- README claims around "exactly two MCP tools" and Hub through Code Mode are
  stale against source.

## Cleanup Implication

Treat Code Mode plus peer notebook as the current public MCP boundary. Treat
legacy direct tool classes as internal implementation until a later cleanup
decides whether to remove or re-expose them.
