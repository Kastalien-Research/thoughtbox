# MCP Client Architecture

> **Protocol Version**: 2025-11-25

## Core Mental Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HOST APPLICATION                                  │
│   (Claude Desktop, VS Code Extension, Custom LLM App, CLI Tool)         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  MCP Client │  │  MCP Client │  │  MCP Client │   ...                │
│  │  (Server A) │  │  (Server B) │  │  (Server C) │                      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                      │
│         │                │                │                              │
│         ▼                ▼                ▼                              │
│  ┌──────────────────────────────────────────────────────┐               │
│  │              TRANSPORT LAYER                          │               │
│  │   stdio  │  Streamable HTTP  │  SSE (deprecated)      │               │
│  └──────────────────────────────────────────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  MCP Server │  │  MCP Server │  │  MCP Server │
│  (Local)    │  │  (Remote)   │  │  (Remote)   │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Key Principle**: **1:1 Client-to-Server Mapping**

- Each `Client` instance connects to exactly ONE server
- Host application manages MULTIPLE clients
- Clients are stateful messengers, NOT decision makers
- LLM decides which tools to use; client executes

---

## Architectural Layers

### Layer 1: Transport

Handles raw message delivery between client and server.

```
┌─────────────────────────────────────────────────────────────┐
│                     TRANSPORT                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    stdio     │  │ Streamable   │  │     SSE      │       │
│  │              │  │    HTTP      │  │ (deprecated) │       │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤       │
│  │ - Subprocess │  │ - Remote     │  │ - Legacy     │       │
│  │ - stdin/out  │  │ - Sessions   │  │ - HTTP+SSE   │       │
│  │ - Local only │  │ - SSE stream │  │ - Read-only  │       │
│  │ - Fast       │  │ - Resumable  │  │   stream     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Transport Interface**:
```typescript
interface Transport {
  connect(): Promise<void>;
  send(message: JSONRPCMessage): Promise<void>;
  receive(): AsyncIterator<JSONRPCMessage>;
  close(): Promise<void>;
}
```

#### stdio Transport

```
┌────────────┐        stdin (JSON-RPC)        ┌────────────┐
│   Client   │ ──────────────────────────────▶│   Server   │
│ (Host App) │◀────────────────────────────── │(Subprocess)│
└────────────┘       stdout (JSON-RPC)        └────────────┘
                     stderr (logging)
```

**Characteristics**:
- Client spawns server as child process
- Newline-delimited JSON-RPC messages
- No embedded newlines in messages
- stderr for logging only (not protocol)
- Best for local development/CLI tools

#### Streamable HTTP Transport

```
                    POST (request/response/notification)
┌────────────┐ ─────────────────────────────────────────────▶ ┌────────────┐
│   Client   │                                                 │   Server   │
│            │◀───────────────────────────────────────────────│            │
└────────────┘         SSE stream (server messages)           └────────────┘
                    GET (open SSE listener)
```

**Characteristics**:
- Single endpoint for POST and GET
- Session management via `Mcp-Session-Id` header
- Server can push requests/notifications via SSE
- Supports resumability with `Last-Event-ID`
- Best for production remote servers

**Session Lifecycle**:
```
Client                              Server
  │                                    │
  │─── POST /mcp (initialize) ────────▶│
  │◀── Response + Mcp-Session-Id ──────│
  │                                    │
  │─── POST /mcp (tool call) ─────────▶│  (include Mcp-Session-Id)
  │◀── Response ───────────────────────│
  │                                    │
  │─── GET /mcp (open SSE) ───────────▶│  (optional: listen for server msgs)
  │◀── SSE stream ─────────────────────│
  │                                    │
  │─── DELETE /mcp (end session) ─────▶│
  │◀── 200 OK / 405 Not Allowed ───────│
```

---

### Layer 2: Protocol

Handles JSON-RPC message framing and lifecycle.

```
┌─────────────────────────────────────────────────────────────┐
│                     PROTOCOL                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │  Initialize   │  │   Operation   │  │   Shutdown    │    │
│  │    Phase      │  │    Phase      │  │    Phase      │    │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤    │
│  │ - Version     │  │ - Requests    │  │ - Close       │    │
│  │   negotiation │  │ - Responses   │  │   transport   │    │
│  │ - Capability  │  │ - Notifica-   │  │ - Cleanup     │    │
│  │   exchange    │  │   tions       │  │   resources   │    │
│  │ - Info share  │  │ - Bidirect-   │  │               │    │
│  │               │  │   ional       │  │               │    │
│  └───────────────┘  └───────────────┘  └───────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Connection Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONNECTION LIFECYCLE                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 1. INITIALIZATION                                                    │ │
│  │    Client                           Server                           │ │
│  │      │                                │                              │ │
│  │      │─── initialize ────────────────▶│                              │ │
│  │      │    (protocolVersion,           │                              │ │
│  │      │     capabilities,              │                              │ │
│  │      │     clientInfo)                │                              │ │
│  │      │                                │                              │ │
│  │      │◀── InitializeResult ───────────│                              │ │
│  │      │    (protocolVersion,           │                              │ │
│  │      │     capabilities,              │                              │ │
│  │      │     serverInfo,                │                              │ │
│  │      │     instructions)              │                              │ │
│  │      │                                │                              │ │
│  │      │─── notifications/initialized ─▶│                              │ │
│  │      │                                │                              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 2. OPERATION                                                         │ │
│  │    (Bidirectional requests/responses/notifications)                  │ │
│  │                                                                      │ │
│  │    Client ◀════════════════════════════▶ Server                      │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 3. SHUTDOWN                                                          │ │
│  │    - Close transport                                                 │ │
│  │    - For stdio: close stdin, SIGTERM, SIGKILL                        │ │
│  │    - For HTTP: close connections, DELETE session                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Layer 3: Capabilities

Negotiated features between client and server.

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPABILITIES                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLIENT CAPABILITIES          SERVER CAPABILITIES            │
│  (client → server)            (server → client)              │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │ sampling         │        │ tools            │           │
│  │ - tools          │        │ - listChanged    │           │
│  │ - context        │        │                  │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │ roots            │        │ resources        │           │
│  │ - listChanged    │        │ - subscribe      │           │
│  │                  │        │ - listChanged    │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │ elicitation      │        │ prompts          │           │
│  │ - form           │        │ - listChanged    │           │
│  │ - url            │        │                  │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │ tasks            │        │ logging          │           │
│  │ - requests       │        │                  │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                              │
│                              ┌──────────────────┐           │
│                              │ completions      │           │
│                              │                  │           │
│                              └──────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Layer 4: Features

High-level functionality built on capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                      FEATURES                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SERVER → CLIENT                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ tools/list          → List available tools           │    │
│  │ tools/call          → Execute a tool                 │    │
│  │ resources/list      → List available resources       │    │
│  │ resources/read      → Read resource content          │    │
│  │ resources/subscribe → Subscribe to changes           │    │
│  │ prompts/list        → List available prompts         │    │
│  │ prompts/get         → Get prompt with arguments      │    │
│  │ completion/complete → Get argument completions       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  CLIENT → SERVER (via capability handlers)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ sampling/createMessage → Request LLM completion      │    │
│  │ roots/list             → Get filesystem boundaries   │    │
│  │ elicitation/create     → Request user input          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  NOTIFICATIONS (bidirectional)                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ notifications/initialized                            │    │
│  │ notifications/tools/list_changed                     │    │
│  │ notifications/resources/list_changed                 │    │
│  │ notifications/resources/updated                      │    │
│  │ notifications/prompts/list_changed                   │    │
│  │ notifications/roots/list_changed                     │    │
│  │ notifications/progress                               │    │
│  │ notifications/cancelled                              │    │
│  │ notifications/message (logging)                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Single Client Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                           MCP CLIENT                                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PUBLIC API                                    │   │
│  │                                                                  │   │
│  │  connect(transport)     close()                                  │   │
│  │  listTools()            callTool(name, args)                     │   │
│  │  listResources()        readResource(uri)                        │   │
│  │  listPrompts()          getPrompt(name, args)                    │   │
│  │  subscribeResource(uri)                                          │   │
│  │  setRequestHandler(schema, handler)                              │   │
│  │  setNotificationHandler(method, handler)                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│                                ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    INTERNAL COMPONENTS                           │   │
│  │                                                                  │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │   Request     │  │  Notification │  │   Capability  │        │   │
│  │  │   Manager     │  │   Handler     │  │   Store       │        │   │
│  │  ├───────────────┤  ├───────────────┤  ├───────────────┤        │   │
│  │  │ - ID tracking │  │ - Event       │  │ - Client caps │        │   │
│  │  │ - Timeouts    │  │   dispatch    │  │ - Server caps │        │   │
│  │  │ - Retries     │  │ - Handlers    │  │ - Negotiation │        │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘        │   │
│  │                                                                  │   │
│  │  ┌───────────────┐  ┌───────────────┐                           │   │
│  │  │   Session     │  │    Error      │                           │   │
│  │  │   Manager     │  │    Handler    │                           │   │
│  │  ├───────────────┤  ├───────────────┤                           │   │
│  │  │ - Session ID  │  │ - Retry logic │                           │   │
│  │  │ - State       │  │ - Escalation  │                           │   │
│  │  │ - Lifecycle   │  │ - Logging     │                           │   │
│  │  └───────────────┘  └───────────────┘                           │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│                                ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      TRANSPORT                                   │   │
│  │            (stdio | Streamable HTTP | SSE)                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Host Application Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HOST APPLICATION                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    USER INTERFACE                                │   │
│  │                                                                  │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │    Chat       │  │   Sampling    │  │  Elicitation  │        │   │
│  │  │  Interface    │  │   Consent UI  │  │   Forms/URLs  │        │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘        │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│                                ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    LLM INTEGRATION                               │   │
│  │                                                                  │   │
│  │  ┌───────────────────────────────────────────────────────┐      │   │
│  │  │ - Receive user query                                   │      │   │
│  │  │ - Aggregate tools from all connected servers           │      │   │
│  │  │ - Present tools to LLM                                 │      │   │
│  │  │ - Execute LLM-chosen tool calls via correct client     │      │   │
│  │  │ - Return results to LLM                                │      │   │
│  │  │ - Present final response to user                       │      │   │
│  │  └───────────────────────────────────────────────────────┘      │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│                                ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    CLIENT MANAGER                                │   │
│  │                                                                  │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │  MCP Client A │  │  MCP Client B │  │  MCP Client C │        │   │
│  │  │  (weather)    │  │  (calendar)   │  │  (database)   │        │   │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘        │   │
│  │          │                  │                  │                 │   │
│  │          ▼                  ▼                  ▼                 │   │
│  │      Transport          Transport          Transport             │   │
│  │       (stdio)           (HTTP)             (stdio)               │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
   MCP Server A           MCP Server B           MCP Server C
```

---

## Message Flow Patterns

### Tool Orchestration Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                    TOOL ORCHESTRATION                                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User                Host               LLM               MCP Servers   │
│   │                   │                  │                     │        │
│   │─ "What's the ────▶│                  │                     │        │
│   │   weather?"       │                  │                     │        │
│   │                   │                  │                     │        │
│   │                   │─ Aggregate ─────▶│                     │        │
│   │                   │   tools from     │                     │        │
│   │                   │   all servers    │                     │        │
│   │                   │                  │                     │        │
│   │                   │─ Query + tools ─▶│                     │        │
│   │                   │                  │                     │        │
│   │                   │◀─ tool_use: ─────│                     │        │
│   │                   │   get_weather    │                     │        │
│   │                   │                  │                     │        │
│   │                   │─────────────────────────── callTool ──▶│        │
│   │                   │                  │                     │        │
│   │                   │◀────────────────────────── result ─────│        │
│   │                   │                  │                     │        │
│   │                   │─ tool_result ───▶│                     │        │
│   │                   │                  │                     │        │
│   │                   │◀─ Final text ────│                     │        │
│   │                   │                  │                     │        │
│   │◀─ "It's 72°F" ────│                  │                     │        │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Sampling Flow (Server-Initiated)

```
┌────────────────────────────────────────────────────────────────────────┐
│                    SAMPLING FLOW                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Server                Client/Host            LLM Provider              │
│   │                       │                       │                     │
│   │─ sampling/create ────▶│                       │                     │
│   │   Message             │                       │                     │
│   │                       │                       │                     │
│   │                       │─ (consent UI) ───────▶│                     │
│   │                       │                       │                     │
│   │                       │─ API call ───────────▶│                     │
│   │                       │   with messages       │                     │
│   │                       │                       │                     │
│   │                       │◀─ Completion ─────────│                     │
│   │                       │                       │                     │
│   │◀─ CreateMessage ──────│                       │                     │
│   │   Result              │                       │                     │
│   │                       │                       │                     │
│   │   (Server continues   │                       │                     │
│   │    processing with    │                       │                     │
│   │    LLM result)        │                       │                     │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Elicitation Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                    ELICITATION FLOW                                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FORM MODE                                                              │
│  ─────────                                                              │
│  Server                Client                 User                      │
│   │                       │                    │                        │
│   │─ elicitation/create ─▶│                    │                        │
│   │   mode: "form"        │                    │                        │
│   │   schema: {...}       │                    │                        │
│   │                       │                    │                        │
│   │                       │─ Show form ───────▶│                        │
│   │                       │                    │                        │
│   │                       │◀─ User input ──────│                        │
│   │                       │                    │                        │
│   │◀─ ElicitResult ───────│                    │                        │
│   │   action: "accept"    │                    │                        │
│   │   content: {...}      │                    │                        │
│                                                                         │
│  URL MODE                                                               │
│  ────────                                                               │
│  Server                Client                 User         External URL │
│   │                       │                    │                │       │
│   │─ elicitation/create ─▶│                    │                │       │
│   │   mode: "url"         │                    │                │       │
│   │   url: "https://..."  │                    │                │       │
│   │                       │                    │                │       │
│   │                       │─ Show URL + ──────▶│                │       │
│   │                       │   get consent      │                │       │
│   │                       │                    │                │       │
│   │                       │◀─ User consents ───│                │       │
│   │                       │                    │                │       │
│   │                       │─ Open secure ──────────────────────▶│       │
│   │                       │   browser          │                │       │
│   │                       │                    │                │       │
│   │◀─ ElicitResult ───────│                    │       User     │       │
│   │   action: "accept"    │                    │     interacts  │       │
│   │                       │                    │      with URL  │       │
│   │                       │                    │                │       │
│   │◀─ notifications/ ─────────────────────────────── complete ──│       │
│   │   elicitation/                             │                │       │
│   │   complete            │                    │                │       │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## State Management

### Client State Machine

```
┌────────────────────────────────────────────────────────────────────────┐
│                    CLIENT STATE MACHINE                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                      ┌──────────────┐                                   │
│                      │  DISCONNECTED │                                  │
│                      └───────┬───────┘                                  │
│                              │                                          │
│                              │ connect(transport)                       │
│                              ▼                                          │
│                      ┌──────────────┐                                   │
│                      │  CONNECTING  │                                   │
│                      └───────┬───────┘                                  │
│                              │                                          │
│                              │ transport.connect()                      │
│                              ▼                                          │
│                      ┌──────────────┐                                   │
│                      │ INITIALIZING │                                   │
│                      └───────┬───────┘                                  │
│                              │                                          │
│               initialize request/response                               │
│               + initialized notification                                │
│                              │                                          │
│                              ▼                                          │
│                      ┌──────────────┐                                   │
│             ┌───────▶│   CONNECTED  │◀───────┐                          │
│             │        └───────┬───────┘        │                         │
│             │                │                │                         │
│        operations       close()         error                           │
│             │                │                │                         │
│             │                ▼                │                         │
│             │        ┌──────────────┐         │                         │
│             └────────│   CLOSING    │─────────┘                         │
│                      └───────┬───────┘                                  │
│                              │                                          │
│                              │ transport.close()                        │
│                              ▼                                          │
│                      ┌──────────────┐                                   │
│                      │  DISCONNECTED │                                  │
│                      └──────────────┘                                   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Session State (HTTP Transport)

```
┌────────────────────────────────────────────────────────────────────────┐
│                    SESSION STATE                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Session {                                                              │
│    id: string              // Mcp-Session-Id from server                │
│    state: "active" | "expired"                                          │
│    lastActivity: Date                                                   │
│    serverCapabilities: ServerCapabilities                               │
│  }                                                                      │
│                                                                         │
│  On 404 Response:                                                       │
│    1. Session expired                                                   │
│    2. Clear session state                                               │
│    3. Re-initialize (send new initialize request)                       │
│                                                                         │
│  On Disconnect:                                                         │
│    1. Attempt reconnect with Last-Event-ID (if using SSE)               │
│    2. Server may replay missed messages                                 │
│    3. Continue from last known state                                    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Extension Points

### Custom Transport

```typescript
class CustomTransport implements Transport {
  async connect(): Promise<void> {
    // Establish connection
  }

  async send(message: JSONRPCMessage): Promise<void> {
    // Send message over custom channel
  }

  async *receive(): AsyncIterator<JSONRPCMessage> {
    // Yield incoming messages
  }

  async close(): Promise<void> {
    // Clean up
  }
}

// Usage
const client = new Client({ name: "my-client", version: "1.0.0" });
await client.connect(new CustomTransport());
```

### Custom Request Handler

```typescript
// Handle server-initiated requests
client.setRequestHandler(CustomRequestSchema, async (request) => {
  // Process request
  return { result: "processed" };
});
```

### Middleware Pattern

```typescript
class ClientMiddleware {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async callToolWithLogging(name: string, args: unknown) {
    console.log(`Calling tool: ${name}`);
    const start = Date.now();

    try {
      const result = await this.client.callTool({ name, arguments: args });
      console.log(`Tool ${name} completed in ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.error(`Tool ${name} failed:`, error);
      throw error;
    }
  }
}
```
