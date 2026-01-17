import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListResourcesRequestSchema, ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { PATTERNS_COOKBOOK } from "./resources/patterns-cookbook-content.js";
import { SERVER_ARCHITECTURE_GUIDE } from "./resources/server-architecture-content.js";
import { NotebookHandler, NOTEBOOK_TOOL } from "./notebook/index.js";
import { getOperationNames } from "./notebook/operations.js";
import {
  MentalModelsHandler,
  MENTAL_MODELS_TOOL,
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
  type Session,
  type ThoughtData,
} from "./persistence/index.js";
import {
  SessionHandler,
  SESSION_TOOL,
  getOperationNames as getSessionOperationNames,
} from "./sessions/index.js";
import {
  createInitFlow,
  type IInitHandler,
  InitToolHandler,
  INIT_TOOL,
  initToolInputSchema,
  StateManager,
} from "./init/index.js";
import { ThoughtHandler } from "./thought-handler.js";
import { SamplingHandler } from "./sampling/index.js";
import { ToolRegistry, DisclosureStage } from "./tool-registry.js";
import { DiscoveryRegistry } from "./discovery-registry.js";
import {
  INIT_DESCRIPTIONS,
  CIPHER_DESCRIPTIONS,
  SESSION_DESCRIPTION,
  THOUGHTBOX_DESCRIPTIONS,
  NOTEBOOK_DESCRIPTIONS,
  getMentalModelsDescription,
  EXPORT_DESCRIPTIONS,
  GATEWAY_DESCRIPTION,
} from "./tool-descriptions.js";
import {
  GatewayHandler,
  gatewayToolInputSchema,
  GATEWAY_TOOL,
} from "./gateway/index.js";
import { SUBAGENT_SUMMARIZE_CONTENT } from "./resources/subagent-summarize-content.js";
import { EVOLUTION_CHECK_CONTENT } from "./resources/evolution-check-content.js";

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

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

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

const THOUGHTBOX_TOOL = {
  name: "thoughtbox",
  description: `Step-by-step thinking tool for complex problem-solving.

Supports flexible reasoning: forward thinking (1→N), backward thinking (N→1), branching, and revision.
Adjust your approach dynamically as understanding deepens.

Use for:
- Multi-step analysis and planning
- Problems requiring course correction
- Hypothesis generation and testing
- System design and architecture decisions

Patterns Cookbook:
Automatically provided at thought 1 with 6 core reasoning patterns, examples, and best practices.
Request anytime with includeGuide parameter.`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step",
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed",
      },
      thoughtNumber: {
        type: "integer",
        description:
          "Current thought number (can be 1→N for forward thinking, or N→1 for backward/goal-driven thinking)",
        minimum: 1,
      },
      totalThoughts: {
        type: "integer",
        description:
          "Estimated total thoughts needed (for backward thinking, start with thoughtNumber = totalThoughts)",
        minimum: 1,
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking",
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1,
      },
      branchFromThought: {
        type: "integer",
        description: "The thought number to fork from when creating an alternative reasoning path. Required when using branchId. Example: fork from thought 5 to explore different approaches.",
        minimum: 1,
      },
      branchId: {
        type: "string",
        description: "Identifier for this alternative reasoning path (requires branchFromThought). Creates a structural fork, not a category tag. Multiple branches can share the same branchFromThought but must have unique branchIds.",
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed",
      },
      includeGuide: {
        type: "boolean",
        description:
          "Request the patterns cookbook guide as embedded resource (also provided automatically at thought 1 and final thought)",
      },
      sessionTitle: {
        type: "string",
        description:
          "Title for the reasoning session (used at thought 1 for auto-create). Defaults to timestamp-based title.",
      },
      sessionTags: {
        type: "array",
        items: { type: "string" },
        description:
          "Tags for the reasoning session (used at thought 1 for auto-create). Enables cross-chat discovery.",
      },
      critique: {
        type: "boolean",
        description:
          "Request autonomous critique of this thought. When enabled, an external LLM will analyze the thought for logical fallacies, unstated assumptions, and potential improvements.",
      },
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

const defaultLogger: Logger = {
  debug: (msg, ...args) => console.error(`[DEBUG] ${msg}`, ...args),
  info: (msg, ...args) => console.error(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.error(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
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

  const THOUGHTBOX_INSTRUCTIONS = `START HERE: Use the \`init\` tool to set/restore scope before using other tools.

Terminology:
- "Tools" are top-level capabilities (e.g., \`init\`, \`thoughtbox\`, \`notebook\`).
- "Operations" are sub-commands inside a tool (e.g., \`init.operation = "navigate"\`).

What "project" means (scope boundary):
- If your client supports MCP Roots: bind a root directory as your project boundary, optionally narrow with a path prefix.
- If your client does not support Roots: choose a stable logical project name for tagging.

Recommended workflow:
1) Call \`init\` { "operation": "get_state" }.
2) If Roots are supported, call \`init\` { "operation": "list_roots" } then \`init\` { "operation": "bind_root", ... }.
3) Choose one: \`init\` → "start_new" (new work) or \`init\` → "list_sessions" then "load_context" (continue).
4) Call \`thoughtbox_cipher\` early (especially before long reasoning).

IMPORTANT - Progressive Disclosure:
After calling \`init\` (start_new or load_context), \`thoughtbox_cipher\` and \`session\` tools will become available.
After calling \`thoughtbox_cipher\`, \`thoughtbox\` and \`notebook\` tools will become available.
If newly unlocked tools don't appear, use \`thoughtbox_gateway\` instead - it's always available and routes to all handlers with stage enforcement.`;

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

  // Register tools using McpServer's registerTool API
  // Thoughtbox tool - Stage 2: Visible after cipher is loaded
  const thoughtboxTool = server.registerTool(
    "thoughtbox",
    {
      description:
        THOUGHTBOX_DESCRIPTIONS[DisclosureStage.STAGE_2_CIPHER_LOADED] ||
        THOUGHTBOX_TOOL.description,
      inputSchema: z.object({
        thought: z.string().describe("Your current thinking step"),
        nextThoughtNeeded: z
          .boolean()
          .describe("Whether another thought step is needed"),
        thoughtNumber: z
          .number()
          .int()
          .min(1)
          .describe(
            "Current thought number (can be 1→N for forward thinking, or N→1 for backward/goal-driven thinking)"
          ),
        totalThoughts: z
          .number()
          .int()
          .min(1)
          .describe(
            "Estimated total thoughts needed (for backward thinking, start with thoughtNumber = totalThoughts)"
          ),
        isRevision: z
          .boolean()
          .optional()
          .describe("Whether this revises previous thinking"),
        revisesThought: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Which thought is being reconsidered"),
        branchFromThought: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("The thought number to fork from when creating an alternative reasoning path. Required when using branchId."),
        branchId: z.string().optional().describe("Identifier for this alternative reasoning path (requires branchFromThought). Creates a structural fork, not a category tag."),
        needsMoreThoughts: z
          .boolean()
          .optional()
          .describe("If more thoughts are needed"),
        includeGuide: z
          .boolean()
          .optional()
          .describe(
            "Request the patterns cookbook guide as embedded resource (also provided automatically at thought 1 and final thought)"
          ),
        sessionTitle: z
          .string()
          .optional()
          .describe(
            "Title for the reasoning session (used at thought 1 for auto-create). Defaults to timestamp-based title."
          ),
        sessionTags: z
          .array(z.string())
          .optional()
          .describe(
            "Tags for the reasoning session (used at thought 1 for auto-create). Enables cross-chat discovery."
          ),
        critique: z
          .boolean()
          .optional()
          .describe(
            "Request autonomous critique of this thought. When enabled, an external LLM will analyze the thought for logical fallacies, unstated assumptions, and potential improvements."
          ),
      }),
      annotations: THOUGHTBOX_TOOL.annotations,
    },
    async (toolArgs) => {
      return await thoughtHandler.processThought(toolArgs);
    }
  );

  // Notebook tool - Stage 2: Visible after cipher is loaded
  const notebookTool = server.registerTool(
    "notebook",
    {
      description:
        NOTEBOOK_DESCRIPTIONS[DisclosureStage.STAGE_2_CIPHER_LOADED] ||
        NOTEBOOK_TOOL.description,
      inputSchema: z.object({
        operation: z
          .enum(getOperationNames() as [string, ...string[]])
          .describe("The notebook operation to execute"),
        args: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Arguments for the operation (varies by operation)"),
      }),
      annotations: NOTEBOOK_TOOL.annotations,
      _meta: NOTEBOOK_TOOL._meta,
    },
    async ({ operation, args }) => {
      return notebookHandler.processTool(operation, args || {});
    }
  );

  // Mental models tool - Stage 3: Visible after domain selection
  const mentalModelsTool = server.registerTool(
    "mental_models",
    {
      description: getMentalModelsDescription(null), // Dynamic based on domain
      inputSchema: z.object({
        operation: z
          .enum([
            "get_model",
            "list_models",
            "list_tags",
            "get_capability_graph",
          ])
          .describe("The operation to execute"),
        args: z
          .object({
            model: z
              .string()
              .optional()
              .describe("Name of the mental model to retrieve (for get_model)"),
            tag: z
              .string()
              .optional()
              .describe("Tag to filter models by (for list_models)"),
          })
          .optional()
          .describe("Arguments for the operation"),
      }),
      annotations: MENTAL_MODELS_TOOL.annotations,
    },
    async ({ operation, args }) => {
      const result = await mentalModelsHandler.processTool(operation, args || {});
      // Transform content to have proper literal types for McpServer
      const content: Array<{ type: "text"; text: string }> = result.content
        .filter(
          (c): c is { type: string; text: string } =>
            c.type === "text" && typeof c.text === "string"
        )
        .map((c) => ({ type: "text" as const, text: c.text }));
      return { content, isError: result.isError };
    }
  );

  // Session tool - Stage 1: Visible after init completes
  const sessionTool = server.registerTool(
    "session",
    {
      description: SESSION_DESCRIPTION,
      inputSchema: z.object({
        operation: z
          .enum(getSessionOperationNames() as [string, ...string[]])
          .describe("The session operation to execute"),
        args: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Arguments for the operation (varies by operation)"),
      }),
      annotations: SESSION_TOOL.annotations,
    },
    async ({ operation, args }) => {
      return sessionHandler.processTool(operation, args || {});
    }
  );

  // Init tool (tool-based navigation with embedded resources)
  // Stage 0: Always visible - entry point for progressive disclosure
  const initTool = server.registerTool(
    "init",
    {
      description:
        INIT_DESCRIPTIONS[DisclosureStage.STAGE_0_ENTRY] ||
        INIT_TOOL.description,
      inputSchema: initToolInputSchema,
      annotations: INIT_TOOL.annotations,
    },
    async (toolArgs) => {
      if (!initToolHandler) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "Init tool not ready. Session index is still building.",
                  suggestion:
                    "Try again in a moment, or use thoughtbox tool directly.",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
      const result = await initToolHandler.handle(toolArgs);

      // Error-safe stage advancement (moved from handler to factory per Phase 1.5)
      // Only advance if operation succeeded - prevents unlocking tools on error
      if (!result.isError) {
        const op = toolArgs.operation;
        if (op === 'load_context' || op === 'start_new') {
          toolRegistry.advanceToStage(DisclosureStage.STAGE_1_INIT_COMPLETE);
          
          // Notify client of tool list change
          // Clients that don't refresh tool lists should use the gateway tool instead
          server.sendToolListChanged();
        }
      }

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

  // Cipher tool - Stage 1: Visible after init completes
  // Calling this tool advances to Stage 2 and unlocks thoughtbox + notebook
  const cipherTool = server.registerTool(
    "thoughtbox_cipher",
    {
      description:
        CIPHER_DESCRIPTIONS[DisclosureStage.STAGE_1_INIT_COMPLETE] ||
        "Returns Thoughtbox's notation system for token-efficient reasoning.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      // Advance to Stage 2 when cipher is called
      toolRegistry.advanceToStage(DisclosureStage.STAGE_2_CIPHER_LOADED);
      
      // Notify client of tool list change
      // Clients that don't refresh tool lists should use the gateway tool instead
      server.sendToolListChanged();

      const turnBoundaryInstruction = `

---

## ⚠️ STOP HERE - DO NOT CALL ANY MORE TOOLS IN THIS TURN

New tools (\`thoughtbox\`, \`notebook\`, \`mental_models\`) are now available, but you must
**end this turn and wait for the user to send another message** before calling them.

If newly unlocked tools don't appear in your next turn, use \`thoughtbox_gateway\` instead:
- \`thoughtbox_gateway({ operation: 'thought', args: {...} })\` routes to the thoughtbox handler
- The gateway is always available and bypasses tool list refresh issues

Immediate next actions for Claude:
0) Ask the user to send any short message to start the next turn.
1) In the next turn, call \`thoughtbox\` (or use gateway if unavailable).

Tell the user: "Cipher loaded. Ready to begin reasoning - please send any message to proceed."

In your NEXT turn (after user responds), you can use the \`thoughtbox\` tool to begin structured thinking.`;

      return {
        content: [{ type: "text" as const, text: THOUGHTBOX_CIPHER + turnBoundaryInstruction }],
      };
    }
  );

  // Export reasoning chain tool - Stage 3: Visible after domain selection
  const exportTool = server.registerTool(
    "export_reasoning_chain",
    {
      description:
        "Export a reasoning session to filesystem as linked JSON structure. Useful for persisting reasoning chains, sharing sessions, or archiving completed work.",
      inputSchema: z.object({
        sessionId: z
          .string()
          .optional()
          .describe("Session ID to export (uses current session if omitted)"),
        destination: z
          .string()
          .optional()
          .describe(
            "Custom export directory path (default: ~/.thoughtbox/exports/)"
          ),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ sessionId: exportSessionId, destination }) => {
      const targetSession =
        exportSessionId || thoughtHandler.getCurrentSessionId();
      if (!targetSession) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error:
                    "No active session to export. Provide a sessionId or start a reasoning session first.",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await thoughtHandler.exportReasoningChain(
          targetSession,
          destination
        );
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  exportPath: result.path,
                  sessionId: result.session.id,
                  sessionTitle: result.session.title,
                  nodeCount: result.nodeCount,
                  exportedAt: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: (err as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // =============================================================================
  // Progressive Disclosure Registration
  // =============================================================================
  toolRegistry.register(
    "init",
    initTool,
    DisclosureStage.STAGE_0_ENTRY,
    INIT_DESCRIPTIONS
  );

  toolRegistry.register(
    "thoughtbox_cipher",
    cipherTool,
    DisclosureStage.STAGE_1_INIT_COMPLETE,
    CIPHER_DESCRIPTIONS
  );

  toolRegistry.register(
    "session",
    sessionTool,
    DisclosureStage.STAGE_1_INIT_COMPLETE,
    { [DisclosureStage.STAGE_1_INIT_COMPLETE]: SESSION_DESCRIPTION }
  );

  toolRegistry.register(
    "thoughtbox",
    thoughtboxTool,
    DisclosureStage.STAGE_2_CIPHER_LOADED,
    THOUGHTBOX_DESCRIPTIONS
  );

  toolRegistry.register(
    "notebook",
    notebookTool,
    DisclosureStage.STAGE_2_CIPHER_LOADED,
    NOTEBOOK_DESCRIPTIONS
  );

  toolRegistry.register(
    "mental_models",
    mentalModelsTool,
    DisclosureStage.STAGE_3_DOMAIN_ACTIVE,
    { [DisclosureStage.STAGE_3_DOMAIN_ACTIVE]: getMentalModelsDescription(null) }
  );

  toolRegistry.register(
    "export_reasoning_chain",
    exportTool,
    DisclosureStage.STAGE_3_DOMAIN_ACTIVE,
    EXPORT_DESCRIPTIONS
  );

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
  // Operation-Based Tool Discovery (SPEC-009)
  // =============================================================================
  const sessionDeepAnalysisTool = server.registerTool(
    "session_deep_analysis",
    {
      description:
        "Deep analysis tool for reasoning sessions. Provides pattern extraction, cognitive load analysis, and decision point mapping. Use after running session.analyze to get detailed insights.",
      inputSchema: z.object({
        sessionId: z.string().describe("Session ID to analyze"),
        analysisType: z
          .enum(["patterns", "cognitive_load", "decision_points", "full"])
          .describe("Type of deep analysis to perform"),
        options: z
          .object({
            includeTimeline: z
              .boolean()
              .optional()
              .describe("Include temporal analysis"),
            compareWith: z
              .array(z.string())
              .optional()
              .describe("Session IDs to compare against"),
          })
          .optional()
          .describe("Analysis options"),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ sessionId: analysisSessionId, analysisType, options }) => {
      // Mark tool as used for auto-hide tracking
      discoveryRegistry.markToolUsed("session_deep_analysis");

      try {
        const session = await storage.getSession(analysisSessionId);
        if (!session) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { error: `Session not found: ${analysisSessionId}` },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        // Fetch thoughts separately (not stored on Session object)
        const thoughts: ThoughtData[] = await storage.getThoughts(analysisSessionId);

        const result: Record<string, unknown> = {
          sessionId: analysisSessionId,
          analysisType,
          timestamp: new Date().toISOString(),
        };

        if (analysisType === "patterns" || analysisType === "full") {
          result.patterns = {
            totalThoughts: thoughts.length,
            revisionCount: thoughts.filter((t: ThoughtData) => t.isRevision).length,
            branchCount: new Set(
              thoughts
                .filter((t: ThoughtData) => t.branchId)
                .map((t: ThoughtData) => t.branchId)
            ).size,
            averageThoughtLength:
              thoughts.length > 0
                ? Math.round(
                    thoughts.reduce(
                      (sum: number, t: ThoughtData) => sum + t.thought.length,
                      0
                    ) / thoughts.length
                  )
                : 0,
          };
        }

        if (analysisType === "cognitive_load" || analysisType === "full") {
          result.cognitiveLoad = {
            complexityScore: Math.min(
              100,
              thoughts.length * 5 + ((session.tags?.length || 0) as number) * 10
            ),
            depthIndicator: thoughts.reduce(
              (max: number, t: ThoughtData) => Math.max(max, t.thoughtNumber),
              0
            ),
            breadthIndicator: new Set(
              thoughts.map((t: ThoughtData) => t.branchId || "main")
            ).size,
          };
        }

        if (analysisType === "decision_points" || analysisType === "full") {
          result.decisionPoints = thoughts
            .filter((t: ThoughtData) => t.isRevision || t.branchFromThought)
            .map((t: ThoughtData) => ({
              thoughtNumber: t.thoughtNumber,
              type: t.isRevision ? "revision" : "branch",
              reference: t.revisesThought || t.branchFromThought,
            }));
        }

        if (options?.includeTimeline) {
          result.timeline = {
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            durationEstimate: thoughts.length
              ? `~${thoughts.length * 2} minutes`
              : "unknown",
          };
        }

        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: (err as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  discoveryRegistry.registerDiscoverableTool(
    "session_deep_analysis",
    sessionDeepAnalysisTool,
    [
      {
        hubTool: "session",
        operation: "analyze",
        unlocksTools: ["session_deep_analysis"],
        description: "Unlocks deep analysis capabilities for reasoning sessions",
        requiredStage: DisclosureStage.STAGE_1_INIT_COMPLETE,
      },
    ],
    {
      discovered:
        "Deep analysis tool for reasoning sessions. Provides pattern extraction, cognitive load analysis, and decision point mapping.",
      hidden: "Advanced session analysis (unlock by calling session.analyze)",
    },
    // Auto-hide after 10 minutes of non-use
    10 * 60 * 1000
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
      {
        uri: "thoughtbox://mental-models/operations",
        name: "Mental Models Operations Catalog",
        description: "Complete catalog of mental models, tags, and operations",
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

