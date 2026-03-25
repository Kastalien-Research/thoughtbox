# Thoughtbox Architecture

Thoughtbox is an MCP server that gives AI agents structured thinking, persistent memory, and auditability. Agents connect over HTTP, record their reasoning as thoughts in sessions, and build a knowledge graph that persists across conversations.

This document describes what exists and is deployed today. Specs and ADRs are referenced where relevant but this is the single source of truth for "how does the system actually work."

## Documents in this section

| Document | What it covers |
|----------|---------------|
| [Data Model](./data-model.md) | Supabase schema — tables, relationships, constraints |
| [Auth and Billing](./auth-and-billing.md) | API key auth, workspace memberships, Stripe integration |
| [Server Architecture](./server-architecture.md) | MCP server internals, tool surface, storage backends |
| [Infrastructure](./infrastructure.md) | GCP Cloud Run, Supabase hosted, deployment pipeline |

## System Overview

```
Client (Claude, GPT, any MCP client)
  |
  | HTTP POST /mcp (Streamable HTTP transport)
  | Authorization: Bearer tbx_<prefix>_<key>
  |
  v
+---------------------------+
| Cloud Run: thoughtbox-mcp |
|                           |
|  API Key Auth             |
|    -> resolves workspace  |
|                           |
|  MCP Server               |
|    thoughtbox_search      |
|    thoughtbox_execute     |
|                           |
|  Storage (per-workspace)  |
|    sessions + thoughts    |
|    knowledge graph        |
|    protocols              |
+---------------------------+
  |
  | service_role key
  |
  v
+---------------------------+
| Supabase                  |
|  Postgres (data)          |
|  Auth (user accounts)     |
|  RLS (tenant isolation)   |
+---------------------------+
```

## Repos

| Repo | What | Deploys to |
|------|------|-----------|
| `Kastalien-Research/thoughtbox` | MCP server, Supabase schema, core logic | Google Cloud Run |
| `Kastalien-Research/thoughtbox-web-two` | Web app (Next.js) | TBD |
