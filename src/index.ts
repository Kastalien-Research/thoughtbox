#!/usr/bin/env node

/**
 * Thoughtbox MCP Server - Entry Point
 *
 * Defaults to Streamable HTTP. Set THOUGHTBOX_TRANSPORT=stdio for stdio mode.
 */

import crypto from "node:crypto";
import * as path from "node:path";
import * as os from "node:os";

// Global Kill Switch for GCP Stabilization
if (process.env.AGENTS_DISABLED === 'true') {
  console.log('AGENTS_DISABLED is true. Exiting instantly with 0 side effects.');
  process.exit(0);
}
import type { Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
import { resolveApiKeyToWorkspace } from "./auth/api-key.js";

/**
 * Get the storage backend based on environment configuration.
 *
 * THOUGHTBOX_STORAGE=memory  -> InMemoryStorage (volatile, for testing)
 * THOUGHTBOX_STORAGE=fs      -> FileSystemStorage (persistent, default)
 *
 * THOUGHTBOX_DATA_DIR -> Custom data directory (default: ~/.thoughtbox)
 *
 * Project scope is set at runtime by the progressive disclosure flow
 * (bind_root / start_new), not at startup.
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
  const storageType = process.env.THOUGHTBOX_STORAGE?.toLowerCase();
  
  if (!storageType) {
    console.error('ERROR: THOUGHTBOX_STORAGE environment variable is explicitly required.');
    console.error('No silent fallback permitted to local disk or memory. Exiting.');
    process.exit(1);
  }

  // Determine base directory (used for both main and hub storage)
  const baseDir =
    process.env.THOUGHTBOX_DATA_DIR ||
    path.join(os.homedir(), ".thoughtbox");

  if (storageType === "supabase") {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!supabaseUrl || !supabaseKey || !jwtSecret) {
      throw new Error(
        "THOUGHTBOX_STORAGE=supabase requires SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_JWT_SECRET"
      );
    }

    console.error("[Storage] Using Supabase per-session storage factory");

    // For Supabase, we return a factory that spins up scoped instances synchronously
    const factory: StorageFactory = {
      getStorage: (workspaceId?: string) => {
        if (!workspaceId) throw new Error('workspaceId is required for Supabase storage');
        return new SupabaseStorage({ supabaseUrl, supabaseKey, jwtSecret, workspaceId });
      },
      getKnowledgeStorage: (workspaceId?: string) => {
        if (!workspaceId) throw new Error('workspaceId is required for Supabase knowledge storage');
        return new SupabaseKnowledgeStorage({ supabaseUrl, supabaseKey, jwtSecret, workspaceId });
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
    const memoryStorage = new InMemoryStorage();
    const factory: StorageFactory = {
      getStorage: () => memoryStorage,
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
    getStorage: () => fsStorage,
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

  const sessions = new Map<string, SessionEntry>();

  app.all("/mcp", async (req: Request, res: Response) => {
    const mcpSessionId = req.headers["mcp-session-id"] as string | undefined;

    console.error(`[MCP] ${req.method} request, session: ${mcpSessionId || 'new'}`);

    // Dynamic API Key / Workspace resolution
    let workspaceId: string | undefined = undefined;
    const authHeader = req.headers.authorization as string | undefined;
    const headerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const queryKey = req.query.key as string | undefined;
    const providedKey = headerKey || queryKey;

    if (providedKey) {
      if (providedKey === process.env.THOUGHTBOX_API_KEY_LOCAL) {
        // Bypass for local development if the master key is used
        workspaceId = 'local-dev-workspace';
      } else {
        try {
          workspaceId = await resolveApiKeyToWorkspace(providedKey);
        } catch (err) {
          res.status(401).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Invalid or inactive API key" },
            id: null,
          });
          return;
        }
      }
    } else if (process.env.THOUGHTBOX_STORAGE === 'supabase') {
       // Require key for hosted environment
       res.status(401).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Missing API key" },
        id: null,
      });
      return;
    }

    try {
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

      // Instantiate strictly-scoped storage using the resolved workspaceId
      const storage = factory.getStorage(workspaceId);
      const knowledgeStorage = factory.getKnowledgeStorage(workspaceId);

      const server = await createMcpServer({
        sessionId,
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
        sessionIdGenerator: () => sessionId,
        enableJsonResponse: true,
      });

      sessions.set(sessionId, {
        transport,
        server,
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

async function runStdioServer() {
  // Initialize storage for stdio mode
  const { factory, hubStorage, dataDir } = await createStorage();
  
  // For stdio mode with Supabase, a workspace ID must be provided via the environment
  const workspaceId = process.env.THOUGHTBOX_WORKSPACE_ID;
  const storage = factory.getStorage(workspaceId);
  const knowledgeStorage = factory.getKnowledgeStorage(workspaceId);

  const disableThoughtLogging =
    (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";

  const server = await createMcpServer({
    storage,
    hubStorage,
    dataDir,
    knowledgeStorage,
    config: {
      disableThoughtLogging,
    },
  });

  const observatoryServer = await maybeStartObservatory(hubStorage, storage);

  // Initialize LangSmith evaluation tracing (no-op if LANGSMITH_API_KEY not set)
  const traceListener = initEvaluation();
  initMonitoring(traceListener ?? undefined);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Thoughtbox MCP Server running on stdio");

  const shutdown = async () => {
    if (observatoryServer?.isRunning()) {
      await observatoryServer.stop();
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    shutdown().catch(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    shutdown().catch(() => process.exit(0));
  });
}

const transportMode = (process.env.THOUGHTBOX_TRANSPORT || "").toLowerCase();
if (transportMode === "stdio") {
  runStdioServer().catch((error) => {
    console.error("Fatal error starting stdio server:", error);
    process.exit(1);
  });
} else {
  startHttpServer().catch((error) => {
    console.error("Fatal error starting HTTP server:", error);
    process.exit(1);
  });
}
