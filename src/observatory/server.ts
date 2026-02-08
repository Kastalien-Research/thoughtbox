/**
 * Observatory Server Factory
 *
 * Creates and configures the complete Observatory server including:
 * - HTTP server for health/REST endpoints
 * - WebSocket server for real-time communication
 * - Channel registration and wiring
 * - Hub REST API for workspace data (when hubStorage provided)
 */

import { createServer, type Server as HttpServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { WebSocketServer } from "./ws-server.js";
import { createReasoningChannel, sessionStore } from "./channels/reasoning.js";
import { createObservatoryChannel } from "./channels/observatory.js";
import { createWorkspaceChannel } from "./channels/workspace.js";
import type { ObservatoryConfig } from "./config.js";
import { OBSERVATORY_HTML } from "./ui/index.js";
import { ImprovementEventStore } from "./improvement-store.js";
import { ScorecardAggregator } from "./scorecard-aggregator.js";
import type { HubStorage } from "../hub/hub-types.js";

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
 * Options for creating an Observatory server
 */
export interface ObservatoryServerOptions {
  _type: 'options';
  config: ObservatoryConfig;
  hubStorage?: HubStorage;
}

/**
 * Create an Observatory server with the given configuration
 */
export function createObservatoryServer(
  options: ObservatoryServerOptions
): ObservatoryServer {
  const config = options.config;
  const hubStorage = options.hubStorage;

  let httpServer: HttpServer | null = null;
  let wss: WebSocketServer | null = null;
  let running = false;

  /**
   * Send JSON response helper
   */
  function json(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  /**
   * Handle Hub REST API requests
   * Returns true if the request was handled, false otherwise
   */
  function handleHubApi(url: URL, req: IncomingMessage, res: ServerResponse): boolean {
    if (!hubStorage || req.method !== "GET") return false;

    // GET /api/hub/workspaces
    if (url.pathname === "/api/hub/workspaces") {
      (async () => {
        try {
          const workspaces = await hubStorage.listWorkspaces();
          json(res, 200, { workspaces });
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
        }
      })();
      return true;
    }

    // GET /api/hub/workspaces/:id/problems
    const problemsMatch = url.pathname.match(/^\/api\/hub\/workspaces\/([^/]+)\/problems$/);
    if (problemsMatch) {
      const workspaceId = problemsMatch[1];
      (async () => {
        try {
          const problems = await hubStorage.listProblems(workspaceId);
          json(res, 200, { problems });
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
        }
      })();
      return true;
    }

    // GET /api/hub/workspaces/:id/proposals
    const proposalsMatch = url.pathname.match(/^\/api\/hub\/workspaces\/([^/]+)\/proposals$/);
    if (proposalsMatch) {
      const workspaceId = proposalsMatch[1];
      (async () => {
        try {
          const proposals = await hubStorage.listProposals(workspaceId);
          json(res, 200, { proposals });
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
        }
      })();
      return true;
    }

    // GET /api/hub/workspaces/:id/consensus
    const consensusMatch = url.pathname.match(/^\/api\/hub\/workspaces\/([^/]+)\/consensus$/);
    if (consensusMatch) {
      const workspaceId = consensusMatch[1];
      (async () => {
        try {
          const markers = await hubStorage.listConsensusMarkers(workspaceId);
          json(res, 200, { markers });
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
        }
      })();
      return true;
    }

    // GET /api/hub/workspaces/:id/channels/:problemId
    const channelMatch = url.pathname.match(/^\/api\/hub\/workspaces\/([^/]+)\/channels\/([^/]+)$/);
    if (channelMatch) {
      const [, workspaceId, problemId] = channelMatch;
      (async () => {
        try {
          const channel = await hubStorage.getChannel(workspaceId, problemId);
          if (!channel) {
            json(res, 404, { error: "Channel not found" });
            return;
          }
          json(res, 200, { messages: channel.messages });
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
        }
      })();
      return true;
    }

    // GET /api/hub/workspaces/:id/agents
    const agentsMatch = url.pathname.match(/^\/api\/hub\/workspaces\/([^/]+)\/agents$/);
    if (agentsMatch) {
      const workspaceId = agentsMatch[1];
      (async () => {
        try {
          const workspace = await hubStorage.getWorkspace(workspaceId);
          if (!workspace) {
            json(res, 404, { error: "Workspace not found" });
            return;
          }
          // Enrich workspace agents with full identity info
          const agents = await Promise.all(
            workspace.agents.map(async (wa) => {
              const identity = await hubStorage.getAgent(wa.agentId);
              return { ...wa, name: identity?.name, profile: identity?.profile };
            })
          );
          json(res, 200, { agents });
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
        }
      })();
      return true;
    }

    return false;
  }

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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

    // Health endpoint (always available regardless of httpApi setting)
    if (url.pathname === "/api/health" && req.method === "GET") {
      const activeSessions = sessionStore.getActiveSessions();
      json(res, 200, {
        status: "ok",
        connections: wss?.getConnectionCount() || 0,
        activeSessions: activeSessions.length,
        hubEnabled: !!hubStorage,
      });
      return;
    }

    // Gate all other API routes behind httpApi config
    if (config.httpApi === false && url.pathname.startsWith("/api/")) {
      json(res, 403, { error: "HTTP API is disabled" });
      return;
    }

    // Test endpoint: Trigger mock collaborative session
    if (url.pathname === "/api/test/mock-collab-session" && req.method === "POST") {
      (async () => {
        try {
          const { emitMockCollabSession } = await import("./test-collab-events.js");
          emitMockCollabSession();
          json(res, 200, { status: "ok", message: "Mock session events emitted" });
        } catch (error) {
          json(res, 500, { status: "error", message: error instanceof Error ? error.message : "Unknown error" });
        }
      })();
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

      json(res, 200, { sessions });
      return;
    }

    // Session detail endpoint
    const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
    if (sessionMatch && req.method === "GET") {
      const sessionId = sessionMatch[1];

      (async () => {
        const session = await sessionStore.getSession(sessionId);
        if (!session) {
          json(res, 404, { error: "Session not found" });
          return;
        }

        const thoughts = await sessionStore.getThoughts(sessionId);
        const branches = await sessionStore.getBranches(sessionId);

        json(res, 200, { session, thoughts, branches });
      })().catch((err) => {
        json(res, 500, { error: err.message });
      });
      return;
    }

    // Hub API endpoints
    if (url.pathname.startsWith("/api/hub/") && handleHubApi(url, req, res)) {
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

          json(res, 200, { events });
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
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

          json(res, 200, scorecard);
        } catch (err) {
          json(res, 500, { error: (err as Error).message });
        }
      })();
      return;
    }

    // 404 for unknown routes
    json(res, 404, { error: "Not found" });
  }

  // Channel cleanup functions — populated on start(), called on stop()
  let channelCleanups: Array<() => void> = [];

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
      const { channel: workspaceChannel, cleanup: cleanupWorkspace } =
        createWorkspaceChannel(wss);

      channelCleanups = [cleanupWorkspace];
      // TODO: reasoning and observatory channels also attach emitter listeners
      // and should return cleanup functions (same pattern as workspace)

      wss.registerChannel(reasoningChannel);
      wss.registerChannel(observatoryChannel);
      wss.registerChannel(workspaceChannel);

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
            `[Observatory] WebSocket: ws://localhost:${config.port}/`
          );
          console.log(
            `[Observatory] REST API: http://localhost:${config.port}/api/`
          );
          if (hubStorage) {
            console.log(
              `[Observatory] Hub API: http://localhost:${config.port}/api/hub/`
            );
          }
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

      // Remove emitter listeners to prevent duplicates on restart
      for (const cleanup of channelCleanups) {
        cleanup();
      }
      channelCleanups = [];

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
