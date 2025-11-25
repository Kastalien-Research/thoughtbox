#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import createServer from "./index.js";

const app = express();
app.use(express.json());

// CORS for local development
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Mcp-Session-Id"],
  exposedHeaders: ["Mcp-Session-Id"],
}));

// Create the MCP server with default config
const mcpServer = createServer({
  config: {
    disableThoughtLogging:
      (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true",
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    transport: "streamable-http",
    server: "thoughtbox",
    version: "1.0.1"
  });
});

// Server info on GET /mcp
app.get("/mcp", (req, res) => {
  res.json({
    status: "ok",
    server: {
      name: "thoughtbox-server",
      version: "1.0.0",
      transport: "streamable-http",
      mode: "stateless",
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

const port = parseInt(process.env.PORT || "3000");
app.listen(port, () => {
  console.log(`Thoughtbox MCP Server running on http://localhost:${port}/mcp`);
  console.log(`Health check: http://localhost:${port}/health`);
});
