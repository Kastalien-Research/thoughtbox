# Thoughtbox Documentation

Thoughtbox is an MCP server for structured reasoning. Connect it to Claude Code and get persistent thinking sessions, a knowledge graph that accumulates insights across conversations, and protocol-driven workflows for debugging and refactoring.

## Guides

| Guide | What it covers | Read time |
|-------|---------------|-----------|
| [Quickstart](./quickstart.md) | Connect to Thoughtbox and record your first thought | 5 min |
| [Sessions](./sessions.md) | Session lifecycle, search, resume, export, analysis | 10 min |
| [Knowledge Graph](./knowledge-graph.md) | Entities, relations, observations, graph traversal | 10 min |
| [Interleaved Thinking](./interleaved-thinking.md) | IRCoT pattern: think, act, reflect, repeat | 8 min |
| [Ulysses Protocol](./ulysses-protocol.md) | Surprise-gated debugging with forced hypotheses | 8 min |
| [Subagent Patterns](./subagent-patterns.md) | Context isolation for session retrieval and thought evolution | 8 min |
| [Observability](./observability.md) | OTEL setup, cost tracking, session timelines | 10 min |

## Two Tools

Everything goes through two MCP tools:

- **`thoughtbox_search`** — query the catalog to discover operations, prompts, and resources
- **`thoughtbox_execute`** — run JavaScript using the `tb` SDK to chain operations

Every code example in these guides is a `thoughtbox_execute` call.
