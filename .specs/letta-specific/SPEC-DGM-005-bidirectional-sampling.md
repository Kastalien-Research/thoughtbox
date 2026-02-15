# SPEC-DGM-005: MCP Bidirectional Sampling Protocol

**Status**: Draft  
**Priority**: P1 - Critical for Thoughtbox Integration  
**Complexity**: High  
**Dependencies**: SPEC-DGM-001 (MCP Client)  
**Target Codebases**: `letta-code-thoughtbox/`, `thoughtbox/`

## Overview

Implement bidirectional sampling capability where Thoughtbox MCP server can request LLM completions from the Letta Code client, enabling agent-to-agent reasoning loops. This is the killer feature that allows Thoughtbox to request critique, analysis, or reasoning from the Letta agent.

## Motivation

**MCP Sampling Flow** (from spec):
```
Thoughtbox → sampling/createMessage → Letta Code
Letta Code → forward to Letta agent → get response  
Letta Code → return response → Thoughtbox
```

**Powerful Use Cases**:
1. Thoughtbox requests critique of its own reasoning
2. Thoughtbox requests alternative approaches
3. Thoughtbox requests synthesis of multiple thoughts
4. Collaborative reasoning between systems

**Example**:
```
User: "Help me architect this system"
Letta → Thoughtbox.process("architectural decision")
Thoughtbox → [reasoning about options]
Thoughtbox → sampling/createMessage("Critique this architecture")
Letta ← receives sampling request
Letta → forwards to agent
Agent → critiques architecture
Letta → returns critique
Thoughtbox ← receives critique
Thoughtbox → synthesizes with original reasoning
User ← receives enhanced output
```

## Requirements

### Functional Requirements

#### FR-001: Client Sampling Capability Declaration
**Priority**: MUST  
**Description**: Letta Code declares sampling support during MCP initialization

**Acceptance Criteria**:
- [ ] Client sends `capabilities.sampling = {}` during init
- [ ] Client sends `capabilities.sampling.tools = {}` to support tool-using sampling
- [ ] Capability stored and validated
- [ ] Server can check if client supports sampling before requesting

**Protocol**:
```json
// Letta Code → Thoughtbox during initialize
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "sampling": {
        "tools": {}  // Support tool use in sampling
      },
      "roots": {}
    },
    "clientInfo": {
      "name": "letta-code",
      "version": "0.12.9"
    }
  }
}
```

---

#### FR-002: Sampling Request Handler
**Priority**: MUST  
**Description**: Handle `sampling/createMessage` requests from Thoughtbox

**Acceptance Criteria**:
- [ ] Parse sampling request per MCP spec
- [ ] Extract messages, systemPrompt, tools, maxTokens
- [ ] Forward to Letta agent (via message injection or sub-agent)
- [ ] Return response with correct format
- [ ] Handle errors gracefully (user rejection, timeout)

**Request Format** (from Thoughtbox):
```json
{
  "jsonrpc": "2.0",
  "id": "sample-123",
  "method": "sampling/createMessage",
  "params": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Critique this architectural approach: ..."
        }
      }
    ],
    "systemPrompt": "You are an expert system architect",
    "modelPreferences": {
      "hints": [{ "name": "claude-3-sonnet" }],
      "intelligencePriority": 0.8
    },
    "maxTokens": 2000
  }
}
```

**Response Format** (from Letta Code):
```json
{
  "jsonrpc": "2.0",
  "id": "sample-123",
  "result": {
    "role": "assistant",
    "content": {
      "type": "text",
      "text": "The proposed architecture has these strengths..."
    },
    "model": "claude-3-5-sonnet-20241022",
    "stopReason": "endTurn"
  }
}
```

---

#### FR-003: Sampling Integration Modes
**Priority**: MUST  
**Description**: Support multiple modes for handling sampling requests

**Mode A: Message Injection** (Recommended)
```typescript
async function handleSampling_MessageInjection(req: SamplingRequest): Promise<SamplingResult> {
  // Inject sampling request into agent's conversation
  const response = await agent.sendMessage({
    role: 'user',
    content: formatSamplingPrompt(req),
    metadata: { source: 'thoughtbox-sampling', requestId: req.id }
  });
  
  return {
    role: 'assistant',
    content: { type: 'text', text: response.text },
    model: agent.model,
    stopReason: 'endTurn'
  };
}
```

**Mode B: Sub-Agent** (For isolated reasoning)
```typescript
async function handleSampling_SubAgent(req: SamplingRequest): Promise<SamplingResult> {
  // Create ephemeral sub-agent for this sampling request
  const subAgent = await createSubAgent({
    systemPrompt: req.systemPrompt,
    tools: req.tools || [],
    maxTokens: req.maxTokens
  });
  
  const response = await subAgent.complete(req.messages);
  await subAgent.destroy();
  
  return {
    role: 'assistant',
    content: { type: 'text', text: response.text },
    model: subAgent.model,
    stopReason: response.stopReason
  };
}
```

**Acceptance Criteria**:
- [ ] Both modes implemented
- [ ] Mode selection configurable
- [ ] Message injection mode preserves agent context
- [ ] Sub-agent mode provides isolation
- [ ] Default mode documented with rationale

---

#### FR-004: Human-in-the-Loop Approval
**Priority**: MUST (per MCP spec safety guidelines)  
**Description**: Present sampling requests to user for approval before forwarding

**Acceptance Criteria**:
- [ ] Sampling request shown in CLI UI
- [ ] User can view/edit prompt before sending
- [ ] User can approve/reject request
- [ ] Rejection sends error code `-1` to server
- [ ] Timeout after 60s (configurable) if no user response
- [ ] Option to auto-approve for trusted servers

**UI Design**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔄 Thoughtbox Sampling Request                          │
├─────────────────────────────────────────────────────────┤
│ Server: thoughtbox-local                                │
│ Request: Critique architectural approach                │
│                                                         │
│ System Prompt:                                          │
│ You are an expert system architect                      │
│                                                         │
│ Message:                                                │
│ Critique this approach: ...                             │
│                                                         │
│ Model Preference: claude-3-sonnet, high intelligence    │
│ Max Tokens: 2000                                        │
├─────────────────────────────────────────────────────────┤
│ [A]pprove  [E]dit  [R]eject                            │
└─────────────────────────────────────────────────────────┘
```

---

#### FR-005: Tool Use in Sampling
**Priority**: SHOULD  
**Description**: Support sampling requests that include tools

**Acceptance Criteria**:
- [ ] Parse tools array from sampling request
- [ ] Agent can use provided tools during sampling
- [ ] Multi-turn tool loop supported
- [ ] Tool results formatted correctly
- [ ] Final response includes all tool usage history

**Example** (Thoughtbox requests sampling with tools):
```json
{
  "method": "sampling/createMessage",
  "params": {
    "messages": [...],
    "tools": [
      {
        "name": "search_codebase",
        "description": "Search for code patterns",
        "inputSchema": { /* ... */ }
      }
    ],
    "toolChoice": { "mode": "auto" }
  }
}
```

**Agent uses tools**:
```
Agent: I'll search for similar patterns
Agent: [calls search_codebase tool]
Agent: Based on search results, here's my critique...
```

---

### Non-Functional Requirements

#### NFR-001: Performance
- Sampling latency: <5s overhead (excluding model inference)
- Support nested sampling (depth=3 max to prevent loops)
- Timeout configurable per request

#### NFR-002: Security
- User approval required by default
- Trusted server list for auto-approval (opt-in)
- Rate limiting: max 10 sampling requests/minute per server
- Budget limits: max tokens per sampling request

#### NFR-003: Observability
- Log all sampling requests/responses
- Include in Thoughtbox session trace
- Performance metrics (latency, token usage)
- Error tracking and alerting

---

## Architecture

### Sampling Handler

```typescript
// letta-code-thoughtbox/src/mcp-client/sampling-handler.ts
export class SamplingHandler {
  constructor(
    private agentContext: AgentContext,
    private config: SamplingConfig
  ) {}
  
  async handleRequest(
    request: SamplingRequest,
    serverId: string
  ): Promise<SamplingResult> {
    // 1. Validate request
    this.validate(request);
    
    // 2. Check approval (if required)
    if (!this.config.autoApprove.includes(serverId)) {
      const approved = await this.requestUserApproval(request);
      if (!approved) {
        throw new JsonRpcError(-1, "User rejected sampling request");
      }
    }
    
    // 3. Select mode (message injection vs sub-agent)
    const mode = this.selectMode(request);
    
    // 4. Execute sampling
    const result = mode === 'injection'
      ? await this.handleViaInjection(request)
      : await this.handleViaSubAgent(request);
    
    // 5. Log and return
    await this.logSampling(request, result);
    return result;
  }
  
  private selectMode(request: SamplingRequest): 'injection' | 'subagent' {
    // Use sub-agent if:
    // - Custom system prompt differs significantly from agent's
    // - Request includes tools not in agent's toolset
    // - Request is for isolated reasoning
    
    if (request.systemPrompt && !this.isCompatiblePrompt(request.systemPrompt)) {
      return 'subagent';
    }
    
    if (request.tools && request.tools.length > 0) {
      return 'subagent';
    }
    
    return 'injection';
  }
}
```

### Integration with Thoughtbox

```typescript
// thoughtbox/src/sampling/handler.ts (already exists in prod)
export class SamplingHandler {
  constructor(private mcpClient: MCPClient) {}
  
  async requestCritique(thought: string): Promise<string> {
    const result = await this.mcpClient.sendRequest('sampling/createMessage', {
      messages: [{
        role: 'user',
        content: { type: 'text', text: `Critique this reasoning: ${thought}` }
      }],
      systemPrompt: 'You are an expert system critic',
      maxTokens: 1500
    });
    
    return result.content.text;
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// Test sampling handler
test('handleRequest processes valid sampling request', async () => {
  const handler = new SamplingHandler(mockAgent, config);
  const request = createMockSamplingRequest();
  
  const result = await handler.handleRequest(request, 'thoughtbox');
  
  expect(result.role).toBe('assistant');
  expect(result.content.type).toBe('text');
  expect(result.stopReason).toBeDefined();
});

test('handleRequest rejects when user denies approval', async () => {
  const handler = new SamplingHandler(mockAgent, { autoApprove: [] });
  mockUserResponse('reject');
  
  await expect(
    handler.handleRequest(mockRequest, 'untrusted-server')
  ).rejects.toThrow('User rejected');
});
```

### Integration Tests
```typescript
// Test full round-trip
test('Thoughtbox can request sampling from Letta', async () => {
  // Start Thoughtbox
  const thoughtbox = await startThoughtbox();
  
  // Connect Letta Code
  const lettaClient = new McpClient({ /* ... */ });
  await lettaClient.connect();
  
  // Thoughtbox calls thoughtbox.process
  const response = await thoughtbox.call('thoughtbox', 'process', {
    thought: 'Should I use REST or GraphQL?',
    context: { requestCritique: true }
  });
  
  // Verify sampling occurred
  expect(response).toContain('critique');
  expect(samplingLog).toHaveLength(1);
});
```

---

## Success Criteria

- [ ] Thoughtbox can request sampling from Letta Code
- [ ] Letta agent provides meaningful responses
- [ ] User approval flow works (can approve/reject)
- [ ] Multi-turn tool loop supported in sampling
- [ ] No infinite recursion (depth limit enforced)
- [ ] Error handling for all failure modes
- [ ] Performance meets NFR-001 targets
- [ ] Passes all integration tests

---

## References

- [MCP Sampling Specification](../../ai_docs/mcp-docs-20251125/modelcontextprotocol.io_specification_2025-11-25_client_sampling.md)
- [DGM Paper - Sampling for Critique](https://arxiv.org/pdf/2505.22954) - Thoughtbox uses sampling
- [Thoughtbox Prod Sampling](../../thoughtbox-prod/src/sampling/handler.ts)

---

**Previous**: [SPEC-DGM-001: MCP Client](./SPEC-DGM-001-mcp-client-local-mode.md)  
**Next**: [SPEC-DGM-003: Reflection Sessions](./SPEC-DGM-003-reflection-session-system.md)
