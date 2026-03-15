#!/usr/bin/env node

/**
 * Thoughtbox MCP Server - Entry Point
 *
 * Defaults to Streamable HTTP. Set THOUGHTBOX_TRANSPORT=stdio for stdio mode.
 */

import crypto from "node:crypto";
import * as path from "node:path";
import * as os from "node:os";
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
import {
  createJwks,
  validateToken,
  extractBearerToken,
  type AuthContext,
} from "./middleware/auth.js";

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
interface StorageBundle {
  storage: ThoughtboxStorage;
  hubStorage: HubStorage;
  dataDir: string;
  knowledgeStorage?: KnowledgeStorage;
}

async function createStorage(): Promise<StorageBundle> {
  const storageType = (process.env.THOUGHTBOX_STORAGE || "fs").toLowerCase();

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

    console.error("[Storage] Using Supabase storage");

    const storage = new SupabaseStorage({ supabaseUrl, supabaseKey, jwtSecret });
    await storage.initialize();

    const knowledgeStorage = new SupabaseKnowledgeStorage({
      supabaseUrl,
      supabaseKey,
      jwtSecret,
    });
    await knowledgeStorage.initialize();

    return {
      storage,
      hubStorage: createFileSystemHubStorage(baseDir),
      dataDir: baseDir,
      knowledgeStorage,
    };
  }

  if (storageType === "memory") {
    console.error("[Storage] Using in-memory storage (volatile)");
    return {
      storage: new InMemoryStorage(),
      hubStorage: createFileSystemHubStorage(baseDir),
      dataDir: baseDir,
    };
  }

  console.error(`[Storage] Using filesystem storage at ${baseDir}`);

  const storage = new FileSystemStorage({
    basePath: baseDir,
    partitionGranularity: "monthly",
  });

  // Base init: config, legacy migration. Project scoping happens later via setProject().
  await storage.initialize();

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

  return {
    storage,
    hubStorage: createFileSystemHubStorage(baseDir),
    dataDir: baseDir,
  };
}

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: Awaited<ReturnType<typeof createMcpServer>>;
  storage?: ThoughtboxStorage;
  knowledgeStorage?: KnowledgeStorage;
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
  // Initialize shared storage (all MCP sessions share the same persistence layer)
  const { storage, hubStorage, dataDir, knowledgeStorage } = await createStorage();

  const observatoryServer = await maybeStartObservatory(hubStorage, storage);

  // Initialize LangSmith evaluation tracing (no-op if LANGSMITH_API_KEY not set)
  const traceListener = initEvaluation();
  initMonitoring(traceListener ?? undefined);

  const app = createMcpExpressApp({
    host: process.env.HOST || "0.0.0.0",
  });

  const sessions = new Map<string, SessionEntry>();

  // Auth middleware: validate Bearer token in Supabase mode
  const storageType = (process.env.THOUGHTBOX_STORAGE || "fs").toLowerCase();
  const requireAuth = storageType === "supabase";
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const jwks = requireAuth && supabaseUrl ? createJwks(supabaseUrl) : null;

  app.all("/mcp", async (req: Request, res: Response) => {
    const mcpSessionId = req.headers["mcp-session-id"] as string | undefined;

    // Debug: log all incoming requests
    console.error(`[MCP] ${req.method} request, session: ${mcpSessionId || 'new'}`);

    // Conditional auth: enforce in Supabase mode, skip in FS mode
    // Token sources: Authorization header (preferred) or ?token= query param (workaround for
    // MCP clients that don't forward custom headers — Claude Code issues #14976, #28293, #29562)
    let authContext: AuthContext | null = null;
    let rawToken: string | null = null;
    if (requireAuth && jwks && supabaseUrl) {
      rawToken = extractBearerToken(
        req.headers.authorization as string | undefined,
      ) || (req.query.token as string | undefined) || null;
      if (!rawToken) {
        res.status(401).json({
          jsonrpc: "2.0",
          error: { code: -32001, message: "Missing Authorization header or ?token= query param" },
          id: null,
        });
        return;
      }
      try {
        authContext = await validateToken(rawToken, jwks, supabaseUrl);
      } catch (err) {
        console.error("[Auth] Token validation failed:", err);
        res.status(401).json({
          jsonrpc: "2.0",
          error: { code: -32001, message: "Invalid or expired token" },
          id: null,
        });
        return;
      }
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

      // In Supabase mode, each session gets its own storage instances
      // bound to the user's token for RLS isolation. In FS/memory mode,
      // shared storage is fine (no multi-tenancy).
      let sessionStorage: ThoughtboxStorage = storage;
      let sessionKnowledgeStorage: KnowledgeStorage | undefined = knowledgeStorage;
      if (requireAuth && rawToken && supabaseUrl && supabaseKey && jwtSecret) {
        const perSessionStorage = new SupabaseStorage({
          supabaseUrl,
          supabaseKey,
          jwtSecret,
          userToken: rawToken,
        });
        const perSessionKnowledge = new SupabaseKnowledgeStorage({
          supabaseUrl,
          supabaseKey,
          jwtSecret,
          userToken: rawToken,
        });
        sessionStorage = perSessionStorage;
        sessionKnowledgeStorage = perSessionKnowledge;
      }

      const server = await createMcpServer({
        sessionId,
        storage: sessionStorage,
        hubStorage,
        dataDir,
        knowledgeStorage: sessionKnowledgeStorage,
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
        storage: requireAuth ? sessionStorage : undefined,
        knowledgeStorage: requireAuth ? sessionKnowledgeStorage : undefined,
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
  const { storage, hubStorage, dataDir, knowledgeStorage } = await createStorage();

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
