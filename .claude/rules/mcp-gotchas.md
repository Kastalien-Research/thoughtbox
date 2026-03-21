---
paths:
  - "src/**"
---

# MCP Gotchas

Verified parameter names and known bugs for MCP tool APIs.

## Knowledge Graph API (re-verified 2026-03-13)

| Operation | Correct Params | NOT These |
|-----------|---------------|-----------|
| `add_observation` | `entity_id` + `content` | ~~entityId~~, ~~observation~~ |
| `create_relation` | `from_id` + `to_id` | ~~source_id~~, ~~target_id~~ |
| `query_graph` | `start_entity_id` | ~~entity_id~~ |

- `query_graph` only follows OUTGOING relations
- `create_entity` returns existing entity on UNIQUE(name,type) collision — use `add_observation` for corroborating evidence
- Re-registering on Hub gives new agentId — lose coordinator role permanently

## Sub-Agent MCP Tool Access (VERIFIED 2026-02-08)

- Sub-agents inherit parent MCP tools automatically
- DO NOT add `mcpServers:` to agent frontmatter — causes "Tool names must be unique" API errors (inherited + declared = duplicates, no dedup)
- Correct pattern: put `ToolSearch` in agent `tools:` frontmatter, use at runtime to load MCP tools
- Known Claude Code bugs: GH #10668, #10704, #21560. Not fixed as of Feb 2026.

## Hub Tool Schema (updated 2026-03-21)

- `thoughtbox_hub` now uses flat Zod schema with typed per-operation fields (hub-tool-schema.ts)
- All 28 operations have `operation: z.enum([...])` + described optional params at top level
- `agentId` is a cross-cutting optional field — stripped before forwarding to hub-handler
- operations.ts catalog fixed: `endorse_consensus` uses `consensusId` (not `markerId`), `mark_consensus.thoughtRef` is `number` (not `string`), `merge_proposal` includes `mergeMessage`
