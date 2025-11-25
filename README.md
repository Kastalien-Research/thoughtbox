# Thoughtbox

[![smithery badge](https://smithery.ai/badge/@Kastalien-Research/clear-thought-two)](https://smithery.ai/server/@Kastalien-Research/clear-thought-two)

MCP server providing cognitive enhancement tools for LLM agents: structured reasoning, mental models, and literate programming notebooks.

## Features

- **Thoughtbox Tool**: Step-by-step reasoning with branching, revision, and dynamic planning
- **Mental Models**: 15 structured reasoning frameworks (rubber-duck, five-whys, pre-mortem, etc.)
- **Notebook Tool**: Literate programming with JavaScript/TypeScript execution
- **Patterns Cookbook**: 6 core reasoning patterns with examples and best practices

## Tools

### 1. `thoughtbox` - Step-by-Step Reasoning

Facilitates a detailed, step-by-step thinking process for problem-solving and analysis.

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

## Usage

The Thoughtbox tool is designed for:

- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

### Thinking Approaches

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

### 2. `notebook` - Literate Programming

Create, manage, and execute interactive notebooks with JavaScript/TypeScript.

**Features:**
- Isolated execution environments per notebook
- Full package.json support with `install_deps` operation
- Sequential Feynman template for deep learning workflows
- Export notebooks as .src.md files

**Operations:**
- `create` - Create new notebook
- `add_cell` - Add markdown or code cells
- `run_cell` - Execute code with output capture
- `export` - Export to .src.md format
- `list`, `load`, `update_cell`, `get_cell`, `list_cells`

### 3. `mental_models` - Structured Reasoning Frameworks

Access 15 mental models that provide process scaffolds for how to think about problems.

**Available Models:**
- `rubber-duck`, `five-whys`, `pre-mortem`, `assumption-surfacing`
- `steelmanning`, `trade-off-matrix`, `fermi-estimation`
- `abstraction-laddering`, `decomposition`, `adversarial-thinking`
- `opportunity-cost`, `constraint-relaxation`, `time-horizon-shifting`
- `impact-effort-grid`, `inversion`

**Operations:**
- `get_model` - Retrieve specific mental model prompt
- `list_models` - List all models (optionally filter by tag)
- `list_tags` - Show available tags (debugging, planning, decision-making, etc.)
- `get_capability_graph` - Get structured data for knowledge graphs

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

### HTTP Transport (Production Deployment)

Thoughtbox can be deployed as a scalable HTTP server using [Smithery](https://smithery.ai).

**Benefits:**

- Streamable HTTP transport for better performance
- Automatic containerization and deployment
- Interactive development playground
- Built-in configuration management

**Deploy to Smithery:**

1. Visit [smithery.ai/new](https://smithery.ai/new)
2. Connect your GitHub repository
3. Configure `disableThoughtLogging` setting as needed
4. Deploy!

## Development

### Local Development

```bash
# Install dependencies
npm install

# Build for STDIO (backward compatible)
npm run build:stdio

# Build for HTTP (Smithery deployment)
npm run build:http

# Start development server with interactive playground
npm run dev
```

### Scripts

- `npm run dev` - Start Smithery development server with interactive playground
- `npm run build` - Build for production (defaults to HTTP)
- `npm run build:stdio` - Compile TypeScript for STDIO usage
- `npm run build:http` - Build for Smithery HTTP deployment
- `npm run start:http` - Run the Smithery-built HTTP server
- `npm run start:stdio` - Run the compiled STDIO version locally
- `npm run watch` - Watch mode for development

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
