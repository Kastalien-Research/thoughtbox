#!/usr/bin/env node

/**
 * Thoughtbox MCP Server - Entry Point
 *
 *
 * Mode selection:
 * - `THOUGHTBOX_TRANSPORT=http`  -> Streamable HTTP server (default)
 * - `THOUGHTBOX_TRANSPORT=stdio` -> MCP over stdio
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
  migrateExports,
  type ThoughtboxStorage,
} from "./persistence/index.js";
import {
  createObservatoryServer,
  loadObservatoryConfig,
  type ObservatoryServer,
} from "./observatory/index.js";

/**
 * Get the storage backend based on environment configuration.
 *
 * THOUGHTBOX_STORAGE=memory  -> InMemoryStorage (volatile, for testing)
 * THOUGHTBOX_STORAGE=fs      -> FileSystemStorage (persistent, default)
 *
 * THOUGHTBOX_DATA_DIR -> Custom data directory (default: ~/.thoughtbox)
 * THOUGHTBOX_PROJECT  -> Project scope for isolation (default: _default)
 */
async function createStorage(): Promise<ThoughtboxStorage> {
  const storageType = (process.env.THOUGHTBOX_STORAGE || "fs").toLowerCase();

  if (storageType === "memory") {
    console.error("[Storage] Using in-memory storage (volatile)");
    return new InMemoryStorage();
  }

  // FileSystemStorage is the default for local-first
  const baseDir =
    process.env.THOUGHTBOX_DATA_DIR ||
    path.join(os.homedir(), ".thoughtbox");
  const project = process.env.THOUGHTBOX_PROJECT || "_default";

  console.error(`[Storage] Using filesystem storage at ${baseDir}/projects/${project}/`);

  const storage = new FileSystemStorage({
    basePath: baseDir,
    partitionGranularity: "monthly",
    project,
  });

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

  return storage;
}

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: ReturnType<typeof createMcpServer>;
}

async function maybeStartObservatory(): Promise<ObservatoryServer | null> {
  const observatoryConfig = loadObservatoryConfig();
  if (!observatoryConfig.enabled) return null;

  const observatoryServer = createObservatoryServer(observatoryConfig);
  await observatoryServer.start();
  console.error(`[Observatory] Server started on port ${observatoryConfig.port}`);
  return observatoryServer;
}

async function startHttpServer() {
  // Initialize shared storage (all MCP sessions share the same persistence layer)
  const storage = await createStorage();

  const observatoryServer = await maybeStartObservatory();

  const app = createMcpExpressApp({
    host: process.env.HOST || "0.0.0.0",
  });

  const sessions = new Map<string, SessionEntry>();

  app.all("/mcp", async (req: Request, res: Response) => {
    const mcpSessionId = req.headers["mcp-session-id"] as string | undefined;

    // Debug: log all incoming requests
    console.error(`[MCP] ${req.method} request, session: ${mcpSessionId || 'new'}`);

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

      const server = createMcpServer({
        sessionId,
        storage, // Shared storage instance
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
  const storage = await createStorage();

  const disableThoughtLogging =
    (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";

  const server = createMcpServer({
    storage,
    config: {
      disableThoughtLogging,
    },
  });

  const observatoryServer = await maybeStartObservatory();

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
