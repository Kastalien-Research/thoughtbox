# Thoughtbox

**A reasoning ledger for AI agents.** Thoughtbox is an MCP server that provides structured reasoning tools, enabling agents to think step-by-step, branch into alternative explorations, revise earlier conclusions, and maintain a persistent record of their cognitive process.

Unlike ephemeral chain-of-thought prompting, Thoughtbox creates a **durable reasoning chain** — a ledger of thoughts that can be visualized, exported, and analyzed. Each thought is a node in a graph structure supporting forward thinking, backward planning, branching explorations, and mid-course revisions.

![Thoughtbox Observatory](public/Screenshot%202025-12-11%20at%206.23.22%20AM.png)
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

### 1. Thoughtbox Tool — Structured Reasoning

The core tool for step-by-step thinking with full graph capabilities.

```javascript
// Simple forward thinking
{ thought: "First, let's identify the problem...", thoughtNumber: 1, totalThoughts: 5, nextThoughtNeeded: true }

// Branching to explore alternatives
{ thought: "Option A: Use PostgreSQL...", thoughtNumber: 3, branchFromThought: 2, branchId: "sql-path", ... }

// Revising an earlier conclusion
{ thought: "Actually, the root cause is...", thoughtNumber: 7, isRevision: true, revisesThought: 3, ... }
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

### 2. Observatory — Real-Time Visualization

A built-in web UI for watching reasoning unfold in real-time.

**Features:**
- **Live Graph**: Watch thoughts appear as they're added
- **Snake Layout**: Compact left-to-right flow with row wrapping
- **Hierarchical Branches**: Branches collapse into clickable stub nodes (A, B, C...)
- **Navigation**: Click stubs to explore branches, back button to return
- **Detail Panel**: Click any node to view full thought content
- **Multi-Session**: Switch between active reasoning sessions

**Access:** The Observatory is available at `http://localhost:1729` when the server is running.

### 3. Mental Models — Reasoning Frameworks

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

### 4. Notebook — Literate Programming

Interactive notebooks combining documentation with executable JavaScript/TypeScript.

**Features:**
- Isolated execution environments per notebook
- Full package.json support with dependency installation
- Sequential Feynman template for deep learning workflows
- Export to `.src.md` format

**Operations:** `create`, `add_cell`, `run_cell`, `export`, `list`, `load`, `update_cell`

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

- `DISABLE_THOUGHT_LOGGING=true` — Suppress thought logging to stderr

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

## Architecture

```text
src/
├── index.ts              # MCP server entry point
├── persistence/          # Session and thought storage
│   └── storage.ts        # In-memory storage with linked thought chains
├── observatory/          # Real-time visualization
│   ├── ui/               # Self-contained HTML/CSS/JS
│   ├── ws-server.ts      # WebSocket server for live updates
│   └── emitter.ts        # Event emission for thought changes
├── mental-models/        # 15 reasoning frameworks
├── notebook/             # Literate programming engine
└── resources/            # Documentation and patterns cookbook
```

## License

MIT License — free to use, modify, and distribute.
