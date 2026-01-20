# Getting Started

Get Thoughtbox running in under 5 minutes.

---

## Prerequisites

- **Node.js 22+** (required)
- An MCP-compatible client (Claude Code, Cursor, or similar)

---

## Installation

### Option 1: npm (Recommended)

```bash
npm install -g @kastalien-research/thoughtbox
```

### Option 2: From Source

```bash
git clone https://github.com/anthropic/thoughtbox
cd thoughtbox
npm install
npm run build
```

---

## Running the Server

Thoughtbox supports two transport modes:

### Stdio Mode (Default)

Best for MCP clients like Claude Code or Cursor that manage the server lifecycle:

```bash
thoughtbox
```

### HTTP Mode

Best for persistent servers or when multiple clients connect:

```bash
THOUGHTBOX_TRANSPORT=http thoughtbox
# Server runs on http://localhost:1731
```

---

## Connecting Your MCP Client

### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "thoughtbox",
      "args": []
    }
  }
}
```

### HTTP Connection

For HTTP mode, configure your client to connect to:

```
http://localhost:1731/mcp
```

---

## Your First Session

Once connected, the agent will see the `thoughtbox_gateway` tool. Here's a typical flow:

### 1. Start a New Session

```json
{
  "operation": "start_new",
  "args": {
    "title": "Investigate memory leak",
    "tags": ["debugging", "performance"]
  }
}
```

### 2. Load the Deep Thinking Primer

```json
{
  "operation": "cipher"
}
```

This returns guidance on effective reasoning patterns.

### 3. Begin Reasoning

```json
{
  "operation": "thought",
  "args": {
    "thought": "Memory usage spikes when processing large files. Let me identify where allocations happen...",
    "thoughtNumber": 1,
    "totalThoughts": 5,
    "nextThoughtNeeded": true
  }
}
```

### 4. Continue the Chain

Each thought builds on the previous:

```json
{
  "operation": "thought",
  "args": {
    "thought": "Found it — the buffer isn't released after parsing. The fix is to explicitly null the reference after use.",
    "thoughtNumber": 5,
    "totalThoughts": 5,
    "nextThoughtNeeded": false
  }
}
```

---

## Where's My Data?

By default, Thoughtbox stores everything in:

```
~/.thoughtbox/
├── config.json
├── mental-models/
└── projects/
    └── _default/
        └── sessions/
            └── 2025-01/
                └── {session-id}/
                    ├── manifest.json
                    ├── 001.json
                    ├── 002.json
                    └── ...
```

Each thought is an individual JSON file, making it easy to inspect, backup, or process with other tools.

---

## Listing Sessions

View your reasoning history:

```json
{
  "operation": "list_sessions",
  "args": {}
}
```

Returns all sessions with metadata:

```json
{
  "sessions": [
    {
      "id": "memory-leak-2025-01-15",
      "title": "Investigate memory leak",
      "tags": ["debugging", "performance"],
      "thoughtCount": 5,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## Loading a Previous Session

Resume where you left off:

```json
{
  "operation": "load_context",
  "args": {
    "sessionId": "memory-leak-2025-01-15"
  }
}
```

The agent receives the full thought chain and can continue reasoning.

---

## Exporting Sessions

### As Markdown

```json
{
  "operation": "session",
  "args": {
    "action": "export",
    "sessionId": "memory-leak-2025-01-15",
    "format": "markdown"
  }
}
```

### As JSON

```json
{
  "operation": "session",
  "args": {
    "action": "export",
    "sessionId": "memory-leak-2025-01-15",
    "format": "json"
  }
}
```

---

## Next Steps

- [**Core Concepts**](./core-concepts.md) — Understand sessions, branches, and revisions
- [**Tools Reference**](./tools-reference.md) — Complete API documentation
- [**Mental Models**](./mental-models.md) — Use structured reasoning frameworks
- [**Configuration**](./configuration.md) — Customize storage, projects, and more
