# MCP Client Best Practices

> **Protocol Version**: 2025-11-25

## Security

### 1. Network Security

#### DNS Rebinding Protection (HTTP Transport)

Servers MUST validate the `Origin` header on all incoming connections:

```typescript
// Server-side validation
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: { code: -32600, message: "Invalid origin" }
    });
  }

  next();
});
```

**Client Responsibility**: Only connect to trusted server endpoints.

#### TLS Enforcement

```typescript
// Always use HTTPS for remote servers
function validateUrl(url: string): void {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:" && !isLocalhost(parsed.hostname)) {
    throw new Error("Remote servers must use HTTPS");
  }
}

function isLocalhost(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}
```

#### Localhost Binding

When running local servers, bind to localhost only:

```typescript
// CORRECT
server.listen(3000, "127.0.0.1");

// WRONG - exposes to network
server.listen(3000, "0.0.0.0");
```

---

### 2. Authentication & Authorization

#### Credential Management

**Never hardcode or expose credentials**:

```typescript
// WRONG: Hardcoded
const client = new Client({ apiKey: "sk-1234..." });

// WRONG: Environment variable (visible to process)
const client = new Client({ apiKey: process.env.API_KEY });

// CORRECT: OS keychain or vault
import { getSecret } from "@keychain/secure-store";
const apiKey = await getSecret("mcp-server-credentials");

// CORRECT: Vault service
const credentials = await vault.getCredentials("mcp-server");
```

#### OAuth 2.1 with PKCE

For servers requiring OAuth:

```typescript
class OAuth2PKCEProvider {
  async authenticate(): Promise<Credentials> {
    // Generate PKCE verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    // Build authorization URL
    const authUrl = new URL(this.authorizationEndpoint);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", this.clientId);
    authUrl.searchParams.set("redirect_uri", this.redirectUri);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("scope", this.scopes.join(" "));

    // Get user consent (implementation-specific)
    const authCode = await this.getUserConsent(authUrl.toString());

    // Exchange code for tokens
    return await this.exchangeCode(authCode, codeVerifier);
  }
}
```

#### Session ID Security

For HTTP transport sessions:

```typescript
class SecureSessionManager {
  // Session IDs must be:
  // - Globally unique
  // - Cryptographically secure
  // - Only visible ASCII (0x21-0x7E)

  generateSessionId(): string {
    return crypto.randomUUID();
  }

  // Handle session ID securely
  storeSessionId(sessionId: string): void {
    // Store in memory or secure storage
    // Never log session IDs
    // Never include in error messages
    this.sessionId = sessionId;
  }

  // On 404: session expired
  handleExpiredSession(): void {
    this.sessionId = null;
    // Re-initialize connection
  }
}
```

---

### 3. Tool Execution Safety

#### User Consent for Destructive Operations

```typescript
class AuthorizationManager {
  async checkPermissions(
    toolName: string,
    toolAnnotations: ToolAnnotations
  ): Promise<boolean> {
    // Destructive operations require explicit consent
    if (toolAnnotations.destructiveHint === true) {
      return await this.requestUserApproval(
        `Allow ${toolName}? This operation will modify data.`
      );
    }

    // Read-only operations may proceed
    if (toolAnnotations.readOnlyHint === true) {
      return true;
    }

    // Unknown operations: be cautious
    return await this.requestUserApproval(
      `Allow ${toolName}? This operation's effects are unknown.`
    );
  }
}
```

#### Input Validation

Always validate tool arguments:

```typescript
import { z } from "zod";

async function callToolSafe(
  client: Client,
  name: string,
  args: unknown
): Promise<ToolResult> {
  // Get tool schema
  const tools = await client.listTools();
  const tool = tools.tools.find(t => t.name === name);

  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  // Validate against schema
  const schema = z.object(tool.inputSchema as z.ZodRawShape);
  const validatedArgs = schema.parse(args);

  // Sanitize inputs (remove potential injection vectors)
  const sanitizedArgs = sanitizeInputs(validatedArgs);

  return await client.callTool({ name, arguments: sanitizedArgs });
}
```

---

### 4. Data Privacy

#### User Consent for Data Sharing

```typescript
class DataSharingManager {
  async beforeSendingData(data: unknown, serverInfo: ServerInfo): Promise<void> {
    // Hosts must obtain explicit consent before exposing user data
    const consent = await this.requestConsent(
      `Share data with ${serverInfo.name}?`,
      this.summarizeData(data)
    );

    if (!consent) {
      throw new Error("User declined data sharing");
    }
  }

  async beforeResourceRead(uri: string): Promise<void> {
    // Validate resource access is within declared roots
    if (!this.isWithinRoots(uri)) {
      throw new Error(`Resource access denied: ${uri} outside roots`);
    }
  }
}
```

#### Sampling Security

When handling server sampling requests:

```typescript
async function handleSamplingRequest(
  request: CreateMessageRequest
): Promise<CreateMessageResult> {
  // 1. Always get user approval
  const approved = await showSamplingConsentUI({
    serverName: request.serverInfo.name,
    prompt: request.params.messages,
    systemPrompt: request.params.systemPrompt
  });

  if (!approved) {
    throw new McpError(-1, "User rejected sampling request");
  }

  // 2. Allow user to review/edit prompt before sending
  const editedMessages = await allowUserEdit(request.params.messages);

  // 3. Make LLM call
  const result = await llm.complete(editedMessages);

  // 4. Allow user to review result before returning to server
  const approvedResult = await showResultForApproval(result);

  return approvedResult;
}
```

---

### 5. Elicitation Security

#### Form Mode: No Sensitive Data

```typescript
// WRONG: Requesting sensitive data via form
{
  mode: "form",
  requestedSchema: {
    properties: {
      password: { type: "string" },  // NEVER!
      apiKey: { type: "string" }     // NEVER!
    }
  }
}

// CORRECT: Use URL mode for sensitive data
{
  mode: "url",
  url: "https://secure.example.com/enter-credentials",
  message: "Please enter your API key on the secure page"
}
```

#### URL Mode: Safe Handling

```typescript
class ElicitationHandler {
  async handleUrlElicitation(params: UrlElicitationParams): Promise<ElicitResult> {
    const { url, message } = params;

    // 1. Never auto-fetch or prefetch the URL
    // 2. Show full URL to user for examination
    // 3. Highlight the domain
    // 4. Warn about suspicious URLs (Punycode, etc.)

    const userConsent = await this.showUrlConsentDialog({
      url,
      message,
      domain: new URL(url).hostname,
      warnings: this.detectUrlWarnings(url)
    });

    if (!userConsent) {
      return { action: "decline" };
    }

    // 5. Open in secure browser context (not embedded webview)
    await this.openSecureBrowser(url);

    return { action: "accept" };
  }

  private detectUrlWarnings(url: string): string[] {
    const warnings: string[] = [];

    // Check for Punycode (IDN homograph attacks)
    if (/xn--/.test(url)) {
      warnings.push("URL contains Punycode - verify domain carefully");
    }

    // Check for unusual ports
    const parsed = new URL(url);
    if (parsed.port && !["80", "443", ""].includes(parsed.port)) {
      warnings.push(`Unusual port: ${parsed.port}`);
    }

    // Check for IP addresses
    if (/^\d+\.\d+\.\d+\.\d+/.test(parsed.hostname)) {
      warnings.push("URL uses IP address instead of domain name");
    }

    return warnings;
  }
}
```

---

## Error Handling

### 1. Error Classification

```typescript
enum ErrorCategory {
  Transient,    // Retry with backoff
  Permanent,    // Fail immediately
  Security,     // Escalate to user
  Protocol      // Reconnect/reinitialize
}

function classifyError(error: McpError): ErrorCategory {
  switch (error.code) {
    // Transient - retry
    case -32603:  // Internal error
    case -32001:  // Timeout
      return ErrorCategory.Transient;

    // Permanent - don't retry
    case -32600:  // Invalid request
    case -32601:  // Method not found
    case -32602:  // Invalid params
    case -32700:  // Parse error
      return ErrorCategory.Permanent;

    // Security - escalate
    case -32003:  // Unauthorized
      return ErrorCategory.Security;

    // Protocol - reconnect
    default:
      return ErrorCategory.Protocol;
  }
}
```

### 2. Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    jitter: true
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const category = classifyError(error);

      if (category !== ErrorCategory.Transient) {
        throw error;  // Don't retry non-transient errors
      }

      if (attempt < config.maxRetries - 1) {
        const delay = calculateDelay(attempt, config);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff
  let delay = config.baseDelay * Math.pow(2, attempt);

  // Cap at max delay
  delay = Math.min(delay, config.maxDelay);

  // Add jitter to prevent thundering herd
  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return delay;
}
```

### 3. Timeout Management

```typescript
class TimeoutManager {
  private defaultTimeout = 120000;  // 2 minutes
  private requestTimeouts = new Map<string, NodeJS.Timeout>();

  async sendWithTimeout<T>(
    requestId: string,
    sendFn: () => Promise<T>,
    timeout: number = this.defaultTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this.requestTimeouts.delete(requestId);

        // Send cancellation notification
        this.sendCancellation(requestId);

        reject(new McpError(-32001, "Request timeout"));
      }, timeout);

      this.requestTimeouts.set(requestId, timer);

      // Execute request
      sendFn()
        .then(result => {
          clearTimeout(timer);
          this.requestTimeouts.delete(requestId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          this.requestTimeouts.delete(requestId);
          reject(error);
        });
    });
  }

  // Reset timeout on progress notification
  onProgress(requestId: string): void {
    const timer = this.requestTimeouts.get(requestId);
    if (timer) {
      clearTimeout(timer);
      // Set new timeout (implementation varies)
    }
  }
}
```

---

## Performance

### 1. Token Efficiency

MCP communication consumes LLM context window tokens. Optimize aggressively.

#### Response Truncation

```typescript
interface TruncationConfig {
  maxTokens: number;
  preserveStructure: boolean;
}

function truncateResponse(
  data: unknown,
  config: TruncationConfig
): unknown {
  // Remove low-signal fields
  const cleaned = removeLowSignalFields(data);

  // Truncate arrays
  if (Array.isArray(cleaned)) {
    return {
      items: cleaned.slice(0, 10),
      totalCount: cleaned.length,
      truncated: cleaned.length > 10
    };
  }

  // Truncate strings
  if (typeof cleaned === "string" && cleaned.length > 1000) {
    return cleaned.slice(0, 1000) + "... [truncated]";
  }

  return cleaned;
}

function removeLowSignalFields(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  // Remove common low-signal fields
  const lowSignalKeys = [
    "id", "createdAt", "updatedAt", "metadata",
    "timestamp", "version", "_links", "_embedded"
  ];

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!lowSignalKeys.includes(key)) {
      result[key] = removeLowSignalFields(value);
    }
  }

  return result;
}
```

#### Concise Tool Responses

```typescript
// BAD: Verbose response wastes tokens
{
  "weather": {
    "temperature": {
      "value": 72.5,
      "unit": "fahrenheit",
      "precision": 1
    },
    "humidity": {
      "value": 65,
      "unit": "percentage"
    },
    "wind": {
      "speed": { "value": 5, "unit": "mph" },
      "direction": { "value": "N", "degrees": 0 }
    }
  }
}

// GOOD: Concise response preserves context
{
  "temp": "72°F",
  "humidity": "65%",
  "wind": "5mph N"
}
```

### 2. Connection Management

#### Connection Pooling (Multi-Server)

```typescript
class ConnectionPool {
  private connections = new Map<string, Client>();
  private maxConnections = 10;
  private idleTimeout = 300000;  // 5 minutes

  async getConnection(serverId: string): Promise<Client> {
    // Return existing connection
    if (this.connections.has(serverId)) {
      return this.connections.get(serverId)!;
    }

    // Create new connection
    if (this.connections.size >= this.maxConnections) {
      await this.evictIdleConnection();
    }

    const client = await this.createConnection(serverId);
    this.connections.set(serverId, client);

    return client;
  }

  private async evictIdleConnection(): Promise<void> {
    // Find least recently used connection
    // Close it to make room
  }
}
```

#### Request Queuing

```typescript
class RequestQueue {
  private queue: PendingRequest[] = [];
  private processing = 0;
  private maxConcurrent = 5;

  async enqueue<T>(
    request: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    while (
      this.queue.length > 0 &&
      this.processing < this.maxConcurrent
    ) {
      const { request, resolve, reject } = this.queue.shift()!;
      this.processing++;

      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.processing--;
        this.processQueue();
      }
    }
  }
}
```

---

## Logging

### 1. Structured Logging

```typescript
interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  event: string;
  serverId?: string;
  requestId?: string;
  durationMs?: number;
  error?: {
    code: number;
    message: string;
  };
}

class McpLogger {
  log(entry: LogEntry): void {
    // For stdio transport: ALWAYS use stderr
    // stdout is reserved for protocol messages
    console.error(JSON.stringify(entry));
  }

  logToolCall(
    serverId: string,
    toolName: string,
    requestId: string,
    durationMs: number,
    success: boolean,
    error?: Error
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: success ? "info" : "error",
      event: "tool_call",
      serverId,
      requestId,
      durationMs,
      error: error ? {
        code: (error as McpError).code ?? -1,
        message: error.message
      } : undefined
    });
  }
}
```

### 2. What to Log

**DO log**:
- Connection lifecycle events
- Tool calls (name, duration, success/failure)
- Error codes and messages
- Performance metrics

**DO NOT log**:
- Session IDs (security risk)
- User data or PII
- Full request/response payloads (use debug level only)
- Credentials or tokens

---

## Testing

### 1. Use MCP Inspector

```bash
# Install
npm install -g @modelcontextprotocol/inspector

# Run against server
npx @modelcontextprotocol/inspector node server.js

# Access UI
open http://localhost:5173
```

**Validation Checklist**:

- [ ] Connection establishes successfully
- [ ] Version negotiation works
- [ ] Capabilities exchanged correctly
- [ ] Tools list and execute
- [ ] Resources list and read
- [ ] Prompts list and get
- [ ] Errors have meaningful messages
- [ ] Session IDs propagate (HTTP)
- [ ] OAuth flow completes (if applicable)

### 2. Mock Transport for Unit Tests

```typescript
class MockTransport implements Transport {
  private responses: Map<string, unknown> = new Map();
  private sentMessages: JSONRPCMessage[] = [];

  mockResponse(method: string, result: unknown): void {
    this.responses.set(method, result);
  }

  getSentMessages(): JSONRPCMessage[] {
    return this.sentMessages;
  }

  async connect(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    this.sentMessages.push(message);
  }

  async *receive(): AsyncIterator<JSONRPCMessage> {
    for (const message of this.sentMessages) {
      if ("method" in message && "id" in message) {
        const response = this.responses.get(message.method);
        if (response) {
          yield {
            jsonrpc: "2.0",
            id: message.id,
            result: response
          };
        }
      }
    }
  }

  async close(): Promise<void> {}
}
```

### 3. Integration Test Pattern

```typescript
describe("MCP Client Integration", () => {
  let client: Client;
  let serverProcess: ChildProcess;

  beforeAll(async () => {
    // Start real server
    serverProcess = spawn("node", ["server.js"]);

    client = new Client({ name: "test", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: "node",
      args: ["server.js"]
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    serverProcess.kill();
  });

  test("lists tools", async () => {
    const response = await client.listTools();
    expect(response.tools.length).toBeGreaterThan(0);
  });

  test("calls tool successfully", async () => {
    const result = await client.callTool({
      name: "echo",
      arguments: { message: "hello" }
    });

    expect(result.content[0].text).toBe("hello");
  });
});
```

---

## Anti-Patterns to Avoid

### 1. Client Choosing Tools

```typescript
// WRONG: Client decides which tool to use
async function handleQuery(query: string) {
  if (query.includes("weather")) {
    return await client.callTool("get_weather", { city: extractCity(query) });
  }
}

// CORRECT: LLM decides, client executes
async function handleQuery(query: string) {
  const tools = await client.listTools();

  const llmResponse = await llm.complete({
    messages: [{ role: "user", content: query }],
    tools: tools.tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema
    }))
  });

  // Execute LLM's choice
  for (const toolUse of llmResponse.toolUses) {
    await client.callTool(toolUse);
  }
}
```

### 2. Forgetting Session IDs

```typescript
// WRONG: Not propagating session
async function makeRequest(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

// CORRECT: Always include session ID
async function makeRequest(url: string, body: unknown, sessionId?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }

  return fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
}
```

### 3. No Retry Logic

```typescript
// WRONG: Fail on first error
const result = await client.callTool("flaky_api", {});

// CORRECT: Retry transient errors
const result = await executeWithRetry(
  () => client.callTool("flaky_api", {}),
  { maxRetries: 3, baseDelay: 1000 }
);
```

### 4. Verbose Responses

```typescript
// WRONG: Return everything
return await database.query("SELECT * FROM users");  // 10,000 rows!

// CORRECT: Return summary
const users = await database.query("SELECT * FROM users LIMIT 10");
return {
  sample: users,
  totalCount: await database.count("users"),
  message: "Showing first 10 of many results"
};
```

### 5. Blocking on Long Operations

```typescript
// WRONG: Block indefinitely
const result = await client.callTool("long_running_analysis", data);

// CORRECT: Use tasks for long operations (experimental)
const task = await client.callToolAsTask("long_running_analysis", data);

// Poll for completion with timeout
const result = await pollTaskWithTimeout(task.taskId, 300000);  // 5 min max
```

---

## Deployment Checklist

### Pre-Production

- [ ] All sensitive operations require user consent
- [ ] Credentials stored in secure vault/keychain
- [ ] TLS enforced for all remote connections
- [ ] Origin validation enabled on servers
- [ ] Rate limiting implemented
- [ ] Timeout/retry logic in place
- [ ] Structured logging configured
- [ ] Error messages don't leak sensitive info

### Monitoring

- [ ] Connection success/failure rates
- [ ] Tool call latency (p50, p95, p99)
- [ ] Error rates by type
- [ ] Session duration and count
- [ ] Token usage per conversation

### Incident Response

- [ ] Runbook for session expiry issues
- [ ] Runbook for auth failures
- [ ] Runbook for server unavailability
- [ ] Escalation path for security issues
