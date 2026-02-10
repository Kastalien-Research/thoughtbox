# Thoughtbox

**A reasoning ledger and collaboration hub for AI agents.** Thoughtbox is an MCP server that provides structured reasoning tools for individual agents and a coordination layer for multi-agent teams. Agents think step-by-step, branch into alternative explorations, revise earlier conclusions, build a persistent knowledge graph, and collaborate through shared workspaces — all via the Model Context Protocol.

Unlike ephemeral chain-of-thought prompting, Thoughtbox creates a **durable reasoning chain** — a ledger of thoughts that can be visualized, exported, and analyzed. Each thought is a node in a graph structure supporting forward thinking, backward planning, branching explorations, mid-course revisions, and **autonomous critique via MCP sampling**. The **Hub** extends this to multi-agent scenarios where agents register, claim problems, propose solutions, review each other's work, and reach consensus.

**Local-First:** Thoughtbox runs entirely on your machine. All reasoning data is stored locally at `~/.thoughtbox/` by default — nothing is sent to external servers. Your thought processes remain private and under your control.

## Client Compatibility

> **Note:** Thoughtbox is currently optimized for use with **Claude Code**. We are actively working on supporting additional MCP clients, but due to the wide variation in capability support across the Model Context Protocol ecosystem — server features (prompts, resources, tools), client features (roots, sampling, elicitation), and behaviors like `listChanged` notifications — we're having to implement custom adaptations for many clients. See the [gateway tool](#gateway-tool-always-available) for one such adaptation.

If you're using a client other than Claude Code and encounter issues, please [open an issue](https://github.com/Kastalien-Research/thoughtbox/issues) describing your client and the problem — this helps us prioritize compatibility work.

## Progressive Disclosure

Thoughtbox uses a staged tool disclosure system to guide agents through proper initialization:

| Stage | Tools Available | Trigger |
|-------|-----------------|---------|
| **Stage 0** | `init`, `thoughtbox_gateway` | Connection start |
| **Stage 1** | + `thoughtbox_cipher`, `session`, `deep_analysis` | `init(start_new)` or `init(load_context)` |
| **Stage 2** | + `thoughtbox`, `notebook`, `knowledge`, `mental_models` | `thoughtbox_cipher` call |
| **Stage 3** | + `export_reasoning_chain` | Domain activation |

This ensures agents establish proper session context before accessing advanced reasoning tools.

### Gateway Tool (Always Available)

The `thoughtbox_gateway` tool is always enabled and provides a routing mechanism for clients that don't refresh tool lists mid-turn (e.g., Claude Code over streaming HTTP). It routes to all handlers internally while enforcing stage requirements:

```javascript
// Call operations through gateway without waiting for tool list refresh
{ operation: "get_state" }                    // → init handler
{ operation: "start_new", args: {...} }       // → init handler, advances to Stage 1
{ operation: "cipher" }                       // → cipher content, advances to Stage 2
{ operation: "thought", args: {...} }         // → thoughtbox handler (requires Stage 2)
```

The gateway returns clear error messages when operations are called at the wrong stage.

![Thoughtbox Observatory](public/thoughtbox-observatory.png)
*Observatory UI showing a reasoning session with 14 thoughts and a branch exploration (purple nodes 13-14) forking from thought 5.*

## Core Concepts

### The Reasoning Ledger

Thoughtbox treats reasoning as **data**, not just process. Every thought is:

- **Numbered**: Logical position in the reasoning chain (supports non-sequential addition)
- **Timestamped**: When the thought was recorded
- **Linked**: Connected to previous thoughts, branch origins, or revised thoughts
- **Persistent**: Stored in sessions that survive across conversations
- **Exportable**: Full reasoning chains can be exported as JSON or Markdown

This creates an **auditable trail** of how conclusions were reached — invaluable for debugging agent behavior, understanding decision-making, and improving reasoning strategies.

### Thinking Patterns

Thoughtbox supports multiple reasoning strategies out of the box:

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Forward Thinking** | Sequential 1→2→3→N progression | Exploration, discovery, open-ended analysis |
| **Backward Thinking** | Start at goal (N), work back to start (1) | Planning, system design, working from known goals |
| **Branching** | Fork into parallel explorations (A, B, C...) | Comparing alternatives, A/B scenarios |
| **Revision** | Update earlier thoughts with new information | Error correction, refined understanding |
| **Interleaved** | Alternate reasoning with tool actions | Tool-oriented tasks, adaptive execution |

See the **[Patterns Cookbook](src/resources/docs/thoughtbox-patterns-cookbook.md)** for comprehensive examples.

## Features

### 1. Init Tool — Session Management (Stage 0)

The entry point for establishing session context.

**Operations:**
- `get_state` — Check current session state
- `list_sessions` — Browse available sessions (filter by project, task, aspect)
- `start_new` — Begin a new work session with project/task/aspect scoping
- `load_context` — Resume an existing session
- `navigate` — Move between project/task/aspect levels
- `list_roots` — Query MCP roots from client
- `bind_root` — Bind a root directory as project scope

### 2. Thoughtbox Cipher — Deep Thinking Primer (Stage 1)

A priming tool that prepares agents for structured reasoning. Calling this tool unlocks Stage 2 tools.

### 3. Session Tool — Persistence & Export (Stage 1)

Manage reasoning sessions with full persistence.

**Operations:**
- `list` — List all sessions
- `get` — Retrieve session details
- `export` — Export session as JSON or Markdown
- `analyze` — Get session statistics and insights

### 4. Thoughtbox Tool — Structured Reasoning (Stage 2)

The core tool for step-by-step thinking with full graph capabilities.

```javascript
// Simple forward thinking
{ thought: "First, let's identify the problem...", thoughtNumber: 1, totalThoughts: 5, nextThoughtNeeded: true }

// Branching to explore alternatives
{ thought: "Option A: Use PostgreSQL...", thoughtNumber: 3, branchFromThought: 2, branchId: "sql-path", ... }

// Revising an earlier conclusion
{ thought: "Actually, the root cause is...", thoughtNumber: 7, isRevision: true, revisesThought: 3, ... }

// Request autonomous critique via MCP sampling
{ thought: "This approach seems optimal...", thoughtNumber: 5, critique: true, ... }
```

**Parameters:**
- `thought` (string): The current thinking step
- `thoughtNumber` (integer): Logical position in the chain
- `totalThoughts` (integer): Estimated total (adjustable)
- `nextThoughtNeeded` (boolean): Continue thinking?
- `branchFromThought` (integer): Fork point for branching
- `branchId` (string): Branch identifier
- `isRevision` (boolean): Marks revision of earlier thought
- `revisesThought` (integer): Which thought is being revised
- `critique` (boolean): Request autonomous LLM critique via MCP sampling API

**Autonomous Critique:** When `critique: true`, the server uses the MCP `sampling/createMessage` API to request an external LLM analysis of the current thought. The critique is returned in the response and persisted with the thought.

### 5. Observatory — Real-Time Visualization

A built-in web UI for watching reasoning unfold in real-time.

**Features:**
- **Live Graph**: Watch thoughts appear as they're added
- **Snake Layout**: Compact left-to-right flow with row wrapping
- **Hierarchical Branches**: Branches collapse into clickable stub nodes (A, B, C...)
- **Navigation**: Click stubs to explore branches, back button to return
- **Detail Panel**: Click any node to view full thought content
- **Multi-Session**: Switch between active reasoning sessions

**Access:** The Observatory is available at `http://localhost:1729` when the server is running.

### 6. Mental Models — Reasoning Frameworks (Stage 2)

15 structured mental models that provide process scaffolds for different problem types.

**Available Models:**
- `rubber-duck` — Explain to clarify thinking
- `five-whys` — Root cause analysis
- `pre-mortem` — Anticipate failures
- `steelmanning` — Strengthen opposing arguments
- `fermi-estimation` — Order-of-magnitude reasoning
- `trade-off-matrix` — Multi-criteria decisions
- `decomposition` — Break down complexity
- `inversion` — Solve by avoiding failure
- And 7 more...

**Operations:**
- `get_model` — Retrieve a specific model's prompt
- `list_models` — List all models (filter by tag)
- `list_tags` — Available categories (debugging, planning, decision-making, etc.)

### 7. Notebook — Literate Programming (Stage 2)

Interactive notebooks combining documentation with executable JavaScript/TypeScript.

**Features:**
- Isolated execution environments per notebook
- Full package.json support with dependency installation
- Sequential Feynman template for deep learning workflows
- Export to `.src.md` format

**Operations:** `create`, `add_cell`, `run_cell`, `export`, `list`, `load`, `update_cell`

### 8. Hub — Multi-Agent Collaboration

The Hub is a coordination layer for multiple AI agents working together. Agents register, join workspaces, and coordinate through problems, proposals, consensus, and channels — all via a single `thoughtbox_hub` MCP tool.

**Core Concepts:**
- **Workspace** — A shared collaboration space containing problems, proposals, consensus markers, and channels
- **Problem** — A unit of work with dependencies, sub-problems, and status tracking (open → in-progress → resolved → closed)
- **Proposal** — A proposed solution to a problem, with a source branch reference and review workflow
- **Consensus** — A decision marker tied to a thought reference for traceability
- **Channel** — A message stream scoped to a problem for discussion and coordination

**27 Operations across 7 categories:**

| Category | Operations | Stage |
|----------|-----------|-------|
| **Identity** (3) | `register`, `quick_join`, `list_workspaces` | 0 |
| **Agent** (4) | `whoami`, `create_workspace`, `join_workspace`, `get_profile_prompt` | 1 |
| **Problems** (9) | `create_problem`, `claim_problem`, `update_problem`, `list_problems`, `add_dependency`, `remove_dependency`, `ready_problems`, `blocked_problems`, `create_sub_problem` | 2 |
| **Proposals** (4) | `create_proposal`, `review_proposal`, `merge_proposal`, `list_proposals` | 2 |
| **Consensus** (3) | `mark_consensus`, `endorse_consensus`, `list_consensus` | 2 |
| **Channels** (3) | `post_message`, `read_channel`, `post_system_message` | 2 |
| **Status** (2) | `workspace_status`, `workspace_digest` | 2 |

**Agent Profiles:** `MANAGER`, `ARCHITECT`, `DEBUGGER`, `SECURITY`, `RESEARCHER`, `REVIEWER` — each provides domain-specific mental models and behavioral priming.

**Quick join example:**
```javascript
{ operation: "quick_join", args: { name: "Architect", workspaceId: "ws-abc123", profile: "ARCHITECT" } }
```

**Typical workflow:** register → create_workspace → create_problem → claim_problem → work → create_proposal → review_proposal → merge_proposal → mark_consensus

### 9. Knowledge Graph — Persistent Memory (Stage 2)

A structured knowledge graph for capturing insights, concepts, workflows, and decisions that persist across sessions. Accessed via the `knowledge` gateway operation.

**7 Operations across 2 categories:**

| Category | Operations |
|----------|-----------|
| **Entity Management** | `create_entity`, `get_entity`, `list_entities`, `add_observation` |
| **Graph Structure** | `create_relation`, `query_graph`, `stats` |

**Entity types:** `Insight`, `Concept`, `Workflow`, `Decision`, `Agent`

**Relation types:** `RELATES_TO`, `BUILDS_ON`, `CONTRADICTS`, `EXTRACTED_FROM`, `APPLIED_IN`, `LEARNED_BY`, `DEPENDS_ON`, `SUPERSEDES`, `MERGED_FROM`

**Visibility levels:** `public`, `agent-private`, `user-private`, `team-private`

### 10. Deep Analysis — Session Intelligence (Stage 1)

Analyze reasoning sessions for patterns, cognitive load, and decision points.

**Analysis types:**
- `patterns` — Identify reasoning patterns across the session
- `cognitive_load` — Measure complexity and context-switching burden
- `decision_points` — Extract key decision moments and their alternatives
- `full` — Comprehensive analysis combining all types

**Options:** Include timelines, compare across sessions.

## Installation

### Quick Start

```bash
npx -y @kastalien-research/thoughtbox
```

### MCP Client Configuration

#### Claude Code

Add to your `~/.claude/settings.json` or project `.claude/settings.json`:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "npx",
      "args": ["-y", "@kastalien-research/thoughtbox"]
    }
  }
}
```

#### Cline / VS Code

Add to your MCP settings or `.vscode/mcp.json`:

```json
{
  "servers": {
    "thoughtbox": {
      "command": "npx",
      "args": ["-y", "@kastalien-research/thoughtbox"]
    }
  }
}
```

## Usage Examples

### Forward Thinking — Problem Analysis

```text
Thought 1: "Users report slow checkout. Let's analyze..."
Thought 2: "Data shows 45s average, target is 10s..."
Thought 3: "Root causes: 3 API calls, no caching..."
Thought 4: "Options: Redis cache, query optimization, parallel calls..."
Thought 5: "Recommendation: Implement Redis cache for product data"
```

### Backward Thinking — System Design

```text
Thought 8: [GOAL] "System handles 10k req/s with <100ms latency"
Thought 7: "Before that: monitoring and alerting operational"
Thought 6: "Before that: resilience patterns implemented"
Thought 5: "Before that: caching layer with invalidation"
...
Thought 1: [START] "Current state: 1k req/s, 500ms latency"
```

### Branching — Comparing Alternatives

```text
Thought 4: "Need to choose database architecture..."

Branch A (thought 5): branchId="sql-path"
  "PostgreSQL: ACID compliance, mature tooling, relational integrity"

Branch B (thought 5): branchId="nosql-path"
  "MongoDB: Flexible schema, horizontal scaling, document model"

Thought 6: [SYNTHESIS] "Use PostgreSQL for transactions, MongoDB for analytics"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISABLE_THOUGHT_LOGGING` | Suppress thought logging to stderr | `false` |
| `THOUGHTBOX_DATA_DIR` | Base directory for persistent storage | `~/.thoughtbox` |
| `THOUGHTBOX_PROJECT` | Project scope for session isolation | `_default` |
| `THOUGHTBOX_TRANSPORT` | Transport type (`stdio` or `http`) | `http` |
| `THOUGHTBOX_STORAGE` | Storage backend (`fs` or `memory`) | `fs` |
| `THOUGHTBOX_OBSERVATORY_ENABLED` | Enable Observatory web UI | `false` |
| `THOUGHTBOX_OBSERVATORY_PORT` | Observatory UI port | `1729` |
| `THOUGHTBOX_OBSERVATORY_CORS` | CORS origins for Observatory (comma-separated) | (none) |
| `THOUGHTBOX_AGENT_ID` | Pre-assigned Hub agent ID | (none) |
| `THOUGHTBOX_AGENT_NAME` | Pre-assigned Hub agent name | (none) |
| `THOUGHTBOX_EVENTS_ENABLED` | Enable event emission | `false` |
| `THOUGHTBOX_EVENTS_DEST` | Event destination | `stderr` |
| `PORT` | HTTP server port | `1731` |
| `HOST` | HTTP server bind address | `0.0.0.0` |
| `NODE_ENV` | Node environment | (none) |
| `PROMETHEUS_URL` | Prometheus endpoint (Docker) | `http://prometheus:9090` |
| `GRAFANA_URL` | Grafana endpoint (Docker) | `http://localhost:3001` |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development with hot reload
npm run dev

# Run the server
npm start
```

### Testing

Thoughtbox uses a combination of unit tests and agentic test scripts:

```bash
# Unit tests (vitest)
npx vitest run

# Agentic tests — full suite (build + run)
npm test

# Agentic tests — tool-level only (build + run)
npm run test:tool

# Agentic tests — quick (no build)
npm run test:quick

# Behavioral contract tests
npm run test:behavioral
```

### Docker Compose

A `docker-compose.yml` is included to run the full observability stack:

```bash
docker compose up --build
```

| Service | Port | Description |
|---------|------|-------------|
| **thoughtbox** | 1731 (MCP), 1729 (Observatory) | Core MCP server + Observatory UI |
| **mcp-sidecar** | 4000 | Observability proxy with OpenTelemetry |
| **otel-collector** | 4318 (HTTP), 8889 (metrics) | OpenTelemetry Collector |
| **prometheus** | 9090 | Metrics storage + alerting |
| **grafana** | 3001 | Dashboards and visualization |

Persistent data is stored in named volumes: `thoughtbox-data`, `prometheus-data`, `grafana-data`.

## Architecture

```text
src/
├── index.ts              # Entry point (stdio/HTTP transport selection)
├── server-factory.ts     # MCP server factory with tool registration
├── tool-registry.ts      # Progressive disclosure (stage-based tool enabling)
├── tool-descriptions.ts  # Stage-specific tool descriptions
├── thought-handler.ts    # Thoughtbox tool logic with critique support
├── gateway/              # Always-on routing tool
│   ├── gateway-handler.ts  # Routes to handlers with stage enforcement
│   └── operations.ts     # Gateway operations catalog
├── init/                 # Init workflow and state management
│   ├── tool-handler.ts   # Init tool operations
│   └── state-manager.ts  # Session state persistence
├── sessions/             # Session tool handler
├── sampling/             # Autonomous critique via MCP sampling
│   └── handler.ts        # SamplingHandler for LLM critique requests
├── persistence/          # Storage layer
│   ├── storage.ts        # InMemoryStorage with LinkedThoughtStore
│   └── filesystem-storage.ts  # FileSystemStorage with atomic writes
├── observatory/          # Real-time visualization
│   ├── ui/               # Self-contained HTML/CSS/JS
│   ├── ws-server.ts      # WebSocket server for live updates
│   └── emitter.ts        # Event emission for thought changes
├── hub/                  # Multi-agent collaboration
│   ├── identity.ts         # Agent registration
│   ├── workspace.ts        # Workspace management
│   ├── problems.ts         # Problem tracking with dependencies
│   ├── proposals.ts        # Solution proposals with reviews
│   ├── consensus.ts        # Decision recording
│   ├── channels.ts         # Problem-scoped messaging
│   ├── hub-handler.ts      # Hub operation dispatcher
│   └── operations.ts       # 27-operation catalog
├── knowledge/            # Knowledge graph memory
├── events/               # Event emission system
├── mental-models/        # 15 reasoning frameworks
├── notebook/             # Literate programming engine
├── observability/        # Prometheus/Grafana integration
└── resources/            # Documentation and patterns cookbook
```

### Storage

Thoughtbox supports two storage backends:

- **InMemoryStorage**: Default for development, uses `LinkedThoughtStore` for O(1) thought lookups
- **FileSystemStorage**: Persistent storage with atomic writes and project isolation

Data is stored at `~/.thoughtbox/` by default:
```text
~/.thoughtbox/
├── config.json           # Global configuration
└── projects/
    └── {project}/
        └── sessions/
            └── {date}/
                └── {session-id}/
                    ├── manifest.json
                    └── {thought-number}.json
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup
- Commit conventions (optimized for `thick_read` code comprehension)
- Testing with vitest and agentic scripts
- Pull request process

## License

MIT License — free to use, modify, and distribute.
