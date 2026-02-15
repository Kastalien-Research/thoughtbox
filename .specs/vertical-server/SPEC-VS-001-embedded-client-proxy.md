# SPEC-VS-001: Embedded Client Proxy — Vertical Server Architecture

**Status:** Draft
**Created:** 2026-02-07
**Depends on:** `.specs/quality-diversity/map-elites-research.md`
**SDK Version:** `@modelcontextprotocol/sdk@1.25.3`

---

## 1. Overview & Motivation

### The Problem

The MAP-Elites research spec describes a system requiring multiple external tool sources — Exa, Semantic Scholar, Arxiv, GitHub — orchestrated by internal logic (Taste Agent, Workflow Composer, Library Updater). Today, each of these would be a separately configured MCP server, requiring the host to manage 5-8 independent server entries in `claude_desktop_config.json` or the equivalent Claude Code MCP config.

This creates three problems:

1. **Configuration burden.** Users must discover, configure, and maintain N satellite servers independently.
2. **Coordination gap.** No server can orchestrate calls *across* other servers — each server operates in isolation. The host (Claude) must do all orchestration, consuming context tokens and introducing latency.
3. **Tool surface explosion.** Raw satellite tools (e.g., `exa_search`, `semantic_scholar_search`, `arxiv_search`) are low-level primitives. The agent must figure out how to combine them for each research task. High-level operations like "map the state of this field" require multi-step recipes that should be encapsulated server-side.

### The Solution: Vertical Stack

Thoughtbox boots as a **vertical MCP server** — a single server process that embeds MCP `Client` instances to connect to satellite servers. The host sees one server with three tool entry points (`thoughtbox_gateway`, `thoughtbox_hub`, `thoughtbox_research`), but internally the server coordinates calls to satellite tools, applies research taste evaluation, and manages an evolving workflow library.

```
Host (Claude Code / Claude Desktop)
  |
  |  sees: thoughtbox_gateway, thoughtbox_hub, thoughtbox_research
  |
  +---> Thoughtbox Server Process
        |
        +-- Gateway Handler (existing, src/gateway/gateway-handler.ts)
        +-- Hub Handler (existing, src/hub/hub-tool-handler.ts)
        +-- Research Gateway (new, src/research/research-gateway.ts)
        |     |
        |     +-- Taste Agent (in-process, src/research/taste-agent.ts)
        |     +-- Task Characterizer (in-process, src/research/task-characterizer.ts)
        |     +-- Workflow Composer (in-process, src/research/workflow-composer.ts)
        |     +-- Library Manager (in-process, src/research/library-manager.ts)
        |     +-- Satellite Manager (src/satellites/satellite-manager.ts)
        |           |
        |           +--[stdio]--> Exa MCP Server (subprocess)
        |           +--[http]---> Scholar MCP Server (remote)
        |           +--[stdio]--> GitHub MCP Server (subprocess)
        |
        +-- Storage Layer (existing, src/persistence/)
```

### Why This Works

The MCP TypeScript SDK v1.25.3 natively supports embedding `Client` instances inside a `Server` process. The `Client` class (from `@modelcontextprotocol/sdk/client/index.js`), `StdioClientTransport` (from `@modelcontextprotocol/sdk/client/stdio.js`), and `StreamableHTTPClientTransport` (from `@modelcontextprotocol/sdk/client/streamableHttp.js`) are all available. No protocol extensions are needed — the server process simply acts as both an MCP server (to the host) and an MCP client (to satellites).

---

## 2. Satellite Client Manager

### Module Location

```
src/satellites/
  satellite-manager.ts     # Core manager class
  satellite-config.ts      # Config schema and loading
  satellite-types.ts       # Shared types
  index.ts                 # Public API
```

### Configuration Schema

```jsonc
// ~/.thoughtbox/satellites.json (or THOUGHTBOX_SATELLITES_CONFIG env var)
{
  "satellites": [
    {
      "name": "exa",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic-ai/exa-mcp-server"],
      "env": { "EXA_API_KEY": "${EXA_API_KEY}" },
      "required": false
    },
    {
      "name": "scholar",
      "transport": "http",
      "url": "http://localhost:3001/mcp",
      "required": false
    },
    {
      "name": "github",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic-ai/github-mcp-server"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" },
      "required": false
    }
  ]
}
```

The `${VAR_NAME}` syntax in `env` values resolves against `process.env` at boot time. If a required env var is missing and `required: false`, the satellite is skipped with a warning.

**Zod schema:**

```typescript
import { z } from 'zod';

const StdioSatelliteSchema = z.object({
  name: z.string(),
  transport: z.literal('stdio'),
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).default({}),
  cwd: z.string().optional(),
  required: z.boolean().default(false),
});

const HttpSatelliteSchema = z.object({
  name: z.string(),
  transport: z.literal('http'),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).default({}),
  required: z.boolean().default(false),
});

const SatelliteSchema = z.discriminatedUnion('transport', [
  StdioSatelliteSchema,
  HttpSatelliteSchema,
]);

export const SatellitesConfigSchema = z.object({
  satellites: z.array(SatelliteSchema).default([]),
});

export type SatellitesConfig = z.infer<typeof SatellitesConfigSchema>;
export type SatelliteEntry = z.infer<typeof SatelliteSchema>;
```

### Config Loading

```typescript
// satellite-config.ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export async function loadSatellitesConfig(): Promise<SatellitesConfig> {
  const configPath = process.env.THOUGHTBOX_SATELLITES_CONFIG
    ?? join(homedir(), '.thoughtbox', 'satellites.json');

  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return SatellitesConfigSchema.parse(parsed);
  } catch {
    // No config file = no satellites. This is fine.
    return { satellites: [] };
  }
}
```

### SatelliteManager API

```typescript
// satellite-manager.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface SatelliteHealth {
  name: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'failed';
  lastPing?: string;  // ISO timestamp
  error?: string;
  tools?: string[];   // Discovered tool names
}

export interface SatelliteManager {
  /** Boot all configured satellites. Call once during server startup. */
  initialize(): Promise<void>;

  /** Get a connected client by satellite name. Returns null if unavailable. */
  getClient(name: string): Client | null;

  /** Call a tool on a satellite. Returns null if satellite is unavailable. */
  callTool(satellite: string, tool: string, args: Record<string, unknown>): Promise<CallToolResult | null>;

  /** Health status of all satellites. */
  getHealth(): SatelliteHealth[];

  /** Check if a specific satellite is available. */
  isAvailable(name: string): boolean;

  /** Clean shutdown of all satellite connections. */
  shutdown(): Promise<void>;
}
```

### Lifecycle

1. **Boot:** `SatelliteManager.initialize()` is called during `createMcpServer()`. For each configured satellite:
   - Create a `Client` instance with `{ name: "thoughtbox-proxy", version: "<server-version>" }`
   - Create the appropriate transport (`StdioClientTransport` for stdio, `StreamableHTTPClientTransport` for http)
   - Call `client.connect(transport)` which performs the MCP initialization handshake
   - On success: discover available tools via `client.listTools()`, mark status `connected`
   - On failure: if `required: false`, log warning and continue; if `required: true`, throw

2. **Health check:** A periodic timer (every 60s) pings each connected satellite via `client.ping()`. If ping fails, attempt reconnection once. If reconnection fails, mark `disconnected`.

3. **Reconnection:** On transport close (detected via `transport.onclose`), attempt automatic reconnection with exponential backoff (1s, 2s, 4s, max 30s, max 5 attempts).

4. **Shutdown:** On server shutdown, call `transport.close()` for each satellite. For stdio satellites, this kills the subprocess. For HTTP satellites, this calls `transport.terminateSession()`.

### SDK API Mapping (Verified)

The following classes are confirmed present in `@modelcontextprotocol/sdk@1.25.3`:

| Class | Import Path | Constructor |
|-------|------------|-------------|
| `Client` | `@modelcontextprotocol/sdk/client/index.js` | `new Client(implementation: Implementation, options?: ClientOptions)` |
| `StdioClientTransport` | `@modelcontextprotocol/sdk/client/stdio.js` | `new StdioClientTransport(server: StdioServerParameters)` |
| `StreamableHTTPClientTransport` | `@modelcontextprotocol/sdk/client/streamableHttp.js` | `new StreamableHTTPClientTransport(url: URL, opts?: StreamableHTTPClientTransportOptions)` |

Key `StdioServerParameters` fields: `command`, `args?`, `env?`, `stderr?`, `cwd?`

Key `Client` methods used: `connect(transport)`, `listTools()`, `callTool(params)`, `ping()`

---

## 3. Research Gateway Tool

### Tool Surface

A new gateway tool — `thoughtbox_research` — registered alongside `thoughtbox_gateway` and `thoughtbox_hub` in `server-factory.ts`. Follows the same operation-dispatch pattern: single tool entry point with `{ operation, args }` input schema.

### Input Schema

```typescript
import { z } from 'zod';

export const researchInputSchema = z.object({
  operation: z.enum([
    'landscape_assessment',
    'evaluate_proposal',
    'characterize_task',
    'retrieve_workflows',
    'execute_workflow',
    'evaluate_output',
    'update_library',
    'satellite_status',
  ]),
  args: z.record(z.string(), z.unknown()).optional(),
});
```

### Operations

| Operation | What it does | Satellites used | Stage required |
|-----------|-------------|----------------|----------------|
| `landscape_assessment` | Map the state of a field: adjacent work, abandoned approaches, new capabilities, active trends | Exa + Scholar + GitHub | Stage 2 |
| `evaluate_proposal` | Taste Agent: compression test, prediction query, dead-end estimation, simplicity audit, cross-pollination | Pure inference via Sampling | Stage 2 |
| `characterize_task` | Map a research task to 5D behavioral coordinates (scope, domain structure, evidence type, time horizon, fidelity) | Pure inference via Sampling | Stage 2 |
| `retrieve_workflows` | Pull matching workflows from the MAP-Elites library by behavioral region | Local storage | Stage 2 |
| `execute_workflow` | Run a composed workflow plan, calling satellites as directed by workflow steps | Variable (depends on steps) | Stage 2 |
| `evaluate_output` | Score research output on composite rubric (coherence, grounding, compression, surprise, actionability) | Pure inference via Sampling | Stage 2 |
| `update_library` | MAP-Elites library update: if fitness > current cell occupant, replace and archive | Local storage | Stage 2 |
| `satellite_status` | Health check on all satellite connections | None (internal) | Stage 0 |

### Progressive Disclosure

Research operations gate behind **Stage 2** (cipher loaded), consistent with existing thoughtbox operations. The exception is `satellite_status`, which is available at Stage 0 for diagnostics.

Stage enforcement follows the same pattern as `gateway-handler.ts`:

```typescript
const RESEARCH_OPERATION_REQUIRED_STAGE: Record<string, DisclosureStage> = {
  satellite_status: DisclosureStage.STAGE_0_ENTRY,
  landscape_assessment: DisclosureStage.STAGE_2_CIPHER_LOADED,
  evaluate_proposal: DisclosureStage.STAGE_2_CIPHER_LOADED,
  characterize_task: DisclosureStage.STAGE_2_CIPHER_LOADED,
  retrieve_workflows: DisclosureStage.STAGE_2_CIPHER_LOADED,
  execute_workflow: DisclosureStage.STAGE_2_CIPHER_LOADED,
  evaluate_output: DisclosureStage.STAGE_2_CIPHER_LOADED,
  update_library: DisclosureStage.STAGE_2_CIPHER_LOADED,
};
```

### Registration in server-factory.ts

The research gateway registers the same way as the hub tool — conditionally, when `SatelliteManager` is available (even with zero connected satellites, since some operations are pure inference):

```typescript
// In createMcpServer(), after hub tool registration:

const satelliteManager = createSatelliteManager(satellitesConfig, logger);
await satelliteManager.initialize();

const researchGateway = new ResearchGatewayHandler({
  toolRegistry,
  satelliteManager,
  storage: researchStorage,  // Workflow library storage
  samplingHandler,
});

server.registerTool(
  "thoughtbox_research",
  {
    description: RESEARCH_DESCRIPTION,
    inputSchema: researchInputSchema,
  },
  async (toolArgs) => {
    const result = await researchGateway.handle(toolArgs);
    return {
      content: result.content.map(block => ({
        type: "text" as const,
        text: block.text,
      })),
      isError: result.isError,
    };
  }
);
```

### Tool Description

```
Research workflow system with quality-diversity optimization.

Operations:
- landscape_assessment: Map the state of a field (args: { query, scope? })
- evaluate_proposal: Taste Agent evaluation of a proposal (args: { proposal, depth? })
- characterize_task: Map task to behavioral coordinates (args: { task })
- retrieve_workflows: Get matching workflows from library (args: { coordinates?, query? })
- execute_workflow: Run a composed workflow plan (args: { plan, workflowIds? })
- evaluate_output: Score research output quality (args: { output, rubricWeights? })
- update_library: Update MAP-Elites library with new workflow (args: { workflowId, fitnessScore })
- satellite_status: Check health of satellite MCP connections

Requires cipher loaded (Stage 2) except satellite_status.
Satellites degrade gracefully - operations report which tools are unavailable.
```

---

## 4. Internal Modules

These are built as in-process TypeScript modules, not separate MCP servers. They live under `src/research/`.

### 4.1 Taste Agent (`src/research/taste-agent.ts`)

Implements the six core operations from the MAP-Elites spec's "Research Taste Agent":

1. **Landscape Assessment** — Aggregates results from Exa, Semantic Scholar, and GitHub satellites into a structured landscape report. Calls satellite tools via `SatelliteManager.callTool()`.
2. **Compression Test** — Pure inference. Uses the `SamplingHandler` (already in codebase at `src/sampling/handler.ts`) to ask the LLM to compress a proposal into a single sentence.
3. **Prediction Query** — Pure inference via Sampling. Simulates success/failure futures.
4. **Dead-End Estimation** — Combines satellite search (negative results, abandoned approaches) with inference-time cost estimation.
5. **Simplicity Audit** — Pure inference. Recursive simplification check.
6. **Cross-Pollination Check** — Uses Exa satellite for cross-domain semantic search, augmented by inference for structural analogy detection.

**Output format:** JSON matching the Taste Evaluation structure from the MAP-Elites spec (verdict, compression, landscape position, prediction, time-to-signal, simplification opportunity, cross-domain resonance).

**Meta-pruning:** The `depth` argument controls which operations run:
- `"quick"` — Compression test + simplicity audit only (pure inference, no satellite calls)
- `"standard"` — Landscape + dead-end + compression + simplicity
- `"full"` — All six operations

### 4.2 Task Characterizer (`src/research/task-characterizer.ts`)

Maps a research task to the 5D behavioral space defined in the MAP-Elites spec:

| Dimension | Range | Description |
|-----------|-------|-------------|
| `scope` | 1-5 | Point question (1) to frontier mapping (5) |
| `domain_structure` | 1-5 | Single established field (1) to distant cross-domain (5) |
| `evidence_type` | 1-5 | Empirical data (1) to theoretical/first-principles (5) |
| `time_horizon` | 1-5 | Current truth (1) to speculative future (5) |
| `fidelity_requirement` | 1-5 | Ballpark/directional (1) to rigorous/publication-grade (5) |

**Implementation:** Pure inference via `SamplingHandler`. Sends the task description along with dimension definitions and asks the LLM to rate each dimension with justification.

**Output type:**

```typescript
interface BehavioralCoordinates {
  scope: number;          // 1-5
  domain_structure: number;
  evidence_type: number;
  time_horizon: number;
  fidelity_requirement: number;
  justification: string;  // Why these coordinates
}
```

### 4.3 Workflow Composer (`src/research/workflow-composer.ts`)

Three responsibilities:

1. **Retrieve:** Query the workflow library for the top 3-5 workflows near the target behavioral coordinates (Euclidean distance in the 5D space).
2. **Recombine:** Via Sampling, examine retrieved workflows and generate a novel composed plan. Each step includes its source workflow, rationale, tools required, and skip conditions.
3. **Generate:** If no close workflows exist, generate a novel workflow from first principles via Sampling.

**Input:** `BehavioralCoordinates` + task description
**Output:** A `ComposedWorkflowPlan` with steps, tool requirements, and parent workflow lineage.

### 4.4 Library Manager (`src/research/library-manager.ts`)

Implements the MAP-Elites library mechanics:

1. **Cell lookup:** Given behavioral coordinates, find the occupied cell (or nearest neighbors).
2. **Fitness comparison:** Compare new workflow fitness against current cell occupant.
3. **Replacement:** If new fitness > current, replace. Archive the displaced workflow (don't delete).
4. **Lineage tracking:** Record which parent workflows contributed to each new workflow.
5. **Diversity audit:** Check coverage of the 5D space. Identify empty regions.

**Factory pattern** (consistent with hub modules):

```typescript
export function createLibraryManager(
  storage: ResearchStorage,
): LibraryManager { ... }
```

---

## 5. Workflow Library Storage

### Directory Structure

```
~/.thoughtbox/research/
  workflows/                  # Active MAP-Elites library
    workflow-<uuid>.yaml      # Individual workflow documents
  workflows/archive/          # Displaced workflows
    workflow-<uuid>.yaml
  runs/                       # Execution logs (one per research run)
    run-<timestamp>-<uuid>.jsonl
```

This follows the same filesystem persistence pattern as hub storage (`src/hub/hub-storage-fs.ts`): JSON/YAML files in a well-known directory, loaded on demand, written atomically.

### Workflow Document Format

Per the MAP-Elites spec:

```yaml
id: workflow-<uuid>
name: "Quick landscape scan"
created: "2026-02-07T04:16:00Z"
parent_workflows: []
behavioral_coordinates:
  scope: 3
  domain_structure: 1
  evidence_type: 1
  time_horizon: 2
  fidelity_requirement: 2
fitness_score: 0.72
fitness_method: "llm-as-judge-composite"
times_used: 0
times_selected_as_parent: 0

steps:
  - name: "Exa semantic search"
    description: "Search for recent work in the target domain"
    rationale: "Semantic search surfaces relevant work that keyword search misses"
    tools_required: ["exa.web_search_exa"]
    skip_condition: "Skip if domain is well-known to the agent"
    outputs: ["search_results"]

  - name: "Scholar citation graph"
    description: "Find highly-cited papers and their citation networks"
    rationale: "Citation count indicates community validation"
    tools_required: ["scholar.search_papers"]
    skip_condition: "Skip if non-academic domain"
    outputs: ["citation_graph"]

notes: "Best for initial exploration of unfamiliar fields"
```

### Storage Interface

```typescript
export interface ResearchStorage {
  // Workflow CRUD
  saveWorkflow(workflow: WorkflowDocument): Promise<void>;
  getWorkflow(id: string): Promise<WorkflowDocument | null>;
  listWorkflows(): Promise<WorkflowDocument[]>;
  archiveWorkflow(id: string): Promise<void>;

  // Spatial query: find workflows near given coordinates
  findNearWorkflows(
    coordinates: BehavioralCoordinates,
    limit?: number,
  ): Promise<WorkflowDocument[]>;

  // Run logging
  logRun(entry: RunLogEntry): Promise<void>;
  getRuns(limit?: number): Promise<RunLogEntry[]>;
}
```

### Seed Library

The system initializes with 20-30 handcrafted seed workflows covering the categories from the MAP-Elites spec:

- **Exploratory:** Quick landscape scan, deep literature review, trend detection, white space identification
- **Confirmatory:** Fact-checking pipeline, consensus mapping, replication check
- **Analytical:** Compare and contrast, root cause analysis, cost-benefit, forecasting
- **Generative:** Cross-domain transfer, first-principles derivation, synthesis, adversarial stress-test
- **Applied:** Technical feasibility assessment, build-vs-buy analysis, implementation planning

Seed workflows are stored as YAML files in `src/research/seeds/` and copied to `~/.thoughtbox/research/workflows/` on first initialization.

---

## 6. Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `THOUGHTBOX_SATELLITES_CONFIG` | `~/.thoughtbox/satellites.json` | Path to satellite config file |
| `THOUGHTBOX_RESEARCH_DIR` | `~/.thoughtbox/research/` | Root directory for workflow library and run logs |
| `THOUGHTBOX_SATELLITES_ENABLED` | `true` | Set to `false` to disable satellite connections entirely |
| `EXA_API_KEY` | (none) | API key for Exa satellite |
| `GITHUB_TOKEN` | (none) | Token for GitHub satellite |

### Graceful Degradation

`required: false` (the default) means Thoughtbox boots even if a satellite fails to connect. Research operations that need unavailable satellites return clear error messages:

```json
{
  "error": "Satellite 'scholar' is not available",
  "operation": "landscape_assessment",
  "partial_results": {
    "exa": { ... },
    "github": { ... }
  },
  "unavailable_satellites": ["scholar"],
  "suggestion": "Results are partial. Configure the 'scholar' satellite for comprehensive academic coverage."
}
```

Operations that are pure inference (evaluate_proposal, characterize_task, evaluate_output) never depend on satellites and always work.

### No Satellites Mode

If `THOUGHTBOX_SATELLITES_ENABLED=false` or no `satellites.json` exists, the research gateway still works for:
- `evaluate_proposal` (pure inference)
- `characterize_task` (pure inference)
- `evaluate_output` (pure inference)
- `retrieve_workflows` (local storage)
- `update_library` (local storage)
- `satellite_status` (returns empty list)

The `landscape_assessment` and `execute_workflow` operations return an error explaining that satellites are required.

---

## 7. Integration Points

### server-factory.ts

The main integration point. Changes required:

1. **Import** `SatelliteManager` and `ResearchGatewayHandler`
2. **Add** `satellitesConfig` to `CreateMcpServerArgs` (optional)
3. **Create** `SatelliteManager` during server creation (after storage init, before tool registration)
4. **Register** `thoughtbox_research` tool (after `thoughtbox_hub`, same pattern)
5. **Pass** `satelliteManager` to cleanup/shutdown logic

**CreateMcpServerArgs extension:**

```typescript
export interface CreateMcpServerArgs {
  // ... existing fields ...
  /** Satellite MCP server configuration for research operations */
  satellitesConfig?: SatellitesConfig;
}
```

### index.ts

Load satellite config and pass it to `createMcpServer()`:

```typescript
import { loadSatellitesConfig } from './satellites/index.js';

const satellitesConfig = await loadSatellitesConfig();

const server = await createMcpServer({
  // ... existing args ...
  satellitesConfig,
});
```

### tool-registry.ts

No changes needed. The research gateway uses the existing `ToolRegistry` and `DisclosureStage` enum. Stage enforcement is internal to the `ResearchGatewayHandler`, same as `GatewayHandler`.

### sampling/handler.ts

The existing `SamplingHandler` is used by the Taste Agent, Task Characterizer, and Output Evaluator for inference-time operations. No changes needed to the handler itself — the research modules call `protocol.request({ method: "sampling/createMessage", params: {...} })` through the same path.

However, the `SamplingHandler` is currently only wired to `ThoughtHandler`. The research modules need their own reference. Two options:

- **Option A:** Pass `samplingHandler` as a shared dependency to both `ThoughtHandler` and `ResearchGatewayHandler` (preferred — simpler).
- **Option B:** Create a second `SamplingHandler` instance. Not needed since the handler is stateless.

### Server Instructions Update

The `THOUGHTBOX_INSTRUCTIONS` string in `server-factory.ts` should be extended to mention the research gateway:

```
For quality-diversity research workflows, use the `thoughtbox_research` tool with operations:
landscape_assessment, evaluate_proposal, characterize_task, retrieve_workflows, etc.
Call `thoughtbox_research` { "operation": "satellite_status" } to check satellite connections.
```

---

## 8. Observability

### Satellite Health Metrics

Exposed via the `satellite_status` operation and optionally via the existing observability gateway:

```json
{
  "satellites": [
    {
      "name": "exa",
      "status": "connected",
      "lastPing": "2026-02-07T04:15:00Z",
      "tools": ["web_search_exa", "deep_search_exa", "crawling_exa"],
      "callCount": 42,
      "errorCount": 1,
      "avgLatencyMs": 320
    }
  ],
  "totalConnected": 2,
  "totalConfigured": 3,
  "totalFailed": 1
}
```

### Research Run Logging

Every research execution logs a JSONL entry to `~/.thoughtbox/research/runs/`:

```jsonc
{
  "timestamp": "2026-02-07T04:16:00Z",
  "operation": "execute_workflow",
  "taskCharacterization": { "scope": 3, "domain_structure": 2, ... },
  "workflowsRetrieved": ["workflow-abc", "workflow-def"],
  "subTechniquesSelected": ["exa-semantic-search", "citation-graph-traversal"],
  "composedPlan": { ... },
  "satelliteCalls": [
    { "satellite": "exa", "tool": "web_search_exa", "latencyMs": 450, "success": true },
    { "satellite": "scholar", "tool": "search_papers", "latencyMs": 0, "success": false, "error": "unavailable" }
  ],
  "outputQuality": { "coherence": 0.8, "grounding": 0.7, "compression": 0.9, "surprise": 0.6, "actionability": 0.85 },
  "fitnessScore": 0.77,
  "libraryUpdated": true,
  "displacedWorkflow": "workflow-xyz"
}
```

### Integration with Existing Observability

The `ObservabilityGatewayHandler` (existing) can be extended with a `satellites` operation that delegates to `SatelliteManager.getHealth()`. This is additive and backward-compatible.

---

## 9. Testing Strategy

### Unit Tests with InMemoryTransport

The MCP SDK provides `InMemoryTransport` (from `@modelcontextprotocol/sdk/inMemory.js`) for creating paired client/server connections without real processes. This is the primary testing strategy for satellite integration:

```typescript
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Create a mock satellite server
const mockExa = new Server({ name: "mock-exa", version: "1.0.0" });
mockExa.setRequestHandler(CallToolRequestSchema, async (request) => {
  return { content: [{ type: "text", text: JSON.stringify({ results: [...] }) }] };
});

// Create linked transports
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await mockExa.connect(serverTransport);

// Create client and connect
const client = new Client({ name: "test-proxy", version: "1.0.0" });
await client.connect(clientTransport);

// Now client.callTool() reaches the mock server
```

### Test File Organization

```
src/satellites/__tests__/
  satellite-manager.test.ts     # Manager lifecycle, reconnection
  satellite-config.test.ts      # Config loading, env var resolution

src/research/__tests__/
  taste-agent.test.ts           # Taste evaluation operations
  task-characterizer.test.ts    # Behavioral coordinate mapping
  workflow-composer.test.ts     # Workflow retrieval and composition
  library-manager.test.ts       # MAP-Elites fitness, replacement, archiving
  research-gateway.test.ts      # Full gateway routing and stage enforcement
```

### Shared Test Helpers

Following the pattern from `src/hub/__tests__/test-helpers.ts`:

```typescript
// src/research/__tests__/test-helpers.ts
export function createMockSatelliteManager(): SatelliteManager { ... }
export function createInMemoryResearchStorage(): ResearchStorage { ... }
export function createMockSamplingHandler(): SamplingHandler { ... }
```

### Integration Tests

End-to-end tests that boot a full Thoughtbox server with mock satellites via InMemoryTransport, then call `thoughtbox_research` operations through the MCP protocol. These test the full stack: gateway routing → stage enforcement → research module → satellite callTool → response aggregation.

---

## 10. Implementation Phases

### Phase 1: Satellite Client Manager (MVP)

**Goal:** Boot satellite MCP clients inside the Thoughtbox server process.

**Deliverables:**
- `src/satellites/` module: config loading, SatelliteManager, health checks
- `satellites.json` config support
- `satellite_status` operation on `thoughtbox_research`
- Unit tests with InMemoryTransport
- Integration with `server-factory.ts` and `index.ts`

**Does NOT include:** Research operations, workflow library, taste agent.

### Phase 2: Research Operations (Core)

**Goal:** Two research operations working end-to-end.

**Deliverables:**
- `landscape_assessment` operation (aggregates Exa + Scholar + GitHub)
- `evaluate_proposal` operation (pure inference via Sampling)
- `src/research/taste-agent.ts` (compression test + simplicity audit at minimum)
- Research gateway handler with stage enforcement
- Graceful degradation when satellites unavailable

### Phase 3: Workflow Library

**Goal:** MAP-Elites workflow storage and retrieval.

**Deliverables:**
- `src/research/library-manager.ts`
- `ResearchStorage` filesystem implementation
- Seed library (20-30 workflows in `src/research/seeds/`)
- `retrieve_workflows`, `update_library` operations
- Behavioral coordinate querying

### Phase 4: Full Research Pipeline

**Goal:** Complete research workflow execution.

**Deliverables:**
- `src/research/task-characterizer.ts`
- `src/research/workflow-composer.ts`
- `execute_workflow` operation
- `evaluate_output` operation
- `characterize_task` operation
- Run logging to JSONL
- Diversity maintenance (forced novelty injection, archive mining)

---

## Appendix A: ADR Compatibility

This spec is compatible with existing ADRs:

- **ADR-001** (MCP Hub Research): The hub's multi-agent coordination is orthogonal to the research gateway. Hub agents can call `thoughtbox_research` operations the same way they call `thoughtbox_gateway` operations.
- **ADR-002** (MCP Hub Staging): The hub storage pattern (`hub-storage-fs.ts`) is replicated for research storage. Both use the same `~/.thoughtbox/` base directory with different subdirectories.

The research gateway does **not** use the hub's workspace/problem/proposal model. Research tasks are not "problems" — they are standalone operations. If hub coordination is needed for research (e.g., multiple agents running different research tasks in parallel), that's orchestrated at the hub level, not the research gateway level.

## Appendix B: File Manifest

| File | Purpose | Phase |
|------|---------|-------|
| `src/satellites/satellite-manager.ts` | Core satellite client pool | 1 |
| `src/satellites/satellite-config.ts` | Config schema and loading | 1 |
| `src/satellites/satellite-types.ts` | Shared types | 1 |
| `src/satellites/index.ts` | Public API | 1 |
| `src/satellites/__tests__/satellite-manager.test.ts` | Manager tests | 1 |
| `src/satellites/__tests__/satellite-config.test.ts` | Config tests | 1 |
| `src/research/research-gateway.ts` | Research tool handler | 2 |
| `src/research/taste-agent.ts` | Taste evaluation | 2 |
| `src/research/task-characterizer.ts` | Behavioral coordinates | 4 |
| `src/research/workflow-composer.ts` | Workflow composition | 4 |
| `src/research/library-manager.ts` | MAP-Elites library | 3 |
| `src/research/research-storage-fs.ts` | Filesystem persistence | 3 |
| `src/research/research-types.ts` | Shared types | 2 |
| `src/research/index.ts` | Public API | 2 |
| `src/research/seeds/*.yaml` | Seed workflows | 3 |
| `src/research/__tests__/*.test.ts` | Test suite | 1-4 |
| `~/.thoughtbox/satellites.json` | User config (not in repo) | 1 |
