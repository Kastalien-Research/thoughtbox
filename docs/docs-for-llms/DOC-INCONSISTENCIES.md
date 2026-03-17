# Documentation Inconsistencies Audit

This file lists claims in `docs/docs-for-llms/` that are not clearly supported by the current codebase.

Last full audit: 2026-03-15.

## Fixed in 2026-03-15 update

These items from the 2026-03-07 audit have been resolved:

| Issue | Resolution |
|---|---|
| Version `1.3.0` in ARCHITECTURE.md vs `1.2.2` in package.json | Fixed: version updated to `1.2.2` |
| `restoreFromSession()` documented at `src/sessions/handlers.ts` but lives in `src/thought-handler.ts` | Fixed: path corrected |
| Event types documented as `thought_revised`, `session_loaded`, `cipher_loaded`, `stage_changed`, `session_started`, `session_exported` but code has `session_created`, `thought_added`, `branch_created`, `session_completed`, `export_requested` | Fixed: event types updated to match `src/events/types.ts` |
| `THOUGHTBOX_OBSERVATORY_HTTP_API` documented default `false` but code defaults to `true` | Fixed: default corrected to `true` |
| `THOUGHTBOX_EVENT_OUTPUT`, `THOUGHTBOX_EVENT_FILE`, `THOUGHTBOX_EVENT_TYPES` documented but not wired in code | Fixed: replaced with actual env vars `THOUGHTBOX_EVENTS_ENABLED` and `THOUGHTBOX_EVENTS_DEST` |
| `THOUGHTBOX_OBSERVATORY_MAX_CONNECTIONS` documented but env var is actually `THOUGHTBOX_OBSERVATORY_MAX_CONN` | Fixed: corrected to `THOUGHTBOX_OBSERVATORY_MAX_CONN` |
| Missing `supabase` as a `THOUGHTBOX_STORAGE` value | Fixed: added |
| Missing Supabase env vars, auth middleware, knowledge graph, hub tool, workspace model | Fixed: all added |

## Current findings

| Doc file | Claim | Evidence checked | Verdict | Notes |
|---|---|---|---|---|
| `TOOL-INTERFACES.md` | `thoughtbox_hub` enum does not include `quick_join` | `src/hub/hub-handler.ts` supports `quick_join` but `src/server-factory.ts` z.enum does not list it | Partial gap | `quick_join` works at handler level but is not in the server-factory tool registration enum. Documented as a note in TOOL-INTERFACES.md. |
| `TOOL-INTERFACES.md` | Gateway tool `inputSchema` uses `z.unknown()` for args | `src/gateway/gateway-handler.ts:89` uses `z.unknown()` | Known | Agents cannot see per-operation arg shapes via the gateway schema. Documented in `.claude/rules/mcp-gotchas.md`. |

## Not flagged as inconsistencies

These claims were checked and appear to be supported:

- `list_roots` and `bind_root` are real operations (`src/gateway/gateway-handler.ts`, `src/init/tool-handler.ts`, `src/init/operations.ts`).
- Observatory default port `1729` is correct (`src/observatory/config.ts`).
- `THOUGHTBOX_OBSERVATORY_HTTP_API` is a real env var with default `true`.
- Event streaming env vars `THOUGHTBOX_EVENTS_ENABLED` and `THOUGHTBOX_EVENTS_DEST` are wired in `src/events/event-emitter.ts:197-199`.
- All four MCP tools (`thoughtbox_gateway`, `thoughtbox_operations`, `thoughtbox_hub`, `observability_gateway`) match `src/server-factory.ts` registrations.
- Knowledge operations with `knowledge_` prefix match `src/gateway/gateway-handler.ts` operation enum.
- Supabase storage tables match `supabase/migrations/20260313000000_create_product_schema.sql`.
- Auth workspace tables match `supabase/migrations/20260313100000_auth_workspace_tables.sql`.
- Auth middleware (`src/middleware/auth.ts`) uses JWKS validation as documented.