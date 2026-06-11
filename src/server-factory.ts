import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListResourcesRequestSchema, ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod"; // hypothesis test 3
import type { HubStorage } from "./hub/hub-types.js";
import type { HubEvent } from "./hub/hub-handler.js";
import { createHubToolHandler } from "./hub/hub-tool-handler.js";
import {
  createThoughtStoreAdapter,
  type ThoughtStoreAdapter,
} from "./hub/thought-store-adapter.js";
import { FileSystemTaskStore } from "./hub/hub-task-store.js";
import { InMemoryTaskStore, InMemoryTaskMessageQueue } from "@modelcontextprotocol/sdk/experimental/tasks/stores/in-memory.js";
import { PATTERNS_COOKBOOK } from "./resources/patterns-cookbook-content.js";
import { SERVER_ARCHITECTURE_GUIDE } from "./resources/server-architecture-content.js";
import { NotebookHandler } from "./notebook/index.js";

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
import { getExtendedCipher } from "./multi-agent/cipher-extension.js";
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
  KnowledgeHandler,
  FileSystemKnowledgeStorage,
} from "./knowledge/index.js";
import {
  createInitFlow,
  type IInitHandler,
} from "./init/index.js";
import { ThoughtHandler } from "./thought-handler.js";
import { ThoughtboxEventEmitter } from "./events/index.js";
import { SamplingHandler } from "./sampling/index.js";
import { ThoughtQueryHandler } from "./resources/thought-query-handler.js";

import { KnowledgeTool } from "./knowledge/tool.js";
import { SessionTool } from "./sessions/tool.js";
import { ThoughtTool } from "./thought/tool.js";
import { NotebookTool } from "./notebook/tool.js";
import {
  PEER_NOTEBOOK_TOOL,
  InMemoryPeerNotebookRepository,
  PeerNotebookHandler,
  PeerNotebookTool,
  SupabasePeerNotebookRepository,
  type PeerNotebookRepository,
} from "./peer-notebook/index.js";
import {
  TheseusTool,
  UlyssesTool,
  ProtocolHandler,
  InMemoryProtocolHandler,
} from "./protocol/index.js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  ObservabilityGatewayHandler,
} from "./observability/index.js";
import { BranchHandler } from "./branch/index.js";
import { SUBAGENT_SUMMARIZE_CONTENT } from "./resources/subagent-summarize-content.js";
import { EVOLUTION_CHECK_CONTENT } from "./resources/evolution-check-content.js";
import { BEHAVIORAL_TESTS } from "./resources/behavioral-tests-content.js";
import { SKILL_DEFINITIONS, getSkillCatalog, getSkill } from "./resources/skills/index.js";
import { getOperationsCatalog as getInitOperationsCatalog, getOperation as getInitOp } from "./init/operations.js";
import { getOperationsCatalog as getSessionOperationsCatalog, getOperation as getSessOp } from "./sessions/operations.js";
import { getOperationsCatalog as getKnowledgeOperationsCatalog, getOperation as getKnowOp } from "./knowledge/operations.js";
import { getOperationsCatalog as getHubOperationsCatalog, getOperation as getHubOp } from "./hub/operations.js";
import { getOperation as getNbOp } from "./notebook/operations.js";
import {
  SearchTool, SEARCH_TOOL,
  ExecuteTool, EXECUTE_TOOL,
  buildSearchCatalog,
} from "./code-mode/index.js";

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
  /**
   * Hub storage for multi-agent coordination. Must be the single
   * process-shared instance so workspaces, agents, and proposals are
   * visible across MCP sessions; tb.hub.* is unavailable without it.
   */
  hubStorage?: HubStorage;
  /**
   * Shared thought store for hub session persistence. Local mode must pass
   * the single process-shared adapter: per-session FileSystemStorage holds
   * an in-memory session index, so hub main-sessions created by one MCP
   * session would otherwise be invisible to another (merge_proposal would
   * fail with "Session not found"). When omitted, falls back to this
   * session's storage — correct for Supabase, which resolves sessions from
   * the database on every call.
   */
  hubThoughtStore?: ThoughtStoreAdapter;
  /** Optional callback for hub events (local-mode unified event stream) */
  onHubEvent?: (event: HubEvent) => void;
  /** Data directory for task store (filesystem persistence) */
  dataDir?: string;
  /** Optional pre-created knowledge storage (used by Supabase mode) */
  knowledgeStorage?: import('./knowledge/types.js').KnowledgeStorage;
  /** Workspace ID for multi-tenant OTEL queries */
  workspaceId?: string;
  /** Optional peer notebook repository override for tests/local composition */
  peerNotebookRepository?: PeerNotebookRepository;
  /** Optional callback to expose the shared protocol handler */
  onProtocolHandlerReady?: (
    handler: ProtocolHandler | InMemoryProtocolHandler,
  ) => void;
  /** Optional callback for protocol lifecycle events (unified event stream) */
  onProtocolEvent?: import('./events/types.js').OnThoughtboxEvent;
}

const defaultLogger: Logger = {
  debug(message: string, ...args: unknown[]) { console.error(`[DEBUG] ${message}`, ...args); },
  info(message: string, ...args: unknown[]) { console.error(`[INFO] ${message}`, ...args); },
  warn(message: string, ...args: unknown[]) { console.error(`[WARN] ${message}`, ...args); },
  error(message: string, ...args: unknown[]) { console.error(`[ERROR] ${message}`, ...args); },
};

function serializeToolError(err: unknown): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    error: err instanceof Error ? err.message : String(err),
  };

  if (err && typeof err === "object") {
    if ("code" in err && typeof err.code === "string") {
      payload.code = err.code;
    }
    if ("details" in err && err.details !== undefined) {
      payload.details = err.details;
    }
    if ("data" in err && err.data !== undefined) {
      payload.data = err.data;
    }
  }

  return payload;
}

function getPeerNotebookPilotResourceContent(): string {
  return JSON.stringify({
    tool: PEER_NOTEBOOK_TOOL.name,
    description: PEER_NOTEBOOK_TOOL.description,
    scope: {
      persistence: "in-memory by default; Supabase-backed in hosted workspace mode",
      runtimeProviders: ["local-process (development-only, no isolation boundary)"],
      deferred: [
        "web app peer views",
        "smolvm provider (production isolation)",
        "public direct runtime MCP",
      ],
    },
    pilotPeer: {
      peerId: "claim-extractor",
      exposedTool: "extract_claims",
      args: { textArtifactId: "artifact id returned by peer_artifact_seed" },
      result: { claimsArtifactId: "produced claims.json artifact id", claimCount: "number" },
      deniedProbe: "thoughtbox.knowledge.queryGraph",
    },
    operations: [
      {
        operation: "peer_artifact_seed",
        purpose: "Seed a text artifact for the current workspace",
        requiredFields: ["text"],
        optionalFields: ["name"],
      },
      {
        operation: "peer_invoke",
        purpose: "Invoke claim-extractor.extract_claims through the broker facade",
        requiredFields: ["peerId", "tool", "args"],
      },
      {
        operation: "peer_get_invocation",
        purpose: "Read invocation metadata by invocationId",
        requiredFields: ["invocationId"],
      },
      {
        operation: "peer_list_trace_events",
        purpose: "Read trace events, including denied outbound broker-proxy calls",
        requiredFields: ["invocationId"],
      },
      {
        operation: "peer_get_artifact",
        purpose: "Read seeded or produced artifacts by artifactId",
        requiredFields: ["artifactId"],
      },
    ],
  }, null, 2);
}

function createDefaultPeerNotebookRepository(
  workspaceId: string | undefined,
  logger: Logger,
): PeerNotebookRepository {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (workspaceId && supabaseUrl && serviceRoleKey) {
    logger.info("Peer notebook tool using Supabase-backed repository");
    return new SupabasePeerNotebookRepository({
      supabaseUrl,
      serviceRoleKey,
    });
  }

  logger.info("Peer notebook tool using in-memory repository");
  return new InMemoryPeerNotebookRepository();
}

/**
 * Side-effect-free server factory.
 * - No transport binding
 * - No HTTP listen
 * - No process signal handlers
 */
export async function createMcpServer(args: CreateMcpServerArgs = {}): Promise<McpServer> {
  const sessionId = args.sessionId;
  const config = configSchema.parse(args.config ?? {});
  const logger = args.logger ?? defaultLogger;

  const THOUGHTBOX_INSTRUCTIONS = `Thoughtbox is a structured reasoning server using Code Mode.

Three tools:
- \`thoughtbox_search\`: Write JavaScript to query the operation/prompt/resource catalog
- \`thoughtbox_execute\`: Write JavaScript using the \`tb\` SDK to chain operations
- \`thoughtbox_peer_notebook\`: Seed artifacts and invoke the brokered claim-extractor peer

Workflow: search to discover available operations, then execute code against them.
Use \`console.log()\` for debugging — output captured in response logs.`;

  // Create task infrastructure if hub storage is provided
  const taskStore = args.dataDir
    ? new FileSystemTaskStore(args.dataDir)
    : new InMemoryTaskStore();
  const taskMessageQueue = new InMemoryTaskMessageQueue();

  const server = new McpServer({
    name: "thoughtbox-server",
    // Keep in sync with package.json version; avoid importing outside src/ (tsconfig rootDir)
    version: "1.2.2",
  }, {
    instructions: THOUGHTBOX_INSTRUCTIONS,
    taskStore,
    taskMessageQueue,
  });

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
  let resolvedWorkspaceId = args.workspaceId || process.env.THOUGHTBOX_PROJECT || "default";
  const durablePeerWorkspaceId = resolvedWorkspaceId === "default" ? undefined : resolvedWorkspaceId;
  const peerNotebookRepository =
    args.peerNotebookRepository ?? createDefaultPeerNotebookRepository(durablePeerWorkspaceId, logger);

  const sessionHandler = new SessionHandler({
    storage,
    thoughtHandler,
  });

  // Create knowledge storage (project scoping happens later via setProject)
  // If a pre-created knowledge storage was provided (Supabase mode), use it.
  // Otherwise fall back to FileSystemKnowledgeStorage.
  let knowledgeHandler: KnowledgeHandler | undefined;
  let knowledgeStorage: import('./knowledge/types.js').KnowledgeStorage | undefined;
  let knowledgeInitError: string | undefined;
  if (args.knowledgeStorage) {
    knowledgeStorage = args.knowledgeStorage;
    knowledgeHandler = new KnowledgeHandler(knowledgeStorage);
  } else {
    try {
      const fsKnowledge = new FileSystemKnowledgeStorage({
        basePath: args.dataDir,
      });
      knowledgeStorage = fsKnowledge;
      knowledgeHandler = new KnowledgeHandler(knowledgeStorage);
    } catch (knowledgeError) {
      knowledgeInitError =
        knowledgeError instanceof Error ? knowledgeError.message : String(knowledgeError);
      logger.warn(
        `Knowledge storage unavailable, continuing without it: ${knowledgeInitError}`
      );
    }
  }

  // Broker proxy targets resolve through the same handlers the tb SDK uses;
  // absent handlers surface target_unavailable errors instead of crashing.
  const peerNotebookHandler = new PeerNotebookHandler({
    getWorkspaceId: () => resolvedWorkspaceId,
    repository: peerNotebookRepository,
    notebookSource: notebookHandler,
    proxyTargetDeps: {
      knowledgeHandler,
      knowledgeUnavailableReason: knowledgeInitError,
      sessionHandler,
    },
  });

  // Log server creation when sessionId is available
  if (sessionId) {
    logger.info(`Creating server for MCP session: ${sessionId}`);
  }

  // Initialize persistence layer — must complete before tools are registered
  try {
    await thoughtHandler.initialize();
    logger.info("Persistence layer initialized");

    if (config.reasoningSessionId) {
      try {
        await thoughtHandler.loadSession(config.reasoningSessionId);
        logger.info(`Pre-loaded reasoning session: ${config.reasoningSessionId}`);
      } catch (loadErr) {
        logger.warn(
          `Failed to pre-load reasoning session ${config.reasoningSessionId}:`,
          loadErr
        );
      }
    }

    try {
      await sessionHandler.init();
    } catch (err) {
      logger.warn("Session handler init failed:", err);
    }
  } catch (err) {
    logger.error("Failed to initialize persistence layer:", err);
  }

  // Initialize init flow (fire-and-forget)
  // handleInit() has fallback for when initHandler is null
  let initHandler: IInitHandler | null = null;

  // ADR-015: Protocol handler reference for project scoping.
  // Declared here so createInitFlow's .then() callback can capture the reference.
  // Assigned later in the synchronous protocol tools block.
  let protocolHandler: ProtocolHandler | InMemoryProtocolHandler | null = null;

  try {
    const { handler, stats, errors } = await createInitFlow();
    initHandler = handler;
    logger.info(
      `Init flow index built: ${stats.sessionsIndexed} sessions, ${stats.projectsFound} projects, ${stats.tasksFound} tasks (${stats.buildTimeMs}ms)`
    );
    if (errors.length > 0) {
      logger.warn(
        `Init flow index encountered ${errors.length} errors during build`
      );
    }
  } catch (err) {
    logger.error("Failed to initialize init flow:", err);
  }



  // =============================================================================
  // Tool Registration (all tools enabled at startup)
  // =============================================================================

  // Undefined when knowledge init failed above; tb.knowledge.* then returns
  // a clean "knowledge unavailable" error from ExecuteTool instead of crashing.
  const knowledgeTool = knowledgeHandler ? new KnowledgeTool(knowledgeHandler) : undefined;
  const sessionTool = new SessionTool(sessionHandler);
  const thoughtTool = new ThoughtTool(thoughtHandler);
  const notebookTool = new NotebookTool(notebookHandler);
  const peerNotebookTool = new PeerNotebookTool(peerNotebookHandler);

  // Resolve project scope.
  //
  // Hosted path: args.workspaceId is set by the auth layer. storage and
  // knowledgeStorage are already workspace-scoped at construction (their
  // setProject methods are deprecated no-ops). protocolHandler.setProject
  // still does real work — it assigns the handler's workspaceId. Calling
  // these synchronously with args.workspaceId gives us correct protocol
  // scoping AND avoids server.server.listRoots(), which hangs on streamable
  // HTTP clients that don't cooperate with the relatedRequestId routing
  // (typescript-sdk#1167). This is the "first tool call on every session
  // hangs for 300s" bug — with args.workspaceId we never make that call.
  //
  // Legacy path (no workspaceId and no env): listRoots retained with a 3s
  // Promise.race timeout as a seatbelt. Not expected to be reached in any
  // currently-deployed configuration.
  let projectResolved = false;
  const resolveProject = async (requestId?: string | number) => {
    if (projectResolved) return;
    projectResolved = true;

    const project = args.workspaceId || process.env.THOUGHTBOX_PROJECT;
    if (project) {
      resolvedWorkspaceId = project;
      try {
        await storage.setProject(project);
        if (knowledgeStorage) await knowledgeStorage.setProject(project);
        if (protocolHandler) protocolHandler.setProject(project);
        logger.info(
          `Project scoped from ${args.workspaceId ? 'workspaceId' : 'THOUGHTBOX_PROJECT'}: ${project}`,
        );
      } catch (err) {
        logger.warn('Failed to scope project:', err);
      }
      return;
    }

    try {
      // Pass relatedRequestId so the transport routes through the active
      // POST response stream instead of the standalone GET SSE stream,
      // which hangs over streamable HTTP (typescript-sdk#1167). Even with
      // this routing, some clients don't cooperate — the Promise.race with
      // 3s timeout is a seatbelt that caps the worst case at 3s instead of
      // the Cloud Run request timeout (300s).
      const options = requestId !== undefined
        ? { relatedRequestId: requestId }
        : undefined;
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('listRoots timed out (3s)')), 3000),
      );
      const { roots } = await Promise.race([
        server.server.listRoots(undefined, options),
        timeout,
      ]);
      if (roots.length > 0) {
        const root = roots[0];
        const name = root.name
          || root.uri.split('/').filter(Boolean).pop()
          || 'default';
        resolvedWorkspaceId = name;
        await storage.setProject(name);
        if (knowledgeStorage) await knowledgeStorage.setProject(name);
        if (protocolHandler) protocolHandler.setProject(name);
        logger.info(`Project auto-resolved from root: ${name}`);
      }
    } catch (err) {
      logger.debug('Could not resolve project from roots:', err);
    }
  };

  // Helper to register tools with standardized error handling
  // Calls resolveProject() on first invocation (transport must be connected)
  const registerTool = <T>(
    toolDef: { name: string; description: string; inputSchema: any; annotations?: any },
    toolInstance: { handle: (args: T) => Promise<any> },
  ) => {
    server.registerTool(
      toolDef.name,
      {
        description: toolDef.description,
        inputSchema: toolDef.inputSchema as any,
        annotations: toolDef.annotations,
      },
      async (args: any, extra: any) => {
        await resolveProject(extra?.requestId);
        try {
          const result = await toolInstance.handle(args as any);
          if (result && Array.isArray(result.content)) {
            return result;
          }
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (err: any) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify(serializeToolError(err), null, 2) }],
            isError: true,
          };
        }
      }
    );
  };

  // Protocol tools (Theseus + Ulysses) — ADR-015
  // Use Supabase backend when available, fall back to in-memory
  const protocolSupabaseUrl = process.env.SUPABASE_URL;
  const protocolServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (protocolSupabaseUrl && protocolServiceKey) {
    const protocolClient = createSupabaseClient(
      protocolSupabaseUrl,
      protocolServiceKey,
    );
    protocolHandler = new ProtocolHandler(protocolClient, args.onProtocolEvent);
    logger.info('Protocol tools using Supabase backend');
  } else {
    protocolHandler = new InMemoryProtocolHandler(args.onProtocolEvent);
    logger.info('Protocol tools using in-memory backend');
  }

  args.onProtocolHandlerReady?.(protocolHandler);

  // Wire the notebook ValidatorService into the protocol handler so Ulysses
  // plan/outcome/bind_final_validator/complete can dispatch validator runs
  // without an MCP roundtrip.
  protocolHandler.setValidatorService(notebookHandler.getValidatorService());

  const theseusTool = new TheseusTool(protocolHandler, thoughtHandler, knowledgeStorage);
  const ulyssesTool = new UlyssesTool(protocolHandler, thoughtHandler, knowledgeStorage);

  const observabilityHandler = new ObservabilityGatewayHandler({
    storage,
    workspaceId: args.workspaceId,
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  // Branch handler — hosted mode only. The branch toolhost spawns Supabase
  // Edge Function workers and constructs a Supabase client at init, so it is
  // only wired when Supabase credentials are present. In local/self-hosted
  // mode it is left undefined; `tb.branch.*` then returns a clear "hosted
  // mode" error instead of crashing session setup on a missing SUPABASE_URL.
  //
  // TB_BRANCH_SIGNING_SECRET is the dedicated HMAC secret shared with the
  // tb-branch Edge Function. The service role key cannot serve as the signing
  // secret: the hosted Edge runtime injects its own SUPABASE_SERVICE_ROLE_KEY
  // value, which does not match the key this server holds.
  const branchSupabaseUrl = process.env.SUPABASE_URL;
  const branchServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const branchSigningSecret = process.env.TB_BRANCH_SIGNING_SECRET;
  if (branchSupabaseUrl && branchServiceKey && !branchSigningSecret) {
    console.error(
      "[branch] Supabase credentials present but TB_BRANCH_SIGNING_SECRET is not set; " +
        "tb.branch.* is disabled. Set the same secret on this server and the " +
        "tb-branch Edge Function (supabase secrets set TB_BRANCH_SIGNING_SECRET=...)."
    );
  }
  const branchHandler =
    branchSupabaseUrl && branchServiceKey && branchSigningSecret
      ? new BranchHandler({
          supabaseUrl: branchSupabaseUrl,
          serviceRoleKey: branchServiceKey,
          signingSecret: branchSigningSecret,
          workspaceId: args.workspaceId ?? "default",
        })
      : undefined;

  // =============================================================================
  // Code Mode Tools (replaces individual tool registrations)
  // =============================================================================

  // Hub dispatcher — tb.hub.* over the process-shared hub storage.
  // Hub state (workspaces, agents, proposals) is shared across MCP sessions
  // via args.hubStorage; the thought store delegates to THIS session's
  // storage so merge_proposal synthesis thoughts persist with the session's
  // real backend (filesystem locally, Supabase when hosted).
  // The HubToolHandler keeps a register-once identity registry keyed by the
  // session, so agentId is implicit after the first register/quick_join.
  const hubToolHandler = args.hubStorage
    ? createHubToolHandler({
        hubStorage: args.hubStorage,
        thoughtStore: args.hubThoughtStore ?? createThoughtStoreAdapter(storage),
        envAgentId: process.env.THOUGHTBOX_AGENT_ID,
        envAgentName: process.env.THOUGHTBOX_AGENT_NAME,
        onEvent: args.onHubEvent,
      })
    : undefined;
  const hubSessionKey = sessionId ?? "local";
  const hubDispatcher = hubToolHandler
    ? {
        handle: (input: { operation: string; [key: string]: unknown }) =>
          hubToolHandler.handle(input, hubSessionKey),
      }
    : undefined;

  const searchCatalog = buildSearchCatalog();
  const searchTool = new SearchTool(searchCatalog);
  const executeTool = new ExecuteTool({
    thoughtTool,
    sessionTool,
    knowledgeTool,
    knowledgeUnavailableReason: knowledgeInitError,
    notebookTool,
    theseusTool,
    ulyssesTool,
    observabilityHandler,
    branchHandler,
    hubDispatcher,
  });

  registerTool(SEARCH_TOOL, searchTool);
  registerTool(EXECUTE_TOOL, executeTool);
  registerTool(PEER_NOTEBOOK_TOOL, peerNotebookTool);

  logger.info('Code Mode tools registered (search + execute) and peer notebook tool registered');

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
  "prompt": "${request ? `Task: ${request}` : "Retrieve and summarize Thoughtbox session data."}\\n\\nSteps:\\n1. Call mcp__thoughtbox__thoughtbox_execute with code using the tb SDK:\\n   - async () => tb.session.list() to see available sessions\\n   - async () => tb.session.get('<SESSION_ID>') to retrieve a specific session\\n   - async () => tb.session.search('<QUERY>') to find relevant sessions\\n2. Process the data according to the request\\n\\nReturn ONLY your findings/summary. Do not include raw thought content."
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
// Via the thoughtbox_execute tool:
async () => tb.thought({
  thought: "[REVISED content with new context]",
  thoughtType: "reasoning",
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

  // Thoughtbox Skills — registered as both prompts and resources (unified pattern)
  // Accessible as prompts: skill-onboard, skill-research, etc.
  // Accessible as resources: thoughtbox://skills/onboard, thoughtbox://skills/research, etc.
  for (const skill of SKILL_DEFINITIONS) {
    const argsSchema: Record<string, z.ZodTypeAny> = {};
    for (const arg of skill.args) {
      argsSchema[arg.name] = arg.required
        ? z.string().describe(arg.description)
        : z.string().optional().describe(arg.description);
    }

    server.registerPrompt(
      `skill-${skill.name}`,
      {
        description: skill.description,
        argsSchema,
      },
      async (args) => {
        const argSummary = Object.entries(args)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `**${k}**: ${v}`)
          .join("\n");

        const header = argSummary
          ? `# Execute: ${skill.title}\n\n${argSummary}\n\n---\n\n`
          : "";

        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: header + skill.content,
              },
            },
          ],
        };
      }
    );
  }

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
    "notebook-capabilities",
    "thoughtbox://notebook/capabilities",
    {
      description: "Notebook Evidence Engine modes, templates, outputs, and recommended use cases",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: notebookHandler.getCapabilitiesCatalog(),
        },
      ],
    })
  );

  server.registerResource(
    "peer-notebook-pilot",
    "thoughtbox://peer-notebook/pilot",
    {
      description: "Mock peer notebook pilot surface: artifact seed, claim-extractor invocation, invocation/trace/artifact reads",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: getPeerNotebookPilotResourceContent(),
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
          text: getExtendedCipher(THOUGHTBOX_CIPHER),
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
    "session-operations",
    "thoughtbox://session/operations",
    {
      description: "Complete catalog of session operations with schemas and examples",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: getSessionOperationsCatalog(),
        },
      ],
    })
  );



  server.registerResource(
    "init-operations",
    "thoughtbox://init/operations",
    {
      description: "Complete catalog of init operations (get_state, list_sessions, navigate, load_context, start_new, list_roots, bind_root) with schemas and examples",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: getInitOperationsCatalog(),
        },
      ],
    })
  );

  server.registerResource(
    "knowledge-operations",
    "thoughtbox://knowledge/operations",
    {
      description: "Complete catalog of knowledge graph operations (create_entity, get_entity, list_entities, add_observation, create_relation, query_graph, stats) with schemas and examples",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: getKnowledgeOperationsCatalog(),
        },
      ],
    })
  );

  server.registerResource(
    "hub-operations",
    "thoughtbox://hub/operations",
    {
      description: "Complete catalog of all 28 hub operations organized by category with stage metadata and vocabulary",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: getHubOperationsCatalog(),
        },
      ],
    })
  );

  server.registerResource(
    "gateway-operations",
    "thoughtbox://gateway/operations",
    {
      description: "Complete catalog of operations available through the Code Mode gateway, grouped by tb SDK module (thought, session, knowledge, notebook, theseus, ulysses, observability, branch, hub)",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(
            {
              version: "1.0.0",
              publicTools: searchCatalog.publicTools,
              operations: searchCatalog.operations,
            },
            null,
            2
          ),
        },
      ],
    })
  );

  server.registerResource(
    "init-operation",
    new ResourceTemplate("thoughtbox://init/operations/{op}", { list: undefined }),
    { description: "Individual init operation schema and examples", mimeType: "application/json" },
    async (uri, { op }) => {
      const opDef = getInitOp(op as string);
      if (!opDef) throw new Error(`Unknown init operation: ${op}`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
    }
  );

  server.registerResource(
    "session-operation",
    new ResourceTemplate("thoughtbox://session/operations/{op}", { list: undefined }),
    { description: "Individual session operation schema and examples", mimeType: "application/json" },
    async (uri, { op }) => {
      const opDef = getSessOp(op as string);
      if (!opDef) throw new Error(`Unknown session operation: ${op}`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
    }
  );

  server.registerResource(
    "knowledge-operation",
    new ResourceTemplate("thoughtbox://knowledge/operations/{op}", { list: undefined }),
    { description: "Individual knowledge graph operation schema and examples", mimeType: "application/json" },
    async (uri, { op }) => {
      const opDef = getKnowOp(op as string);
      if (!opDef) throw new Error(`Unknown knowledge operation: ${op}`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
    }
  );

  server.registerResource(
    "hub-operation",
    new ResourceTemplate("thoughtbox://hub/operations/{op}", { list: undefined }),
    { description: "Individual hub operation schema and examples", mimeType: "application/json" },
    async (uri, { op }) => {
      const opDef = getHubOp(op as string);
      if (!opDef) throw new Error(`Unknown hub operation: ${op}`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
    }
  );

  server.registerResource(
    "gateway-operation",
    new ResourceTemplate("thoughtbox://gateway/operations/{op}", { list: undefined }),
    { description: "Individual operation schema from the Code Mode gateway catalog, looked up by name across tb SDK modules", mimeType: "application/json" },
    async (uri, { op }) => {
      const opName = op as string;
      for (const [module, ops] of Object.entries(searchCatalog.operations)) {
        const opDef = ops[opName];
        if (opDef) {
          return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({ module, name: opName, ...opDef }, null, 2) }] };
        }
      }
      throw new Error(`Unknown gateway operation: ${opName}`);
    }
  );

  server.registerResource(
    "notebook-operation",
    new ResourceTemplate("thoughtbox://notebook/operations/{op}", { list: undefined }),
    { description: "Individual notebook operation schema and examples", mimeType: "application/json" },
    async (uri, { op }) => {
      const opDef = getNbOp(op as string);
      if (!opDef) throw new Error(`Unknown notebook operation: ${op}`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
    }
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
        text: `# Thoughtbox Init\n\nSession index not available. You can start using tools directly.\n\n## Available Tools\n\n- \`thoughtbox_search\` — Query the operation/prompt/resource catalog\n- \`thoughtbox_execute\` — Run JavaScript against the \`tb\` SDK (thoughts, sessions, knowledge, notebooks)\n- \`thoughtbox_peer_notebook\` — Seed artifacts and invoke the brokered claim-extractor peer`,
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


  // Skills catalog resource (static)
  server.registerResource(
    "skills-catalog",
    "thoughtbox://skills",
    {
      description:
        "Catalog of all Thoughtbox workflow skills with descriptions and usage",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: getSkillCatalog(),
        },
      ],
    })
  );

  // Skills resource template — individual skill content
  server.registerResource(
    "skill-content",
    new ResourceTemplate("thoughtbox://skills/{name}", { list: undefined }),
    {
      description:
        "Individual skill workflow guide. Available skills: onboard, research, decision, debug, refactor, session-review, knowledge-query, evolution",
      mimeType: "text/markdown",
    },
    async (uri, params) => {
      const name = typeof params === "object" && params !== null
        ? String((params as Record<string, unknown>).name ?? "")
        : "";
      const skill = getSkill(name);
      if (!skill) {
        const available = SKILL_DEFINITIONS.map((s) => s.name).join(", ");
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/markdown",
              text: `# Skill Not Found\n\n**Error**: No skill named "${name}".\n\n**Available skills**: ${available}\n\nUse \`thoughtbox://skills\` to see the full catalog.`,
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "text/markdown",
            text: skill.content,
          },
        ],
      };
    }
  );

  // SPEC-001: Thought query resource templates
  const thoughtQueryHandler = new ThoughtQueryHandler(storage);

  server.registerResource(
    "thoughts-by-type",
    new ResourceTemplate("thoughtbox://thoughts/{sessionId}/{type}", { list: undefined }),
    { description: "Query thoughts by semantic type (H/E/C/Q/R/P/O/A/X)", mimeType: "application/json" },
    async (uri) => {
      const result = await thoughtQueryHandler.handleQuery(uri.toString());
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  server.registerResource(
    "thought-range",
    new ResourceTemplate("thoughtbox://thoughts/{sessionId}/range/{start}-{end}", { list: undefined }),
    { description: "Retrieve thoughts in specified range [start, end] inclusive", mimeType: "application/json" },
    async (uri) => {
      const result = await thoughtQueryHandler.handleQuery(uri.toString());
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  server.registerResource(
    "thought-references",
    new ResourceTemplate("thoughtbox://references/{sessionId}/{thoughtNumber}", { list: undefined }),
    { description: "Find all thoughts that reference a specific thought number", mimeType: "application/json" },
    async (uri) => {
      const result = await thoughtQueryHandler.handleQuery(uri.toString());
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  server.registerResource(
    "revision-history",
    new ResourceTemplate("thoughtbox://revisions/{sessionId}/{thoughtNumber}", { list: undefined }),
    { description: "Get complete revision history for a thought", mimeType: "application/json" },
    async (uri) => {
      const result = await thoughtQueryHandler.handleQuery(uri.toString());
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Knowledge graph resources (Phase 1)
  server.registerResource(
    "knowledge-stats",
    "thoughtbox://knowledge/stats",
    { description: "Knowledge graph statistics (entity/relation counts)", mimeType: "application/json" },
    async (uri) => {
      if (!knowledgeHandler) {
        return {
          contents: [{
            uri: uri.toString(),
            mimeType: "application/json",
            text: JSON.stringify({ error: 'Knowledge storage not initialized' }, null, 2),
          }],
        };
      }
      const result = await knowledgeHandler.processOperation({ operation: 'stats' });
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "application/json",
          text: result.content[0].text,
        }],
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
        uri: "thoughtbox://notebook/capabilities",
        name: "Notebook Evidence Engine Capabilities",
        description: "Notebook modes, templates, outputs, and recommended use cases",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://peer-notebook/pilot",
        name: "Peer Notebook Pilot",
        description: "Mock peer notebook pilot surface: artifact seed, claim-extractor invocation, invocation/trace/artifact reads",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://session/operations",
        name: "Session Operations Catalog",
        description: "Complete catalog of session operations with schemas and examples",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://gateway/operations",
        name: "Gateway Operations Catalog",
        description: "Complete catalog of operations available through the Code Mode gateway, grouped by tb SDK module (thought, session, knowledge, notebook, theseus, ulysses, observability, branch, hub)",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://init/operations",
        name: "Init Operations Catalog",
        description: "Complete catalog of init operations (get_state, list_sessions, navigate, load_context, start_new, list_roots, bind_root)",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://knowledge/operations",
        name: "Knowledge Operations Catalog",
        description: "Complete catalog of knowledge graph operations with schemas and examples",
        mimeType: "application/json",
      },
      {
        uri: "thoughtbox://hub/operations",
        name: "Hub Operations Catalog",
        description: "Complete catalog of all 28 hub operations with stage metadata and vocabulary",
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
      // Skill resources (unified prompt/resource pattern)
      {
        uri: "thoughtbox://skills",
        name: "Thoughtbox Skills Catalog",
        description:
          "Catalog of all Thoughtbox workflow skills: onboard, research, decision, debug, refactor, session-review, knowledge-query, evolution",
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
      // Knowledge graph resources (Phase 1)
      {
        uri: "thoughtbox://knowledge/stats",
        name: "Knowledge Graph Statistics",
        description: "Entity and relation counts for the knowledge graph",
        mimeType: "application/json",
      },

      {
        uri: BEHAVIORAL_TESTS.memory.uri,
        name: "Behavioral Tests: Memory",
        description: BEHAVIORAL_TESTS.memory.description,
        mimeType: "text/markdown",
      },


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
        // Skill resource templates
        {
          uriTemplate: "thoughtbox://skills/{name}",
          name: "Skill Guide",
          description:
            "Individual skill workflow guide. Available: onboard, research, decision, debug, refactor, session-review, knowledge-query, evolution",
          mimeType: "text/markdown",
        },
        // Per-operation resource templates (Fix #4)
        {
          uriTemplate: "thoughtbox://gateway/operations/{op}",
          name: "Gateway Operation Detail",
          description: "Individual operation schema from the Code Mode gateway catalog, looked up by name across tb SDK modules",
          mimeType: "application/json",
        },
        {
          uriTemplate: "thoughtbox://init/operations/{op}",
          name: "Init Operation Detail",
          description: "Individual init operation schema and examples",
          mimeType: "application/json",
        },
        {
          uriTemplate: "thoughtbox://session/operations/{op}",
          name: "Session Operation Detail",
          description: "Individual session operation schema and examples",
          mimeType: "application/json",
        },
        {
          uriTemplate: "thoughtbox://knowledge/operations/{op}",
          name: "Knowledge Operation Detail",
          description: "Individual knowledge graph operation schema and examples",
          mimeType: "application/json",
        },
        {
          uriTemplate: "thoughtbox://hub/operations/{op}",
          name: "Hub Operation Detail",
          description: "Individual hub operation schema and examples",
          mimeType: "application/json",
        },
        {
          uriTemplate: "thoughtbox://notebook/operations/{op}",
          name: "Notebook Operation Detail",
          description: "Individual notebook operation schema and examples",
          mimeType: "application/json",
        },
        ...getSessionAnalysisResourceTemplates().resourceTemplates,
      ],
    })
  );

  return server;
}

export default createMcpServer;
