# Thoughtbox

[![smithery badge](https://smithery.ai/badge/@Kastalien-Research/clear-thought-two)](https://smithery.ai/server/@Kastalien-Research/clear-thought-two)

MCP server providing cognitive enhancement tools for LLM agents: structured reasoning, mental models, and literate programming notebooks.

## Features

- **Thoughtbox Tool**: Reasoning substrate for agents—call first for any task requiring thought, planning, or analysis
- **Mental Models**: 15 structured reasoning frameworks that complement Thoughtbox workflows
- **Notebook Tool**: Executable documentation environment for code-as-documentation
- **Patterns Cookbook**: Core reasoning patterns automatically provided during Thoughtbox sessions

## Tools

### 1. `thoughtbox` - Reasoning Substrate

Reasoning substrate for agents. Call first for any task requiring thought, planning, analysis, or multi-step work.

Externalizes your reasoning process into structured, persistent steps. Enables dynamic course correction, branching exploration, and revision of earlier thinking. Any model becomes a reasoning model when using Thoughtbox.

**Inputs:**

- `thought` (string): The current thinking step
- `nextThoughtNeeded` (boolean): Whether another thought step is needed
- `thoughtNumber` (integer): Current thought number
- `totalThoughts` (integer): Estimated total thoughts needed
- `isRevision` (boolean, optional): Whether this revises previous thinking
- `revisesThought` (integer, optional): Which thought is being reconsidered
- `branchFromThought` (integer, optional): Branching point thought number
- `branchId` (string, optional): Branch identifier
- `needsMoreThoughts` (boolean, optional): If more thoughts are needed

## Reasoning Approaches

Thoughtbox supports multiple reasoning strategies. For a comprehensive guide with 7 core reasoning patterns, see the **[Thoughtbox Patterns Cookbook](src/resources/docs/thoughtbox-patterns-cookbook.md)**.

Below are the three primary approaches:

#### Forward Thinking (Traditional)

Start at thought 1 and work sequentially toward your conclusion. Best for exploration and discovery.

**Example: "How can we improve user engagement?"**

- Thought 1: Analyze current engagement metrics (DAU/MAU ratio, session duration, bounce rate)
- Thought 2: Identify patterns in user behavior (when do users drop off? what features are sticky?)
- Thought 3: Survey top engagement drivers from user research and analytics
- Thought 4: Brainstorm potential improvements (notifications, gamification, social features)
- Thought 5: Evaluate each option against effort/impact matrix
- Thought 6: Recommendation - implement personalized onboarding flow with progress tracking

#### Backward Thinking (Goal-Driven)

Start with thought N (your desired end state) and work backward to thought 1 (starting conditions). Best for planning and system design.

**Example: "Design a caching strategy for a high-traffic API (10k req/s)"**

- Thought 8: **Final state** - System handles 10,000 requests/second with <50ms p95 latency, 85%+ cache hit rate
- Thought 7: To validate success, need monitoring: cache hit/miss rates, latency metrics, memory usage, eviction rates
- Thought 6: Before monitoring, implement resilience: circuit breakers, fallback to database, graceful degradation
- Thought 5: Before resilience, need cache invalidation strategy: TTL (1-5 min) + event-driven invalidation on writes
- Thought 4: Before invalidation, implement caching layer: Redis cluster with connection pooling, LRU eviction
- Thought 3: Before implementation, identify what to cache: analyze endpoint usage patterns, read/write ratios
- Thought 2: Before analysis, establish baseline metrics: current throughput, latency distribution, query times
- Thought 1: **Starting point** - Define success criteria and constraints (target latency, throughput, data freshness)

#### Mixed/Branched Thinking

Combine approaches or explore alternatives using revision and branch parameters for complex multi-faceted problems.

### 2. `notebook` - Executable Documentation

Executable documentation environment. Use for building reproducible code examples, tutorials, or prototypes—especially when you lack a sandbox or when preserving code-as-documentation adds value.

Creates isolated JavaScript/TypeScript notebooks with markdown and executable cells. Each notebook gets its own workspace and package.json.

**Operations:** `create`, `list`, `load`, `add_cell`, `update_cell`, `run_cell`, `install_deps`, `list_cells`, `get_cell`, `export`

Templates available (e.g., "sequential-feynman" for deep learning workflows).

### 3. `mental_models` - Structured Reasoning Frameworks

Structured reasoning frameworks that complement Thoughtbox workflows. When your thinking needs a specific shape—debugging, decision-making, estimation—retrieve a mental model to scaffold the process.

15 models across 9 tags: debugging, planning, decision-making, risk-analysis, estimation, prioritization, communication, architecture, validation.

**Operations:** `get_model`, `list_models`, `list_tags`, `get_capability_graph`

Each model provides process steps, examples, and pitfalls. Scaffolds for HOW to think, not WHAT to think.

## Prerequisites

- [Node.js](https://nodejs.org/) version 22 or higher

## Installation

### Quick Start

Run directly without installation:

```bash
npx -y @kastalien-research/thoughtbox
```

### Configure Your MCP Client

#### Cline

Add to your Cline MCP settings (click MCP Servers icon → Configure → Configure MCP Servers):

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

#### Claude Desktop

Add to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

#### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your workspace:

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

### Alternative Installation Methods

#### Global Installation (npm)

```bash
npm install -g @kastalien-research/thoughtbox
```

#### Smithery

Visit the [Thoughtbox page on Smithery](https://smithery.ai/server/@Kastalien-Research/clear-thought-two) for one-click installation instructions specific to your MCP client.

> **Note**: Smithery deployment uses the name `@Kastalien-Research/clear-thought-two` while the NPM package is `@kastalien-research/thoughtbox`.

### Environment Variables

- `DISABLE_THOUGHT_LOGGING=true` - Disable thought logging to stderr

## Development

### Local Development

```bash
# Install dependencies
npm install

# Build (compiles both stdio and http entry points)
npm run build

# Start development server with interactive playground
npm run dev
```

### Scripts

- `npm run dev` - Start Smithery development server with interactive playground
- `npm run build` - Build for production (runs `build:local`)
- `npm run build:local` - Compile TypeScript (produces both `dist/index.js` and `dist/http.js`)
- `npm run build:smithery` - Build for Smithery HTTP deployment
- `npm run start` - Run the HTTP server locally
- `npm run start:stdio` - Run the STDIO version locally
- `npm run start:smithery` - Run the Smithery-built server
- `npm run watch` - Watch mode for development

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
