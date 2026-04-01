#!/usr/bin/env node

/**
 * Thoughtbox MCP Server - Entry Point (Streamable HTTP)
 */

import crypto from "node:crypto";
import * as path from "node:path";
import * as os from "node:os";
import type { Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server-factory.js";
import {
  FileSystemStorage,
  InMemoryStorage,
  SupabaseStorage,
  migrateExports,
  type ThoughtboxStorage,
} from "./persistence/index.js";
import { SupabaseKnowledgeStorage } from "./knowledge/index.js";
import type { KnowledgeStorage } from "./knowledge/types.js";
import {
  createObservatoryServer,
  loadObservatoryConfig,
  type ObservatoryServer,
} from "./observatory/index.js";
import { createFileSystemHubStorage } from "./hub/hub-storage-fs.js";
import type { HubStorage } from "./hub/hub-types.js";
import { initEvaluation, initMonitoring } from "./evaluation/index.js";
import { createHubHandler, type HubEvent } from "./hub/hub-handler.js";
import { createHubHttpSurface, shouldWarnOnExposedLocalMode } from "./http/hub-http.js";
import {
  createProtocolHttpSurface,
  type ProtocolEnforcementHandler,
} from "./http/protocol-http.js";
import { resolveRequestAuth } from "./auth/resolve-request-auth.js";
import { ensureStaticWorkspace } from "./auth/static-workspace.js";
import { mountOtlpRoutes } from "./otel/index.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import {
  ThoughtboxOAuthProvider,
  OAuthClientSupabaseStorage,
  InMemoryClientStorage,
  SupabaseTokenStorage,
  InMemoryTokenStorage,
  verifyAccessToken as verifyOAuthToken,
} from "./auth/oauth/index.js";

/**
 * Get the storage backend based on environment configuration.
 *
 * THOUGHTBOX_STORAGE=memory  -> InMemoryStorage (volatile, for testing)
 * THOUGHTBOX_STORAGE=fs      -> FileSystemStorage (persistent, default)
 *
 * THOUGHTBOX_DATA_DIR -> Custom data directory (default: ~/.thoughtbox)
 *
 * Project scope is set via MCP roots or THOUGHTBOX_PROJECT env var.
 */
interface StorageFactory {
  getStorage: (workspaceId?: string) => ThoughtboxStorage;
  getKnowledgeStorage: (workspaceId?: string) => KnowledgeStorage | undefined;
}

interface StorageBundle {
  factory: StorageFactory;
  hubStorage: HubStorage;
  dataDir: string;
}

async function createStorage(): Promise<StorageBundle> {
  const storageType = (process.env.THOUGHTBOX_STORAGE || "fs").toLowerCase();

  // Determine base directory (used for both main and hub storage)
  const baseDir =
    process.env.THOUGHTBOX_DATA_DIR ||
    path.join(os.homedir(), ".thoughtbox");

  if (storageType === "supabase") {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "THOUGHTBOX_STORAGE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    console.error("[Storage] Using Supabase per-session storage factory");

    const factory: StorageFactory = {
      getStorage: (workspaceId?: string) => {
        if (!workspaceId) throw new Error('workspaceId is required for Supabase storage');
        return new SupabaseStorage({ supabaseUrl, serviceRoleKey, workspaceId });
      },
      getKnowledgeStorage: (workspaceId?: string) => {
        if (!workspaceId) throw new Error('workspaceId is required for Supabase knowledge storage');
        return new SupabaseKnowledgeStorage({ supabaseUrl, serviceRoleKey, workspaceId });
      }
    };

    return {
      factory,
      hubStorage: createFileSystemHubStorage(baseDir),
      dataDir: baseDir,
    };
  }

  if (storageType === "memory") {
    console.error("[Storage] Using in-memory storage (volatile)");
    const factory: StorageFactory = {
      getStorage: () => new InMemoryStorage(),
      getKnowledgeStorage: () => undefined,
    };
    return {
      factory,
      hubStorage: createFileSystemHubStorage(baseDir),
      dataDir: baseDir,
    };
  }

  console.error(`[Storage] Using filesystem storage at ${baseDir}`);

  // Base init for FileSystem: config, legacy migration. Done once globally.
  const fsStorage = new FileSystemStorage({
    basePath: baseDir,
    partitionGranularity: "monthly",
  });
  await fsStorage.initialize();

  // Auto-migrate existing exports if any
  try {
    const migrationResult = await migrateExports({
      destDir: baseDir,
      skipExisting: true,
      dryRun: false,
    });
    if (migrationResult.migrated > 0) {
      console.error(
        `[Storage] Migrated ${migrationResult.migrated} sessions from exports`
      );
    }
  } catch (err) {
    console.error("[Storage] Migration check failed (non-fatal):", err);
  }

  const factory: StorageFactory = {
    getStorage: () => new FileSystemStorage({
      basePath: baseDir,
      partitionGranularity: "monthly",
    }),
    getKnowledgeStorage: () => undefined,
  };

  return {
    factory,
    hubStorage: createFileSystemHubStorage(baseDir),
    dataDir: baseDir,
  };
}

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: Awaited<ReturnType<typeof createMcpServer>>;
  workspaceId: string;
  protocolHandler: ProtocolEnforcementHandler | null;
}

async function maybeStartObservatory(hubStorage?: HubStorage, persistentStorage?: ThoughtboxStorage): Promise<ObservatoryServer | null> {
  const observatoryConfig = loadObservatoryConfig();
  if (!observatoryConfig.enabled) return null;

  const observatoryServer = createObservatoryServer({
    _type: 'options',
    config: observatoryConfig,
    hubStorage,
    persistentStorage,
  });
  await observatoryServer.start();
  console.error(`[Observatory] Server started on port ${observatoryConfig.port}`);
  return observatoryServer;
}

async function startHttpServer() {
  const { factory, hubStorage, dataDir } = await createStorage();

  // Provide observatory with a generic un-scoped storage if possible, otherwise it limits functionality
  let observatoryBaseStorage: ThoughtboxStorage | undefined;
  try {
    observatoryBaseStorage = factory.getStorage();
    if (observatoryBaseStorage) {
      await observatoryBaseStorage.initialize();
    }
  } catch (e) {
    // Fails for Supabase without workspaceId, which is fine since Observatory skips persistent reading in MVP
  }

  const observatoryServer = await maybeStartObservatory(hubStorage, observatoryBaseStorage);

  // Initialize LangSmith evaluation tracing (no-op if LANGSMITH_API_KEY not set)
  const traceListener = initEvaluation();
  initMonitoring(traceListener ?? undefined);

  const host = process.env.HOST || "0.0.0.0";
  const app = createMcpExpressApp({
    host,
  });

  const port = parseInt(process.env.PORT || "1731", 10);
  const isMultiTenant = process.env.THOUGHTBOX_STORAGE === 'supabase';
  const sessions = new Map<string, SessionEntry>();

  // Cloud Run (and most reverse proxies) set X-Forwarded-For.
  // express-rate-limit throws ValidationError if it sees that header
  // without trust proxy enabled, crashing the OAuth /authorize handler.
  if (isMultiTenant) {
    app.set('trust proxy', 1);
  }

  if (shouldWarnOnExposedLocalMode(host, isMultiTenant)) {
    console.warn(
      "[Security] Local/singleton mode is bound to 0.0.0.0. Hub HTTP endpoints and local storage are not workspace-isolated; do not expose this server to untrusted users.",
    );
  }

  // ---------------------------------------------------------------------------
  // OAuth 2.1 — mount auth router (discovery, registration, token, revoke)
  // ---------------------------------------------------------------------------

  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  const issuerUrl = new URL(baseUrl);
  const resourceServerUrl = new URL('/mcp', baseUrl);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSupabase = isMultiTenant && supabaseUrl && serviceRoleKey;

  const oauthClientStorage = hasSupabase
    ? new OAuthClientSupabaseStorage({ supabaseUrl, serviceRoleKey })
    : new InMemoryClientStorage();

  const oauthTokenStorage = hasSupabase
    ? new SupabaseTokenStorage({ supabaseUrl, serviceRoleKey })
    : new InMemoryTokenStorage();

  const scopesSupported = ['mcp:tools'];

  const oauthProvider = new ThoughtboxOAuthProvider({
    clientsStore: oauthClientStorage,
    tokenStorage: oauthTokenStorage,
    scopesSupported,
    ...(hasSupabase ? {} : { defaultWorkspaceId: await ensureStaticWorkspace('local-dev') }),
  });

  const authRouter = mcpAuthRouter({
    provider: oauthProvider,
    issuerUrl,
    baseUrl: issuerUrl,
    resourceServerUrl,
    scopesSupported,
    resourceName: 'Thoughtbox MCP Server',
  });

  app.use(authRouter);

  app.all("/mcp", async (req: Request, res: Response) => {
    const mcpSessionId = req.headers["mcp-session-id"] as string | undefined;

    console.error(`[MCP] ${req.method} request, session: ${mcpSessionId || 'new'}`);

    // Dual auth: OAuth JWT or API key (tbx_*)
    let workspaceId: string | undefined = undefined;
    const authHeader = req.headers.authorization as string | undefined;
    const queryKey = req.query.key as string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      if (token.startsWith('tbx_')) {
        // API key via Bearer header
        try {
          workspaceId = await resolveRequestAuth(req, {
            staticKey: process.env.THOUGHTBOX_API_KEY,
            localDevKey: process.env.THOUGHTBOX_API_KEY_LOCAL,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Authentication failed';
          res.status(401).json({
            jsonrpc: "2.0",
            error: { code: -32001, message },
            id: null,
          });
          return;
        }
      } else {
        // OAuth JWT
        try {
          const claims = await verifyOAuthToken(token);
          workspaceId = claims.workspace_id;
        } catch {
          res.status(401).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Invalid or expired OAuth token" },
            id: null,
          });
          return;
        }
      }
    } else if (queryKey) {
      // API key via query param
      try {
        workspaceId = await resolveRequestAuth(req, {
          staticKey: process.env.THOUGHTBOX_API_KEY,
          localDevKey: process.env.THOUGHTBOX_API_KEY_LOCAL,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        res.status(401).json({
          jsonrpc: "2.0",
          error: { code: -32001, message },
          id: null,
        });
        return;
      }
    } else if (isMultiTenant) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Missing API key or OAuth token" },
        id: null,
      });
      return;
    } else if (!workspaceId) {
      console.error('[MCP] Unauthenticated request in local mode');
    }

    try {
      // --- Multi-tenant (Supabase) mode: per-session servers ---
      if (isMultiTenant) {
        if (mcpSessionId && sessions.has(mcpSessionId)) {
          const entry = sessions.get(mcpSessionId)!;

          if (entry.workspaceId !== workspaceId) {
            res.status(403).json({
              jsonrpc: "2.0",
              error: { code: -32001, message: "Session belongs to a different workspace" },
              id: null,
            });
            return;
          }

          await entry.transport.handleRequest(req, res, req.body);

          if (req.method === "DELETE") {
            sessions.delete(mcpSessionId);
            entry.transport.close();
          }
          return;
        }

        const sessionId = mcpSessionId || crypto.randomUUID();
        const storage = factory.getStorage(workspaceId);
        const knowledgeStorage = factory.getKnowledgeStorage(workspaceId);

        const server = await createMcpServer({
          sessionId,
          storage,
          hubStorage,
          dataDir,
          knowledgeStorage,
          workspaceId,
          config: {
            disableThoughtLogging:
              (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true",
          },
        });

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
          enableJsonResponse: true,
        });

        sessions.set(sessionId, {
          transport,
          server,
          workspaceId: workspaceId!,
          protocolHandler: null,
        });
        transport.onclose = () => {
          sessions.delete(transport.sessionId || sessionId);
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);

        if (req.method === "DELETE") {
          sessions.delete(sessionId);
          transport.close();
        }
        return;
      }

      // --- Local mode: per-session servers, same pattern as multi-tenant ---
      if (mcpSessionId && sessions.has(mcpSessionId)) {
        const entry = sessions.get(mcpSessionId)!;
        await entry.transport.handleRequest(req, res, req.body);
        if (req.method === "DELETE") {
          sessions.delete(mcpSessionId);
          entry.transport.close();
        }
        return;
      }

      const sessionId = mcpSessionId || crypto.randomUUID();
      const localWorkspaceId = await ensureStaticWorkspace('local-dev');
      const storage = factory.getStorage();
      const knowledgeStorage = factory.getKnowledgeStorage();

      const localEntry: SessionEntry = {
        transport: null!,
        server: null!,
        workspaceId: localWorkspaceId,
        protocolHandler: null,
      };
      sessions.set(sessionId, localEntry);

      const server = await createMcpServer({
        sessionId,
        storage,
        hubStorage,
        dataDir,
        knowledgeStorage,
        workspaceId: localWorkspaceId,
        onProtocolHandlerReady: (handler) => {
          localEntry.protocolHandler = handler;
        },
        config: {
          disableThoughtLogging:
            (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true",
        },
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        enableJsonResponse: true,
      });

      localEntry.transport = transport;
      localEntry.server = server;
      transport.onclose = () => sessions.delete(transport.sessionId || sessionId);

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      if (req.method === "DELETE") {
        sessions.delete(sessionId);
        transport.close();
      }
    } catch (error) {
      console.error("MCP ERROR:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/health", (_: Request, res: Response) =>
    res.json({
      status: "ok",
      transport: "streamable-http",
      server: "thoughtbox",
      version: "1.2.2",
    })
  );

  app.get("/info", (_: Request, res: Response) =>
    res.json({
      status: "ok",
      server: { name: "thoughtbox-server", version: "1.2.2" },
    })
  );

  // ---------------------------------------------------------------------------
  // Hub Event SSE Endpoint — pushes HubEvents to Channel subscribers
  // ---------------------------------------------------------------------------

  // Minimal thought store for the shared hub-handler (hub operations that
  // create sessions/thoughts use this; most Channel operations don't need it)
  const sharedThoughtStore = {
    sessions: new Map<string, Map<number, unknown>>(),
    async createSession(sessionId: string) {
      this.sessions.set(sessionId, new Map());
    },
    async saveThought(sessionId: string, thought: any) {
      if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, new Map());
      this.sessions.get(sessionId)!.set(thought.thoughtNumber, thought);
    },
    async getThought(sessionId: string, thoughtNumber: number) {
      return this.sessions.get(sessionId)?.get(thoughtNumber) ?? null;
    },
    async getThoughts(sessionId: string) {
      const session = this.sessions.get(sessionId);
      if (!session) return [];
      return [...session.values()];
    },
    async getThoughtCount(sessionId: string) {
      return this.sessions.get(sessionId)?.size ?? 0;
    },
    async saveBranchThought(_sessionId: string, _branchId: string, _thought: any) {},
    async getBranch(_sessionId: string, _branchId: string) { return []; },
  };

  const hubHttpSurface = createHubHttpSurface(
    createHubHandler(
      hubStorage,
      sharedThoughtStore,
      (event: HubEvent) => hubHttpSurface.broadcastHubEvent(event),
    ),
  );

  if (!isMultiTenant) {
    hubHttpSurface.mount(app);
  }

  const protocolHttpSurface = createProtocolHttpSurface(() => {
    for (const entry of sessions.values()) {
      if (entry.protocolHandler) return entry.protocolHandler;
    }
    return null;
  });

  if (!isMultiTenant) {
    protocolHttpSurface.mount(app);
  }

  // ---------------------------------------------------------------------------
  // OTLP Ingestion Routes (multi-tenant / deployed mode only)
  // ---------------------------------------------------------------------------

  if (isMultiTenant) {
    mountOtlpRoutes(app, {
      supabaseUrl: process.env.SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      staticApiKey: process.env.THOUGHTBOX_API_KEY,
      localDevApiKey: process.env.THOUGHTBOX_API_KEY_LOCAL,
    });
  }

  const httpServer = app.listen(port, () => {
    console.log(`Thoughtbox MCP Server listening on port ${port}`);
  });

  const shutdown = async () => {
    for (const entry of sessions.values()) {
      try {
        entry.transport.close();
      } catch {
        // ignore
      }
    }
    if (observatoryServer?.isRunning()) {
      try {
        await observatoryServer.stop();
      } catch {
        // ignore
      }
    }
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

startHttpServer().catch((error) => {
  console.error("Fatal error starting HTTP server:", error);
  process.exit(1);
});
