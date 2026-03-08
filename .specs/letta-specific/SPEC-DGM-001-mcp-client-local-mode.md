# SPEC-DGM-001: Direct MCP Client for Letta Code

**Status**: Draft  
**Priority**: P1 - Critical Foundation  
**Complexity**: High  
**Dependencies**: None  
**Target Codebase**: `letta-code-thoughtbox/`

## Overview

Implement a full-featured Model Context Protocol (MCP) client directly within Letta Code CLI, enabling direct connections to MCP servers without requiring Letta Platform intermediation. This provides local-first capability and full access to MCP primitives (tools, resources, prompts, sampling, elicitation).

## Motivation

**Current State**: Letta Code only connects to MCP servers via Letta Platform API (`@letta-ai/letta-client`), which:
- Requires platform account and network connectivity
- Only exposes tools (not resources, prompts, sampling)
- Adds latency through proxy layer
- Limited to platform-supported transports

**Desired State**: Dual-mode architecture where Letta Code can:
- Connect directly to local MCP servers (STDIO, HTTP)
- Access full MCP protocol capabilities
- Work offline without platform dependency
- Enable bidirectional sampling for agent-to-agent communication

## Requirements

### Functional Requirements

#### FR-001: Transport Layer Support
**Priority**: MUST  
**Description**: Support STDIO and HTTP/SSE transports for MCP connections

**Acceptance Criteria**:
- [ ] STDIO transport spawns subprocess and communicates via stdin/stdout
- [ ] HTTP transport makes requests to streamable HTTP endpoints
- [ ] SSE transport handles server-sent events (legacy compatibility)
- [ ] Transport abstraction allows adding new transports without core changes
- [ ] Connection lifecycle managed (connect, heartbeat, disconnect, reconnect)

**Test Strategy**:
```typescript
// STDIO transport test
const client = new McpClient({ transport: 'stdio', command: 'thoughtbox' });
await client.connect();
const tools = await client.listTools();
expect(tools).toContain('thoughtbox');

// HTTP transport test
const httpClient = new McpClient({ 
  transport: 'http', 
  url: 'http://localhost:3000/mcp' 
});
await httpClient.connect();
expect(httpClient.isConnected()).toBe(true);
```

---

#### FR-002: MCP Protocol Primitives
**Priority**: MUST  
**Description**: Implement all MCP protocol primitives per spec (2025-11-25)

**Acceptance Criteria**:
- [ ] **Tools**: `tools/list`, `tools/call` with full argument validation
- [ ] **Resources**: `resources/list`, `resources/read`, `resources/subscribe` (if server supports)
- [ ] **Prompts**: `prompts/list`, `prompts/get` with template variable support
- [ ] **Sampling**: `sampling/createMessage` request handler (client role)
- [ ] **Elicitation**: User input request handling
- [ ] **Roots**: Expose project root to MCP server
- [ ] **Ping**: Keepalive mechanism

**Test Strategy**:
```typescript
// Test each primitive
const client = await connectToThoughtbox();

// Tools
const tools = await client.listTools();
const result = await client.callTool('thoughtbox', { thought: '...' });

// Resources
const resources = await client.listResources();
const content = await client.readResource('thoughtbox://session/abc');

// Sampling
client.onSamplingRequest(async (req) => {
  return await lettaAgent.sample(req);
});
```

---

#### FR-003: Dual-Mode Architecture
**Priority**: MUST  
**Description**: Support both platform mode (existing) and local mode (new) with seamless switching

**Acceptance Criteria**:
- [ ] Configuration specifies mode per server: `{ mode: 'platform' | 'local' }`
- [ ] Platform mode uses existing `@letta-ai/letta-client` SDK
- [ ] Local mode uses new direct MCP client
- [ ] Agent tools work identically regardless of mode
- [ ] UI clearly indicates which mode each server uses
- [ ] Migration path from platform to local (and vice versa)

**Configuration Example**:
```json
// .letta/mcp-config.json
{
  "servers": {
    "thoughtbox-local": {
      "mode": "local",
      "transport": "http",
      "url": "http://localhost:3000/mcp"
    },
    "thoughtbox-prod": {
      "mode": "platform",
      "serverId": "srv_abc123"
    }
  }
}
```

---

#### FR-004: Capability Negotiation
**Priority**: MUST  
**Description**: Implement MCP capability negotiation during initialization

**Acceptance Criteria**:
- [ ] Client declares capabilities: `{ sampling: { tools: {} }, roots: {} }`
- [ ] Server capabilities parsed and stored
- [ ] Feature availability checked before use
- [ ] Graceful degradation if server lacks capability
- [ ] Capability changes trigger re-negotiation

**Protocol Flow**:
```
Client → Server: initialize { capabilities: { sampling: {} } }
Server → Client: initialized { capabilities: { tools: {}, resources: {} } }
Client: Store server capabilities
Client: Enable features based on negotiated capabilities
```

---

#### FR-005: Connection Management
**Priority**: MUST  
**Description**: Robust connection lifecycle with error recovery

**Acceptance Criteria**:
- [ ] Auto-reconnect on connection loss (with backoff)
- [ ] Graceful shutdown on process exit
- [ ] Timeout handling for hung requests
- [ ] Connection pooling for multiple servers
- [ ] Health monitoring (ping/pong)
- [ ] Error notifications to UI

---

#### FR-006: Resource Provider (Expose Agent State)
**Priority**: SHOULD  
**Description**: Expose Letta agent state as MCP resources that servers can query

**Acceptance Criteria**:
- [ ] Implement `ResourceProvider` interface
- [ ] Expose resources:
  - `letta://agent/{id}/memory/core` - Core memory blocks
  - `letta://agent/{id}/memory/archival` - Archival memory
  - `letta://agent/{id}/skills/loaded` - Currently loaded skills
  - `letta://agent/{id}/tasks/history` - Recent task history
- [ ] Resources update when agent state changes
- [ ] Access control (only connected servers can read)

**Use Case**: Thoughtbox can query agent's current memory/skills for context-aware reasoning

---

### Non-Functional Requirements

#### NFR-001: Performance
- Maximum connection setup latency: 2 seconds
- Tool call overhead: <100ms vs platform mode
- Memory footprint: <50MB per active connection
- Support 5+ concurrent MCP server connections

#### NFR-002: Security
- Subprocess sandboxing for STDIO transport
- No arbitrary code execution from MCP responses
- API key/token storage in encrypted keychain
- Project-scope restriction (no system-wide access)

#### NFR-003: Reliability
- Automatic reconnection on transient failures
- Request retry with exponential backoff
- Graceful degradation when server unavailable
- No data loss on unexpected disconnections

#### NFR-004: Compatibility
- Works with all MCP protocol versions (with version detection)
- Compatible with existing Letta Code tool system
- No breaking changes to current platform mode
- Works on macOS, Linux, Windows (WSL)

---

## Architecture

### High-Level Structure

```
letta-code-thoughtbox/src/
  mcp-client/
    ├── index.ts              # Public API
    ├── client.ts             # Core MCP client
    ├── transport/
    │   ├── base.ts          # Transport interface
    │   ├── stdio.ts         # STDIO implementation
    │   ├── http.ts          # HTTP/SSE implementation
    │   └── manager.ts       # Connection lifecycle
    ├── protocol/
    │   ├── messages.ts      # JSON-RPC message types
    │   ├── tools.ts         # Tool primitive
    │   ├── resources.ts     # Resource primitive
    │   ├── prompts.ts       # Prompt primitive
    │   ├── sampling.ts      # Sampling primitive
    │   └── elicitation.ts   # Elicitation primitive
    ├── capabilities.ts       # Capability negotiation
    ├── resource-provider.ts  # Expose agent as resources
    ├── config.ts            # Configuration types
    └── integration/
        ├── platform-bridge.ts  # Bridge to existing platform mode
        └── tool-adapter.ts     # Adapt MCP tools to Letta tools
```

### Key Classes

```typescript
// Core client
export class McpClient {
  constructor(config: McpClientConfig);
  
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  
  // Tools
  async listTools(): Promise<Tool[]>;
  async callTool(name: string, args: unknown): Promise<ToolResult>;
  
  // Resources
  async listResources(): Promise<Resource[]>;
  async readResource(uri: string): Promise<ResourceContent>;
  async subscribeResource(uri: string, handler: UpdateHandler): Promise<void>;
  
  // Prompts
  async listPrompts(): Promise<Prompt[]>;
  async getPrompt(name: string, args?: Record<string, string>): Promise<PromptResult>;
  
  // Sampling (client implements)
  onSamplingRequest(handler: SamplingHandler): void;
  
  // Elicitation (client implements)
  onElicitationRequest(handler: ElicitationHandler): void;
  
  // State
  getCapabilities(): ServerCapabilities;
  isConnected(): boolean;
}

// Transport abstraction
export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: JsonRpcMessage): Promise<void>;
  onMessage(handler: (message: JsonRpcMessage) => void): void;
  onError(handler: (error: Error) => void): void;
  onDisconnect(handler: () => void): void;
}

// Resource provider
export class LettaResourceProvider implements ResourceProvider {
  constructor(agentContext: AgentContext);
  
  async listResources(): Promise<Resource[]>;
  async readResource(uri: string): Promise<ResourceContent>;
  
  // Letta-specific
  async getMemoryBlocks(): Promise<Block[]>;
  async getSkills(): Promise<Skill[]>;
  async getTaskHistory(): Promise<Task[]>;
}
```

---

## Integration Points

### With Existing Letta Code

1. **Tool System**: `src/tools/manager.ts`
   - Add MCP tools to agent's tool registry
   - Wrap MCP tool calls with Letta's execution model
   - Handle MCP tool results in stream

2. **Agent Context**: `src/agent/context.ts`
   - Store active MCP connections
   - Expose to tools via context
   - Clean up on agent termination

3. **CLI Commands**: `src/cli/commands/mcp.ts`
   - Extend `/mcp add` to support local mode
   - Add `/mcp mode` to switch between platform/local
   - Show connection status in UI

### With Thoughtbox

1. **HTTP Endpoint**: `http://localhost:3000/mcp`
   - Thoughtbox exposes streamable HTTP MCP endpoint
   - Letta Code connects as MCP client
   - Bidirectional communication (tools + sampling)

2. **Sampling Flow**:
   ```
   Thoughtbox → sampling/createMessage → Letta Code
   Letta Code → forward to agent → get response
   Letta Code → return response → Thoughtbox
   ```

3. **Resource Queries**:
   ```
   Thoughtbox → resources/list → Letta Code
   Letta Code → return agent resources
   Thoughtbox → resources/read letta://agent/memory/core
   Letta Code → return memory blocks
   ```

---

## Implementation Phases

### Phase 1: Core Client (Week 1)
- [ ] Transport interface and STDIO implementation
- [ ] JSON-RPC message handling
- [ ] Basic tool list/call primitives
- [ ] Connection lifecycle management

### Phase 2: Full Protocol (Week 2)
- [ ] HTTP/SSE transport
- [ ] Resources, prompts primitives
- [ ] Capability negotiation
- [ ] Error handling and recovery

### Phase 3: Bidirectional Communication (Week 3)
- [ ] Sampling request handler
- [ ] Elicitation request handler
- [ ] Resource provider implementation

### Phase 4: Integration (Week 4)
- [ ] Dual-mode configuration
- [ ] Tool adapter for Letta system
- [ ] CLI enhancements
- [ ] Documentation

---

## Testing Strategy

### Unit Tests
- Transport layer in isolation (mocked subprocess/HTTP)
- Protocol message parsing and validation
- Capability negotiation logic
- Resource provider methods

### Integration Tests
- Connect to real Thoughtbox instance
- Full protocol handshake
- Tool call round-trip
- Sampling request handling
- Resource queries

### End-to-End Tests
```bash
# Start Thoughtbox locally
cd thoughtbox && pnpm dev

# Run Letta Code with local MCP
cd letta-code-thoughtbox
bun run letta.js --mcp-mode=local

# Test: Use Thoughtbox from CLI
> /mcp add --mode local --transport http thoughtbox http://localhost:3000/mcp
> Help me think through this architecture decision
# Should use Thoughtbox via local MCP client
```

---

## Migration Path

### For Existing Users

1. **No disruption**: Platform mode remains default
2. **Opt-in**: Users explicitly configure local mode
3. **Gradual migration**: Can use both modes simultaneously
4. **Fallback**: If local fails, suggest platform mode

### Configuration Migration

```typescript
// Before (platform only)
await client.mcpServers.create({ /* ... */ });

// After (explicit mode selection)
{
  "servers": {
    "thoughtbox": {
      "mode": "local",  // NEW
      "transport": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

---

## Success Criteria

- [ ] Can connect to Thoughtbox via local MCP client
- [ ] All MCP primitives accessible (tools, resources, prompts)
- [ ] Bidirectional sampling works (Thoughtbox → Letta)
- [ ] No regressions to existing platform mode
- [ ] Performance meets NFR-001 targets
- [ ] Passes all integration tests
- [ ] Documentation complete with examples

---

## References

- [MCP Specification 2025-11-25](../../ai_docs/mcp-docs-20251125/)
- [Letta MCP Integration Docs](../../ai_docs/letta-docs/docs.letta.com_guides_mcp_overview_.md)
- [MCP Client Builder Skill](../../.letta/skills/mcp-client-builder/)
- [Thoughtbox MCP Server](../../thoughtbox/src/index.ts)

---

**Next Spec**: [SPEC-DGM-002: Git-Based Archive Management](./SPEC-DGM-002-dgm-archive-system.md)
