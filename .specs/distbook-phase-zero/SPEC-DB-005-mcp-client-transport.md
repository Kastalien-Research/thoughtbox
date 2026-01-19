# SPEC-DB-005: MCP Client Transport

> **Status**: Draft
> **Priority**: MEDIUM
> **Phase**: 0.4 (Optional)
> **Estimated Effort**: 2-3 hours

## Summary

Implement the MCP client transport layer to enable Distbook to connect to external MCP servers (like Thoughtbox), completing the "MCP peer" architecture.

## Problem Statement

The MCP client transport is completely commented out:

```typescript
// packages/api/mcp/client/index.mts:135-162
// All transport code commented out with TODO
// this.transport = new StreamableHTTPClientTransport(...)
```

Without this, Distbook can only serve as an MCP server - it cannot consume tools from other servers like Thoughtbox.

**Note**: This spec is marked "Optional for Phase 0" because the core execution path (specs 001-004) can function without the client. However, the full MCP peer vision requires bidirectional capability.

## Scope

### In Scope
- Implement `StreamableHTTPClientTransport` connection
- Connection lifecycle management (connect, disconnect, reconnect)
- Tool discovery (`list_tools`)
- Tool invocation with proper request/response handling
- Configuration via `.mcp.json`

### Out of Scope
- Resource subscriptions
- Prompt handling
- Sampling requests
- Advanced reconnection strategies

## Requirements

### R1: Transport Implementation
- Use `StreamableHTTPClientTransport` from MCP SDK
- Support HTTPS URLs
- Handle connection errors gracefully

### R2: Configuration Loading
- Read server configs from `.mcp.json`
- Support HTTP type servers with URL property
- Handle missing or malformed config

### R3: Connection Lifecycle
```typescript
interface McpClientLifecycle {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}
```

### R4: Tool Operations
```typescript
interface McpClientTools {
  listTools(): Promise<Tool[]>;
  callTool(name: string, args: object): Promise<ToolResult>;
}
```

### R5: Error Handling
- Connection refused → retry with backoff
- Timeout → return error result
- Server error → propagate error message

## Technical Approach

### Transport Implementation

```typescript
// packages/api/mcp/client/index.mts

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamable-http.js';

export class McpClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  private serverUrl: string;
  private connected: boolean = false;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.client = new Client({
      name: 'distbook-client',
      version: '1.0.0',
    }, {
      capabilities: {},
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    this.transport = new StreamableHTTPClientTransport(
      new URL(this.serverUrl)
    );

    await this.client.connect(this.transport);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.transport) return;

    await this.client.close();
    this.transport = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async listTools(): Promise<Tool[]> {
    if (!this.connected) {
      throw new Error('Client not connected');
    }

    const response = await this.client.listTools();
    return response.tools;
  }

  async callTool(name: string, args: object): Promise<ToolResult> {
    if (!this.connected) {
      throw new Error('Client not connected');
    }

    const response = await this.client.callTool({
      name,
      arguments: args,
    });

    return response;
  }
}
```

### Configuration Loading

```typescript
// packages/api/mcp/client/config.mts

import { readFile } from 'fs/promises';
import { join } from 'path';

interface McpServerConfig {
  type: 'http' | 'stdio';
  url?: string;
  command?: string;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export async function loadMcpConfig(configPath: string): Promise<McpConfig> {
  try {
    const content = await readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { mcpServers: {} };
  }
}

export async function getServerUrl(
  configPath: string,
  serverName: string
): Promise<string | null> {
  const config = await loadMcpConfig(configPath);
  const server = config.mcpServers[serverName];

  if (!server || server.type !== 'http' || !server.url) {
    return null;
  }

  return server.url;
}
```

### Client Manager

```typescript
// packages/api/mcp/client/manager.mts

import { McpClient } from './index.mts';
import { loadMcpConfig } from './config.mts';

export class McpClientManager {
  private clients: Map<string, McpClient> = new Map();

  async connectToServer(name: string, url: string): Promise<McpClient> {
    if (this.clients.has(name)) {
      return this.clients.get(name)!;
    }

    const client = new McpClient(url);
    await client.connect();
    this.clients.set(name, client);
    return client;
  }

  async disconnectFromServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [name] of this.clients) {
      await this.disconnectFromServer(name);
    }
  }

  getClient(name: string): McpClient | undefined {
    return this.clients.get(name);
  }
}
```

## Files

### Modified Files
| File | Changes |
|------|---------|
| `packages/api/mcp/client/index.mts` | Implement transport connection |

### New Files
| File | Purpose |
|------|---------|
| `packages/api/mcp/client/config.mts` | Config loading |
| `packages/api/mcp/client/manager.mts` | Multi-client management |

### Test Files
| File | Purpose |
|------|---------|
| `packages/api/mcp/client/index.test.mts` | Transport tests |
| `packages/api/mcp/client/config.test.mts` | Config loading tests |

## Acceptance Criteria

- [ ] Client connects to MCP server via HTTP transport
- [ ] `listTools()` returns available tools from server
- [ ] `callTool()` invokes tool and returns result
- [ ] Connection errors handled gracefully
- [ ] Config loading from `.mcp.json` works
- [ ] Unit tests pass
- [ ] Integration test with Thoughtbox server passes

## Test Cases

### Unit Tests

```typescript
describe('McpClient', () => {
  describe('connect', () => {
    it('establishes connection to server', async () => {
      const client = new McpClient('http://localhost:1731/mcp');
      await client.connect();
      expect(client.isConnected()).toBe(true);
      await client.disconnect();
    });

    it('handles connection refused', async () => {
      const client = new McpClient('http://localhost:9999/mcp');
      await expect(client.connect()).rejects.toThrow();
    });
  });

  describe('listTools', () => {
    it('returns available tools', async () => {
      const client = new McpClient('http://localhost:1731/mcp');
      await client.connect();
      const tools = await client.listTools();
      expect(tools).toBeInstanceOf(Array);
      await client.disconnect();
    });
  });

  describe('callTool', () => {
    it('invokes tool and returns result', async () => {
      const client = new McpClient('http://localhost:1731/mcp');
      await client.connect();
      const result = await client.callTool('init', { mode: 'start_new' });
      expect(result.content).toBeDefined();
      await client.disconnect();
    });
  });
});
```

### Integration Tests (requires Thoughtbox running)

```typescript
describe('Thoughtbox Integration', () => {
  it('connects to Thoughtbox and lists tools', async () => {
    const client = new McpClient('http://localhost:1731/mcp');
    await client.connect();

    const tools = await client.listTools();
    const toolNames = tools.map(t => t.name);

    expect(toolNames).toContain('init');
    // Progressive disclosure means not all tools visible initially

    await client.disconnect();
  });
});
```

## Dependencies

- SPEC-DB-001 (TypeScript compilation)
- MCP SDK with `StreamableHTTPClientTransport`
- Running MCP server for integration tests

## Blocked By

- SPEC-DB-001

## Blocks

- Full MCP peer functionality
- Thoughtbox integration from Distbook
- Self-improvement loop with Thoughtbox session management

## Notes

This spec is marked as **Optional for Phase 0** because:
1. The core execution path (cell_execute) works without it
2. Higher risk (external dependencies, network)
3. Can be deferred if Phase 0 timeline is tight

However, it completes the "MCP peer" architecture that makes Distbook valuable for the self-improvement loop.

---

**Created**: 2026-01-19
**Source**: plans/feat-distbook-phase-zero-mcp-execution.md (Gap 4)
