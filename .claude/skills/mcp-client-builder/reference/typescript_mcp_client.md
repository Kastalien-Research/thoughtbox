# TypeScript MCP Client Implementation Guide

> **Protocol Version**: 2025-11-25
> **SDK**: `@modelcontextprotocol/sdk`

## Quick Start

```bash
npm install @modelcontextprotocol/sdk
```

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({
  name: "my-client",
  version: "1.0.0"
});

const transport = new StdioClientTransport({
  command: "node",
  args: ["server.js"]
});

await client.connect(transport);

// List and call tools
const tools = await client.listTools();
const result = await client.callTool({
  name: "example_tool",
  arguments: { param: "value" }
});

await client.close();
```

---

## Transport Options

### 1. Stdio Transport (Local Servers)

Best for local development and CLI tools where server runs as subprocess.

```typescript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "python",       // or "node", "npx", etc.
  args: ["server.py"],
  env: { API_KEY: "..." }  // Optional environment variables
});

await client.connect(transport);
```

**Characteristics**:
- Server spawned as child process
- Communication via stdin/stdout
- Newline-delimited JSON-RPC messages
- Server stderr available for logging

### 2. Streamable HTTP Transport (Remote Servers)

Recommended for production remote servers. Supports bidirectional communication via SSE.

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://api.example.com/mcp")
);

await client.connect(transport);
```

**Key Features**:
- Single MCP endpoint for POST and GET
- Session management via `Mcp-Session-Id` header
- Supports server-initiated requests via SSE
- DNS rebinding protection required

**Session Management**:
```typescript
// Session ID is automatically propagated after initialization
// If session expires, server returns 404 - client must reinitialize
```

### 3. SSE Transport (Legacy/Deprecated)

For backwards compatibility with 2024-11-05 spec servers only.

```typescript
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("https://legacy-server.example.com/sse")
);
```

---

## Client Initialization

### Basic Client Setup

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "my-mcp-client",
  version: "1.0.0"
});
```

### With Capabilities

Declare capabilities to enable server-to-client features:

```typescript
const client = new Client({
  name: "my-mcp-client",
  version: "1.0.0"
}, {
  capabilities: {
    // Allow servers to request LLM completions
    sampling: {
      tools: {}  // Enable tool use in sampling
    },
    // Declare filesystem roots
    roots: {
      listChanged: true  // Emit notifications on root changes
    },
    // Allow servers to request user input
    elicitation: {
      form: {},  // Form-based input
      url: {}    // URL-based sensitive input
    }
  }
});
```

---

## Connection Lifecycle

### Three-Phase Initialization

```typescript
async function connectToServer(transport: Transport) {
  // Phase 1: Connect and initialize
  await client.connect(transport);
  // SDK automatically sends initialize request and waits for response
  // SDK automatically sends initialized notification

  // Phase 2: Discover capabilities
  const serverCapabilities = client.getServerCapabilities();
  console.log("Server supports:", serverCapabilities);

  // Phase 3: Ready for operations
  const tools = await client.listTools();
  const resources = await client.listResources();
  const prompts = await client.listPrompts();
}
```

### Manual Initialization (Low-Level)

```typescript
// If not using SDK's automatic initialization
const initResponse = await client.request({
  method: "initialize",
  params: {
    protocolVersion: "2025-11-25",
    capabilities: {
      sampling: {},
      roots: { listChanged: true },
      elicitation: { form: {}, url: {} }
    },
    clientInfo: {
      name: "my-client",
      version: "1.0.0"
    }
  }
});

// Store server capabilities
const serverCapabilities = initResponse.capabilities;

// Confirm initialization
await client.notification({
  method: "notifications/initialized"
});
```

---

## Working with Server Features

### Tools

```typescript
// List available tools
const toolsResponse = await client.listTools();
const tools = toolsResponse.tools;

// Call a tool
const result = await client.callTool({
  name: "get_weather",
  arguments: { city: "Tokyo" }
});

// Handle result content
for (const content of result.content) {
  if (content.type === "text") {
    console.log(content.text);
  } else if (content.type === "image") {
    // Base64-encoded image
    console.log(content.data, content.mimeType);
  }
}

// Access structured content (2025-11-25 spec)
if (result.structuredContent) {
  console.log("Structured:", result.structuredContent);
}
```

### Resources

```typescript
// List available resources
const resourcesResponse = await client.listResources();

// Read a resource
const content = await client.readResource({
  uri: "file:///path/to/resource"
});

// Subscribe to resource changes (if server supports)
if (serverCapabilities.resources?.subscribe) {
  await client.subscribeResource({ uri: "file:///watched" });

  client.setNotificationHandler(
    "notifications/resources/updated",
    (notification) => {
      console.log("Resource updated:", notification.params.uri);
    }
  );
}
```

### Prompts

```typescript
// List available prompts
const promptsResponse = await client.listPrompts();

// Get a prompt with arguments
const prompt = await client.getPrompt({
  name: "code_review",
  arguments: { language: "typescript", code: "..." }
});

// Use prompt messages
const messages = prompt.messages;
// messages[0].role === "user" | "assistant"
// messages[0].content.type === "text" | "image" | "resource"
```

---

## Client Capabilities Implementation

### Sampling (Server Requests LLM Completions)

```typescript
import { CreateMessageRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Register handler for server sampling requests
client.setRequestHandler(CreateMessageRequestSchema, async (request) => {
  const { messages, modelPreferences, systemPrompt, maxTokens, tools } = request.params;

  // Call your LLM provider
  const llmResponse = await anthropic.messages.create({
    model: selectModel(modelPreferences),  // Use hints + priorities
    system: systemPrompt,
    max_tokens: maxTokens,
    messages: convertMessages(messages),
    tools: tools  // Pass through if sampling.tools capability declared
  });

  // Return in MCP format
  return {
    role: "assistant",
    content: {
      type: "text",
      text: llmResponse.content[0].text
    },
    model: llmResponse.model,
    stopReason: mapStopReason(llmResponse.stop_reason)
  };
});

// Helper: Select model based on preferences
function selectModel(prefs: ModelPreferences): string {
  // Check hints first
  for (const hint of prefs.hints || []) {
    if (hint.name.includes("sonnet")) return "claude-3-5-sonnet-latest";
    if (hint.name.includes("haiku")) return "claude-3-5-haiku-latest";
  }

  // Fall back to priorities
  if (prefs.intelligencePriority > 0.8) return "claude-3-5-sonnet-latest";
  if (prefs.speedPriority > 0.8) return "claude-3-5-haiku-latest";

  return "claude-3-5-sonnet-latest";  // Default
}
```

### Roots (Filesystem Boundaries)

```typescript
import { ListRootsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Track roots
const roots = [
  { uri: "file:///home/user/project", name: "My Project" }
];

// Handle server requests for roots
client.setRequestHandler(ListRootsRequestSchema, async () => {
  return { roots };
});

// Notify server when roots change
async function addRoot(uri: string, name: string) {
  roots.push({ uri, name });

  await client.notification({
    method: "notifications/roots/list_changed"
  });
}
```

### Elicitation (Server Requests User Input)

```typescript
import { ElicitRequestSchema } from "@modelcontextprotocol/sdk/types.js";

client.setRequestHandler(ElicitRequestSchema, async (request) => {
  const { mode, message, requestedSchema, url, elicitationId } = request.params;

  if (mode === "form" || !mode) {
    // Form mode: collect structured data
    const userInput = await showFormDialog(message, requestedSchema);

    if (userInput === null) {
      return { action: "cancel" };
    }

    return {
      action: "accept",
      content: userInput  // Matches requestedSchema
    };
  }

  if (mode === "url") {
    // URL mode: redirect to external URL for sensitive input
    const userConsent = await confirmUrlNavigation(url, message);

    if (!userConsent) {
      return { action: "decline" };
    }

    // Open URL in secure browser context
    await openSecureUrl(url);

    return { action: "accept" };  // No content for URL mode
  }
});
```

---

## Error Handling

### JSON-RPC Error Codes

```typescript
enum McpErrorCode {
  // Standard JSON-RPC
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,

  // MCP-specific
  URLElicitationRequired = -32042,
}

// Handle errors
try {
  const result = await client.callTool({ name: "risky_tool", arguments: {} });
} catch (error) {
  if (error.code === McpErrorCode.MethodNotFound) {
    console.error("Tool not found");
  } else if (error.code === McpErrorCode.InvalidParams) {
    console.error("Invalid arguments:", error.data);
  } else if (error.code === McpErrorCode.URLElicitationRequired) {
    // Handle URL elicitation requirement
    const elicitations = error.data.elicitations;
    for (const elicit of elicitations) {
      await handleUrlElicitation(elicit);
    }
  }
}
```

### Retry with Exponential Backoff

```typescript
async function callToolWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isTransient = [
        McpErrorCode.InternalError,
        -32001  // Timeout
      ].includes(error.code);

      if (isTransient && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## Multi-Server Host Pattern

A host application typically manages multiple clients, one per server:

```typescript
class MCPHost {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, Transport> = new Map();

  async connectToServer(
    serverId: string,
    config: ServerConfig
  ): Promise<void> {
    const client = new Client({
      name: "my-host",
      version: "1.0.0"
    }, {
      capabilities: this.getClientCapabilities()
    });

    const transport = this.createTransport(config);

    await client.connect(transport);

    this.clients.set(serverId, client);
    this.transports.set(serverId, transport);
  }

  async disconnectServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (client) {
      await client.close();
      this.clients.delete(serverId);
      this.transports.delete(serverId);
    }
  }

  // Aggregate tools from all servers
  async getAllTools(): Promise<Tool[]> {
    const allTools: Tool[] = [];

    for (const [serverId, client] of this.clients) {
      const response = await client.listTools();
      for (const tool of response.tools) {
        allTools.push({
          ...tool,
          // Namespace tool names by server
          name: `${serverId}__${tool.name}`
        });
      }
    }

    return allTools;
  }

  // Route tool call to correct server
  async callTool(namespacedName: string, args: unknown): Promise<ToolResult> {
    const [serverId, toolName] = namespacedName.split("__");
    const client = this.clients.get(serverId);

    if (!client) {
      throw new Error(`Server not connected: ${serverId}`);
    }

    return await client.callTool({ name: toolName, arguments: args });
  }

  private createTransport(config: ServerConfig): Transport {
    if (config.type === "stdio") {
      return new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env
      });
    }

    if (config.type === "http") {
      return new StreamableHTTPClientTransport(new URL(config.url));
    }

    throw new Error(`Unknown transport type: ${config.type}`);
  }
}
```

---

## Integration with LLM (Anthropic Example)

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

class LLMIntegratedClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private tools: Tool[] = [];

  constructor() {
    this.mcp = new Client({ name: "llm-client", version: "1.0.0" });
    this.anthropic = new Anthropic();
  }

  async connect(transport: Transport): Promise<void> {
    await this.mcp.connect(transport);

    // Cache tools
    const response = await this.mcp.listTools();
    this.tools = response.tools;
  }

  async processQuery(query: string): Promise<string> {
    const messages: MessageParam[] = [
      { role: "user", content: query }
    ];

    // Convert MCP tools to Anthropic format
    const anthropicTools = this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }));

    // Initial LLM call
    let response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages,
      tools: anthropicTools
    });

    // Handle tool use loop
    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        c => c.type === "tool_use"
      );

      // Execute all tool calls
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await this.mcp.callTool({
            name: toolUse.name,
            arguments: toolUse.input
          });

          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: result.content.map(c =>
              c.type === "text" ? c.text : JSON.stringify(c)
            ).join("\n")
          };
        })
      );

      // Continue conversation with tool results
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages,
        tools: anthropicTools
      });
    }

    // Extract final text response
    const textContent = response.content.find(c => c.type === "text");
    return textContent?.text ?? "";
  }
}
```

---

## Testing with MCP Inspector

```bash
# Install inspector
npm install -g @modelcontextprotocol/inspector

# Run against your server
npx @modelcontextprotocol/inspector node server.js

# Access UI at http://localhost:5173
```

**Validation Checklist**:
- [ ] Connection establishes successfully
- [ ] Capabilities negotiated correctly
- [ ] Tools discovered and listed
- [ ] Tool calls execute and return results
- [ ] Errors display meaningful messages
- [ ] Session IDs propagate (HTTP transport)

---

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./build"
  }
}
```

**Package.json**:
```json
{
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js"
  }
}
```
