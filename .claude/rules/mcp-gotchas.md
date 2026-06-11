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

## Hub via Code Mode `tb.hub.*` (updated 2026-06-11, PR #374)

- There is NO registered `thoughtbox_hub` or `thoughtbox_gateway` MCP tool. The only registered tools are `thoughtbox_search`, `thoughtbox_execute`, `thoughtbox_peer_notebook`; the hub is the `tb.hub.*` namespace inside `thoughtbox_execute`
- SDK methods are camelCase (`tb.hub.quickJoin`, `tb.hub.markConsensus`, ...); the mapping to the 28 snake_case hub operations is `HUB_SDK_METHODS` in `src/code-mode/execute-tool.ts`; signatures live in `src/code-mode/sdk-types.ts` and `src/hub/operations.ts`
- Per-session identity registry: the FIRST `tb.hub.register`/`tb.hub.quickJoin` in an MCP session becomes the implicit default agentId for all later hub calls in that session
- Explicit `agentId` is accepted only if that agentId was registered in the SAME session — otherwise "Agent <id> not registered in this session. Call register first."
- Re-registering creates a new agentId; coordinator role stays bound to the creating agentId — `tb.hub.mergeProposal` (coordinator-only) must run from the coordinator's own session
- One state-mutating hub call per `thoughtbox_execute`; reads (`tb.hub.whoami`, `tb.hub.listWorkspaces`, `tb.hub.readChannel`, `tb.hub.workspaceStatus/Digest`, `tb.hub.list*`, `tb.hub.readyProblems/blockedProblems`) chain freely

| SDK call | Correct params | NOT these |
|----------|---------------|-----------|
| `tb.hub.endorseConsensus` | `consensusId` | ~~markerId~~ |
| `tb.hub.markConsensus` | `thoughtRef: number` | ~~thoughtRef as string/object~~ |
| `tb.hub.mergeProposal` | `mergeMessage` (required) | ~~omitting it~~ |
| `tb.hub.addDependency` | `dependsOnProblemId` | ~~dependsOn~~, ~~dependsOnId~~ |
| `tb.hub.createSubProblem` | `parentId` | ~~parentProblemId~~ |
| `tb.hub.createProposal` | `sourceBranch` (required) | ~~thoughtRef-only~~ |
| `tb.hub.postMessage` | `workspaceId` + `problemId` | ~~channelId~~ |
