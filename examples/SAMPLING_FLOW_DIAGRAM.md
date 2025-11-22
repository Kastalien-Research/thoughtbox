# MCP Sampling Flow Diagrams

## Overall Sampling Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MCP Client (e.g., Claude Desktop)           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  User Interface                                              │  │
│  │  - Shows sampling request for approval                       │  │
│  │  - Displays system prompt and messages                       │  │
│  │  - Allows user to approve/reject/modify                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓ (if approved)                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  LLM Provider (Claude, GPT, etc.)                            │  │
│  │  - Client selects model based on preferences                 │  │
│  │  - Sends request to LLM                                      │  │
│  │  - Returns completion                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
└────────────────────────────────────────────────────────────────────┘
                               ↕ JSON-RPC over stdio/HTTP
┌─────────────────────────────────────────────────────────────────────┐
│                      Thoughtbox MCP Server                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Main Server (index.ts)                                      │  │
│  │  - Declares capabilities: {tools, prompts, resources}        │  │
│  │  - Handles CallToolRequest                                   │  │
│  │  - Routes to appropriate server                              │  │
│  │  - Passes RequestHandlerExtra to tool handlers               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Tool Servers                                                │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │ NotebookServer                                      │    │  │
│  │  │ - explain_code → uses sampling                      │    │  │
│  │  │ - generate_code → uses sampling                     │    │  │
│  │  │ - Other operations → no sampling                    │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │ MentalModelsServer                                  │    │  │
│  │  │ - apply_model → uses sampling                       │    │  │
│  │  │ - suggest_model → uses sampling                     │    │  │
│  │  │ - Other operations → no sampling                    │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │ ClearThoughtServer                                  │    │  │
│  │  │ - validate_thought → uses sampling (optional)       │    │  │
│  │  │ - Regular thoughts → no sampling                    │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Detailed Flow: Code Explanation Example

### 1. Tool Call from Client

```
User → Client → Server
──────────────────────────────────────────────────
{
  "method": "tools/call",
  "params": {
    "name": "notebook",
    "arguments": {
      "operation": "explain_code",
      "args": {
        "cellId": "cell_0",
        "detailLevel": "detailed"
      }
    }
  }
}
```

### 2. Server Processes Request

```
Server receives CallToolRequest
        ↓
Routes to NotebookServer.processTool()
        ↓
Calls handleExplainCode(args, extra)
        ↓
Checks client capabilities:
  capabilities.sampling? → Yes
        ↓
Retrieves cell content from state
        ↓
Constructs sampling request
```

### 3. Server Initiates Sampling

```
Server → Client
──────────────────────────────────────────────────
extra.sendRequest({
  method: "sampling/createMessage",
  params: {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Explain this code:\n```typescript\n...\n```"
        }
      }
    ],
    systemPrompt: "You are a code explanation assistant...",
    maxTokens: 800,
    modelPreferences: {
      intelligencePriority: 0.8,
      speedPriority: 0.7,
      costPriority: 0.5,
      hints: [{ name: "claude" }]
    }
  }
})
```

### 4. Client Shows UI to User

```
┌───────────────────────────────────────────────────┐
│  Thoughtbox wants to use AI                      │
│                                                   │
│  System Prompt:                                   │
│  "You are a code explanation assistant..."        │
│                                                   │
│  User Message:                                    │
│  "Explain this code:                              │
│   ```typescript                                   │
│   function fibonacci(n: number): number {         │
│     ...                                           │
│   }                                               │
│   ```"                                            │
│                                                   │
│  Preferences: Intelligence=0.8, Speed=0.7         │
│                                                   │
│  [Approve]  [Reject]  [Edit First]                │
└───────────────────────────────────────────────────┘
```

### 5. Client Calls LLM (if approved)

```
Client → LLM Provider API
──────────────────────────────────────────────────
Client selects appropriate model:
  - Checks available models
  - Matches preferences (intelligence: 0.8)
  - Matches hints (prefers Claude)
  - Selects: claude-3-5-sonnet-20241022
        ↓
POST /v1/messages
{
  "model": "claude-3-5-sonnet-20241022",
  "system": "You are a code explanation assistant...",
  "messages": [...],
  "max_tokens": 800
}
        ↓
LLM generates completion
```

### 6. Client Returns Result to Server

```
Client → Server
──────────────────────────────────────────────────
{
  "model": "claude-3-5-sonnet-20241022",
  "role": "assistant",
  "content": {
    "type": "text",
    "text": "This code implements the Fibonacci sequence..."
  },
  "stopReason": "endTurn"
}
```

### 7. Server Processes and Returns to User

```
Server receives sampling result
        ↓
Extracts explanation text
        ↓
Formats response
        ↓
Server → Client
──────────────────────────────────────────────────
{
  "content": [
    {
      "type": "text",
      "text": "{
        \"success\": true,
        \"cellId\": \"cell_0\",
        \"explanation\": \"This code implements...\",
        \"metadata\": {
          \"model\": \"claude-3-5-sonnet-20241022\",
          \"stopReason\": \"endTurn\"
        }
      }"
    }
  ]
}
```

## Error Flow: Client Doesn't Support Sampling

```
User → Client → Server
──────────────────────────────────────────────────
Tool call: notebook.explain_code
        ↓
Server checks capabilities
        ↓
capabilities.sampling === undefined
        ↓
Server → Client
──────────────────────────────────────────────────
{
  "content": [
    {
      "type": "text",
      "text": "{
        \"success\": false,
        \"error\": \"Requires client with sampling support\",
        \"requiredCapability\": \"sampling\"
      }"
    }
  ],
  "isError": true
}
```

## Error Flow: User Rejects Sampling

```
User → Client → Server → Client
──────────────────────────────────────────────────
Sampling request sent
        ↓
Client shows UI
        ↓
User clicks [Reject]
        ↓
Client → Server
──────────────────────────────────────────────────
Error: "User rejected sampling request"
        ↓
Server catches error
        ↓
Server → Client
──────────────────────────────────────────────────
{
  "content": [
    {
      "type": "text",
      "text": "{
        \"success\": false,
        \"error\": \"Sampling request rejected\",
        \"details\": \"User declined the AI request\"
      }"
    }
  ],
  "isError": true
}
```

## Multi-turn Conversation Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  Turn 1: Initial Request                                    │
└─────────────────────────────────────────────────────────────┘
User: "Apply First Principles to my problem"
        ↓
Server stores conversation in session:
  messages = [
    { role: "user", content: "Apply First Principles..." }
  ]
        ↓
Server samples LLM → Response
        ↓
Server stores response:
  messages.push({
    role: "assistant",
    content: "Let's break this down..."
  })
        ↓
Return to user

┌─────────────────────────────────────────────────────────────┐
│  Turn 2: Follow-up                                          │
└─────────────────────────────────────────────────────────────┘
User: "Can you elaborate on point 2?"
        ↓
Server retrieves session messages
        ↓
messages.push({
  role: "user",
  content: "Can you elaborate on point 2?"
})
        ↓
Server samples with full history → Response
        ↓
messages.push({
  role: "assistant",
  content: "Sure, let me expand..."
})
        ↓
Return to user

[Repeat for subsequent turns...]
```

## Capability Negotiation (Initialization)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Client Connects to Server                               │
└─────────────────────────────────────────────────────────────┘
Client → Server: initialize
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "sampling": {}  ← Client declares sampling support
  },
  "clientInfo": {
    "name": "Claude Desktop",
    "version": "1.0.0"
  }
}

┌─────────────────────────────────────────────────────────────┐
│  2. Server Responds                                          │
└─────────────────────────────────────────────────────────────┘
Server → Client: initialize result
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": {},
    "prompts": {},
    "resources": {}
    // Note: Server doesn't need to declare sampling
  },
  "serverInfo": {
    "name": "thoughtbox-server",
    "version": "1.0.0"
  }
}

┌─────────────────────────────────────────────────────────────┐
│  3. Server Can Now Check Client Capabilities                │
└─────────────────────────────────────────────────────────────┘
const capabilities = server.getClientCapabilities();
// capabilities.sampling exists → can use sampling!
```

## Model Selection Flow

```
Server specifies preferences:
  intelligencePriority: 0.9
  speedPriority: 0.4
  costPriority: 0.3
  hints: [{ name: "claude" }]
        ↓
Client evaluates available models:

┌──────────────────────────────────────────────────────┐
│  Model: claude-3-5-sonnet-20241022                   │
│  Intelligence: 0.95  ✓ (high priority)               │
│  Speed: 0.7          ✓ (medium)                      │
│  Cost: 0.5           ✓ (acceptable)                  │
│  Name match: "claude" ✓                              │
│  Score: 0.92                                         │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Model: gpt-4-turbo                                  │
│  Intelligence: 0.9   ✓ (high priority)               │
│  Speed: 0.8          ✓ (good)                        │
│  Cost: 0.6           ✓ (acceptable)                  │
│  Name match: "claude" ✗ (no match)                   │
│  Score: 0.85                                         │
└──────────────────────────────────────────────────────┘

Client selects: claude-3-5-sonnet-20241022 (highest score)
```

## Integration Points in Existing Code

```
src/index.ts (Main Server)
├── createServer() creates Server instance
├── server.setRequestHandler(CallToolRequestSchema, (request, extra) => {
│   ├── extra.sendRequest ← Use this for sampling!
│   ├── extra.server ← Access to server.getClientCapabilities()
│   └── Pass 'extra' to tool servers
└── })

src/notebook/index.ts (NotebookServer)
├── class NotebookServer {
│   ├── private server: Server | null
│   ├── setServer(server) { this.server = server; }
│   └── processTool(operation, args, extra?) {
│       ├── if (operation === "explain_code") {
│       │   └── return handleExplainCode(args, extra)
│       └── }
└── }

src/mental-models/index.ts (MentalModelsServer)
├── class MentalModelsServer {
│   ├── private server: Server | null
│   └── processTool(operation, args, extra?) {
│       ├── if (operation === "apply_model") {
│       │   └── return handleApplyModel(args, extra)
│       └── }
└── }
```

## Summary

Key points from the diagrams:

1. **Human-in-the-loop**: Client MUST show UI before calling LLM
2. **Server-initiated**: Server uses `extra.sendRequest()` to request sampling
3. **Capability checking**: Always verify client supports sampling
4. **Model selection**: Client chooses model based on preferences
5. **Error handling**: Multiple failure points to handle gracefully
6. **Toolhost pattern**: Easy to add sampling to existing operations
7. **Session management**: Can maintain conversation history across turns

The architecture ensures user control while enabling powerful AI-assisted features.
