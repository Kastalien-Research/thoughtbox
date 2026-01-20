# Tools Reference

Complete API documentation for all Thoughtbox operations.

---

## Overview

Thoughtbox exposes two main gateway tools:

| Tool | Purpose | Requires Init |
|------|---------|---------------|
| `thoughtbox_gateway` | Core reasoning operations | Partially (some ops) |
| `observability_gateway` | System monitoring | No |

All operations route through these gateways using the `operation` parameter.

---

## thoughtbox_gateway

The primary tool for reasoning operations. Routes to different subsystems based on the operation.

### Call Format

```json
{
  "operation": "<operation_name>",
  "args": { ... }
}
```

---

## Init Operations

Manage sessions and navigation. Available at **Stage 0** (immediately after connection).

### get_state

Check current session context and navigation state.

```json
{
  "operation": "get_state",
  "args": {}
}
```

**Returns:**
```json
{
  "hasActiveSession": true,
  "sessionId": "debug-auth-2025-01",
  "project": "_default",
  "stage": 2
}
```

---

### list_sessions

Browse available reasoning sessions.

```json
{
  "operation": "list_sessions",
  "args": {
    "project": "_default",    // Optional: filter by project
    "tags": ["debugging"],    // Optional: filter by tags
    "limit": 20               // Optional: max results
  }
}
```

**Returns:**
```json
{
  "sessions": [
    {
      "id": "debug-auth-2025-01",
      "title": "Debug authentication flow",
      "tags": ["debugging", "auth"],
      "thoughtCount": 7,
      "branchCount": 1,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T11:30:00Z"
    }
  ]
}
```

---

### start_new

Create a new reasoning session. **Advances to Stage 1.**

```json
{
  "operation": "start_new",
  "args": {
    "title": "Investigate memory leak",           // Required
    "tags": ["debugging", "performance"],         // Optional
    "project": "my-app",                          // Optional: defaults to _default
    "description": "High memory on prod server"   // Optional
  }
}
```

**Returns:**
```json
{
  "sessionId": "memory-leak-2025-01-15",
  "message": "Session created successfully"
}
```

---

### load_context

Resume an existing session. **Advances to Stage 1.**

```json
{
  "operation": "load_context",
  "args": {
    "sessionId": "debug-auth-2025-01"  // Required
  }
}
```

**Returns:**
```json
{
  "session": {
    "id": "debug-auth-2025-01",
    "title": "Debug authentication flow",
    "thoughtCount": 7
  },
  "thoughts": [
    { "thoughtNumber": 1, "thought": "..." },
    { "thoughtNumber": 2, "thought": "..." }
  ]
}
```

---

### navigate

Move between projects, tasks, or aspects in the hierarchy.

```json
{
  "operation": "navigate",
  "args": {
    "to": "project",           // "project" | "task" | "aspect"
    "value": "my-app"          // Target name
  }
}
```

---

### list_roots

Get available filesystem roots from MCP client.

```json
{
  "operation": "list_roots",
  "args": {}
}
```

**Returns:**
```json
{
  "roots": [
    { "uri": "file:///home/user/projects", "name": "projects" }
  ]
}
```

---

### bind_root

Set project boundary with a filesystem path prefix.

```json
{
  "operation": "bind_root",
  "args": {
    "rootUri": "file:///home/user/projects/my-app"
  }
}
```

---

## Cipher Operation

Load the deep thinking primer. **Requires Stage 1. Advances to Stage 2.**

### cipher

```json
{
  "operation": "cipher"
}
```

**Returns:** A comprehensive guide on effective reasoning patterns, including:
- Forward thinking (problem analysis)
- Backward thinking (goal decomposition)
- Branching strategies
- Revision patterns
- Quality indicators

---

## Thought Operations

Core reasoning recording. **Requires Stage 2.**

### thought

Add a thought to the current session.

```json
{
  "operation": "thought",
  "args": {
    "thought": "The error occurs because...",     // Required: reasoning content
    "thoughtNumber": 3,                           // Required: position in chain
    "totalThoughts": 5,                           // Required: estimated total
    "nextThoughtNeeded": true,                    // Required: more to come?

    // Optional: branching
    "branchFromThought": 2,                       // Fork from this thought
    "branchId": "alternative-approach",           // Branch identifier

    // Optional: revision
    "isRevision": true,                           // This corrects earlier reasoning
    "revisesThought": 1,                          // Which thought to update

    // Optional: critique
    "critique": true                              // Request autonomous critique
  }
}
```

**Returns:**
```json
{
  "thoughtNumber": 3,
  "totalThoughts": 5,
  "sessionId": "debug-auth-2025-01",
  "timestamp": "2025-01-15T10:35:00Z"
}
```

**With critique:**
```json
{
  "thoughtNumber": 3,
  "critique": {
    "text": "This reasoning assumes X, but consider Y...",
    "model": "claude-sonnet-4-5-20250929",
    "timestamp": "2025-01-15T10:35:05Z"
  }
}
```

---

## Session Operations

Manage and export sessions. **Requires Stage 1+.**

### session: list

List sessions with filtering.

```json
{
  "operation": "session",
  "args": {
    "action": "list",
    "filter": {
      "tags": ["debugging"],
      "limit": 10
    }
  }
}
```

---

### session: get

Get full session details.

```json
{
  "operation": "session",
  "args": {
    "action": "get",
    "sessionId": "debug-auth-2025-01"
  }
}
```

**Returns:** Complete session with all thoughts and metadata.

---

### session: export

Export session in various formats.

```json
{
  "operation": "session",
  "args": {
    "action": "export",
    "sessionId": "debug-auth-2025-01",
    "format": "markdown"  // "markdown" | "json"
  }
}
```

**Markdown format:**
```markdown
# Debug authentication flow

**Session ID:** debug-auth-2025-01
**Created:** 2025-01-15T10:00:00Z
**Tags:** debugging, auth

---

## Thought 1

The error occurs because...

## Thought 2

Tracing the code, I see...
```

**JSON format:**
```json
{
  "version": "1.0",
  "session": { ... },
  "nodes": [ ... ],
  "exportedAt": "2025-01-15T12:00:00Z"
}
```

---

### session: analyze

Get statistics and quality metrics.

```json
{
  "operation": "session",
  "args": {
    "action": "analyze",
    "sessionId": "debug-auth-2025-01"
  }
}
```

**Returns:**
```json
{
  "metadata": {
    "thoughtCount": 7,
    "branchCount": 1,
    "revisionCount": 0,
    "duration": 5400000,
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "structure": {
    "linearityScore": 0.85,
    "revisionRate": 0,
    "maxDepth": 2,
    "thoughtDensity": 0.078
  },
  "quality": {
    "critiqueRequests": 2,
    "hasConvergence": true,
    "isComplete": true
  }
}
```

---

## Notebook Operations

Literate programming with executable code. **Requires Stage 2.**

### notebook: create

Create a new notebook.

```json
{
  "operation": "notebook",
  "args": {
    "action": "create",
    "title": "Data Analysis",
    "language": "typescript",      // "javascript" | "typescript"
    "template": "sequential-feynman"  // Optional: use template
  }
}
```

---

### notebook: add_cell

Add a cell to the notebook.

```json
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "code",               // "code" | "markdown" | "title"
    "content": "console.log('Hello, world!')",
    "filename": "hello.ts"        // Optional: for code cells
  }
}
```

---

### notebook: update_cell

Modify an existing cell.

```json
{
  "operation": "notebook",
  "args": {
    "action": "update_cell",
    "cellId": "cell-abc123",
    "content": "console.log('Updated!')"
  }
}
```

---

### notebook: run_cell

Execute a code cell.

```json
{
  "operation": "notebook",
  "args": {
    "action": "run_cell",
    "cellId": "cell-abc123"
  }
}
```

**Returns:**
```json
{
  "status": "completed",
  "output": "Hello, world!\n",
  "error": null
}
```

---

### notebook: export

Save notebook as `.src.md` file.

```json
{
  "operation": "notebook",
  "args": {
    "action": "export",
    "path": "/path/to/notebook.src.md"
  }
}
```

---

### notebook: load

Load notebook from file or content.

```json
{
  "operation": "notebook",
  "args": {
    "action": "load",
    "path": "/path/to/notebook.src.md"
  }
}
```

---

## Mental Models Operations

Structured reasoning frameworks. **Requires Stage 3** (or access via `thoughtbox_gateway`).

### mental_models: list

List available reasoning models.

```json
{
  "operation": "mental_models",
  "args": {
    "action": "list",
    "filter": {
      "tags": ["debugging"]       // Optional: filter by tags
    }
  }
}
```

**Returns:**
```json
{
  "models": [
    {
      "name": "rubber-duck",
      "description": "Explain the problem step by step to find gaps",
      "tags": ["debugging", "communication"]
    },
    {
      "name": "five-whys",
      "description": "Ask 'why' repeatedly to find root cause",
      "tags": ["debugging", "root-cause"]
    }
  ]
}
```

---

### mental_models: get

Get full model content with prompt.

```json
{
  "operation": "mental_models",
  "args": {
    "action": "get",
    "name": "rubber-duck"
  }
}
```

**Returns:** Complete model definition with instructions, steps, and examples.

---

### mental_models: list_tags

Get all available model categories.

```json
{
  "operation": "mental_models",
  "args": {
    "action": "list_tags"
  }
}
```

**Returns:**
```json
{
  "tags": [
    "debugging",
    "planning",
    "decision-making",
    "risk-analysis",
    "estimation",
    "prioritization",
    "architecture",
    "validation"
  ]
}
```

---

## observability_gateway

System monitoring and health checks. **No initialization required.**

### health

Check system health.

```json
{
  "operation": "health"
}
```

**Returns:**
```json
{
  "status": "healthy",
  "services": {
    "thoughtbox": { "status": "up", "version": "1.0.0" },
    "prometheus": { "status": "up" },
    "grafana": { "status": "up" }
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

### metrics

Query Prometheus metrics (instant).

```json
{
  "operation": "metrics",
  "args": {
    "query": "thoughtbox_thoughts_total"
  }
}
```

---

### metrics_range

Query Prometheus time series.

```json
{
  "operation": "metrics_range",
  "args": {
    "query": "rate(thoughtbox_thoughts_total[5m])",
    "start": "2025-01-15T10:00:00Z",
    "end": "2025-01-15T12:00:00Z",
    "step": "1m"
  }
}
```

---

### sessions

Get active reasoning sessions.

```json
{
  "operation": "sessions",
  "args": {
    "limit": 10,
    "status": "active"
  }
}
```

---

### session_info

Get specific session details.

```json
{
  "operation": "session_info",
  "args": {
    "sessionId": "debug-auth-2025-01"
  }
}
```

---

### alerts

Check Prometheus alerts.

```json
{
  "operation": "alerts",
  "args": {
    "state": "firing"  // "firing" | "pending" | "inactive"
  }
}
```

---

### dashboard_url

Get Grafana dashboard URL.

```json
{
  "operation": "dashboard_url",
  "args": {
    "name": "thoughtbox-overview"  // Optional
  }
}
```

---

## Error Handling

All operations return errors in a consistent format:

```json
{
  "error": {
    "code": "STAGE_NOT_MET",
    "message": "Operation 'thought' requires Stage 2. Current stage: 1",
    "hint": "Call the 'cipher' operation first to advance to Stage 2"
  }
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `STAGE_NOT_MET` | Operation requires higher disclosure stage |
| `SESSION_NOT_FOUND` | Referenced session doesn't exist |
| `INVALID_ARGS` | Missing or malformed arguments |
| `STORAGE_ERROR` | Filesystem/storage operation failed |
| `SAMPLING_UNAVAILABLE` | Critique requested but sampling not supported |

---

## Next Steps

- [**Core Concepts**](./core-concepts.md) — Understand the data model
- [**Mental Models**](./mental-models.md) — All 15 reasoning frameworks
- [**Configuration**](./configuration.md) — Customize behavior
