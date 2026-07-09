import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListResourcesRequestSchema, ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod"; // hypothesis test 3
import type { HubStorage } from "./hub/hub-types.js";
import type { HubEvent } from "./hub/hub-handler.js";
import { createHubToolHandler } from "./hub/hub-tool-handler.js";
import { SessionIdentityRegistry } from "./hub/session-identity.js";
import type { ClaimStorage } from "./claims/types.js";
import type { RunbookStorage } from "./notebook/runbook/types.js";
import { createClaimsToolHandler } from "./claims/claims-tool-handler.js";
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
} from "./prompts/index.js";
import { THOUGHTBOX_CIPHER } from "./resources/thoughtbox-cipher-content.js";
import { PARALLEL_VERIFICATION_CONTENT } from "./prompts/contents/parallel-verification.js";
import { SESSION_ANALYSIS_GUIDE } from "./resources/session-analysis-guide-content.js";
import {
  STATIC_RESOURCES,
  RESOURCE_TEMPLATES,
  resourceTemplate,
} from "./resources/static-registry.js";
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
import { ThoughtHandler } from "./thought-handler.js";

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
import { getOperationsCatalog as getSessionOperationsCatalog, getOperation as getSessOp } from "./sessions/operations.js";
import { getOperationsCatalog as getKnowledgeOperationsCatalog, getOperation as getKnowOp } from "./knowledge/operations.js";
import { getOperationsCatalog as getHubOperationsCatalog, getOperation as getHubOp } from "./hub/operations.js";
import { getClaimsOperationsCatalog, getClaimsOperation } from "./claims/operations.js";
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
  /**
   * Claim graph storage (SPEC-AGX-SUBSTRATE B1/B2). Like hubStorage, must
   * be shared across MCP sessions (single in-memory instance locally;
   * tenant-scoped SupabaseClaimStorage when hosted); tb.claims.* is
   * unavailable without it. Identity rides the hub session registry, so
   * tb.claims requires hubStorage to be wired as well.
   */
  claimStorage?: ClaimStorage;
  /**
   * Durable runbook storage (SPEC-AGX-SUBSTRATE B4b). Like claimStorage,
   * must be shared across MCP sessions (tenant-scoped SupabaseRunbookStorage
   * when hosted; a single in-memory instance locally). Without it the
   * notebook engine falls back to a per-handler InMemoryRunbookStorage, so
   * templates/instances/executions/ledger rows are lost with the process.
   */
  runbookStorage?: RunbookStorage;
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
      graduation: "graduated notebooks execute as brokered peers; claim-extractor is the reference peer",
      deferred: [
        "web app peer views",
        "smolvm provider (production isolation)",
        "public direct runtime MCP",
      ],
    },
    examplePeer: {
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
- \`thoughtbox_peer_notebook\`: Seed artifacts and invoke brokered graduated peers (e.g. claim-extractor)

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

  const notebookHandler = new NotebookHandler(
    undefined,
    args.runbookStorage ? { runbookStorage: args.runbookStorage } : {},
  );
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

  // ADR-015: Protocol handler reference for project scoping.
  // Assigned later in the synchronous protocol tools block.
  let protocolHandler: ProtocolHandler | InMemoryProtocolHandler | null = null;

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
  // The identity registry is shared between tb.hub and tb.claims so one
  // register/quick_join grants the session identity to both namespaces.
  const sessionIdentities = new SessionIdentityRegistry();
  const hubToolHandler = args.hubStorage
    ? createHubToolHandler({
        hubStorage: args.hubStorage,
        thoughtStore: args.hubThoughtStore ?? createThoughtStoreAdapter(storage),
        envAgentId: process.env.THOUGHTBOX_AGENT_ID,
        envAgentName: process.env.THOUGHTBOX_AGENT_NAME,
        onEvent: args.onHubEvent,
        identityRegistry: sessionIdentities,
      })
    : undefined;
  const hubSessionKey = sessionId ?? "local";
  const hubDispatcher = hubToolHandler
    ? {
        handle: (input: { operation: string; [key: string]: unknown }) =>
          hubToolHandler.handle(input, hubSessionKey),
      }
    : undefined;

  // Claims dispatcher — tb.claims.* over the process-shared claim storage
  // (SPEC-AGX-SUBSTRATE B2), bound to the same session key and identity
  // registry as the hub dispatcher.
  const claimsToolHandler = args.claimStorage
    ? createClaimsToolHandler({
        claimStorage: args.claimStorage,
        identityRegistry: sessionIdentities,
      })
    : undefined;
  const claimsDispatcher = claimsToolHandler
    ? {
        handle: (input: { operation: string; [key: string]: unknown }) =>
          claimsToolHandler.handle(input, hubSessionKey),
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
    claimsDispatcher,
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

  // ===========================================================================
  // Static resources + resource templates (metadata from the single registry)
  // ===========================================================================
  // STATIC_RESOURCES / RESOURCE_TEMPLATES in src/resources/static-registry.ts
  // are the single source of truth for names, URIs, descriptions, and MIME
  // types. Content resolvers live here because they close over runtime
  // handlers. Registration throws at startup if a registry entry has no
  // resolver, so the registry and this map cannot drift silently.

  const staticResourceResolvers: Record<string, (uri: string) => Promise<string> | string> = {
    "system://status": () => JSON.stringify(notebookHandler.getStatus(), null, 2),
    "thoughtbox://notebook/operations": () => notebookHandler.getOperationsCatalog(),
    "thoughtbox://notebook/capabilities": () => notebookHandler.getCapabilitiesCatalog(),
    "thoughtbox://peer-notebook/pilot": () => getPeerNotebookPilotResourceContent(),
    "thoughtbox://session/operations": () => getSessionOperationsCatalog(),
    "thoughtbox://gateway/operations": () =>
      JSON.stringify(
        {
          version: "1.0.0",
          publicTools: searchCatalog.publicTools,
          operations: searchCatalog.operations,
        },
        null,
        2
      ),
    "thoughtbox://knowledge/operations": () => getKnowledgeOperationsCatalog(),
    "thoughtbox://hub/operations": () => getHubOperationsCatalog(),
    "thoughtbox://claims/operations": () => getClaimsOperationsCatalog(),
    "thoughtbox://patterns-cookbook": () => PATTERNS_COOKBOOK,
    "thoughtbox://architecture": () => SERVER_ARCHITECTURE_GUIDE,
    "thoughtbox://cipher": () => THOUGHTBOX_CIPHER,
    "thoughtbox://session-analysis-guide": () => SESSION_ANALYSIS_GUIDE,
    "thoughtbox://guidance/parallel-verification": () => PARALLEL_VERIFICATION_CONTENT,
    "thoughtbox://knowledge/stats": async () => {
      if (!knowledgeHandler) {
        return JSON.stringify({ error: "Knowledge storage not initialized" }, null, 2);
      }
      const result = await knowledgeHandler.processOperation({ operation: "stats" });
      return result.content[0].text;
    },
  };

  for (const def of STATIC_RESOURCES) {
    const resolve = staticResourceResolvers[def.uri];
    if (!resolve) {
      throw new Error(
        `Static resource ${def.uri} is in the registry but has no content resolver`
      );
    }
    server.registerResource(
      def.key,
      def.uri,
      { description: def.description, mimeType: def.mimeType },
      async (uri) => ({
        contents: [
          {
            uri: uri.toString(),
            mimeType: def.mimeType,
            text: await resolve(uri.toString()),
          },
        ],
      })
    );
  }

  // Resource templates: handlers are bespoke, metadata comes from the registry.
  const registerTemplate = (
    key: string,
    handler: (uri: URL, params: Record<string, string | string[] | undefined>) => Promise<{
      contents: Array<{ uri: string; mimeType: string; text: string }>;
    }>,
  ) => {
    const def = resourceTemplate(key);
    server.registerResource(
      def.key,
      new ResourceTemplate(def.uriTemplate, { list: undefined }),
      { description: def.description, mimeType: def.mimeType },
      handler as any
    );
  };

  registerTemplate("session-operation", async (uri, { op }) => {
    const opDef = getSessOp(op as string);
    if (!opDef) throw new Error(`Unknown session operation: ${op}`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
  });

  registerTemplate("knowledge-operation", async (uri, { op }) => {
    const opDef = getKnowOp(op as string);
    if (!opDef) throw new Error(`Unknown knowledge operation: ${op}`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
  });

  registerTemplate("hub-operation", async (uri, { op }) => {
    const opDef = getHubOp(op as string);
    if (!opDef) throw new Error(`Unknown hub operation: ${op}`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
  });

  registerTemplate("claims-operation", async (uri, { op }) => {
    const opDef = getClaimsOperation(op as string);
    if (!opDef) throw new Error(`Unknown claims operation: ${op}`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
  });

  registerTemplate("gateway-operation", async (uri, { op }) => {
    const opName = op as string;
    for (const [module, ops] of Object.entries(searchCatalog.operations)) {
      const opDef = ops[opName];
      if (opDef) {
        return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({ module, name: opName, ...opDef }, null, 2) }] };
      }
    }
    throw new Error(`Unknown gateway operation: ${opName}`);
  });

  registerTemplate("notebook-operation", async (uri, { op }) => {
    const opDef = getNbOp(op as string);
    if (!opDef) throw new Error(`Unknown notebook operation: ${op}`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(opDef, null, 2) }] };
  });

  registerTemplate("interleaved-guide", async (_uri, { guide }) => ({
    contents: [getInterleavedGuideForUri(`thoughtbox://interleaved/${guide as string}`)],
  }));

  // Escape hatches: both list handlers are generated from the same registry
  // the registrations above use, so the three views cannot drift.
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: STATIC_RESOURCES.map((def) => ({
      uri: def.uri,
      name: def.name,
      description: def.description,
      mimeType: def.mimeType,
    })),
  }));

  server.server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async () => ({
      resourceTemplates: RESOURCE_TEMPLATES.map((def) => ({
        uriTemplate: def.uriTemplate,
        name: def.name,
        description: def.description,
        mimeType: def.mimeType,
      })),
    })
  );

  return server;
}

export default createMcpServer;
