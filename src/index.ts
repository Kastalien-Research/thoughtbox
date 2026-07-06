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
import { createFileSystemHubStorage } from "./hub/hub-storage-fs.js";
import { createSupabaseHubStorageProvider } from "./hub/supabase-hub-storage.js";
import type { HubStorage } from "./hub/hub-types.js";
import { InMemoryClaimStorage } from "./claims/in-memory-claim-storage.js";
import { createSupabaseClaimStorageProvider } from "./claims/supabase-claim-storage.js";
import { InMemoryRunbookStorage } from "./notebook/runbook/in-memory-runbook-storage.js";
import { createSupabaseRunbookStorageProvider } from "./notebook/runbook/supabase-runbook-storage.js";
import {
  createSupabaseProtocolEventStorageProvider,
  type ProtocolEventStorage,
} from "./protocol/protocol-event-storage.js";
import { initEvaluation, initMonitoring } from "./evaluation/index.js";
import { createHubHandler, type HubEvent } from "./hub/hub-handler.js";
import {
  createThoughtStoreAdapter,
  type ThoughtStoreAdapter,
} from "./hub/thought-store-adapter.js";
import { createHubApiSurface, shouldWarnOnExposedLocalMode } from "./http/hub-http.js";
import { createEventStreamSurface } from "./http/event-stream.js";
import type { ThoughtboxEvent } from "./events/types.js";
import {
  createProtocolHttpSurface,
  type ProtocolEnforcementHandler,
} from "./http/protocol-http.js";
import { createSupabaseProtocolHandler } from "./protocol/index.js";
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

async function startHttpServer() {
  const { factory, hubStorage, dataDir } = await createStorage();
  const isMultiTenant = process.env.THOUGHTBOX_STORAGE === "supabase";

  // Multi-tenant hub isolation (Phase 4.3): each tenant workspace gets a
  // SupabaseHubStorage scoped by tenant_workspace_id, so tb.hub can never
  // enumerate or read another tenant's workspaces/channels and hub state
  // survives Cloud Run container restarts. The shared `hubStorage` is
  // local-mode only.
  const tenantHubStorage = isMultiTenant
    ? createSupabaseHubStorageProvider({
        supabaseUrl: process.env.SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      })
    : null;

  // Claim graph storage (SPEC-AGX-SUBSTRATE B1/B2): tenant-scoped
  // SupabaseClaimStorage when hosted; a single process-shared
  // InMemoryClaimStorage locally (volatile — the FileSystem backend is
  // deferred per spec §11.5 until the H1/H2 experiments pass).
  const tenantClaimStorage = isMultiTenant
    ? createSupabaseClaimStorageProvider({
        supabaseUrl: process.env.SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      })
    : null;
  const localClaimStorage = isMultiTenant ? null : new InMemoryClaimStorage();

  // Durable runbook storage (SPEC-AGX-SUBSTRATE B4b): tenant-scoped
  // SupabaseRunbookStorage when hosted; a single process-shared
  // InMemoryRunbookStorage locally. Without it the notebook engine falls
  // back to a per-handler InMemoryRunbookStorage and runbook
  // templates/instances/executions/ledger rows are lost with the process.
  const tenantRunbookStorage = isMultiTenant
    ? createSupabaseRunbookStorageProvider({
        supabaseUrl: process.env.SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      })
    : null;
  const localRunbookStorage = isMultiTenant ? null : new InMemoryRunbookStorage();

  // Hosted protocol-event log (SPEC-REASONING-CHANNEL-HOSTED c2): in
  // multi-tenant mode the protocol lifecycle stream is appended to a
  // tenant-scoped Supabase table so the reasoning channel can pull it
  // (changed_since) across Cloud Run replicas. Local mode keeps the
  // in-process /events SSE broadcast and needs no durable log.
  const tenantProtocolEventStorage = isMultiTenant
    ? createSupabaseProtocolEventStorageProvider({
        supabaseUrl: process.env.SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      })
    : null;

  // Local-mode hub thought store: ONE storage instance shared by /hub/api
  // and every local MCP session's tb.hub dispatcher. Per-session
  // FileSystemStorage instances each hold an in-memory session index, so a
  // hub main-session created through one instance is invisible to the
  // others — merge_proposal from a second MCP session would fail with
  // "Session not found". Multi-tenant mode needs no shared instance:
  // Supabase storage resolves sessions from the database on every call.
  let localHubThoughtStore: ThoughtStoreAdapter | undefined;
  if (!isMultiTenant) {
    const hubSessionStorage = factory.getStorage();
    await hubSessionStorage.initialize();
    await hubSessionStorage.setProject(await ensureStaticWorkspace("local-dev"));
    localHubThoughtStore = createThoughtStoreAdapter(hubSessionStorage);
  }

  // Initialize LangSmith evaluation tracing (no-op if LANGSMITH_API_KEY not set)
  const traceListener = initEvaluation();
  initMonitoring(traceListener ?? undefined);

  const host = process.env.HOST || "0.0.0.0";
  const app = createMcpExpressApp({
    host,
  });

  const port = parseInt(process.env.PORT || "1731", 10);
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

  // Unified event stream — carries both Hub and Protocol events via SSE
  // (mounted in local mode only, below)
  const eventStream = createEventStreamSurface();
  const broadcastHubEvent = (event: HubEvent) => {
    eventStream.broadcast({
      source: 'hub',
      type: event.type,
      workspaceId: event.workspaceId,
      timestamp: new Date().toISOString(),
      data: event.data,
    });
  };

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
          workspaceId = await resolveRequestAuth(req);
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
        workspaceId = await resolveRequestAuth(req);
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
        if (!workspaceId) {
          // Auth above guarantees a workspaceId in multi-tenant mode; this
          // guard keeps that invariant explicit and fails fast if it breaks.
          res.status(401).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Authenticated request resolved no workspace" },
            id: null,
          });
          return;
        }
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

        const protocolEventStorage = tenantProtocolEventStorage!(workspaceId);
        const server = await createMcpServer({
          sessionId,
          storage,
          // Tenant-scoped: never the process-shared local hub storage.
          hubStorage: tenantHubStorage!(workspaceId),
          claimStorage: tenantClaimStorage!(workspaceId),
          runbookStorage: tenantRunbookStorage!(workspaceId),
          dataDir,
          knowledgeStorage,
          workspaceId,
          // Persist protocol lifecycle events to the tenant-scoped log so the
          // reasoning channel can pull them across replicas (c2). Fire-and-
          // forget: a log write must never block a protocol transition.
          onProtocolEvent: (event) => {
            void protocolEventStorage.append(event).catch((err: unknown) => {
              const message = err instanceof Error ? err.message : String(err);
              console.error(`[ProtocolEvents] append failed: ${message}`);
            });
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

        sessions.set(sessionId, {
          transport,
          server,
          workspaceId: workspaceId!,
          // Hosted enforcement never consults live session handlers: the
          // /protocol/enforcement route below resolves protocol state
          // per-workspace straight from Supabase, so it works even when no
          // MCP session for that workspace is alive in this container.
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

      let localProtocolHandler: SessionEntry['protocolHandler'] = null;

      const server = await createMcpServer({
        sessionId,
        storage,
        hubStorage,
        claimStorage: localClaimStorage!,
        runbookStorage: localRunbookStorage!,
        hubThoughtStore: localHubThoughtStore,
        dataDir,
        knowledgeStorage,
        workspaceId: localWorkspaceId,
        onProtocolHandlerReady: (handler) => { localProtocolHandler = handler; },
        onProtocolEvent: (event) => eventStream.broadcast(event),
        onHubEvent: broadcastHubEvent,
        config: {
          disableThoughtLogging:
            (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true",
        },
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        enableJsonResponse: true,
      });

      const localEntry: SessionEntry = {
        transport,
        server,
        workspaceId: localWorkspaceId,
        protocolHandler: localProtocolHandler,
      };
      sessions.set(sessionId, localEntry);
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
  // Protocol enforcement surface (`POST /protocol/enforcement`) — mounted in
  // BOTH modes. This is the hook-facing gate behind protocol_gate.sh.
  //
  // Hosted (multi-tenant): a single storage-backed ProtocolHandler resolves
  // protocol_sessions/protocol_scope from Supabase per authenticated
  // workspace. No live in-process session handler is required, so the gate
  // holds across container restarts and for sessions served by other
  // instances. Requests must carry a tbx_* API key or OAuth JWT; the
  // resolved workspace — never the request body — decides the scope.
  //
  // Local: every live MCP session's protocol handler is consulted and a
  // block from any of them wins (per-session in-memory protocol state means
  // no single handler sees all active protocol sessions).
  // ---------------------------------------------------------------------------

  const hostedEnforcementHandler: ProtocolEnforcementHandler | null =
    isMultiTenant
      ? createSupabaseProtocolHandler({
          supabaseUrl: process.env.SUPABASE_URL!,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        })
      : null;

  const resolveEnforcementWorkspace = async (req: Request): Promise<string> => {
    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;
    if (token && !token.startsWith("tbx_")) {
      const claims = await verifyOAuthToken(token);
      return claims.workspace_id;
    }
    // tbx_* Bearer key or ?key= query param.
    return resolveRequestAuth(req);
  };

  const protocolHttpSurface = createProtocolHttpSurface(
    isMultiTenant
      ? {
          getHandlers: () =>
            hostedEnforcementHandler ? [hostedEnforcementHandler] : [],
          resolveWorkspaceId: resolveEnforcementWorkspace,
        }
      : {
          getHandlers: () =>
            [...sessions.values()]
              .map((entry) => entry.protocolHandler)
              .filter(
                (handler): handler is ProtocolEnforcementHandler =>
                  handler !== null,
              ),
        },
  );
  protocolHttpSurface.mount(app);

  // ---------------------------------------------------------------------------
  // Hub Event SSE Endpoint — pushes HubEvents to Channel subscribers
  // ---------------------------------------------------------------------------

  // Local-mode hub HTTP surface (`POST /hub/api`). Its thought store
  // delegates to real filesystem session storage scoped to the local
  // workspace — the same project MCP sessions write to — so hub-created
  // sessions and merge_proposal synthesis thoughts genuinely persist.
  if (!isMultiTenant && localHubThoughtStore) {
    const hubHandler = createHubHandler(
      hubStorage,
      localHubThoughtStore,
      broadcastHubEvent,
    );
    const hubApiSurface = createHubApiSurface(hubHandler);

    eventStream.mount(app);
    hubApiSurface.mount(app);
  }

  // ---------------------------------------------------------------------------
  // OTLP Ingestion Routes (multi-tenant / deployed mode only)
  // ---------------------------------------------------------------------------

  if (isMultiTenant) {
    mountOtlpRoutes(app, {
      supabaseUrl: process.env.SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    // Reasoning-channel pull endpoint (SPEC-REASONING-CHANNEL-HOSTED c3):
    // returns protocol events with id > changed_since for the caller's
    // workspace, oldest first. The API key resolves the workspace, so a key
    // can never read another tenant's events. Hosted only — local mode uses
    // the in-process /events SSE stream.
    app.get("/protocol/events", async (req: Request, res: Response) => {
      let workspaceId: string;
      try {
        workspaceId = await resolveRequestAuth(req);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        res.status(401).json({ error: message });
        return;
      }

      const parsePositiveInt = (value: unknown): number | undefined => {
        if (typeof value !== "string") return undefined;
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
      };

      const cursor = parsePositiveInt(req.query.changed_since) ?? 0;
      const limit = parsePositiveInt(req.query.limit);

      try {
        const events = await tenantProtocolEventStorage!(workspaceId).changedSince(
          cursor,
          limit,
        );
        const nextCursor =
          events.length > 0 ? events[events.length - 1]!.cursor : cursor;
        res.json({ events, cursor: nextCursor });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
      }
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
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

startHttpServer().catch((error) => {
  console.error("Fatal error starting HTTP server:", error);
  process.exit(1);
});
