import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListResourcesRequestSchema, ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { PATTERNS_COOKBOOK } from "./resources/patterns-cookbook-content.js";
import { SERVER_ARCHITECTURE_GUIDE } from "./resources/server-architecture-content.js";
import { NotebookHandler } from "./notebook/index.js";
import {
  MentalModelsHandler,
  getMentalModelsResources,
  getMentalModelsResourceContent,
  getMentalModelsResourceTemplates,
} from "./mental-models/index.js";
import {
  LIST_MCP_ASSETS_PROMPT,
  getListMcpAssetsContent,
  INTERLEAVED_THINKING_PROMPT,
  getInterleavedThinkingContent,
  getInterleavedGuideForUri,
  getInterleavedResourceTemplates,
  SPEC_DESIGNER_PROMPT,
  getSpecDesignerContent,
  SPEC_VALIDATOR_PROMPT,
  getSpecValidatorContent,
  SPEC_ORCHESTRATOR_PROMPT,
  getSpecOrchestratorContent,
  SPECIFICATION_SUITE_PROMPT,
  getSpecificationSuiteContent,
} from "./prompts/index.js";
import { THOUGHTBOX_CIPHER } from "./resources/thoughtbox-cipher-content.js";
import { PARALLEL_VERIFICATION_CONTENT } from "./prompts/contents/parallel-verification.js";
import {
  getSessionAnalysisGuideContent,
  getSessionAnalysisResourceTemplates,
} from "./resources/session-analysis-guide-content.js";
import {
  InMemoryStorage,
  type ThoughtboxStorage,
} from "./persistence/index.js";
import {
  SessionHandler,
} from "./sessions/index.js";
import {
  createInitFlow,
  type IInitHandler,
  InitToolHandler,
  StateManager,
} from "./init/index.js";
import { ThoughtHandler } from "./thought-handler.js";
import { ThoughtboxEventEmitter } from "./events/index.js";
import { SamplingHandler } from "./sampling/index.js";
import { ToolRegistry, DisclosureStage } from "./tool-registry.js";
import { DiscoveryRegistry } from "./discovery-registry.js";
import {
  GATEWAY_DESCRIPTION,
} from "./tool-descriptions.js";
import {
  GatewayHandler,
  gatewayToolInputSchema,
  GATEWAY_TOOL,
} from "./gateway/index.js";
import {
  ObservabilityGatewayHandler,
  ObservabilityInputSchema,
} from "./observability/index.js";
import { SUBAGENT_SUMMARIZE_CONTENT } from "./resources/subagent-summarize-content.js";
import { EVOLUTION_CHECK_CONTENT } from "./resources/evolution-check-content.js";
import { BEHAVIORAL_TESTS } from "./resources/behavioral-tests-content.js";
import {
  LOOPS_CATALOG,
  getCategories,
  getLoopsInCategory,
  getLoop,
  type Loop,
  type LoopMetadata,
} from "./resources/loops-content.js";
import { ClaudeFolderIntegration } from "./claude-folder-integration.js";

// Configuration schema
// Note: Using .default() means the field is always present after parsing.
export const configSchema = z.object({
  disableThoughtLogging: z
    .boolean()
    .default(false)
    .describe(
      "Disable thought output to stderr (useful for production deployments)"
    ),
  // Session management options
  autoCreateSession: z
    .boolean()
    .default(true)
    .describe("Auto-create reasoning session on first thought"),
  reasoningSessionId: z
    .string()
    .optional()
    .describe("Pre-load a specific reasoning session on server start"),
});

// Parsed config type (with defaults applied)
export type ServerConfig = z.infer<typeof configSchema>;

// Input config type (before parsing, allows omitting fields with defaults)
export type ServerConfigInput = z.input<typeof configSchema>;

import type { Logger } from './types.js';
export type { Logger } from './types.js';

export interface CreateMcpServerArgs {
  /** MCP connection session ID (if available) */
  sessionId?: string;
  /** Server configuration */
  config?: ServerConfigInput;
  /** Optional logger (defaults to stderr logger) */
  logger?: Logger;
  /**
   * Storage implementation for persistence.
   * Defaults to InMemoryStorage if not provided.
   * Use FileSystemStorage for durable persistence to disk.
   */
  storage?: ThoughtboxStorage;
}

const defaultLogger: Logger = {
  debug(message: string, ...args: unknown[]) { console.error(`[DEBUG] ${message}`, ...args); },
  info(message: string, ...args: unknown[]) { console.error(`[INFO] ${message}`, ...args); },
  warn(message: string, ...args: unknown[]) { console.error(`[WARN] ${message}`, ...args); },
  error(message: string, ...args: unknown[]) { console.error(`[ERROR] ${message}`, ...args); },
};

/**
 * Side-effect-free server factory.
 * - No transport binding
 * - No HTTP listen
 * - No process signal handlers
 */
export function createMcpServer(args: CreateMcpServerArgs = {}): McpServer {
  const sessionId = args.sessionId;
  const config = configSchema.parse(args.config ?? {});
  const logger = args.logger ?? defaultLogger;

  const THOUGHTBOX_INSTRUCTIONS = `START HERE: Use the \`thoughtbox_gateway\` tool to set/restore scope before using other operations.

Terminology:
- "Operations" are sub-commands inside the gateway tool (e.g., \`thoughtbox_gateway.operation = "get_state"\`).
- Operations map to handlers: init, cipher, thought, notebook, session, mental_models, deep_analysis.

What "project" means (scope boundary):
- If your client supports MCP Roots: bind a root directory as your project boundary, optionally narrow with a path prefix.
- If your client does not support Roots: choose a stable logical project name for tagging.

Recommended workflow:
1) Call \`thoughtbox_gateway\` { "operation": "get_state" }.
2) If Roots are supported, call \`thoughtbox_gateway\` { "operation": "list_roots" } then { "operation": "bind_root", ... }.
3) Choose one: \`thoughtbox_gateway\` { "operation": "start_new", ... } (new work) or { "operation": "list_sessions" } then { "operation": "load_context", ... } (continue).
4) Call \`thoughtbox_gateway\` { "operation": "cipher" } early (especially before long reasoning).
5) Use \`thoughtbox_gateway\` { "operation": "thought", args: {...} } for structured reasoning.

Progressive disclosure is enforced internally - you'll get clear errors if calling operations too early.`;

  const server = new McpServer({
    name: "thoughtbox-server",
    // Keep in sync with package.json version; avoid importing outside src/ (tsconfig rootDir)
    version: "1.2.2",
  }, {
    instructions: THOUGHTBOX_INSTRUCTIONS,
  });

  // Tool registry for progressive disclosure (SPEC-008)
  const toolRegistry = new ToolRegistry();

  // Discovery registry for operation-based tool discovery (SPEC-009)
  const discoveryRegistry = new DiscoveryRegistry(toolRegistry);

  // Shared storage instance for this MCP server instance (used by thought + session tooling)
  // Use provided storage or default to InMemoryStorage
  const storage: ThoughtboxStorage = args.storage ?? new InMemoryStorage();

  // Initialize .claude/ folder integration for usage analytics
  const claudeFolder = new ClaudeFolderIntegration(process.cwd(), logger);

  // Run startup aggregation (synchronous to ensure hot-loops.json is current)
  claudeFolder.initialize().catch(err =>
    logger.error('Failed to initialize .claude/ folder integration:', err)
  );

  // Create server instances with MCP session ID for client isolation
  const thoughtHandler = new ThoughtHandler(
    config.disableThoughtLogging,
    storage,
    sessionId // MCP session ID for isolation
  );

  // Wire up SamplingHandler for autonomous critique (Phase 3: Sampling Loops)
  // Uses deferred pattern - protocol.request() only works when transport is connected
  // By the time thoughtbox tool is called with critique=true, transport is already connected
  const samplingHandler = new SamplingHandler(server.server as any);
  thoughtHandler.setSamplingHandler(samplingHandler);

  // SIL-104: Wire up event emitter for external event stream (JSONL)
  // Configuration via environment variables:
  //   THOUGHTBOX_EVENTS_ENABLED=true - Enable event emission
  //   THOUGHTBOX_EVENTS_DEST=stderr|stdout|<filepath> - Where to write events
  const eventEmitter = new ThoughtboxEventEmitter({
    enabled: process.env.THOUGHTBOX_EVENTS_ENABLED === 'true',
    destination: process.env.THOUGHTBOX_EVENTS_DEST || 'stderr',
    includeMcpSessionId: true,
  }, sessionId);
  thoughtHandler.setEventEmitter(eventEmitter);

  const notebookHandler = new NotebookHandler();
  const mentalModelsHandler = new MentalModelsHandler();
  const sessionHandler = new SessionHandler({
    storage,
    thoughtHandler,
    discoveryRegistry,
  });

  // Log server creation when sessionId is available
  if (sessionId) {
    logger.info(`Creating server for MCP session: ${sessionId}`);
  }

  // Initialize persistence layer (fire-and-forget)
  // Handlers are resilient to uninitialized state
  thoughtHandler
    .initialize()
    .then(() => {
      logger.info("Persistence layer initialized");

      // Pre-load a specific reasoning session if configured
      if (config.reasoningSessionId) {
        thoughtHandler
          .loadSession(config.reasoningSessionId)
          .then(() =>
            logger.info(`Pre-loaded reasoning session: ${config.reasoningSessionId}`)
          )
          .catch((loadErr) =>
            logger.warn(
              `Failed to pre-load reasoning session ${config.reasoningSessionId}:`,
              loadErr
            )
          );
      }
      // Session handler currently has no heavy init work, but keep symmetry for future
      sessionHandler.init().catch((err) => {
        logger.warn("Session handler init failed:", err);
      });
    })
    .catch((err) => {
      logger.error("Failed to initialize persistence layer:", err);
      // Continue without persistence - in-memory mode
    });

  // Initialize init flow (fire-and-forget)
  // handleInit() has fallback for when initHandler is null
  // initToolHandler is used by the tool-based init flow
  let initHandler: IInitHandler | null = null;
  let initToolHandler: InitToolHandler | null = null;
  const initStateManager = new StateManager();

  createInitFlow()
    .then(({ handler, index, stats, errors }) => {
      initHandler = handler;
      // Create the tool-based init handler with the same index and tool registry for stage transitions
      // Pass server.server for MCP roots support (SPEC-011 list_roots/bind_root operations)
      // server.server is the underlying Server class which has listRoots() method
      initToolHandler = new InitToolHandler({
        storage,  // Required: source of truth for sessions
        index,    // Optional: cached hierarchy for navigation UI
        stateManager: initStateManager,
        toolRegistry,
        mcpSessionId: sessionId,
        mcpServer: server.server,  // For listRoots access
      });
      logger.info(
        `Init flow index built: ${stats.sessionsIndexed} sessions, ${stats.projectsFound} projects, ${stats.tasksFound} tasks (${stats.buildTimeMs}ms)`
      );
      if (errors.length > 0) {
        logger.warn(
          `Init flow index encountered ${errors.length} errors during build`
        );
      }
    })
    .catch((err) => {
      logger.error("Failed to initialize init flow:", err);
      // Continue without init flow
    });

  // Sync mental models to filesystem for inspection (fire-and-forget)
  // URI: thoughtbox://mental-models/{tag}/{model} → ~/.thoughtbox/mental-models/{tag}/{model}.md
  mentalModelsHandler.syncToFilesystem().catch((err) => {
    logger.error("Failed to sync mental models to filesystem:", err);
  });

  // =============================================================================
  // Gateway-Only Tool Registration
  // =============================================================================
  // All individual tools have been removed. The gateway is the sole entry point
  // and routes to existing handlers with internal stage enforcement.
  // =============================================================================

  // =============================================================================
  // Gateway Tool (Always-On Router)
  // =============================================================================
  // Gateway tool bypasses client tool list refresh issues by routing internally.
  // It's always enabled at Stage 0 and enforces stages internally.

  // Gateway handler will be created once initToolHandler is ready
  let gatewayHandler: GatewayHandler | null = null;

  const gatewayTool = server.registerTool(
    "thoughtbox_gateway",
    {
      description: GATEWAY_DESCRIPTION,
      inputSchema: gatewayToolInputSchema,
      annotations: GATEWAY_TOOL.annotations,
    },
    async (toolArgs) => {
      if (!gatewayHandler) {
        // Gateway handler not ready - initToolHandler still initializing
        // Create it now if initToolHandler is available
        if (initToolHandler) {
          gatewayHandler = new GatewayHandler({
            toolRegistry,
            initToolHandler,
            thoughtHandler,
            notebookHandler,
            sessionHandler,
            mentalModelsHandler,
            storage,
            sendToolListChanged: () => server.sendToolListChanged(),
          });
        } else {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Gateway tool not ready. Init handler is still initializing.",
                suggestion: "Try again in a moment.",
              }, null, 2),
            }],
            isError: true,
          };
        }
      }

      const result = await gatewayHandler.handle(toolArgs);

      // Transform content to match McpServer expected types
      const content = result.content.map((block) => {
        if (block.type === "text") {
          return { type: "text" as const, text: block.text };
        } else if (block.type === "resource") {
          return {
            type: "resource" as const,
            resource: {
              uri: block.resource.uri,
              mimeType: block.resource.mimeType,
              text: block.resource.text,
            },
          };
        }
        return block;
      });
      return { content, isError: result.isError };
    }
  );

  // Register gateway at Stage 0 - always enabled
  toolRegistry.register(
    "thoughtbox_gateway",
    gatewayTool,
    DisclosureStage.STAGE_0_ENTRY,
    { [DisclosureStage.STAGE_0_ENTRY]: GATEWAY_DESCRIPTION }
  );

  // =============================================================================
  // Observability Gateway Tool (Always-On, No Session Required)
  // =============================================================================
  // Separate tool for querying observability data (metrics, health, sessions, alerts).
  // No progressive disclosure - always available, direct query access.

  const OBSERVABILITY_DESCRIPTION = `Query system observability data including metrics, health status, active sessions, and alerts. No session initialization required - connect and query directly.

Operations:
- health: System and service health check
- metrics: Instant Prometheus query (PromQL)
- metrics_range: Range query over time
- sessions: List active reasoning sessions
- session_info: Get details about a specific session
- alerts: Get active/firing Prometheus alerts
- dashboard_url: Get Grafana dashboard URL`;

  const observabilityHandler = new ObservabilityGatewayHandler({
    storage,
    prometheusUrl: process.env.PROMETHEUS_URL,
    grafanaUrl: process.env.GRAFANA_URL,
  });

  server.registerTool(
    "observability_gateway",
    {
      description: OBSERVABILITY_DESCRIPTION,
      inputSchema: ObservabilityInputSchema,
    },
    async (toolArgs: { operation: string; args?: Record<string, unknown> }) => {
      const result = await observabilityHandler.handle(toolArgs);
      return {
        content: result.content.map((block) => ({
          type: "text" as const,
          text: block.text,
        })),
        isError: result.isError,
      };
    }
  );

  // Register prompts using McpServer's registerPrompt API
  server.registerPrompt(
    "list_mcp_assets",
    {
      description: LIST_MCP_ASSETS_PROMPT.description,
    },
    async () => ({
      messages: [
        {
          role: "assistant" as const,
          content: { type: "text" as const, text: getListMcpAssetsContent() },
        },
      ],
    })
  );

  server.registerPrompt(
    "interleaved-thinking",
    {
      description: INTERLEAVED_THINKING_PROMPT.description,
      argsSchema: {
        task: z.string().describe("The task to reason about"),
        thoughts_limit: z.string().optional().describe("Maximum number of thoughts"),
        clear_folder: z.string().optional().describe("Whether to clear folder (true/false)"),
      },
    },
    async (toolArgs) => {
      if (!toolArgs.task) {
        throw new Error("Missing required argument: task");
      }
      const content = getInterleavedThinkingContent({
        task: toolArgs.task,
        thoughts_limit: toolArgs.thoughts_limit
          ? parseInt(toolArgs.thoughts_limit, 10)
          : undefined,
        clear_folder: toolArgs.clear_folder === "true",
      });
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: content },
          },
        ],
      };
    }
  );

  // Subagent Summarize prompt - RLM-style context isolation pattern
  // Accessible in Claude Code as /mcp__thoughtbox__subagent-summarize
  server.registerPrompt(
    "subagent-summarize",
    {
      description: "Get instructions for using Claude Code's Task tool to retrieve and summarize Thoughtbox sessions with context isolation. Reduces context consumption by 10-40x.",
      argsSchema: {
        request: z.string().optional().describe("What you want to do with Thoughtbox sessions (e.g., 'summarize session abc-123', 'search for authentication discussions', 'synthesize all sessions about architecture')"),
      },
    },
    async (args) => {
      const request = args.request || "";

      // Build contextual header based on the request
      let contextHeader = `# ACTION REQUIRED: Execute Subagent Query

**User Request**: "${request || "retrieve and summarize Thoughtbox sessions"}"

## YOUR TASK

You MUST now spawn a sub-agent using the Task tool to fulfill this request. This achieves context isolation - the sub-agent retrieves the data and returns only a summary, keeping your context clean.

**Execute this Task tool call NOW:**

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "description": "${request ? request.slice(0, 50) : "Query Thoughtbox sessions"}",
  "prompt": "${request ? `Task: ${request}` : "Retrieve and summarize Thoughtbox session data."}\\n\\nSteps:\\n1. Call mcp__thoughtbox__init with operation 'get_state'\\n2. Call mcp__thoughtbox__thoughtbox_cipher (wait for tools to unlock)\\n3. Call mcp__thoughtbox__session with appropriate operation:\\n   - 'list' to see available sessions\\n   - 'get' with sessionId to retrieve specific session\\n   - 'search' with query to find relevant sessions\\n4. Process the data according to the request\\n\\nReturn ONLY your findings/summary. Do not include raw thought content."
}
\`\`\`

---

## Why This Pattern?

`;

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: contextHeader + SUBAGENT_SUMMARIZE_CONTENT
            },
          },
        ],
      };
    }
  );

  // Evolution Check prompt - A-Mem retroactive linking pattern
  // Accessible in Claude Code as /mcp__thoughtbox__evolution-check
  // ALSO accessible as resource at thoughtbox://prompts/evolution-check (unified pattern)
  server.registerPrompt(
    "evolution-check",
    {
      description: "Get instructions for checking which prior thoughts should be updated when a new insight is added. Uses sub-agent pattern for context isolation. Based on A-Mem paper.",
      argsSchema: {
        newThought: z.string().optional().describe("The new thought/insight that was just added"),
        sessionId: z.string().optional().describe("Session ID containing prior thoughts to check"),
        priorThoughts: z.string().optional().describe("Prior thoughts formatted as 'S1: ...\\nS2: ...' (alternative to sessionId)"),
      },
    },
    async (args) => {
      const newThought = args.newThought || "[YOUR NEW THOUGHT HERE]";
      const priorThoughts = args.priorThoughts || "[PRIOR THOUGHTS - retrieve with session.get or pass directly]";

      // Build contextual header with concrete Task tool invocation
      const contextHeader = `# ACTION REQUIRED: Spawn Evolution Checker

**New Thought**: "${newThought.slice(0, 100)}${newThought.length > 100 ? '...' : ''}"

## YOUR TASK

Spawn a Haiku sub-agent to evaluate which prior thoughts should be updated based on this new insight.

**Execute this Task tool call NOW:**

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "model": "haiku",
  "description": "Check evolution candidates",
  "prompt": "Evaluate which prior thoughts should be updated.\\n\\nNEW INSIGHT:\\n${newThought.replace(/"/g, '\\"').replace(/\n/g, '\\n')}\\n\\nPRIOR THOUGHTS:\\n${priorThoughts.replace(/"/g, '\\"').replace(/\n/g, '\\n')}\\n\\nFor each thought, respond ONLY with:\\nS1: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]\\nS2: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]\\n...\\n\\nBe selective. Only suggest UPDATE if the new insight meaningfully enriches context."
}
\`\`\`

## Then Apply Revisions

For each thought marked UPDATE, use:

\`\`\`typescript
mcp__thoughtbox__thoughtbox({
  thought: "[REVISED content with new context]",
  thoughtNumber: [N],
  totalThoughts: [total],
  nextThoughtNeeded: false,
  isRevision: true,
  revisesThought: [N]
})
\`\`\`

---

## Full Pattern Documentation

`;

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: contextHeader + EVOLUTION_CHECK_CONTENT
            },
          },
        ],
      };
    }
  );

  // =============================================================================
  // Behavioral Test Prompts (serve as /mcp__thoughtbox__test_* slash commands)
  // =============================================================================
  // These behavioral tests can be invoked as slash commands in Claude Code.
  // The agent executes the tests directly and reports results.

  server.registerPrompt(
    "test-thoughtbox",
    {
      description: BEHAVIORAL_TESTS.thoughtbox.description,
    },
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: BEHAVIORAL_TESTS.thoughtbox.content },
        },
      ],
    })
  );

  server.registerPrompt(
    "test-notebook",
    {
      description: BEHAVIORAL_TESTS.notebook.description,
    },
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: BEHAVIORAL_TESTS.notebook.content },
        },
      ],
    })
  );

  server.registerPrompt(
    "test-mental-models",
    {
      description: BEHAVIORAL_TESTS.mentalModels.description,
    },
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: BEHAVIORAL_TESTS.mentalModels.content },
        },
      ],
    })
  );

  server.registerPrompt(
    "test-memory",
    {
      description: BEHAVIORAL_TESTS.memory.description,
    },
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: BEHAVIORAL_TESTS.memory.content },
        },
      ],
    })
  );

  // Specification workflow prompts
  server.registerPrompt(
    "spec-designer",
    {
      description: SPEC_DESIGNER_PROMPT.description,
      argsSchema: {
        prompt: z.string().describe(SPEC_DESIGNER_PROMPT.arguments[0].description),
        output_folder: z.string().optional().describe(SPEC_DESIGNER_PROMPT.arguments[1].description),
        depth: z.string().optional().describe(SPEC_DESIGNER_PROMPT.arguments[2].description),
        max_specs: z.string().optional().describe(SPEC_DESIGNER_PROMPT.arguments[3].description),
        plan_only: z.string().optional().describe(SPEC_DESIGNER_PROMPT.arguments[4].description),
      },
    },
    async (toolArgs) => {
      if (!toolArgs.prompt) {
        throw new Error("Missing required argument: prompt");
      }
      const content = getSpecDesignerContent({
        prompt: toolArgs.prompt,
        output_folder: toolArgs.output_folder,
        depth: toolArgs.depth,
        max_specs: toolArgs.max_specs,
        plan_only: toolArgs.plan_only,
      });
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: content },
          },
        ],
      };
    }
  );

  server.registerPrompt(
    "spec-validator",
    {
      description: SPEC_VALIDATOR_PROMPT.description,
      argsSchema: {
        spec_path: z.string().describe(SPEC_VALIDATOR_PROMPT.arguments[0].description),
        strict: z.string().optional().describe(SPEC_VALIDATOR_PROMPT.arguments[1].description),
        deep: z.string().optional().describe(SPEC_VALIDATOR_PROMPT.arguments[2].description),
        report_only: z.string().optional().describe(SPEC_VALIDATOR_PROMPT.arguments[3].description),
      },
    },
    async (toolArgs) => {
      if (!toolArgs.spec_path) {
        throw new Error("Missing required argument: spec_path");
      }
      const content = getSpecValidatorContent({
        spec_path: toolArgs.spec_path,
        strict: toolArgs.strict,
        deep: toolArgs.deep,
        report_only: toolArgs.report_only,
      });
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: content },
          },
        ],
      };
    }
  );

  server.registerPrompt(
    "spec-orchestrator",
    {
      description: SPEC_ORCHESTRATOR_PROMPT.description,
      argsSchema: {
        spec_folder: z.string().describe(SPEC_ORCHESTRATOR_PROMPT.arguments[0].description),
        budget: z.string().optional().describe(SPEC_ORCHESTRATOR_PROMPT.arguments[1].description),
        max_iterations: z.string().optional().describe(SPEC_ORCHESTRATOR_PROMPT.arguments[2].description),
        plan_only: z.string().optional().describe(SPEC_ORCHESTRATOR_PROMPT.arguments[3].description),
      },
    },
    async (toolArgs) => {
      if (!toolArgs.spec_folder) {
        throw new Error("Missing required argument: spec_folder");
      }
      const content = getSpecOrchestratorContent({
        spec_folder: toolArgs.spec_folder,
        budget: toolArgs.budget,
        max_iterations: toolArgs.max_iterations,
        plan_only: toolArgs.plan_only,
      });
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: content },
          },
        ],
      };
    }
  );

  server.registerPrompt(
    "specification-suite",
    {
      description: SPECIFICATION_SUITE_PROMPT.description,
      argsSchema: {
        prompt_or_spec_path: z.string().describe(SPECIFICATION_SUITE_PROMPT.arguments[0].description),
        output_folder: z.string().optional().describe(SPECIFICATION_SUITE_PROMPT.arguments[1].description),
        depth: z.string().optional().describe(SPECIFICATION_SUITE_PROMPT.arguments[2].description),
        budget: z.string().optional().describe(SPECIFICATION_SUITE_PROMPT.arguments[3].description),
        plan_only: z.string().optional().describe(SPECIFICATION_SUITE_PROMPT.arguments[4].description),
        skip_design: z.string().optional().describe(SPECIFICATION_SUITE_PROMPT.arguments[5].description),
        skip_validation: z.string().optional().describe(SPECIFICATION_SUITE_PROMPT.arguments[6].description),
      },
    },
    async (toolArgs) => {
      if (!toolArgs.prompt_or_spec_path) {
        throw new Error("Missing required argument: prompt_or_spec_path");
      }
      const content = getSpecificationSuiteContent({
        prompt_or_spec_path: toolArgs.prompt_or_spec_path,
        output_folder: toolArgs.output_folder,
        depth: toolArgs.depth,
        budget: toolArgs.budget,
        plan_only: toolArgs.plan_only,
        skip_design: toolArgs.skip_design,
        skip_validation: toolArgs.skip_validation,
      });
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: content },
          },
        ],
      };
    }
  );

  // Register static resources using McpServer's registerResource API
  server.registerResource(
    "status",
    "system://status",
    {
      description: "Health snapshot of the notebook server",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(notebookHandler.getStatus(), null, 2),
        },
      ],
    })
  );

  server.registerResource(
    "notebook-operations",
    "thoughtbox://notebook/operations",
    {
      description: "Complete catalog of notebook operations with schemas and examples",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: notebookHandler.getOperationsCatalog(),
        },
      ],
    })
  );

  server.registerResource(
    "patterns-cookbook",
    "thoughtbox://patterns-cookbook",
    {
      description: "Guide to core reasoning patterns for thoughtbox tool",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: PATTERNS_COOKBOOK,
        },
      ],
    })
  );

  server.registerResource(
    "architecture",
    "thoughtbox://architecture",
    {
      description:
        "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: SERVER_ARCHITECTURE_GUIDE,
        },
      ],
    })
  );

  server.registerResource(
    "cipher",
    "thoughtbox://cipher",
    {
      description: "Token-efficient notation system for long reasoning chains",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: THOUGHTBOX_CIPHER,
        },
      ],
    })
  );

  server.registerResource(
    "session-analysis-guide",
    "thoughtbox://session-analysis-guide",
    {
      description:
        "Process guide for qualitative analysis of reasoning sessions (key moments → extract learnings)",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const content = getSessionAnalysisGuideContent(uri.toString());
      return { contents: [content] };
    }
  );

  server.registerResource(
    "parallel-verification-guide",
    "thoughtbox://guidance/parallel-verification",
    {
      description: "Workflow for parallel hypothesis exploration using Thoughtbox branching",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: PARALLEL_VERIFICATION_CONTENT,
        },
      ],
    })
  );

  // Unified prompt/resource: evolution-check
  // Same content as the prompt, but addressable via URI
  // This implements the unified pattern where prompts ARE resources
  server.registerResource(
    "evolution-check-prompt",
    "thoughtbox://prompts/evolution-check",
    {
      description: "A-Mem retroactive linking pattern: check which prior thoughts should be updated when a new insight is added (same as evolution-check prompt)",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: EVOLUTION_CHECK_CONTENT,
        },
      ],
    })
  );

  // Unified prompt/resource: subagent-summarize
  // Same content as the prompt, but addressable via URI
  server.registerResource(
    "subagent-summarize-prompt",
    "thoughtbox://prompts/subagent-summarize",
    {
      description: "RLM-style context isolation pattern: retrieve and summarize sessions without polluting conversation context (same as subagent-summarize prompt)",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: SUBAGENT_SUMMARIZE_CONTENT,
        },
      ],
    })
  );

  // =============================================================================
  // Behavioral Test Resources (unified with prompts above)
  // =============================================================================
  // Same content as the test prompts, but also addressable via URI.
  // This implements the unified pattern where prompts ARE resources.

  server.registerResource(
    "test-thoughtbox",
    BEHAVIORAL_TESTS.thoughtbox.uri,
    {
      description: BEHAVIORAL_TESTS.thoughtbox.description,
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: BEHAVIORAL_TESTS.thoughtbox.content,
        },
      ],
    })
  );

  server.registerResource(
    "test-notebook",
    BEHAVIORAL_TESTS.notebook.uri,
    {
      description: BEHAVIORAL_TESTS.notebook.description,
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: BEHAVIORAL_TESTS.notebook.content,
        },
      ],
    })
  );

  server.registerResource(
    "test-mental-models",
    BEHAVIORAL_TESTS.mentalModels.uri,
    {
      description: BEHAVIORAL_TESTS.mentalModels.description,
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: BEHAVIORAL_TESTS.mentalModels.content,
        },
      ],
    })
  );

  server.registerResource(
    "test-memory",
    BEHAVIORAL_TESTS.memory.uri,
    {
      description: BEHAVIORAL_TESTS.memory.description,
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: BEHAVIORAL_TESTS.memory.content,
        },
      ],
    })
  );

  server.registerResource(
    "mental-models-operations",
    "thoughtbox://mental-models/operations",
    {
      description: "Complete catalog of mental models, tags, and operations",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: mentalModelsHandler.getOperationsCatalog(),
        },
      ],
    })
  );

  // Register resource templates
  server.registerResource(
    "interleaved-guide",
    new ResourceTemplate("thoughtbox://interleaved/{guide}", { list: undefined }),
    { description: "Interleaved thinking guides", mimeType: "text/markdown" },
    async (_uri, { guide }) => ({
      contents: [getInterleavedGuideForUri(`thoughtbox://interleaved/${guide}`)],
    })
  );

  // Mental models root directory (static resource)
  server.registerResource(
    "mental-models-root",
    "thoughtbox://mental-models",
    {
      description: "Mental models root directory",
      mimeType: "application/json",
    },
    async (uri) => {
      const content = getMentalModelsResourceContent(uri.toString());
      if (!content) throw new Error(`Unknown resource: ${uri}`);
      return { contents: [content] };
    }
  );

  // Mental models tag directory (template with single path segment)
  server.registerResource(
    "mental-models-tag",
    new ResourceTemplate("thoughtbox://mental-models/{tag}", { list: undefined }),
    { description: "Mental models by tag", mimeType: "application/json" },
    async (uri) => {
      const content = getMentalModelsResourceContent(uri.toString());
      if (!content) throw new Error(`Unknown resource: ${uri}`);
      return { contents: [content] };
    }
  );

  // Mental model content (template with tag/model path)
  server.registerResource(
    "mental-model-by-tag",
    new ResourceTemplate("thoughtbox://mental-models/{tag}/{model}", {
      list: undefined,
    }),
    { description: "Mental model content by tag path", mimeType: "text/markdown" },
    async (uri) => {
      const content = getMentalModelsResourceContent(uri.toString());
      if (!content) throw new Error(`Unknown resource: ${uri}`);
      return { contents: [content] };
    }
  );

  // Init flow resources using path segments
  const str = (val: string | string[] | undefined): string | undefined =>
    Array.isArray(val) ? val[0] : val;

  const asMode = (val: string | undefined): "new" | "continue" | undefined =>
    val === "new" || val === "continue" ? val : undefined;

  const handleInit = (params: {
    mode?: "new" | "continue";
    project?: string;
    task?: string;
    aspect?: string;
  }) => {
    if (!initHandler) {
      return {
        uri: "thoughtbox://init",
        mimeType: "text/markdown",
        text: `# Thoughtbox Init\n\nSession index not available. You can start using tools directly.\n\n## Available Tools\n\n- \`thoughtbox\` — Step-by-step reasoning\n- \`thoughtbox_cipher\` — Token-efficient notation system\n- \`session\` — Manage/retrieve/analyze reasoning sessions\n- \`notebook\` — Literate programming notebooks\n- \`mental_models\` — Structured reasoning frameworks`,
      };
    }
    return initHandler.handle(params);
  };

  server.registerResource(
    "init",
    "thoughtbox://init",
    {
      description:
        "START HERE: Initialize Thoughtbox session before using other tools. Loads context from previous sessions and guides you through project/task selection.",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [handleInit({})],
    })
  );

  server.registerResource(
    "init-mode",
    new ResourceTemplate("thoughtbox://init/{mode}", { list: undefined }),
    { description: "Init flow mode selection", mimeType: "text/markdown" },
    async (_uri, params) => ({
      contents: [handleInit({ mode: asMode(str(params.mode)) })],
    })
  );

  server.registerResource(
    "init-project",
    new ResourceTemplate("thoughtbox://init/{mode}/{project}", { list: undefined }),
    { description: "Init flow project selection", mimeType: "text/markdown" },
    async (_uri, params) => ({
      contents: [
        handleInit({
          mode: asMode(str(params.mode)),
          project: str(params.project),
        }),
      ],
    })
  );

  server.registerResource(
    "init-task",
    new ResourceTemplate("thoughtbox://init/{mode}/{project}/{task}", {
      list: undefined,
    }),
    { description: "Init flow task selection", mimeType: "text/markdown" },
    async (_uri, params) => ({
      contents: [
        handleInit({
          mode: asMode(str(params.mode)),
          project: str(params.project),
          task: str(params.task),
        }),
      ],
    })
  );

  server.registerResource(
    "init-aspect",
    new ResourceTemplate("thoughtbox://init/{mode}/{project}/{task}/{aspect}", {
      list: undefined,
    }),
    { description: "Init flow context loaded", mimeType: "text/markdown" },
    async (_uri, params) => ({
      contents: [
        handleInit({
          mode: asMode(str(params.mode)),
          project: str(params.project),
          task: str(params.task),
          aspect: str(params.aspect),
        }),
      ],
    })
  );

  // OODA Loops resource templates
  server.registerResource(
    "loops",
    new ResourceTemplate("thoughtbox://loops/{category}/{name}", {
      list: undefined,
    }),
    {
      description: "OODA loop building blocks for workflow composition. Access specific loops by category and name.",
      mimeType: "text/markdown",
    },
    async (uri, params) => {
      const category = str(params.category);
      const name = str(params.name);

      if (!category || !name) {
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/markdown",
              text: `# Invalid Loop URI\n\nBoth category and name are required.\n\nFormat: \`thoughtbox://loops/{category}/{name}\`\n\nAvailable categories: ${getCategories().join(', ')}`,
            },
          ],
        };
      }

      try {
        const loop = getLoop(category, name);

        // Record usage for analytics (async, non-blocking)
        const loopUri = `${category}/${name}`;
        claudeFolder.recordLoopAccess(loopUri, 'active-session', sessionId).catch(err =>
          logger.debug('Failed to record loop access:', err)
        );

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/markdown",
              text: loop.content,
            },
          ],
        };
      } catch (error) {
        const categories = getCategories();
        const errorMsg = error instanceof Error ? error.message : String(error);

        // Return helpful error with available options
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/markdown",
              text: `# Loop Not Found\n\n**Error**: ${errorMsg}\n\n**Available categories**: ${categories.join(', ')}\n\nUse \`thoughtbox://loops/catalog\` to see all available loops.`,
            },
          ],
        };
      }
    }
  );

  // Loops catalog resource (static, no template)
  server.registerResource(
    "loops-catalog",
    "thoughtbox://loops/catalog",
    {
      description: "Complete catalog of OODA loop building blocks with metadata, classification, and composition rules",
      mimeType: "application/json",
    },
    async (uri) => {
      // Get hot loops for sorting (if available)
      const hotLoops = await claudeFolder.getHotLoops();

      // Build catalog JSON with metadata
      const catalog: Record<string, unknown> = {
        version: "1.0",
        updated: new Date().toISOString(),
        categories: {},
      };

      for (const category of getCategories()) {
        const loops = getLoopsInCategory(category);
        const categoryData: Record<string, unknown> = {
          description: `${category.charAt(0).toUpperCase() + category.slice(1)} loops`,
          loops: {},
        };

        // Build loop data array for sorting
        const loopDataArray = loops.map(loopName => {
          const loop = getLoop(category, loopName);
          const loopUri = `${category}/${loopName}`;
          const rank = hotLoops?.ranks[loopUri] || 999;

          return {
            name: loopName,
            rank,
            data: {
              uri: `thoughtbox://loops/${category}/${loopName}`,
              ...loop.metadata,
              content_preview: loop.content.slice(0, 200) + (loop.content.length > 200 ? '...' : ''),
              usage_rank: rank === 999 ? undefined : rank,
            },
          };
        });

        // Sort by usage rank (lower is better, 999 = not in top 10)
        loopDataArray.sort((a, b) => a.rank - b.rank);

        // Convert back to object
        for (const item of loopDataArray) {
          (categoryData.loops as Record<string, unknown>)[item.name] = item.data;
        }

        (catalog.categories as Record<string, unknown>)[category] = categoryData;
      }

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: JSON.stringify(catalog, null, 2),
          },
        ],
      };
    }
  );

  // Loops analytics refresh resource
  server.registerResource(
    "loops-analytics-refresh",
    "thoughtbox://loops/analytics/refresh",
    {
      description: "Trigger immediate aggregation of loop usage metrics. Returns updated hot loops and statistics.",
      mimeType: "application/json",
    },
    async (uri) => {
      const metrics = await claudeFolder.aggregateMetrics();

      if (!metrics) {
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "application/json",
              text: JSON.stringify({
                status: "unavailable",
                reason: ".claude/ folder not found or no usage data",
              }, null, 2),
            },
          ],
        };
      }

      const hotLoops = await claudeFolder.getHotLoops();

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: JSON.stringify({
              status: "refreshed",
              metrics: {
                totalAccesses: metrics.totalAccesses,
                uniqueLoops: metrics.loopStats.size,
                lastAggregated: metrics.lastAggregated,
              },
              hotLoops: hotLoops?.top_10 || [],
            }, null, 2),
          },
        ],
      };
    }
  );

  // Escape hatch: Use server.server for ListResourcesRequestSchema to include dynamic resources
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "thoughtbox://init",
        name: "Thoughtbox Init Flow",
        description:
          "START HERE FIRST: Read this resource before using any Thoughtbox tools. Initializes session context and loads previous work for continuity.",
        mimeType: "text/markdown",
      },
      {
        uri: "system://status",
        name: "Notebook Server Status",
        description: "Health snapshot of the notebook server",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://notebook/operations",
        name: "Notebook Operations Catalog",
        description: "Complete catalog of notebook operations with schemas and examples",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://patterns-cookbook",
        name: "Thoughtbox Patterns Cookbook",
        description: "Guide to core reasoning patterns for thoughtbox tool",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://architecture",
        name: "Server Architecture Guide",
        description:
          "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://cipher",
        name: "Thoughtbox Cipher Notation",
        description: "Token-efficient notation system for long reasoning chains",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://session-analysis-guide",
        name: "Session Analysis Process Guide",
        description:
          "Process guide for qualitative analysis of reasoning sessions (key moments → extract learnings)",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://guidance/parallel-verification",
        name: "Parallel Verification Guide",
        description:
          "Workflow for parallel hypothesis exploration using Thoughtbox branching",
        mimeType: "text/markdown",
      },
      // Unified prompt/resource pattern - prompts are also readable as resources
      {
        uri: "thoughtbox://prompts/evolution-check",
        name: "Evolution Check Pattern (A-Mem)",
        description:
          "Check which prior thoughts should be updated when a new insight is added. Same content as evolution-check prompt.",
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://prompts/subagent-summarize",
        name: "Subagent Summarize Pattern (RLM)",
        description:
          "Context isolation pattern for retrieving sessions. Same content as subagent-summarize prompt.",
        mimeType: "text/markdown",
      },
      // Behavioral test resources (unified with test prompts)
      {
        uri: BEHAVIORAL_TESTS.thoughtbox.uri,
        name: "Behavioral Tests: Thoughtbox",
        description: BEHAVIORAL_TESTS.thoughtbox.description,
        mimeType: "text/markdown",
      },
      {
        uri: BEHAVIORAL_TESTS.notebook.uri,
        name: "Behavioral Tests: Notebook",
        description: BEHAVIORAL_TESTS.notebook.description,
        mimeType: "text/markdown",
      },
      {
        uri: BEHAVIORAL_TESTS.mentalModels.uri,
        name: "Behavioral Tests: Mental Models",
        description: BEHAVIORAL_TESTS.mentalModels.description,
        mimeType: "text/markdown",
      },
      {
        uri: BEHAVIORAL_TESTS.memory.uri,
        name: "Behavioral Tests: Memory",
        description: BEHAVIORAL_TESTS.memory.description,
        mimeType: "text/markdown",
      },
      {
        uri: "thoughtbox://mental-models/operations",
        name: "Mental Models Operations Catalog",
        description: "Complete catalog of mental models, tags, and operations",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://loops/catalog",
        name: "OODA Loops Catalog",
        description: "Complete catalog of OODA loop building blocks with metadata, classification, and composition rules",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://loops/analytics/refresh",
        name: "Loop Analytics Refresh",
        description: "Trigger immediate aggregation of loop usage metrics and return updated statistics",
        mimeType: "application/json",
      },
      // Dynamic mental models browsable hierarchy
      ...getMentalModelsResources(),
    ],
  }));

  // Escape hatch: Use server.server for ListResourceTemplatesRequestSchema to preserve template metadata
  server.server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async () => ({
      resourceTemplates: [
        {
          uriTemplate: "thoughtbox://init/{mode}",
          name: "Init Mode Selection",
          description: "Select new or continue mode",
          mimeType: "text/markdown",
        },
        {
          uriTemplate: "thoughtbox://init/{mode}/{project}",
          name: "Init Project Selection",
          description: "Select project for context",
          mimeType: "text/markdown",
        },
        {
          uriTemplate: "thoughtbox://init/{mode}/{project}/{task}",
          name: "Init Task Selection",
          description: "Select task within project",
          mimeType: "text/markdown",
        },
        {
          uriTemplate: "thoughtbox://init/{mode}/{project}/{task}/{aspect}",
          name: "Init Context Loaded",
          description: "Context loaded - ready to work",
          mimeType: "text/markdown",
        },
        ...getInterleavedResourceTemplates().resourceTemplates,
        ...getSessionAnalysisResourceTemplates().resourceTemplates,
        ...getMentalModelsResourceTemplates().resourceTemplates,
      ],
    })
  );

  return server;
}

export default createMcpServer;

