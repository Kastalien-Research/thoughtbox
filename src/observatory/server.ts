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
 */
export function createObservatoryServer(
  config: ObservatoryConfig
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

    // Sessions list endpoint
    if (url.pathname === "/api/sessions" && req.method === "GET") {
      const status = url.searchParams.get("status");
      let sessions = sessionStore.getAllSessions();

      if (status && status !== "all") {
        sessions = sessions.filter((s) => s.status === status);
      }

      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);
      sessions = sessions.slice(offset, offset + limit);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ sessions }));
      return;
    }

    // Session detail endpoint
    const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
    if (sessionMatch && req.method === "GET") {
      const sessionId = sessionMatch[1];

      (async () => {
        const session = await sessionStore.getSession(sessionId);
        if (!session) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Session not found" }));
          return;
        }

        const thoughts = await sessionStore.getThoughts(sessionId);
        const branches = await sessionStore.getBranches(sessionId);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ session, thoughts, branches }));
      })().catch((err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
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
