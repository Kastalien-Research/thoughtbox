#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import createServer from "./index.js";
import { closeDatabase } from "./persistence/index.js";

const app = express();
app.use(express.json());

// CORS for local development
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Mcp-Session-Id"],
    exposedHeaders: ["Mcp-Session-Id"],
  })
);

// MCP server instance (initialized on startup)
let mcpServer: Awaited<ReturnType<typeof createServer>>;

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    transport: "streamable-http",
    server: "thoughtbox",
    version: "1.1.0",
    persistence: "enabled",
  });
});

// Server info on GET /mcp
app.get("/mcp", (req, res) => {
  res.json({
    status: "ok",
    server: {
      name: "thoughtbox-server",
      version: "1.1.0",
      transport: "streamable-http",
      mode: "stateless",
      persistence: "enabled",
    },
  });
});

// Streamable HTTP endpoint - stateless mode
app.post("/mcp", async (req, res) => {
  try {
    // In stateless mode, create a new transport for each request
    // This prevents request ID collisions between different clients
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// DELETE for session termination (not supported in stateless mode)
app.delete("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32601,
      message: "Session termination not supported in stateless mode",
    },
    id: null,
  });
});

// Startup function
async function start() {
  // Create the MCP server with default config (now async)
  mcpServer = await createServer({
    config: {
      disableThoughtLogging:
        (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true",
    },
  });

  const port = parseInt(process.env.PORT || "1729");
  app.listen(port, () => {
    console.log(
      `Thoughtbox MCP Server running on http://localhost:${port}/mcp`
    );
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Data directory: ${process.env.THOUGHTBOX_DATA_DIR || "~/.thoughtbox"}`);
  });
}

// Graceful shutdown handlers
function setupGracefulShutdown() {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    closeDatabase();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Start the server
setupGracefulShutdown();
start().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
