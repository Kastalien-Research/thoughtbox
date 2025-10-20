# Clear Thought 2.0

Successor to Waldzell AI's Clear Thought. 

## Features

- Break down complex problems into manageable steps
- Revise and refine thoughts as understanding deepens
- Branch into alternative paths of reasoning
- Adjust the total number of thoughts dynamically
- Generate and verify solution hypotheses

## Tool

### clear_thought

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

The Clear Thought tool is designed for:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

### Thinking Approaches

Clear Thought 2.0 supports multiple reasoning strategies. For a comprehensive guide with 20+ reasoning patterns, see the **[Clear Thought Patterns Cookbook](src/resources/clear-thought-patterns-cookbook.md)**.

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

## Installation

Clear Thought 2.0 supports both **STDIO** (for local development) and **HTTP** (for production deployments) transports.

### STDIO Transport (Local Development)

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "clear-thought-two": {
      "command": "npx",
      "args": ["-y", "clear-thought-two"]
    }
  }
}
```

**Environment Variables:**
- `DISABLE_THOUGHT_LOGGING=true` - Disable thought logging to stderr

#### VS Code (Cline)

Add to `.vscode/mcp.json` or User Settings:

```json
{
  "mcp": {
    "servers": {
      "clear-thought-two": {
        "command": "npx",
        "args": ["-y", "clear-thought-two"]
      }
    }
  }
}
```

### HTTP Transport (Production Deployment)

Clear Thought 2.0 can be deployed as a scalable HTTP server using [Smithery](https://smithery.ai).

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
