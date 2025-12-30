#!/usr/bin/env node

/**
 * Stateful HTTP Server for Thoughtbox MCP
 * 
 * Uses Smithery SDK's createStatefulServer for:
 * - Per-client MCP session isolation (LRU cache of transports)
 * - SSE support for real-time notifications
 * - Session termination via DELETE /mcp
 * - Config schema discovery via /.well-known/mcp-config
 * 
 * This provides true statefulness where in-memory state (thoughtHistory, branches)
 * persists across requests within the same MCP session.
 */

import { createStatefulServer } from '@smithery/sdk';
import type { Request, Response } from 'express';
import createServer, { configSchema, type CreateServerArgs } from './index.js';

// Server factory for Smithery SDK - returns low-level Server (synchronous)
const serverFactory = (args: CreateServerArgs) => {
  return createServer(args);
};

// Create stateful server with Smithery SDK
const { app } = createStatefulServer(serverFactory, {
  schema: configSchema,
});

// Additional health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    transport: 'streamable-http',
    server: 'thoughtbox',
    version: '1.0.1',
    mode: 'stateful',
    persistence: 'enabled',
    features: {
      sessionIsolation: true,
      sseNotifications: true,
      configDiscovery: true,
    },
  });
});

// Server info endpoint (mirrors stateless mode but indicates stateful)
app.get('/info', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: {
      name: 'thoughtbox-server',
      version: '1.0.0',
      transport: 'streamable-http',
      mode: 'stateful',
      persistence: 'enabled',
    },
    endpoints: {
      mcp: {
        POST: 'MCP requests with session management',
        GET: 'SSE stream for server notifications',
        DELETE: 'Session termination',
      },
      config: '/.well-known/mcp-config - Configuration schema discovery',
      health: '/health - Health check',
    },
  });
});

// Start the server
const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`Thoughtbox MCP Server (stateful) running on http://localhost:${port}/mcp`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Config schema: http://localhost:${port}/.well-known/mcp-config`);
  console.log(`Data directory: ${process.env.THOUGHTBOX_DATA_DIR || '~/.thoughtbox'}`);
  console.log('');
  console.log('Stateful mode features:');
  console.log('  - Per-client session isolation (MCP session ID header)');
  console.log('  - SSE notifications (GET /mcp)');
  console.log('  - Session termination (DELETE /mcp)');
  console.log('  - In-memory state persists within MCP sessions');
});
