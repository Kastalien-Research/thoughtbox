/**
 * Observatory Server Factory
 *
 * Creates and configures the complete Observatory server including:
 * - HTTP server for health/REST endpoints
 * - WebSocket server for real-time communication
 * - Channel registration and wiring
 *
 * Usage:
 * ```ts
 * import { createObservatoryServer } from './observatory';
 *
 * const config = loadObservatoryConfig();
 * if (config.enabled) {
 *   const observatory = createObservatoryServer(config);
 *   await observatory.start();
 * }
 * ```
 */

import { createServer, type Server as HttpServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { WebSocketServer } from "./ws-server.js";
import { createReasoningChannel, sessionStore } from "./channels/reasoning.js";
import { createObservatoryChannel } from "./channels/observatory.js";
import type { ObservatoryConfig } from "./config.js";
import { OBSERVATORY_HTML } from "./ui/index.js";
import { ImprovementEventStore } from "./improvement-store.js";
import { ScorecardAggregator } from "./scorecard-aggregator.js";
import type { ThoughtboxStorage } from "../persistence/types.js";
import {
  toObservatorySession,
  toObservatoryThought,
  toObservatoryBranches,
} from "./storage-adapter.js";

/**
 * Observatory server instance
 */
export interface ObservatoryServer {
  /** Start the server */
  start(): Promise<void>;
  /** Stop the server gracefully */
  stop(): Promise<void>;
  /** Get the WebSocket server instance */
  getWss(): WebSocketServer;
  /** Get the HTTP server instance */
  getHttpServer(): HttpServer;
  /** Check if server is running */
  isRunning(): boolean;
}

/**
 * Create an Observatory server with the given configuration
 *
 * @param config - Observatory configuration
 * @param storage - Optional persistent storage for historical session access
 */
export function createObservatoryServer(
  config: ObservatoryConfig,
  storage?: ThoughtboxStorage
): ObservatoryServer {
  let httpServer: HttpServer | null = null;
  let wss: WebSocketServer | null = null;
  let running = false;

  /**
   * Handle HTTP requests (REST API endpoints)
   */
  function handleHttpRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    // CORS headers
    const origin = req.headers.origin || "*";
    const allowedOrigin = config.cors?.includes("*")
      ? "*"
      : config.cors?.includes(origin)
      ? origin
      : config.cors?.[0] || "*";

    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // Serve Observatory UI at root and /observatory
    if (
      (url.pathname === "/" || url.pathname === "/observatory") &&
      req.method === "GET"
    ) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(OBSERVATORY_HTML);
      return;
    }

    // Health endpoint
    if (url.pathname === "/api/health" && req.method === "GET") {
      const activeSessions = sessionStore.getActiveSessions();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          connections: wss?.getConnectionCount() || 0,
          activeSessions: activeSessions.length,
        })
      );
      return;
    }

    // Test endpoint: Trigger mock collaborative session
    if (url.pathname === "/api/test/mock-collab-session" && req.method === "POST") {
      (async () => {
        try {
          const { emitMockCollabSession } = await import("./test-collab-events.js");
          emitMockCollabSession();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok", message: "Mock session events emitted" }));
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: error instanceof Error ? error.message : "Unknown error" }));
        }
      })();
      return;
    }

    // Sessions list endpoint
    if (url.pathname === "/api/sessions" && req.method === "GET") {
      const source = url.searchParams.get("source") || "all";

      (async () => {
        // Collect active sessions from in-memory store
        const activeIds = new Set<string>();
        let activeSessions = sessionStore.getAllSessions();
        activeSessions.forEach((s) => activeIds.add(s.id));

        let mergedSessions = [...activeSessions];

        // Merge historical sessions from persistent storage (if available)
        if (storage && source !== "active") {
          try {
            const historicalRaw = await storage.listSessions({
              limit: 50,
              sortBy: "updatedAt",
              sortOrder: "desc",
            });

            for (const ps of historicalRaw) {
              // Active sessions take precedence — skip duplicates
              if (!activeIds.has(ps.id)) {
                mergedSessions.push(toObservatorySession(ps));
              }
            }
          } catch (err) {
            console.error("[Observatory] Failed to load historical sessions:", err);
          }
        }

        // Filter by source if requested
        if (source === "active") {
          mergedSessions = mergedSessions.filter((s) => activeIds.has(s.id));
        } else if (source === "historical") {
          mergedSessions = mergedSessions.filter((s) => !activeIds.has(s.id));
        }

        // Apply status filter
        const status = url.searchParams.get("status");
        if (status && status !== "all") {
          mergedSessions = mergedSessions.filter((s) => s.status === status);
        }

        const limit = parseInt(url.searchParams.get("limit") || "50", 10);
        const offset = parseInt(url.searchParams.get("offset") || "0", 10);
        mergedSessions = mergedSessions.slice(offset, offset + limit);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ sessions: mergedSessions }));
      })().catch((err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (err as Error).message }));
      });
      return;
    }

    // Session detail endpoint
    const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
    if (sessionMatch && req.method === "GET") {
      const sessionId = sessionMatch[1];

      (async () => {
        // First check in-memory store (active sessions)
        const session = await sessionStore.getSession(sessionId);
        if (session) {
          const thoughts = await sessionStore.getThoughts(sessionId);
          const branches = await sessionStore.getBranches(sessionId);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ session, thoughts, branches }));
          return;
        }

        // Fall back to persistent storage
        if (storage) {
          const persistedSession = await storage.getSession(sessionId);
          if (persistedSession) {
            const obsSession = toObservatorySession(persistedSession);
            const rawThoughts = await storage.getThoughts(sessionId);
            const obsThoughts = rawThoughts.map((td) =>
              toObservatoryThought(sessionId, td)
            );

            // Load branches
            const branchIds = await storage.getBranchIds(sessionId);
            const branchThoughtsMap = new Map<
              string,
              import("../persistence/types.js").ThoughtData[]
            >();
            for (const bid of branchIds) {
              branchThoughtsMap.set(bid, await storage.getBranch(sessionId, bid));
            }
            const obsBranches = toObservatoryBranches(
              sessionId,
              branchIds,
              branchThoughtsMap
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                session: obsSession,
                thoughts: obsThoughts,
                branches: obsBranches,
              })
            );
            return;
          }
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
      })().catch((err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (err as Error).message }));
      });
      return;
    }

    // Improvements list endpoint
    if (url.pathname === "/api/improvements" && req.method === "GET") {
      (async () => {
        try {
          const store = new ImprovementEventStore();
          await store.initialize();

          const type = url.searchParams.get("type") as any;
          const iteration = url.searchParams.get("iteration");
          const limit = parseInt(url.searchParams.get("limit") || "100", 10);
          const offset = parseInt(url.searchParams.get("offset") || "0", 10);

          const events = await store.listEvents({
            type: type || undefined,
            iteration: iteration ? parseInt(iteration, 10) : undefined,
            limit,
            offset,
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ events }));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      })();
      return;
    }

    // Scorecard endpoint
    if (url.pathname === "/api/scorecard" && req.method === "GET") {
      (async () => {
        try {
          const store = new ImprovementEventStore();
          await store.initialize();
          const aggregator = new ScorecardAggregator(store);

          const scorecard = await aggregator.computeScorecard({
            recentCount: 10,
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(scorecard));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      })();
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }

  return {
    async start(): Promise<void> {
      if (running) {
        throw new Error("Observatory server is already running");
      }

      // Create HTTP server
      httpServer = createServer(handleHttpRequest);

      // Create WebSocket server with max connections limit
      wss = new WebSocketServer(config.maxConnections);

      // Register channels
      const reasoningChannel = createReasoningChannel(wss);
      const observatoryChannel = createObservatoryChannel(wss);

      wss.registerChannel(reasoningChannel);
      wss.registerChannel(observatoryChannel);

      // Start WebSocket server attached to HTTP server
      wss.start(httpServer);

      // Start HTTP server
      await new Promise<void>((resolve, reject) => {
        httpServer!.listen(config.port, () => {
          console.log(
            `[Observatory] Server listening on port ${config.port}`
          );
          console.log(
            `[Observatory] UI: http://localhost:${config.port}/`
          );
          console.log(
            `[Observatory] WebSocket: ws://localhost:${config.port}${config.path}`
          );
          console.log(
            `[Observatory] REST API: http://localhost:${config.port}/api/`
          );
          running = true;
          resolve();
        });

        httpServer!.on("error", reject);
      });
    },

    async stop(): Promise<void> {
      if (!running) {
        return;
      }

      // Stop WebSocket server
      if (wss) {
        await wss.stop();
        wss = null;
      }

      // Stop HTTP server
      if (httpServer) {
        await new Promise<void>((resolve, reject) => {
          httpServer!.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        httpServer = null;
      }

      running = false;
      console.log("[Observatory] Server stopped");
    },

    getWss(): WebSocketServer {
      if (!wss) {
        throw new Error("Observatory server not started");
      }
      return wss;
    },

    getHttpServer(): HttpServer {
      if (!httpServer) {
        throw new Error("Observatory server not started");
      }
      return httpServer;
    },

    isRunning(): boolean {
      return running;
    },
  };
}
