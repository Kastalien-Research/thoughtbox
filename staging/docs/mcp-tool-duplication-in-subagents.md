# MCP Tool Name Duplication in Sub-Agent Spawning

**Date**: 2026-02-08
**Status**: Confirmed bug, workaround applied
**Thoughtbox Session**: `a125b005-863d-4923-aa10-5a1859fd85d5`

## Problem

Custom Claude Code agents (`.claude/agents/hub-{architect,debugger,coordinator}.md`) that declared `mcpServers: - thoughtbox` in their YAML frontmatter crashed with:

```
API Error: 400 {"type":"error","error":{"type":"invalid_request_error",
"message":"tools: Tool names must be unique."}}
```

The crash occurred on the sub-agent's first turn that included tool calls. Turns with zero tool calls succeeded.

The built-in `general-purpose` agent type (no `mcpServers` declaration) accessed the same MCP tools without issue via `ToolSearch`.

## Root Cause

When Claude Code spawns a sub-agent via the Task tool, it assembles a tool list from two sources:

1. **Inherited tools** — all tools from the parent session (including MCP tools)
2. **Declared tools** — tools from the agent's `mcpServers` frontmatter field

There is **no deduplication step** between these two sources. When the parent already has `thoughtbox` connected and the agent also declares `mcpServers: - thoughtbox`, the same tools (`mcp__thoughtbox__thoughtbox_gateway`, `mcp__thoughtbox__thoughtbox_hub`, `mcp__thoughtbox__observability_gateway`) appear twice. The Anthropic API validates tool name uniqueness and rejects the request.

### Timeline of a Failing Sub-Agent Spawn

| Step | What happens | Result |
|------|-------------|--------|
| Task tool invoked | Claude Code reads cached agent definition | OK |
| Turn 1 (no tool calls) | API call with model prompt only | Succeeds |
| Turn 2 (with tool calls) | API call assembles full tool list: inherited + declared | **CRASH**: duplicates detected |

## Evidence

### 1. Official Documentation (claude-code-guide agent)

Sub-agents inherit all parent tools by default. The `mcpServers` field adds servers on top of inheritance. No dedup exists.

### 2. GitHub Issues (confirmed bug, multiple reports)

| Issue | Title | Status |
|-------|-------|--------|
| [#10668](https://github.com/anthropics/claude-code/issues/10668) | Task agent fails with "Tool names must be unique" when parent has many MCP tools | Closed (stale) |
| [#10704](https://github.com/anthropics/claude-code/issues/10704) | Subagent launch fails with "Tool names must be unique" when MCP server is configured | Closed (dup of #10668) |
| [#10708](https://github.com/anthropics/claude-code/issues/10708) | Task tool fails with "Tool names must be unique" error when MCP servers are enabled | Closed (stale) |
| [#14234](https://github.com/anthropics/claude-code/issues/14234) | /compact fails with "tools: Tool names must be unique" error | Closed (stale) |
| [#21560](https://github.com/anthropics/claude-code/issues/21560) | Plugin-defined subagents cannot access MCP tools - breaks plugin ecosystem | **OPEN** |

### 3. Empirical Tests (this session)

| Experiment | Agent | mcpServers | Tool calls | Result |
|-----------|-------|------------|------------|--------|
| 1 | `hub-architect` | `- thoughtbox` (cached) | None | SUCCESS |
| 2 | `hub-architect` | `- thoughtbox` (cached) | MCP calls | **CRASH** |
| 3 | `general-purpose` | None | ToolSearch + MCP calls | SUCCESS |
| 4 | `hub-architect` | Removed (but cached old) | MCP calls | **CRASH** (cached) |
| 5 | `test-mcp-access` | None (new file) | N/A | NOT DISCOVERED |
| 6 | `fact-checking-agent` | None (specific tools in `tools:`) | MCP call | SUCCESS |

## Fix Applied

### Agent Files

Removed `mcpServers: - thoughtbox` from all three hub agent files:
- `.claude/agents/hub-architect.md`
- `.claude/agents/hub-debugger.md`
- `.claude/agents/hub-coordinator.md`

Added ToolSearch instruction to each agent's system prompt:
```
**MCP Tool Access**: Use `ToolSearch` with query "thoughtbox" to load the
`thoughtbox_gateway` and `thoughtbox_hub` tools before calling them.
```

### Skill Documentation

Updated `.claude/skills/hub-collab/SKILL.md` with a "MCP Tool Access in Sub-Agents" section documenting the bug, correct pattern, and caching behavior.

## Agent Definition Caching

A secondary finding: Claude Code caches agent definitions at session startup.

- Edits to `.claude/agents/*.md` files during a session do **not** take effect
- New agent files created mid-session are **not discoverable** by the Task tool
- A new Claude Code session is required for changes to load

This means the fix requires a session restart to verify.

## Correct Patterns for MCP Tool Access in Sub-Agents

### DO: Inherit + ToolSearch (works)

```yaml
---
name: my-agent
description: Agent that needs MCP tools
model: sonnet
maxTurns: 25
memory: project
---

Use `ToolSearch` to find and load MCP tools before calling them.
```

### DO: Specific tool names in `tools:` allowlist (works)

```yaml
---
name: my-agent
tools: Read, Grep, mcp__firecrawl-mcp__firecrawl_search
---
```

### DON'T: Declare mcpServers (crashes)

```yaml
---
name: my-agent
mcpServers:
  - thoughtbox   # CRASHES: duplicates inherited tools
---
```

## Hypotheses Explored

| Hypothesis | Description | Verdict |
|-----------|-------------|---------|
| H1: Double initialization | `mcpServers` causes a second MCP connection | REJECTED — it's tool list assembly, not connection doubling |
| H2: ToolSearch dedup failure | Deferred tool index has duplicates | REJECTED — crash happens before ToolSearch is called |
| **H3: Inherited + declared merge conflict** | **Inherited parent tools + mcpServers-declared tools = duplicates, no dedup** | **CONFIRMED** |

## Recommendations

1. **Immediate**: Start new session to verify fix works for hub-collab demo
2. **Upstream**: Consider commenting on [#21560](https://github.com/anthropics/claude-code/issues/21560) with this analysis — it's the most recent open issue and affects the plugin ecosystem broadly
3. **Future**: If Claude Code adds deduplication, the `mcpServers` field could be re-enabled for agents that need MCP access in `--agent` CLI mode (where there's no parent to inherit from)
