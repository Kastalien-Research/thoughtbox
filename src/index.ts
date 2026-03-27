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
import { resolveRequestAuth } from "./auth/resolve-request-auth.js";
import { mountOtlpRoutes } from "./otel/index.js";

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

  const app = createMcpExpressApp({
    host: process.env.HOST || "0.0.0.0",
  });

  const isMultiTenant = process.env.THOUGHTBOX_STORAGE === 'supabase';
  const sessions = new Map<string, SessionEntry>();

  // Singleton server + transport for local (non-multi-tenant) mode.
  // Avoids per-request server creation when clients drop session headers
  // (e.g., Claude Code reconnection bug).
  let singletonEntry: SessionEntry | null = null;

  async function getOrCreateSingleton(): Promise<SessionEntry> {
    if (singletonEntry) return singletonEntry;

    const singletonId = crypto.randomUUID();
    const storage = factory.getStorage();
    const knowledgeStorage = factory.getKnowledgeStorage();

    const server = await createMcpServer({
      sessionId: singletonId,
      storage,
      hubStorage,
      dataDir,
      knowledgeStorage,
      config: {
        disableThoughtLogging:
          (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true",
      },
    });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    console.error(`[MCP] Singleton server created: ${singletonId}`);

    singletonEntry = { transport, server };
    sessions.set(singletonId, singletonEntry);
    return singletonEntry;
  }

  app.all("/mcp", async (req: Request, res: Response) => {
    const mcpSessionId = req.headers["mcp-session-id"] as string | undefined;

    console.error(`[MCP] ${req.method} request, session: ${mcpSessionId || 'new'}`);

    // API key auth (ADR-AUTH-02): resolve workspace from key
    let workspaceId: string | undefined = undefined;
    const hasKey = req.headers.authorization || req.query.key;

    if (hasKey) {
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
        error: { code: -32001, message: "Missing API key" },
        id: null,
      });
      return;
    }

    try {
      // --- Multi-tenant (Supabase) mode: per-session servers ---
      if (isMultiTenant) {
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

        sessions.set(sessionId, { transport, server });
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

      // --- Local (singleton) mode: one server, all requests share it ---
      const entry = await getOrCreateSingleton();
      await entry.transport.handleRequest(req, res, req.body);

      if (req.method === "DELETE") {
        singletonEntry = null;
        sessions.clear();
        entry.transport.close();
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

  interface SseClient {
    res: Response;
    workspaceId: string;
  }

  const sseClients = new Set<SseClient>();

  function broadcastHubEvent(event: HubEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      if (client.workspaceId === event.workspaceId || client.workspaceId === "*") {
        try {
          client.res.write(payload);
        } catch {
          sseClients.delete(client);
        }
      }
    }
  }

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

  const sharedHubHandler = createHubHandler(
    hubStorage,
    sharedThoughtStore,
    broadcastHubEvent,
  );

  app.get("/hub/events", (req: Request, res: Response) => {
    const workspaceId = (req.query.workspace_id as string) || "*";

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");

    const client: SseClient = { res, workspaceId };
    sseClients.add(client);

    req.on("close", () => {
      sseClients.delete(client);
    });
  });

  // ---------------------------------------------------------------------------
  // Hub API Endpoint — direct Hub operations for Channel reply tools
  // ---------------------------------------------------------------------------

  app.post("/hub/api", async (req: Request, res: Response) => {
    try {
      const { operation, agentId, ...args } = req.body as {
        operation: string;
        agentId?: string;
        [key: string]: unknown;
      };

      if (!operation) {
        res.status(400).json({ error: "operation is required" });
        return;
      }

      const result = await sharedHubHandler.handle(
        agentId ?? null,
        operation,
        args as Record<string, any>,
      );

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: message });
    }
  });

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

  const port = parseInt(process.env.PORT || "1731", 10);
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
