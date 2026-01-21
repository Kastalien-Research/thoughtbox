# SPEC-012: Peer Architecture

> Thoughtbox as MCP Server + Client for Autonomous Reasoning

**Status:** Draft
**Created:** 2025-01-21
**Author:** Claude (Opus 4.5)
**Requires:** SPEC-008 (Progressive Disclosure), existing sampling infrastructure

---

## 1. Problem Statement

### 1.1 The Sampling Gap

The MCP sampling primitive (`sampling/createMessage`) enables servers to request LLM inference from clients. This powers Thoughtbox's autonomous critique feature—when an agent adds a thought with `critique: true`, Thoughtbox asks the client to generate a critical evaluation.

**Problem:** Major MCP clients (Claude Code, Cursor, etc.) do not implement the sampling primitive. When Thoughtbox requests sampling, it receives error `-32601` (Method Not Found). The critique feature is effectively unusable.

### 1.2 The Composability Gap

MCP is designed as a composable protocol, but current implementations treat servers as isolated endpoints. Each server connects to one client; servers don't connect to other servers or to themselves.

This limits what's possible:
- No server-initiated reasoning loops
- No context-isolated sub-sessions
- No autonomous exploration without upstream agent involvement

### 1.3 Design Goals

1. **Enable critique in Claude Code** — Sampling works regardless of client support
2. **Enable autonomous sub-sessions** — Thoughtbox can spawn isolated reasoning contexts
3. **Maintain transparency** — Agents always know which code path executed
4. **Local-first** — No cloud dependencies; configuration via `.env`
5. **Graceful degradation** — Features work when possible, fail clearly when not

---

## 2. Architecture Overview

### 2.1 Current Architecture

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Claude    │ ───▶ │   Claude Code   │ ───▶ │   Thoughtbox    │
│   (agent)   │      │   (MCP client)  │      │   (MCP server)  │
└─────────────┘      └─────────────────┘      └─────────────────┘
                            │
                            ✗ No sampling support
```

### 2.2 Peer Architecture

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────────────────────────┐
│   Claude    │ ───▶ │   Claude Code   │ ───▶ │   Thoughtbox (Peer)             │
│   (agent)   │      │   (MCP client)  │      │                                 │
└─────────────┘      └─────────────────┘      │  ┌───────────────────────────┐  │
                                              │  │  MCP Server (existing)    │  │
                                              │  │  • Gateway, tools, etc.   │  │
                                              │  └───────────────────────────┘  │
                                              │                                 │
                                              │  ┌───────────────────────────┐  │
                                              │  │  Sampling Polyfill (new)  │  │
                                              │  │  • Direct Anthropic API   │  │
                                              │  │  • Fallback when client   │  │
                                              │  │    lacks sampling         │  │
                                              │  └───────────────────────────┘  │
                                              │                                 │
                                              │  ┌───────────────────────────┐  │
                                              │  │  MCP Client Pool (new)    │  │
                                              │  │  • Loopback connections   │  │
                                              │  │  • Sub-session spawning   │  │
                                              │  └───────────────────────────┘  │
                                              └─────────────────────────────────┘
                                                          │
                                                          ▼
                                              ┌─────────────────────────────────┐
                                              │  Thoughtbox (loopback instance) │
                                              │  • Isolated reasoning context   │
                                              │  • Own sampling (polyfilled)    │
                                              │  • Returns summary to parent    │
                                              └─────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 Sampling Polyfill

**Purpose:** Provide `sampling/createMessage` functionality when the MCP client doesn't support it.

**Location:** `src/sampling/polyfill.ts`

#### 3.1.1 Interface

```typescript
interface PolyfillConfig {
  apiKey?: string;              // From ANTHROPIC_API_KEY env var
  model?: string;               // Default: "claude-sonnet-4-5-20250929"
  maxTokens?: number;           // Default: 1000
}

interface PolyfillResult {
  text: string;
  model: string;
  source: "polyfill";
  latencyMs: number;
}

class SamplingPolyfill {
  constructor(config?: PolyfillConfig);

  /** Check if polyfill can be used (API key present) */
  isAvailable(): boolean;

  /** Create a message via direct API call */
  createMessage(params: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    systemPrompt?: string;
  }): Promise<PolyfillResult>;

  /** Get status for debugging/transparency */
  getStatus(): {
    available: boolean;
    initialized: boolean;
    model: string;
    reason?: string;
  };
}
```

#### 3.1.2 Behavior

1. **Lazy initialization** — Anthropic SDK loaded only when first used
2. **Configuration via environment** — `ANTHROPIC_API_KEY` required, model configurable
3. **No caching** — Each call is independent (stateless)
4. **Error propagation** — API errors bubble up with context

#### 3.1.3 Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for polyfill) | — | API key for direct calls |
| `THOUGHTBOX_CRITIQUE_MODEL` | No | `claude-sonnet-4-5-20250929` | Model for critique |
| `THOUGHTBOX_CRITIQUE_MAX_TOKENS` | No | `1000` | Max response tokens |

---

### 3.2 Refactored Sampling Handler

**Purpose:** Unified interface for sampling that automatically selects native MCP or polyfill.

**Location:** `src/sampling/handler.ts`

#### 3.2.1 Interface

```typescript
interface CritiqueResult {
  text: string;
  model: string;
  source: "mcp" | "polyfill";   // Transparency: which path was used
  latencyMs?: number;
}

interface SamplingStatus {
  nativeSupport: boolean | null;      // null = not yet determined
  polyfillAvailable: boolean;
  effectiveSource: "mcp" | "polyfill" | "unavailable";
}

class SamplingHandler {
  constructor(
    protocol: McpProtocol | null,
    polyfillConfig?: PolyfillConfig
  );

  /** Called during MCP capability negotiation */
  setClientCapabilities(capabilities: { sampling?: boolean }): void;

  /** Check if any sampling method is available */
  isAvailable(): boolean;

  /** Get detailed status */
  getStatus(): SamplingStatus;

  /** Request critique (auto-selects MCP or polyfill) */
  requestCritique(
    thought: string,
    context: ThoughtData[]
  ): Promise<CritiqueResult>;
}
```

#### 3.2.2 Selection Logic

```
requestCritique() called
        │
        ▼
┌───────────────────────────┐
│ clientSupportsSampling?   │
└───────────┬───────────────┘
            │
     ┌──────┴──────┐
     │             │
    Yes           No/Unknown
     │             │
     ▼             ▼
┌─────────┐  ┌──────────────────┐
│ Try MCP │  │ polyfill.        │
│ sampling│  │ isAvailable()?   │
└────┬────┘  └────────┬─────────┘
     │                │
     │         ┌──────┴──────┐
     │        Yes           No
     │         │             │
     │         ▼             ▼
     │   ┌──────────┐  ┌──────────────┐
     │   │ Use      │  │ Throw error: │
     │   │ polyfill │  │ "unavailable"│
     │   └──────────┘  └──────────────┘
     │
     ▼
┌─────────────────┐
│ Success?        │
└────────┬────────┘
         │
  ┌──────┴──────┐
  │             │
 Yes     No (-32601)
  │             │
  ▼             ▼
┌──────┐  ┌─────────────────┐
│Return│  │Mark native as   │
│result│  │unsupported,     │
└──────┘  │retry via        │
          │polyfill         │
          └─────────────────┘
```

#### 3.2.3 Error Messages

| Condition | Error Message |
|-----------|---------------|
| No native support, no API key | `"Critique unavailable: MCP client doesn't support sampling and ANTHROPIC_API_KEY is not set. Set ANTHROPIC_API_KEY in .env to enable critique."` |
| API key invalid | `"Sampling polyfill failed: Invalid API key. Check ANTHROPIC_API_KEY in your .env file."` |
| API rate limited | `"Sampling polyfill rate limited. Critique skipped for this thought."` |

---

### 3.3 MCP Client Pool

**Purpose:** Manage outbound MCP connections for loopback and (future) external servers.

**Location:** `src/peer/client-pool.ts`

#### 3.3.1 Interface

```typescript
interface PeerConnection {
  id: string;
  client: McpClient;
  type: "loopback";
  transport: "stdio";
  status: "connected" | "disconnected" | "error";
  depth: number;                    // Recursion depth for loopback
  createdAt: Date;
}

interface LoopbackConfig {
  env?: Record<string, string>;     // Environment overrides
  maxDepth?: number;                // Recursion limit (default: 3)
}

class ClientPool {
  constructor(config?: { maxLoopbackDepth?: number });

  /** Create loopback connection to new Thoughtbox instance */
  createLoopback(config?: LoopbackConfig): Promise<PeerConnection>;

  /** Get connection by ID */
  get(id: string): PeerConnection | undefined;

  /** List all active connections */
  list(): PeerConnection[];

  /** Close specific connection */
  close(id: string): Promise<void>;

  /** Close all connections (cleanup) */
  closeAll(): Promise<void>;

  /** Get current loopback depth (from environment) */
  getCurrentDepth(): number;
}
```

#### 3.3.2 Loopback Spawning

When `createLoopback()` is called:

1. **Check depth limit** — Prevent infinite recursion
2. **Spawn child process** — `node thoughtbox --stdio`
3. **Pass incremented depth** — `THOUGHTBOX_LOOPBACK_DEPTH` env var
4. **Connect as MCP client** — Using stdio transport
5. **Return connection handle** — Caller can invoke tools on it

```typescript
// Loopback spawn pseudocode
async createLoopback(config) {
  const currentDepth = parseInt(process.env.THOUGHTBOX_LOOPBACK_DEPTH || "0");

  if (currentDepth >= this.maxDepth) {
    throw new Error(`Loopback depth limit (${this.maxDepth}) reached`);
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [process.argv[1], "--stdio"],
    env: {
      ...process.env,
      ...config.env,
      THOUGHTBOX_LOOPBACK_DEPTH: String(currentDepth + 1),
      DISABLE_THOUGHT_LOGGING: "true",  // Reduce noise
    },
  });

  const client = new Client({ name: "thoughtbox-loopback" });
  await client.connect(transport);

  return { id: generateId(), client, type: "loopback", depth: currentDepth + 1 };
}
```

#### 3.3.3 Recursion Safety

| Depth | Instance | Can Spawn? |
|-------|----------|------------|
| 0 | Main Thoughtbox (connected to Claude Code) | Yes |
| 1 | First loopback | Yes |
| 2 | Second loopback | Yes |
| 3 | Third loopback (default limit) | No |

The depth limit is configurable via `THOUGHTBOX_MAX_LOOPBACK_DEPTH`.

---

### 3.4 Sub-Session Orchestrator

**Purpose:** High-level API for spawning autonomous reasoning sessions via loopback.

**Location:** `src/peer/sub-session.ts`

#### 3.4.1 Interface

```typescript
interface SubSessionConfig {
  /** Human-readable title for the sub-session */
  title: string;

  /** Initial thought to seed reasoning */
  seedThought: string;

  /** Mental model to apply (optional) */
  mentalModel?: string;

  /** Maximum thoughts before completion (default: 10) */
  maxThoughts?: number;

  /** Whether to request critique on each thought (default: true) */
  enableCritique?: boolean;

  /** Context inheritance */
  context?: {
    project?: string;
    task?: string;
    inheritCipher?: boolean;
  };
}

interface SubSessionResult {
  /** ID of the created session (persisted) */
  sessionId: string;

  /** All thoughts generated */
  thoughts: Array<{
    thoughtNumber: number;
    thought: string;
    critique?: string;
    timestamp: string;
  }>;

  /** Final summary (last thought or explicit summary) */
  summary: string;

  /** Execution metadata */
  meta: {
    totalThoughts: number;
    durationMs: number;
    tokensUsed?: number;        // If polyfill, we know this
    terminationReason: "completed" | "max_thoughts" | "error";
  };
}

class SubSessionOrchestrator {
  constructor(pool: ClientPool, polyfill: SamplingPolyfill);

  /** Spawn and run a sub-session to completion */
  spawn(config: SubSessionConfig): Promise<SubSessionResult>;

  /** Spawn but don't wait (returns handle for later retrieval) */
  spawnAsync(config: SubSessionConfig): Promise<{ handle: string }>;

  /** Get result of async sub-session */
  getResult(handle: string): Promise<SubSessionResult | null>;
}
```

#### 3.4.2 Autonomous Reasoning Loop

The sub-session runs autonomously using this loop:

```
spawn(config) called
        │
        ▼
┌─────────────────────────────────┐
│ 1. Create loopback connection   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 2. Initialize session           │
│    gateway.start_new(project,   │
│    task=config.title)           │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 3. Load cipher (if inherited)   │
│    gateway.cipher()             │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 4. Add seed thought             │
│    gateway.thought({            │
│      thought: seedThought,      │
│      thoughtNumber: 1,          │
│      nextThoughtNeeded: true    │
│    })                           │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 5. AUTONOMOUS LOOP              │◀──────────────┐
│    (polyfill generates next     │               │
│     thought based on context)   │               │
└─────────────────────────────────┘               │
        │                                         │
        ▼                                         │
┌─────────────────────────────────┐               │
│ nextThoughtNeeded &&            │──── Yes ──────┘
│ thoughtNumber < maxThoughts?    │
└─────────────────────────────────┘
        │
       No
        │
        ▼
┌─────────────────────────────────┐
│ 6. Close loopback, return       │
│    SubSessionResult             │
└─────────────────────────────────┘
```

#### 3.4.3 Thought Generation via Polyfill

Within the autonomous loop, each thought is generated by:

1. **Build context** — Previous thoughts in this sub-session
2. **Call polyfill** — `samplingPolyfill.createMessage({ messages, systemPrompt })`
3. **Parse response** — Extract thought content
4. **Record thought** — `gateway.thought({ thought, ... })`
5. **Check termination** — `nextThoughtNeeded` or max reached

The system prompt for autonomous reasoning:

```
You are continuing a reasoning session. Your task is to think through
the problem step by step.

Context:
- Session title: {title}
- Mental model: {mentalModel or "general reasoning"}
- Previous thoughts: {formatted thoughts}

Generate the next thought in this reasoning chain. Your response should be
a single thought that advances the reasoning. Include:
- What you're considering
- Any conclusions or observations
- Whether more thinking is needed

If you've reached a conclusion or the problem is resolved, indicate that
no further thoughts are needed.
```

---

### 3.5 Gateway Integration

**New operation:** `spawn_exploration`

**Location:** `src/gateway/gateway-handler.ts`

#### 3.5.1 Operation Schema

```typescript
{
  operation: "spawn_exploration",
  args: {
    /** Required: what this exploration is about */
    title: string,

    /** Required: initial thought/question to explore */
    seedThought: string,

    /** Optional: mental model to apply */
    mentalModel?: "rubber-duck" | "five-whys" | "pre-mortem" | "steelmanning" | ...,

    /** Optional: max thoughts (default: 10) */
    maxThoughts?: number,

    /** Optional: inherit current project/task context */
    inheritContext?: boolean,  // default: true

    /** Optional: run async and return handle */
    async?: boolean,  // default: false (wait for completion)
  }
}
```

#### 3.5.2 Response Schema

**Synchronous (async: false):**
```typescript
{
  operation: "spawn_exploration",
  status: "completed",
  subSessionId: string,
  summary: string,
  meta: {
    totalThoughts: number,
    durationMs: number,
    terminationReason: "completed" | "max_thoughts",
  },
  // Full thoughts available via: gateway.session({ operation: "get", sessionId })
}
```

**Asynchronous (async: true):**
```typescript
{
  operation: "spawn_exploration",
  status: "running",
  handle: string,  // Use with gateway.get_exploration_result({ handle })
}
```

#### 3.5.3 Stage Requirements

| Operation | Required Stage | Rationale |
|-----------|---------------|-----------|
| `spawn_exploration` | STAGE_2_CIPHER_LOADED | Sub-sessions need context established |
| `get_exploration_result` | STAGE_2_CIPHER_LOADED | Same as above |

---

## 4. Data Flow Examples

### 4.1 Critique with Polyfill

```
Agent: gateway.thought({ thought: "...", critique: true })
        │
        ▼
ThoughtHandler.processThought()
        │
        ├─── Persist thought
        │
        └─── samplingHandler.requestCritique(thought, context)
                    │
                    ▼
            ┌───────────────────┐
            │ clientSupports-   │
            │ Sampling = false  │
            │ (Claude Code)     │
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │ polyfill.         │
            │ createMessage()   │
            │                   │
            │ → Anthropic API   │
            │ ← critique text   │
            └─────────┬─────────┘
                      │
                      ▼
            Return: {
              text: "The reasoning assumes...",
              model: "claude-sonnet-4-5-20250929",
              source: "polyfill",
              latencyMs: 1842
            }
        │
        ▼
Response to agent: {
  thoughtNumber: 3,
  critique: {
    text: "The reasoning assumes...",
    source: "polyfill"   // <-- Transparency
  }
}
```

### 4.2 Sub-Session Exploration

```
Agent: gateway.spawn_exploration({
  title: "Evaluate microservices approach",
  seedThought: "The system currently has tight coupling between payment and inventory...",
  mentalModel: "pre-mortem",
  maxThoughts: 5
})
        │
        ▼
GatewayHandler.handle("spawn_exploration")
        │
        ▼
SubSessionOrchestrator.spawn(config)
        │
        ├─── ClientPool.createLoopback()
        │           │
        │           └─── Spawns: node thoughtbox --stdio
        │                        env: THOUGHTBOX_LOOPBACK_DEPTH=1
        │
        ├─── loopback.callTool("gateway", { operation: "start_new" })
        │
        ├─── loopback.callTool("gateway", { operation: "cipher" })
        │
        ├─── loopback.callTool("gateway", { operation: "thought", args: seedThought })
        │
        └─── AUTONOMOUS LOOP (depth=1 instance):
                    │
                    ├─── polyfill.createMessage({ context, prompt })
                    │         │
                    │         └─── Anthropic API → next thought text
                    │
                    ├─── loopback.callTool("gateway", { operation: "thought", args: nextThought })
                    │
                    └─── Repeat until nextThoughtNeeded=false OR maxThoughts
        │
        ▼
Return to agent: {
  operation: "spawn_exploration",
  status: "completed",
  subSessionId: "exp-abc123",
  summary: "Pre-mortem analysis identified 3 failure modes...",
  meta: { totalThoughts: 5, durationMs: 12340 }
}
```

---

## 5. Configuration Reference

### 5.1 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | For polyfill | — | API key for direct sampling calls |
| `THOUGHTBOX_CRITIQUE_MODEL` | No | `claude-sonnet-4-5-20250929` | Model for critique/autonomous thoughts |
| `THOUGHTBOX_CRITIQUE_MAX_TOKENS` | No | `1000` | Max tokens per critique |
| `THOUGHTBOX_MAX_LOOPBACK_DEPTH` | No | `3` | Recursion limit for loopback |
| `THOUGHTBOX_LOOPBACK_DEPTH` | Auto | `0` | Current depth (set by parent) |
| `THOUGHTBOX_AUTONOMOUS_MODEL` | No | `claude-sonnet-4-5-20250929` | Model for sub-session thoughts |

### 5.2 Example `.env`

```bash
# Required for critique and autonomous sub-sessions
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: Use Haiku for faster/cheaper autonomous reasoning
THOUGHTBOX_AUTONOMOUS_MODEL=claude-haiku-3-5-20250131

# Optional: Increase recursion depth (careful!)
THOUGHTBOX_MAX_LOOPBACK_DEPTH=5
```

---

## 6. Error Handling

### 6.1 Error Taxonomy

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| `SAMPLING_UNAVAILABLE` | No native support + no API key | "Critique unavailable: Set ANTHROPIC_API_KEY to enable" |
| `LOOPBACK_DEPTH_EXCEEDED` | Recursion limit hit | "Loopback depth limit (N) reached. This prevents infinite recursion." |
| `LOOPBACK_SPAWN_FAILED` | Child process failed to start | "Failed to spawn sub-session: {error}" |
| `POLYFILL_API_ERROR` | Anthropic API returned error | "Sampling polyfill error: {api_error}" |
| `SUBSESSION_TIMEOUT` | Autonomous loop exceeded time limit | "Sub-session timed out after {N}ms" |

### 6.2 Graceful Degradation

| Feature | Without API Key | With API Key |
|---------|-----------------|--------------|
| Basic thought recording | Works | Works |
| Critique (`critique: true`) | Silently skipped | Works (via polyfill) |
| Sub-session exploration | Error: requires API key | Works |
| Native MCP sampling | Works (if client supports) | Works (prefers native) |

---

## 7. Security Considerations

### 7.1 API Key Handling

- API key read from environment only, never logged
- Key passed to child processes via environment (not args)
- No key persistence to filesystem

### 7.2 Recursion Protection

- Hard limit on loopback depth (default: 3)
- Each level tracked via environment variable
- Depth checked before spawning, not after

### 7.3 Resource Limits

- Sub-sessions have thought limit (`maxThoughts`)
- Consider adding: time limit, token budget
- Child processes cleaned up on parent exit (SIGTERM handler)

---

## 8. Testing Strategy

### 8.1 Unit Tests

| Component | Test Cases |
|-----------|------------|
| `SamplingPolyfill` | API key detection, message creation, error handling |
| `SamplingHandler` | Native/polyfill selection, capability detection, fallback |
| `ClientPool` | Loopback creation, depth tracking, cleanup |
| `SubSessionOrchestrator` | Full spawn cycle, thought loop, termination |

### 8.2 Integration Tests

| Scenario | Description |
|----------|-------------|
| Critique via polyfill | Thought with `critique: true`, verify polyfill path |
| Loopback spawn | Create loopback, call tool, verify response |
| Sub-session end-to-end | `spawn_exploration` through to completion |
| Depth limit | Verify error at max depth |

### 8.3 Manual Testing

```bash
# Test polyfill availability
ANTHROPIC_API_KEY=sk-... node -e "
  const { SamplingPolyfill } = require('./dist/sampling/polyfill.js');
  const p = new SamplingPolyfill();
  console.log('Available:', p.isAvailable());
  console.log('Status:', p.getStatus());
"

# Test loopback depth detection
THOUGHTBOX_LOOPBACK_DEPTH=2 node -e "
  const { ClientPool } = require('./dist/peer/client-pool.js');
  const pool = new ClientPool();
  console.log('Current depth:', pool.getCurrentDepth());
"
```

---

## 9. Migration Path

### 9.1 Phase 1: Sampling Polyfill (Low Risk)

1. Add `SamplingPolyfill` class
2. Refactor `SamplingHandler` to use it
3. Update thought response to include `source`
4. Add configuration via environment

**Breaking changes:** None
**New dependencies:** `@anthropic-ai/sdk`

### 9.2 Phase 2: Client Pool (Medium Risk)

1. Add `ClientPool` class
2. Add depth tracking infrastructure
3. Test loopback creation/cleanup

**Breaking changes:** None
**New dependencies:** None (uses existing MCP SDK)

### 9.3 Phase 3: Sub-Session Orchestrator (Medium Risk)

1. Add `SubSessionOrchestrator` class
2. Add `spawn_exploration` gateway operation
3. Implement autonomous reasoning loop

**Breaking changes:** None
**New dependencies:** None

### 9.4 Phase 4: Production Hardening

1. Add timeout/budget limits
2. Add telemetry for autonomous loops
3. Add Observatory events for sub-sessions
4. Documentation and examples

---

## 10. Future Considerations

### 10.1 Not In Scope (This Spec)

- **Hub/aggregation pattern** — Connecting to external MCP servers. Deferred pending clearer use cases.
- **Streaming responses** — Autonomous thoughts streamed back as they're generated.
- **Multi-model support** — Using different providers for polyfill (OpenAI, etc.).

### 10.2 Potential Extensions

- **Parallel sub-sessions** — Spawn multiple explorations simultaneously
- **Sub-session branching** — Fork a sub-session mid-exploration
- **Cross-session references** — Sub-session can read parent's thoughts

---

## 11. References

- [MCP Sampling Specification](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling)
- [Claude Code MCP Limitations](https://code.claude.com/docs/en/mcp) (sampling not supported)
- [GitHub Issue #1785](https://github.com/anthropics/claude-code/issues/1785) (sampling feature request)
- [FastMCP Proxy Pattern](https://gofastmcp.com/servers/proxy) (prior art for server+client)
- SPEC-008: Progressive Disclosure (stage requirements)

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Polyfill** | Implementation of a feature when native support is missing |
| **Loopback** | MCP connection from Thoughtbox to another Thoughtbox instance |
| **Peer** | An MCP endpoint that is both server and client |
| **Sub-session** | Isolated reasoning session spawned via loopback |
| **Depth** | How many loopback levels deep the current instance is |
| **Native sampling** | MCP `sampling/createMessage` handled by the client |

---

## Appendix B: Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Polyfill over client patch | Can't modify Claude Code; polyfill is self-contained | 2025-01-21 |
| Depth limit default 3 | Balance between capability and runaway risk | 2025-01-21 |
| No hub pattern (yet) | Unclear value over multi-server client | 2025-01-21 |
| Source in response | Transparency for debugging; agent should know path | 2025-01-21 |
| Lazy Anthropic SDK init | Don't load if polyfill never used | 2025-01-21 |
