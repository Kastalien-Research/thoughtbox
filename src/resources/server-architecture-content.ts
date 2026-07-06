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

Thoughtbox is an MCP (Model Context Protocol) server that provides cognitive enhancement tools for LLM agents using Code Mode. Three tools are registered:

1. **thoughtbox_search** - Write JavaScript to query the operation/prompt/resource catalog
2. **thoughtbox_execute** - Write JavaScript against the \`tb\` SDK to chain operations
3. **thoughtbox_peer_notebook** - Seed artifacts and invoke the brokered claim-extractor peer

The \`tb\` SDK inside \`thoughtbox_execute\` exposes the domain modules:

- **tb.thought** - Step-by-step reasoning with branching, revision, and semantic types
- **tb.session** - Session management and persistence
- **tb.notebook** - Literate programming notebooks
- **tb.knowledge** - Knowledge graph (entities, relations, observations)
- **tb.theseus** - Friction-gated refactoring protocol
- **tb.ulysses** - Surprise-gated debugging protocol
- **tb.observability** - Metrics, health, alerts

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
│  │   Tool Registration — All tools available immediately           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│       ↓           ↓            ↓            ↓           ↓         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Thought  │ │ Session  │ │ Notebook │ │Knowledge │ │ Protocol ││
│  │ Handler  │ │ Handler  │ │ Handler  │ │ Handler  │ │ Handlers ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                              ↓                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │   Persistence (FileSystemStorage + SupabaseStorage)        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
\`\`\`

### Key Design Patterns

1. **Code Mode**: One execute tool hosts the whole \`tb\` SDK — the LLM writes code that chains operations instead of making many tool calls
2. **Search + Execute**: \`thoughtbox_search\` discovers operations; \`thoughtbox_execute\` runs them
3. **Resource Embedding**: Responses include contextual documentation as embedded resources
4. **Streamable HTTP**: Single transport via Express with per-session server instances
5. **Lazy Initialization**: Resources created on-demand, not at startup
6. **Persistent Sessions**: File-based storage with atomic writes and project isolation

## Tool Surface

Three tools are registered at connection start. Domain functionality lives in the \`tb\` SDK modules inside \`thoughtbox_execute\`.

### Tool Examples

###### tool-usage.ts

\`\`\`typescript
// Example: code passed to the thoughtbox_execute tool

// Structured reasoning
async () => tb.thought({
  thought: 'Analyzing the problem',
  thoughtType: 'reasoning',
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
});

// Session management
async () => tb.session.list();
\`\`\`

## Project Scoping

Project scope is resolved automatically at startup:

1. **\`THOUGHTBOX_PROJECT\` env var** — explicit project name (takes precedence)
2. **MCP Roots** — server calls \`listRoots()\` on the client and uses the first root's name
3. **Default** — falls back to 'default' if neither is available

This scopes all storage (sessions, knowledge graph, protocol state) to a single project namespace.

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

### Thought Event Emission

\`thought-handler.ts\` emits fire-and-forget reasoning events through the
\`ThoughtEmitter\` singleton (\`src/events/thought-emitter.ts\`). Emission never
blocks or affects reasoning:

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

These events are consumed in-process by the evaluation system
(\`src/evaluation/\`), which bridges them to LangSmith for tracing.

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

// Example: thoughtbox_execute tool call running tb.thought
const exampleRequest: MCPToolRequest = {
  method: 'tools/call',
  params: {
    name: 'thoughtbox_execute',
    arguments: {
      code: \`async () => tb.thought({
        thought: 'Analyzing the problem structure',
        thoughtType: 'reasoning',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      })\`
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

## The tb.thought Module

\`tb.thought\` implements a flexible sequential thinking framework. Key features:

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

## The tb.notebook Module

Instead of exposing 10 separate MCP tools (\`notebook_create\`, \`notebook_list\`, etc.), Thoughtbox groups notebook functionality into the \`tb.notebook\` SDK module inside \`thoughtbox_execute\`:

- **Single Surface**: \`tb.notebook.<operation>(args)\`
- **Cleaner Interface**: Clients see 3 registered tools total, not one per operation
- **Easier Maintenance**: Add operations without changing MCP tool registration

### Available Operations

**Notebook Management**
- \`create\`: Create new notebook
- \`list\`: List all notebooks
- \`load\`: Load from .src.md content
- \`export\`: Save to .src.md format

**Cell Operations**
- \`addCell\`: Add title/markdown/code cell
- \`updateCell\`: Modify cell content
- \`listCells\`: List all cells
- \`getCell\`: Get cell details

**Execution**
- \`runCell\`: Execute code cell
- \`installDeps\`: Install pnpm dependencies

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

## Hub Realtime Delivery (Hosted Mode)

In hosted mode the server's job ends at writing hub rows to Supabase; event
delivery is Supabase Realtime (postgres_changes), not a server push path. The
local-mode SSE stream (\`/events\`) and \`POST /hub/api\` are local-only and do
not exist on the deployed server.

**Published tables** (in the \`supabase_realtime\` publication):
\`hub_channel_messages\`, \`hub_workspaces\`, \`hub_problems\`, \`hub_proposals\`,
\`hub_proposal_reviews\`, \`hub_consensus_markers\`, \`hub_consensus_endorsements\`,
and \`claims\` (claim status transitions, SPEC-AGX-SUBSTRATE B3 — subscribe to
\`event: 'UPDATE'\`; \`claim_edges\`/\`claim_subscriptions\` are deliberately not
published, and agents should prefer the pull primitives \`tb.claims.verify\`
and \`tb.claims.changed_since\` over a standing subscription).

**Authorization is RLS.** Clients subscribe with the Supabase anon key plus
their own auth session; Realtime delivers only rows the subscriber's
workspace-membership SELECT policies allow. A client outside the tenant
workspace receives nothing.

**Subscription pattern** (supabase-js, filter by your tenant workspace id):

\`\`\`typescript
const channel = supabase
  .channel('hub-channel-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'hub_channel_messages',
      filter: \`tenant_workspace_id=eq.\${tenantWorkspaceId}\`,
    },
    (payload) => handleMessage(payload.new)
  )
  .subscribe();
\`\`\`

The same pattern applies to the other published tables. Subscribe to explicit
events — \`event: 'INSERT'\` plus \`event: 'UPDATE'\` where transitions matter
(e.g. proposal status changes) — not \`event: '*'\`. To watch multiple tables,
chain additional \`.on()\` calls on one channel or use a distinct channel name
per table; creating separate channels with the same name produces competing
subscriptions in supabase-js.

**DELETE events cannot be RLS-filtered.** With default REPLICA IDENTITY,
DELETE WAL records carry only primary-key columns — no
\`tenant_workspace_id\` — so Realtime cannot evaluate the workspace-membership
policy and cross-workspace subscribers could see deleted-row PKs.
\`REPLICA IDENTITY FULL\` is deliberately not enabled (full-row DELETE
payloads would bloat WAL on the message-heavy tables), so do not rely on
\`event: '*'\` for tenant-isolated streams.

Polling \`tb.hub.read_channel\` remains the fallback when a Realtime
connection is not available.

## Key Takeaways

### 1. All Tools Available Immediately

All tools are registered at startup and available from the first call. No initialization ceremony or staged unlocking required.

### 2. Project Scope from MCP Roots

Project scope is resolved automatically from MCP roots or \`THOUGHTBOX_PROJECT\` env var. No agent-driven initialization ceremony.

### 3. LinkedThoughtStore Enables Efficient Queries

The doubly-linked list with Map indexes provides O(1) lookups while maintaining chain structure for branching and revisions.

### 4. Fire-and-Forget Events Enable Tracing

The \`ThoughtEmitter\` emits reasoning events without blocking or affecting reasoning. The evaluation system consumes them in-process and bridges to LangSmith for observability.

### 5. MCP Enables Structured Cognition

The Model Context Protocol isn't just about API calls - it's about giving LLMs structured ways to think, document, and organize knowledge.

---

## Reference Files

| File | Purpose |
|------|---------|
| \`src/server-factory.ts\` | Server creation, tool registration, transport |
| \`src/persistence/storage.ts\` | Storage and LinkedThoughtStore |
| \`src/events/thought-emitter.ts\` | Reasoning event emission |
| \`src/sessions/index.ts\` | Session tool handler |
| \`src/thought-handler.ts\` | Thought processing and reasoning chains |

## Conclusion

The Thoughtbox MCP server showcases modern patterns for building AI-native tools. The toolhost dispatch, resource embedding, and direct tool access create a flexible system that works across different client types.`;
