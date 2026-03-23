export const SERVER_ARCHITECTURE_GUIDE = `<!-- srcbook:{"language":"typescript","tsconfig.json":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"ES2022\",\n    \"moduleResolution\": \"node\",\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"strict\": true,\n    \"resolveJsonModule\": true,\n    \"allowSyntheticDefaultImports\": true,\n    \"forceConsistentCasingInFileNames\": true\n  }\n}"} -->

# Understanding the Thoughtbox MCP Server

###### package.json

\`\`\`json
{
  "type": "module",
  "dependencies": {}
}
\`\`\`

## Introduction

Thoughtbox is an MCP (Model Context Protocol) server that provides cognitive enhancement tools for LLM agents. All tools are available immediately at connection start. No staged unlocking is required.

1. **thoughtbox_gateway** - Always-available router for all operations
2. **thoughtbox_cipher** - Deep thinking primer
3. **session** - Session management and persistence
4. **thoughtbox** - Sequential thinking with 7 core reasoning patterns + autonomous critique
5. **notebook** - Literate programming toolhost for executable documentation
6. **mental_models** - Mental model application and analysis

This notebook explores the architecture, implementation patterns, and design decisions behind the Thoughtbox server.

### Why MCP?

The Model Context Protocol enables LLMs to interact with external systems through:
- **Tools**: Callable functions with typed parameters
- **Resources**: URI-addressable content with MIME types
- **Prompts**: Template-based interactions

Thoughtbox leverages all three MCP primitives to create a powerful thinking environment.

## Architecture Overview

The server consists of several interconnected components:

\`\`\`
┌────────────────────────────────────────────────────────────────────┐
│                     Thoughtbox MCP Server                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │   MCP Protocol Layer (server-factory.ts)                     │ │
│  │   - Request handlers    - Tool dispatch                      │ │
│  │   - Resource management - Streamable HTTP transport           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↓                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │   Gateway (always-on) + ToolRegistry                         │ │
│  │   All tools available immediately                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│       ↓           ↓            ↓            ↓           ↓         │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Init   │ │ Thought  │ │ Notebook │ │ Session  │ │ Mental   │  │
│  │Handler │ │ Handler  │ │ Handler  │ │ Handler  │ │ Models   │  │
│  └────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                              ↓                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │   Persistence (FileSystemStorage) + Observatory (WebSocket)  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
\`\`\`

### Key Design Patterns

1. **Gateway Pattern**: Single always-enabled tool that routes to all handlers
2. **Toolhost Pattern**: Single \`notebook\` tool with operation dispatch vs 10 separate tools
3. **Resource Embedding**: Responses include contextual documentation as embedded resources
4. **Streamable HTTP**: Single transport via Express with per-session server instances
5. **Lazy Initialization**: Resources created on-demand, not at startup
6. **Autonomous Critique**: Optional LLM sampling for thought analysis via MCP sampling API
7. **Persistent Sessions**: File-based storage with atomic writes and project isolation

## Gateway Tool Pattern

The gateway tool (\`thoughtbox_gateway\`) is an always-available router that dispatches to all other handlers through a single tool interface. All operations are available immediately at connection start. No staged unlocking is required.

### Gateway Operations

| Operation | Description |
|-----------|-------------|
| \`get_state\` | Get current session state |
| \`list_sessions\` | List available sessions |
| \`navigate\` | Navigate session hierarchy |
| \`load_context\` | Load existing session |
| \`start_new\` | Start new reasoning session |
| \`list_roots\` | List MCP roots |
| \`bind_root\` | Bind a root as project scope |
| \`cipher\` | Load notation system |
| \`session\` | Session management operations |
| \`thought\` | Structured reasoning |
| \`notebook\` | Literate programming |

### When to Use Gateway vs Direct Tools

Use **gateway** when:
- You want a single consistent interface
- Using streaming HTTP transport

Use **direct tools** when:
- You want cleaner tool discovery

###### gateway-usage.ts

\`\`\`typescript
// Example: Using gateway vs direct tools

// Gateway approach (always works)
const viaGateway = {
  tool: 'thoughtbox_gateway',
  args: {
    operation: 'thought',
    args: {
      thought: 'Analyzing the problem',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    }
  }
};

// Direct approach (requires tool list refresh)
const viaDirect = {
  tool: 'thoughtbox',
  args: {
    thought: 'Analyzing the problem',
    thoughtNumber: 1,
    totalThoughts: 5,
    nextThoughtNeeded: true
  }
};

console.log('Gateway approach:', JSON.stringify(viaGateway, null, 2));
console.log('Direct approach:', JSON.stringify(viaDirect, null, 2));
\`\`\`

## State Management

The StateManager tracks session state for each MCP connection.

\`\`\`typescript
// state-manager.ts:15-19
export enum ConnectionStage {
  STAGE_1_UNINITIALIZED = 'stage_1',  // No init call yet
  STAGE_2_INIT_STARTED = 'stage_2',   // Init called
  STAGE_3_FULLY_LOADED = 'stage_3',   // Context loaded
}
\`\`\`

### Session State

\`\`\`typescript
// state-manager.ts:34-55
export interface SessionState {
  stage: ConnectionStage;
  project?: string;
  task?: string;
  aspect?: string;
  activeSessionId?: string;
  boundRoot?: BoundRoot;  // SPEC-011 MCP Roots support
  lastUpdated: Date;
}
\`\`\`

### BoundRoot (SPEC-011)

For MCP Roots support, sessions can be scoped to a project root:

\`\`\`typescript
// state-manager.ts:24-29
export interface BoundRoot {
  uri: string;    // e.g., file:///path/to/project
  name?: string;  // Human-readable name
}

// Usage
stateManager.setBoundRoot(sessionId, {
  uri: 'file:///Users/dev/my-project',
  name: 'my-project'
});
\`\`\`

## Storage Architecture

### ThoughtboxStorage Interface

\`\`\`typescript
// persistence/types.ts
export interface ThoughtboxStorage {
  // Config
  getConfig(): Promise<Config | null>;
  updateConfig(attrs: Partial<Config>): Promise<Config>;

  // Sessions
  createSession(params: CreateSessionParams): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(id: string, attrs: Partial<Session>): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  listSessions(filter?: SessionFilter): Promise<Session[]>;

  // Thoughts
  saveThought(sessionId: string, thought: ThoughtData): Promise<void>;
  getThoughts(sessionId: string): Promise<ThoughtData[]>;
  getThought(sessionId: string, thoughtNumber: number): Promise<ThoughtData | null>;

  // Branches
  saveBranchThought(sessionId: string, branchId: string, thought: ThoughtData): Promise<void>;
  getBranch(sessionId: string, branchId: string): Promise<ThoughtData[]>;
}
\`\`\`

### Storage Implementations

| Implementation | Location | Use Case |
|---------------|----------|----------|
| **InMemoryStorage** | \`storage.ts\` | Testing, ephemeral sessions |
| **FileSystemStorage** | \`filesystem-storage.ts\` | Production persistence |

### LinkedThoughtStore

The core data structure for reasoning chains - a doubly-linked list with Map index for O(1) lookups:

\`\`\`typescript
// storage.ts:32-448
export class LinkedThoughtStore {
  /** All nodes indexed by ID for O(1) lookup */
  private nodes: Map<ThoughtNodeId, ThoughtNode> = new Map();

  /** First node ID for each session */
  private sessionHead: Map<string, ThoughtNodeId> = new Map();

  /** Last node ID for each session */
  private sessionTail: Map<string, ThoughtNodeId> = new Map();

  /** Session index: sessionId -> Set of all node IDs */
  private sessionIndex: Map<string, Set<ThoughtNodeId>> = new Map();
}
\`\`\`

### ThoughtNode Structure

\`\`\`typescript
export interface ThoughtNode {
  id: ThoughtNodeId;           // e.g., "session-123:5" or "session-123:branch-a:3"
  data: ThoughtData;           // The actual thought content
  prev: ThoughtNodeId | null;  // Previous node in chain
  next: ThoughtNodeId[];       // Next nodes (array for branches)
  revisesNode: ThoughtNodeId | null;   // If this is a revision
  branchOrigin: ThoughtNodeId | null;  // Where branch forked from
  branchId: string | null;     // Branch identifier
}
\`\`\`

### Node ID Format

- **Main chain**: \`\${sessionId}:\${thoughtNumber}\`
- **Branch**: \`\${sessionId}:\${branchId}:\${thoughtNumber}\`

This ensures branch thoughts with the same thought number but different branch IDs remain unique.

## Observatory System

Real-time WebSocket monitoring for reasoning processes.

### Components

\`\`\`typescript
// observatory/index.ts exports
export { ThoughtEmitter, thoughtEmitter } from "./emitter.js";
export { WebSocketServer } from "./ws-server.js";
export { Channel } from "./channel.js";
export { createObservatoryServer } from "./server.js";
\`\`\`

### ThoughtEmitter

Fire-and-forget event emission that doesn't affect reasoning:

\`\`\`typescript
// Usage in thought-handler.ts
if (thoughtEmitter.hasListeners()) {
  thoughtEmitter.emitThoughtAdded({
    sessionId,
    thought,
    parentId: previousThought?.id ?? null
  });
}
\`\`\`

### Event Types

| Event | Payload | Description |
|-------|---------|-------------|
| \`thought:added\` | ThoughtAddedPayload | New thought in chain |
| \`thought:revised\` | ThoughtRevisedPayload | Thought revised |
| \`thought:branched\` | ThoughtBranchedPayload | Branch created |
| \`session:started\` | SessionStartedPayload | Session began |
| \`session:ended\` | SessionEndedPayload | Session completed |
| \`session:snapshot\` | SessionSnapshotPayload | Full session state |

### Channel-Based WebSocket Server

Clients subscribe to topics:

\`\`\`typescript
// Client subscribes to a session's events
ws.send(JSON.stringify({
  type: 'subscribe',
  topic: 'session:abc-123'
}));

// Server sends events for that session
{
  type: 'thought:added',
  topic: 'session:abc-123',
  data: { thoughtNumber: 5, thought: '...' }
}
\`\`\`

### Configuration

Observatory is configured via environment variables:

\`\`\`typescript
// observatory/config.ts
export const ObservatoryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  port: z.number().default(8080),
  host: z.string().default('localhost'),
});

// Load from environment
const config = loadObservatoryConfig();
// Uses: OBSERVATORY_ENABLED, OBSERVATORY_PORT, OBSERVATORY_HOST
\`\`\`

###### mcp-protocol-flow.ts

\`\`\`typescript
// Demonstration: MCP Protocol Message Flow
// This shows how a tool call flows through the server

interface MCPToolRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: any;
  }>;
  isError?: boolean;
}

// Example: thoughtbox tool call
const exampleRequest: MCPToolRequest = {
  method: 'tools/call',
  params: {
    name: 'thoughtbox',
    arguments: {
      thought: 'Analyzing the problem structure',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    }
  }
};

console.log('MCP Request:', JSON.stringify(exampleRequest, null, 2));

// Server processes this and returns:
const exampleResponse: MCPToolResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        branches: [],
        thoughtHistoryLength: 1
      }, null, 2)
    },
    // At thought 1, patterns cookbook is embedded
    {
      type: 'resource',
      resource: {
        uri: 'thoughtbox://patterns-cookbook',
        title: 'Thoughtbox Patterns Cookbook',
        mimeType: 'text/markdown'
      }
    }
  ]
};

console.log('\\nMCP Response:', JSON.stringify(exampleResponse, null, 2));
\`\`\`

## The thoughtbox Tool

The \`thoughtbox\` tool implements a flexible sequential thinking framework. Key features:

### Parameters
- **thought**: The current reasoning step
- **thoughtNumber**: Logical position (1 to N)
- **totalThoughts**: Estimated total (adjustable on the fly)
- **nextThoughtNeeded**: Continue or conclude?
- **isRevision**: Marks thought as updating a previous one
- **branchFromThought**: Creates alternative reasoning paths
- **includeGuide**: Requests the patterns cookbook

### Implementation Highlights

1. **Validation**: Type-checks all inputs before processing
2. **History Tracking**: Stores all thoughts for branch management
3. **Colored Output**: Uses chalk to format thoughts with borders and colors
4. **Resource Embedding**: Conditionally includes the patterns cookbook at thought 1, final thought, or on-demand
5. **Error Handling**: Returns structured error responses with \`isError\` flag

###### clear-thought-patterns.ts

\`\`\`typescript
// Demonstration: thoughtbox patterns

// 1. Forward Thinking (1 → N)
const forwardThinking = {
  thought: 'Starting analysis of the problem',
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
};

// 2. Backward Thinking (N → 1)
const backwardThinking = {
  thought: 'Final state: System handles 10k req/s',
  thoughtNumber: 8,  // Start at the end
  totalThoughts: 8,
  nextThoughtNeeded: true
};

// 3. Branching
const branch = {
  thought: 'Exploring SQL approach',
  thoughtNumber: 6,
  totalThoughts: 15,
  branchFromThought: 5,
  branchId: 'sql-option',
  nextThoughtNeeded: true
};

// 4. Revision
const revision = {
  thought: 'CORRECTION: Found additional stakeholder',
  thoughtNumber: 11,
  totalThoughts: 15,
  isRevision: true,
  revisesThought: 4,
  nextThoughtNeeded: true
};

// 5. Request guide on-demand
const withGuide = {
  thought: 'Need to review reasoning patterns',
  thoughtNumber: 7,
  totalThoughts: 15,
  includeGuide: true,  // Embeds patterns cookbook
  nextThoughtNeeded: true
};

console.log('Forward:', forwardThinking);
console.log('\\nBackward:', backwardThinking);
console.log('\\nBranch:', branch);
console.log('\\nRevision:', revision);
console.log('\\nWith Guide:', withGuide);
\`\`\`

## The Notebook Toolhost Pattern

Instead of exposing 10 separate MCP tools (\`notebook_create\`, \`notebook_list\`, etc.), Thoughtbox uses a **toolhost pattern**:

- **Single Tool**: \`notebook(operation, args)\`
- **Operation Dispatch**: The \`operation\` parameter routes to specific handlers
- **Cleaner Interface**: Clients see 1 tool instead of 10
- **Easier Maintenance**: Add operations without changing MCP tool registration

### Available Operations

**Notebook Management**
- \`create\`: Create new notebook
- \`list\`: List all notebooks
- \`load\`: Load from .src.md file
- \`export\`: Save to .src.md file

**Cell Operations**
- \`add_cell\`: Add title/markdown/code cell
- \`update_cell\`: Modify cell content
- \`list_cells\`: List all cells
- \`get_cell\`: Get cell details

**Execution**
- \`run_cell\`: Execute code cell
- \`install_deps\`: Install pnpm dependencies

### Operation Catalog Resource

The \`thoughtbox://notebook/operations\` resource provides a complete catalog of operations with schemas and examples. This enables LLMs to discover and use operations correctly.

## Resource Embedding Pattern

A powerful MCP feature: **tools can embed resources in their responses**. This provides context-aware documentation.

### Three Resource Types

1. **system://status** - Runtime health information
   - Notebook count, active notebooks
   - Dynamic, reflects current state

2. **thoughtbox://notebook/operations** - Complete operations catalog
   - All 10 operations with schemas and examples
   - Static reference documentation

3. **thoughtbox://patterns-cookbook** - Reasoning patterns guide
   - 7 core thinking patterns
   - Embedded at thought 1, final thought, or on-demand

### Embedded Resources in Responses

When you call a notebook operation, the response includes an embedded resource:

\`\`\`typescript
{
  content: [
    { type: 'text', text: '...' },
    {
      type: 'resource',
      resource: {
        uri: 'thoughtbox://notebook/operations/create',
        title: 'Create Notebook',
        mimeType: 'application/json',
        text: '{ "name": "create", ... }',
        annotations: {
          audience: ['assistant'],
          priority: 0.5
        }
      }
    }
  ]
}
\`\`\`

This means every tool response includes just-in-time documentation about what was executed!

## Key Takeaways

### 1. Gateway Provides a Single Entry Point

The gateway tool ensures all clients can access all functionality through a single consistent interface. All tools are available immediately at connection start.

### 2. ConnectionStage Tracks Session Initialization

ConnectionStage tracks where a session is in its lifecycle (uninitialized, started, fully loaded). This is separate from tool availability.

### 3. LinkedThoughtStore Enables Efficient Queries

The doubly-linked list with Map indexes provides O(1) lookups while maintaining chain structure for branching and revisions.

### 4. Observatory Enables Real-Time Monitoring

Fire-and-forget event emission with channel-based WebSocket delivery lets external tools observe reasoning without affecting it.

### 5. MCP Enables Structured Cognition

The Model Context Protocol isn't just about API calls - it's about giving LLMs structured ways to think, document, and organize knowledge.

---

## Reference Files

| File | Purpose |
|------|---------|
| \`src/gateway/gateway-handler.ts\` | Gateway tool implementation |
| \`src/tool-registry.ts\` | Tool registration |
| \`src/init/state-manager.ts\` | Session state tracking |
| \`src/persistence/storage.ts\` | Storage and LinkedThoughtStore |
| \`src/observatory/index.ts\` | Real-time monitoring |
| \`src/server-factory.ts\` | Server creation and transport |

## Conclusion

The Thoughtbox MCP server showcases modern patterns for building AI-native tools. The gateway pattern, toolhost dispatch, and resource embedding create a flexible system that works across different client types.`;
