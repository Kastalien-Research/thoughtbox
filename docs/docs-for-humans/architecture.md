# Architecture

Technical deep-dive for contributors and integrators.

---

## System Overview

Thoughtbox is an MCP server that provides cognitive enhancement tools for AI agents. It's built around the concept of a **reasoning ledger** — treating thinking as persistent, auditable data.

```
┌─────────────────────────────────────────────────────────────┐
│                    THOUGHTBOX SERVER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              TRANSPORT LAYER                          │   │
│  │                                                       │   │
│  │    ┌─────────────┐        ┌─────────────────────┐    │   │
│  │    │    HTTP     │        │       STDIO         │    │   │
│  │    │ (port 1731) │        │  (stdin/stdout)     │    │   │
│  │    └─────────────┘        └─────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MCP SERVER CORE                          │   │
│  │                                                       │   │
│  │    Tool Registry ─── Discovery Registry               │   │
│  │         │                    │                        │   │
│  │         └────────────────────┘                        │   │
│  │                    │                                  │   │
│  └────────────────────┼──────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              HANDLER LAYER                            │   │
│  │                                                       │   │
│  │  Gateway ── Init ── Thought ── Session ── Notebook   │   │
│  │     │                                                 │   │
│  │     └── Mental Models ── Sampling ── Observability   │   │
│  └──────────────────────────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PERSISTENCE LAYER                        │   │
│  │                                                       │   │
│  │    ┌─────────────┐        ┌─────────────────────┐    │   │
│  │    │ Filesystem  │        │     In-Memory       │    │   │
│  │    │   Storage   │        │      Storage        │    │   │
│  │    └─────────────┘        └─────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
src/
├── index.ts                 # Entry point, transport selection
├── server-factory.ts        # MCP server creation
├── tool-registry.ts         # Progressive disclosure
├── discovery-registry.ts    # Operation routing
│
├── gateway/                 # Single entry point for operations
│   └── gateway-handler.ts
│
├── init/                    # Session initialization
│   ├── init-handler.ts
│   ├── tool-handler.ts
│   ├── index-builder.ts
│   └── state-manager.ts
│
├── thought-handler.ts       # Core reasoning engine
│
├── sessions/                # Session management
│   └── handlers.ts
│
├── persistence/             # Storage abstraction
│   ├── types.ts
│   ├── storage.ts           # In-memory
│   └── filesystem-storage.ts
│
├── notebook/                # Literate programming
│   ├── index.ts
│   ├── operations.ts
│   └── execution.ts
│
├── mental-models/           # Reasoning frameworks
│   ├── index.ts
│   └── contents/
│
├── sampling/                # Autonomous critique
│   └── handler.ts
│
├── observability/           # Prometheus/Grafana
│   └── gateway-handler.ts
│
├── observatory/             # Real-time visualization
│   └── ws-server.ts
│
├── prompts/                 # MCP prompts
└── resources/               # MCP resources
```

---

## Entry Point Flow

### Server Startup (`index.ts`)

```typescript
// 1. Determine transport
const transport = process.env.THOUGHTBOX_TRANSPORT || 'http';

// 2. Determine storage
const storage = process.env.THOUGHTBOX_STORAGE || 'fs';

// 3. Create server via factory
const { server, toolRegistry } = await createServer({
  storage: storage === 'memory' ? new InMemoryStorage() : new FileSystemStorage(),
  project: process.env.THOUGHTBOX_PROJECT || '_default'
});

// 4. Connect transport
if (transport === 'http') {
  const httpServer = express();
  httpServer.use('/mcp', createMcpHandler(server));
  httpServer.listen(PORT);
} else {
  const stdio = new StdioServerTransport();
  await server.connect(stdio);
}
```

### Server Factory (`server-factory.ts`)

The factory assembles all components:

```typescript
export async function createServer(options: ServerOptions) {
  // 1. Create MCP server
  const server = new McpServer({
    name: 'thoughtbox',
    version: '1.0.0'
  });

  // 2. Create registries
  const toolRegistry = new ToolRegistry();
  const discoveryRegistry = new DiscoveryRegistry();

  // 3. Create handlers
  const thoughtHandler = new ThoughtHandler(storage);
  const notebookHandler = new NotebookHandler();
  const mentalModelsHandler = new MentalModelsHandler();
  const sessionHandler = new SessionHandler(storage);
  const samplingHandler = new SamplingHandler(server);
  const initHandler = new InitHandler(storage, toolRegistry);
  const gatewayHandler = new GatewayHandler(/* all handlers */);
  const observabilityHandler = new ObservabilityGatewayHandler();

  // 4. Register tools
  server.tool('thoughtbox_gateway', gatewayHandler.schema, gatewayHandler.handle);
  server.tool('observability_gateway', observabilityHandler.schema, observabilityHandler.handle);

  // 5. Register prompts and resources
  registerPrompts(server);
  registerResources(server, mentalModelsHandler);

  return { server, toolRegistry };
}
```

---

## Progressive Disclosure System

### Tool Registry (`tool-registry.ts`)

Manages which operations are available at each stage:

```typescript
export enum DisclosureStage {
  ENTRY = 0,           // Just connected
  INIT_COMPLETE = 1,   // Session created/loaded
  CIPHER_LOADED = 2,   // Deep thinking primer loaded
  DOMAIN_ACTIVE = 3    // Mental models available
}

export class ToolRegistry {
  private stage: DisclosureStage = DisclosureStage.ENTRY;

  advanceTo(stage: DisclosureStage): void {
    if (stage > this.stage) {
      this.stage = stage;
    }
  }

  isOperationAllowed(operation: string): boolean {
    const required = this.getRequiredStage(operation);
    return this.stage >= required;
  }

  private getRequiredStage(operation: string): DisclosureStage {
    // Stage 0: Always available
    if (['get_state', 'list_sessions', 'navigate', 'list_roots', 'bind_root'].includes(operation)) {
      return DisclosureStage.ENTRY;
    }
    // Stage 1: After init
    if (['load_context', 'start_new', 'cipher', 'session'].includes(operation)) {
      return DisclosureStage.INIT_COMPLETE;
    }
    // Stage 2: After cipher
    if (['thought', 'notebook'].includes(operation)) {
      return DisclosureStage.CIPHER_LOADED;
    }
    // Stage 3: Domain operations
    return DisclosureStage.DOMAIN_ACTIVE;
  }
}
```

### Gateway Handler (`gateway-handler.ts`)

Routes operations and enforces stages:

```typescript
export class GatewayHandler {
  async handle(params: GatewayParams): Promise<GatewayResult> {
    const { operation, args } = params;

    // 1. Check stage requirement
    if (!this.toolRegistry.isOperationAllowed(operation)) {
      return {
        error: {
          code: 'STAGE_NOT_MET',
          message: `Operation '${operation}' requires Stage ${required}`,
          hint: this.getAdvancementHint(operation)
        }
      };
    }

    // 2. Route to appropriate handler
    const result = await this.routeOperation(operation, args);

    // 3. Advance stage if applicable
    this.maybeAdvanceStage(operation);

    return result;
  }

  private routeOperation(operation: string, args: any) {
    switch (operation) {
      case 'get_state':
      case 'list_sessions':
      case 'navigate':
      case 'load_context':
      case 'start_new':
      case 'list_roots':
      case 'bind_root':
        return this.initHandler.handle({ operation, ...args });
      case 'cipher':
        return this.getCipherContent();
      case 'thought':
        return this.thoughtHandler.handle(args);
      case 'session':
        return this.sessionHandler.handle(args);
      case 'notebook':
        return this.notebookHandler.handle(args);
      case 'mental_models':
        return this.mentalModelsHandler.handle(args);
    }
  }
}
```

---

## Data Model

### Thought Node Structure

Thoughts are stored as doubly-linked nodes supporting tree structures:

```typescript
interface ThoughtNode {
  // Identity
  id: ThoughtNodeId;          // "{sessionId}:{thoughtNumber}"
  data: ThoughtData;          // The thought content

  // Linked list pointers
  prev: ThoughtNodeId | null; // Previous in chain
  next: ThoughtNodeId[];      // Following nodes (array for branches)

  // Revision pointer
  revisesNode: ThoughtNodeId | null;

  // Branch metadata
  branchOrigin: ThoughtNodeId | null;
  branchId: string | null;
}
```

### Storage Interface

Abstract interface for persistence backends:

```typescript
interface ThoughtboxStorage {
  // Session operations
  createSession(params: CreateSessionParams): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  listSessions(filter?: SessionFilter): Promise<Session[]>;

  // Thought operations
  addThought(sessionId: string, thought: ThoughtData): Promise<ThoughtNode>;
  getThought(nodeId: ThoughtNodeId): Promise<ThoughtNode | null>;
  updateThought(nodeId: ThoughtNodeId, updates: Partial<ThoughtData>): Promise<void>;
  getSessionThoughts(sessionId: string): Promise<ThoughtNode[]>;

  // Export/import
  exportSession(sessionId: string): Promise<SessionExport>;
  importSession(data: SessionExport): Promise<Session>;
}
```

### In-Memory Implementation

Uses a `Map` for O(1) lookups:

```typescript
class LinkedThoughtStore {
  private nodes: Map<ThoughtNodeId, ThoughtNode> = new Map();
  private sessions: Map<string, Session> = new Map();

  addNode(node: ThoughtNode): void {
    this.nodes.set(node.id, node);

    // Update previous node's next pointer
    if (node.prev) {
      const prevNode = this.nodes.get(node.prev);
      if (prevNode) {
        prevNode.next.push(node.id);
      }
    }
  }
}
```

### Filesystem Implementation

Persists each thought as a separate file:

```typescript
class FileSystemStorage implements ThoughtboxStorage {
  private basePath: string;

  async addThought(sessionId: string, thought: ThoughtData): Promise<ThoughtNode> {
    const sessionPath = this.getSessionPath(sessionId);
    const filename = this.padNumber(thought.thoughtNumber) + '.json';
    const filepath = path.join(sessionPath, filename);

    // Atomic write via temp file
    const tempPath = filepath + '.tmp';
    await fs.writeFile(tempPath, JSON.stringify(thought, null, 2));
    await fs.rename(tempPath, filepath);

    // Update manifest
    await this.updateManifest(sessionId, filename);

    return this.createNode(sessionId, thought);
  }
}
```

---

## Thought Handler

Core reasoning engine:

```typescript
export class ThoughtHandler {
  constructor(
    private storage: ThoughtboxStorage,
    private samplingHandler: SamplingHandler,
    private emitter: ThoughtEmitter
  ) {}

  async handle(params: ThoughtParams): Promise<ThoughtResult> {
    const { thought, thoughtNumber, totalThoughts, nextThoughtNeeded } = params;

    // 1. Create thought data
    const thoughtData: ThoughtData = {
      thought,
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded,
      timestamp: new Date().toISOString()
    };

    // 2. Handle branching
    if (params.branchFromThought) {
      thoughtData.branchFromThought = params.branchFromThought;
      thoughtData.branchId = params.branchId || `branch-${Date.now()}`;
    }

    // 3. Handle revision
    if (params.isRevision && params.revisesThought) {
      thoughtData.isRevision = true;
      thoughtData.revisesThought = params.revisesThought;
    }

    // 4. Persist
    const node = await this.storage.addThought(this.sessionId, thoughtData);

    // 5. Emit for Observatory
    this.emitter.emit('thought_added', node);

    // 6. Request critique if asked
    if (params.critique) {
      const critique = await this.samplingHandler.requestCritique(this.sessionId);
      if (critique) {
        thoughtData.critique = critique;
        await this.storage.updateThought(node.id, { critique });
      }
    }

    return { thoughtNumber, sessionId: this.sessionId, timestamp: thoughtData.timestamp };
  }
}
```

---

## Sampling Handler

Autonomous LLM critique via MCP sampling:

```typescript
export class SamplingHandler {
  constructor(private server: McpServer) {}

  async requestCritique(sessionId: string): Promise<CritiqueData | null> {
    // 1. Check if sampling is supported
    if (!this.server.capabilities?.sampling) {
      return null;
    }

    // 2. Build context from recent thoughts
    const thoughts = await this.getRecentThoughts(sessionId, 5);
    const context = this.buildCritiqueContext(thoughts);

    // 3. Request critique
    const response = await this.server.sampling.createMessage({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: context
          }
        }
      ],
      systemPrompt: CRITIQUE_SYSTEM_PROMPT,
      modelPreferences: {
        hints: [{ name: 'claude-sonnet-4-5-20250929' }]
      },
      maxTokens: 500
    });

    // 4. Return critique data
    return {
      text: response.content[0].text,
      model: response.model,
      timestamp: new Date().toISOString()
    };
  }
}

const CRITIQUE_SYSTEM_PROMPT = `
You are a critical thinking assistant. Analyze the reasoning provided and identify:
1. Logical fallacies or gaps
2. Unstated assumptions
3. Alternative approaches not considered
4. Edge cases that might be missed
5. Suggestions for improvement

Be constructive but thorough. Focus on strengthening the reasoning.
`;
```

---

## Notebook Execution

Isolated JavaScript/TypeScript execution:

```typescript
export class NotebookExecutor {
  private processes: Map<string, ChildProcess> = new Map();

  async runCell(notebookId: string, cellId: string, code: string): Promise<CellResult> {
    // 1. Get or create process for notebook
    let proc = this.processes.get(notebookId);
    if (!proc) {
      proc = this.createProcess(notebookId);
      this.processes.set(notebookId, proc);
    }

    // 2. Transpile if TypeScript
    const executableCode = this.notebook.language === 'typescript'
      ? await this.transpile(code)
      : code;

    // 3. Execute and capture output
    return new Promise((resolve) => {
      let output = '';
      let error = null;

      const handler = (data: Buffer) => {
        output += data.toString();
      };

      proc.stdout.on('data', handler);
      proc.stderr.on('data', (data) => {
        error = data.toString();
      });

      proc.stdin.write(executableCode + '\n__CELL_COMPLETE__\n');

      // Wait for completion signal
      const checkComplete = setInterval(() => {
        if (output.includes('__CELL_COMPLETE__')) {
          clearInterval(checkComplete);
          output = output.replace('__CELL_COMPLETE__', '').trim();
          resolve({
            status: error ? 'failed' : 'completed',
            output,
            error
          });
        }
      }, 10);
    });
  }

  private createProcess(notebookId: string): ChildProcess {
    return spawn('node', ['--experimental-vm-modules', '--input-type=module'], {
      cwd: this.getNotebookDir(notebookId),
      env: { ...process.env, NODE_NO_WARNINGS: '1' }
    });
  }
}
```

---

## Observatory WebSocket

Real-time thought visualization:

```typescript
export class ObservatoryServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number, private emitter: ThoughtEmitter) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
    });

    // Forward thought events to all clients
    emitter.on('thought_added', (node) => {
      this.broadcast({ type: 'thought_added', payload: node });
    });

    emitter.on('thought_updated', (node) => {
      this.broadcast({ type: 'thought_updated', payload: node });
    });

    emitter.on('session_loaded', (session) => {
      this.broadcast({ type: 'session_loaded', payload: session });
    });
  }

  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
}
```

---

## Extension Points

### Custom Index Sources

Implement `IndexSource` for different data backends:

```typescript
interface IndexSource {
  listSessions(filter?: SessionFilter): Promise<SessionMetadata[]>;
  getSessionExport(sessionId: string): Promise<SessionExport>;
}

// Examples:
// - S3IndexSource: Read from S3 bucket
// - PostgresIndexSource: Query PostgreSQL
// - ElasticsearchIndexSource: Search via ES
```

### Custom Renderers

Implement `IResponseRenderer` for different output formats:

```typescript
interface IResponseRenderer {
  renderSessionList(sessions: SessionMetadata[]): string;
  renderSession(session: Session, thoughts: ThoughtNode[]): string;
  renderError(error: Error): string;
}

// Examples:
// - MarkdownRenderer (default)
// - HtmlRenderer
// - JsonRenderer
```

### Custom Tag Extractors

Implement `ITagExtractor` for custom tagging:

```typescript
interface ITagExtractor {
  extractTags(session: Session, thoughts: ThoughtNode[]): string[];
}

// Examples:
// - KeywordExtractor: Extract from content
// - LLMExtractor: Use LLM to generate tags
```

---

## Testing

### Behavioral Tests

Located in `/tests/`:

```
tests/
├── thoughtbox-behavioral.md   # Core thought operations
├── notebook-behavioral.md     # Notebook execution
├── mental-models-behavioral.md # Mental model operations
└── memory-behavioral.md       # Persistence tests
```

### Running Tests

```bash
# Unit tests
npm test

# Behavioral tests (agentic)
npm run test:agentic

# Type checking
npm run typecheck

# Lint
npm run lint
```

---

## Build & Development

### Development Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run dev

# Generate capabilities doc
npm run generate:capabilities

# Embed templates
npm run embed:templates
```

### Key Scripts

| Script | Purpose |
|--------|---------|
| `build` | Compile TypeScript |
| `dev` | Watch mode compilation |
| `start` | Run compiled server |
| `test` | Run unit tests |
| `test:agentic` | Run behavioral tests |
| `generate:capabilities` | Update CAPABILITIES.md |
| `embed:templates` | Embed notebook templates |
| `check-cycles` | Verify no import cycles |

---

## Next Steps

- [**Configuration**](./configuration.md) — Environment and settings
- [**Observability**](./observability.md) — Monitoring setup
- [**Tools Reference**](./tools-reference.md) — API documentation
