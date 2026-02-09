# Observatory Architecture

The Observatory is Thoughtbox's real-time observability subsystem. It provides a WebSocket-based streaming interface and REST API for monitoring reasoning sessions, hub collaboration events, and self-improvement loop progress — all without affecting the observed processes.

## Key Files

| File | Role |
|------|------|
| `src/observatory/emitter.ts` | `ThoughtEmitter` singleton — fire-and-forget event bus |
| `src/observatory/ws-server.ts` | `WebSocketServer` — connection/subscription manager |
| `src/observatory/channel.ts` | `Channel` base class — topic-pattern routing |
| `src/observatory/channels/reasoning.ts` | `ReasoningChannel` + `InMemorySessionStore` |
| `src/observatory/channels/observatory.ts` | `ObservatoryChannel` — global session/improvement events |
| `src/observatory/channels/workspace.ts` | `WorkspaceChannel` — hub event bridge |
| `src/observatory/server.ts` | `ObservatoryServer` — HTTP handler, REST API, startup |
| `src/observatory/config.ts` | `ObservatoryConfig` — env-based configuration |
| `src/observatory/improvement-store.ts` | `ImprovementEventStore` — JSONL persistence for SIL events |
| `src/observatory/scorecard-aggregator.ts` | `ScorecardAggregator` — metrics computation |
| `src/observatory/schemas/thought.ts` | Zod schemas for Thought, Session, Branch |
| `src/index.ts` | Startup wiring — `maybeStartObservatory()` |
| `src/server-factory.ts` | Hub event bridging — `thoughtEmitter.emitHubEvent()` |

---

## Diagram 1 — High-Level System Context

Shows the Observatory's position relative to the rest of the system: external actors (MCP clients, browser UI) and internal event producers (ThoughtHandler, HubHandler).

```mermaid
flowchart LR
    subgraph External
        MCP[MCP Client]
        Browser[Browser UI]
    end

    subgraph Thoughtbox MCP Server
        TH[ThoughtHandler]
        HH[HubHandler]
        SF[server-factory.ts<br/>onEvent callback]
    end

    subgraph Observatory
        TE[ThoughtEmitter<br/>singleton]
        WSS[WebSocketServer]
        HTTP[ObservatoryServer<br/>HTTP/REST]
        RC[ReasoningChannel]
        OC[ObservatoryChannel]
        WC[WorkspaceChannel]
        SS[InMemorySessionStore]
        IS[ImprovementEventStore]
        SA[ScorecardAggregator]
    end

    subgraph Storage
        HS[HubStorage<br/>filesystem]
    end

    MCP -->|tool calls| TH
    MCP -->|tool calls| HH
    TH -->|emitThought*| TE
    TH -->|emitSession*| TE
    HH --> SF -->|emitHubEvent| TE
    TE --> RC
    TE --> OC
    TE --> WC
    RC --> WSS
    OC --> WSS
    WC --> WSS
    WSS -->|WebSocket| Browser
    HTTP -->|REST JSON| Browser
    HTTP -->|reads| SS
    HTTP -->|reads| HS
    HTTP -->|reads| IS
    IS --> SA
```

### Critical Invariant

The `ThoughtEmitter` is **fire-and-forget**. Calls are synchronous, return immediately, and listener errors never propagate back to the caller. The act of observation does NOT affect the reasoning process.

---

## Diagram 2 — Event Push Path: Thoughts

The complete path from a thought being recorded to it appearing in a browser via WebSocket.

```mermaid
sequenceDiagram
    participant TH as ThoughtHandler
    participant TE as ThoughtEmitter
    participant RC as ReasoningChannel
    participant OC as ObservatoryChannel
    participant SS as InMemorySessionStore
    participant WSS as WebSocketServer
    participant Browser

    Note over TH: Agent calls thoughtbox_gateway<br/>{ operation: "thought" }

    TH->>TE: emitThoughtAdded({ sessionId, thought, parentId })
    activate TE
    TE-->>RC: thought:added listener fires
    TE-->>OC: (no thought:added listener here)
    deactivate TE

    RC->>SS: addThought(sessionId, thought)
    RC->>WSS: broadcast("reasoning:{sessionId}", "thought:added", payload)
    RC->>WSS: broadcast("observatory", "thought:added", payload)
    WSS->>Browser: [topic, "thought:added", payload] JSON
```

### Session Lifecycle Events

```mermaid
sequenceDiagram
    participant TH as ThoughtHandler
    participant TE as ThoughtEmitter
    participant RC as ReasoningChannel
    participant OC as ObservatoryChannel
    participant SS as InMemorySessionStore
    participant WSS as WebSocketServer
    participant Browser

    Note over TH: Session starts (first thought)
    TH->>TE: emitSessionStarted({ session })
    TE-->>RC: session:started → SS.setSession(session)
    TE-->>OC: session:started → broadcast("observatory", "session:started")
    WSS->>Browser: ["observatory", "session:started", { session }]

    Note over TH: Session ends (nextThoughtNeeded = false)
    TH->>TE: emitSessionEnded({ sessionId, finalThoughtCount })
    TE-->>RC: session:ended → update session status, broadcast
    TE-->>OC: session:ended → broadcast("observatory", "session:ended")
    WSS->>Browser: ["reasoning:{id}", "session:ended", ...]
    WSS->>Browser: ["observatory", "session:ended", ...]
```

### Hub Event Push Path

```mermaid
sequenceDiagram
    participant HH as HubHandler
    participant SF as server-factory.ts<br/>onEvent callback
    participant TE as ThoughtEmitter
    participant WC as WorkspaceChannel
    participant WSS as WebSocketServer
    participant Browser

    Note over HH: Agent creates problem,<br/>posts message, etc.
    HH->>SF: onEvent({ type, workspaceId, data })
    SF->>TE: emitHubEvent({ type, workspaceId, data })
    TE-->>WC: hub:event listener fires
    WC->>WSS: broadcast("workspace", "hub:event", event)
    WSS->>Browser: ["workspace", "hub:event", { type, workspaceId, data }]
```

---

## Diagram 3 — REST Pull Path

HTTP request/response flows. The `ObservatoryServer` serves REST endpoints for querying state that accumulates in the `InMemorySessionStore` and `HubStorage`.

```mermaid
flowchart TD
    Browser[Browser UI]

    subgraph ObservatoryServer["ObservatoryServer (handleHttpRequest)"]
        UI["GET /<br/>GET /observatory<br/>→ HTML UI"]
        Health["GET /api/health<br/>→ { status, connections, activeSessions }"]
        Sessions["GET /api/sessions?status=&limit=&offset=<br/>→ { sessions[] }"]
        SessionDetail["GET /api/sessions/:id<br/>→ { session, thoughts[], branches{} }"]
        Improvements["GET /api/improvements?type=&iteration=&limit=<br/>→ { events[] }"]
        Scorecard["GET /api/scorecard<br/>→ { metrics, trend }"]

        subgraph HubAPI["Hub REST API (GET only)"]
            HubWS["GET /api/hub/workspaces"]
            HubProblems["GET /api/hub/workspaces/:id/problems"]
            HubProposals["GET /api/hub/workspaces/:id/proposals"]
            HubConsensus["GET /api/hub/workspaces/:id/consensus"]
            HubChannels["GET /api/hub/workspaces/:id/channels/:problemId"]
            HubAgents["GET /api/hub/workspaces/:id/agents"]
        end
    end

    Browser -->|HTTP GET| UI
    Browser -->|HTTP GET| Health
    Browser -->|HTTP GET| Sessions
    Browser -->|HTTP GET| SessionDetail
    Browser -->|HTTP GET| Improvements
    Browser -->|HTTP GET| Scorecard
    Browser -->|HTTP GET| HubAPI

    Sessions --> SS[InMemorySessionStore]
    SessionDetail --> SS
    Health --> SS
    Health --> WSS[WebSocketServer<br/>getConnectionCount]
    Improvements --> IS[ImprovementEventStore<br/>JSONL files]
    Scorecard --> IS
    HubAPI --> HS[HubStorage<br/>filesystem]
```

---

## Diagram 4 — Internal Component Architecture

All Observatory components and their relationships, showing data ownership and dependencies.

```mermaid
classDiagram
    class ThoughtEmitter {
        -instance: ThoughtEmitter
        +getInstance() ThoughtEmitter
        +emitThoughtAdded(data)
        +emitThoughtRevised(data)
        +emitThoughtBranched(data)
        +emitSessionStarted(data)
        +emitSessionEnded(data)
        +emitHubEvent(data)
        +emitImprovementEvent(data)
        +emitAgentSpawned(data)
        +emitTaskCreated(data)
        -safeEmit(event, data)
    }

    class WebSocketServer {
        -connections: Map~string, ClientConnection~
        -channels: Channel[]
        -maxConnections: number
        +registerChannel(channel)
        +broadcast(topic, event, payload)
        +start(portOrServer)
        +stop()
        +getConnectionCount() number
        -handleConnection(socket)
        -handleMessage(connection, data)
        -handleSubscribe(connection, topic)
        -findChannel(topic)
    }

    class Channel {
        -pattern: string
        -segments: TopicSegment[]
        -handlers: Map~string, RegisteredHandler~
        -joinHandler: JoinHandler
        +match(topic) TopicParams
        +on(event, schema, handler)
        +onJoin(handler)
        +handleJoin(context)
        +handleEvent(event, context, payload) boolean
    }

    class InMemorySessionStore {
        -sessions: Map~string, Session~
        -thoughts: Map~string, Thought[]~
        -branches: Map~string, Record~
        -MAX_SESSIONS: 1000
        +setSession(session)
        +addThought(sessionId, thought)
        +getSession(sessionId)
        +getActiveSessions() Session[]
        +getAllSessions() Session[]
        -cleanupOldSessions()
    }

    class ObservatoryServer {
        +start()
        +stop()
        +getWss() WebSocketServer
        +isRunning() boolean
        -handleHttpRequest(req, res)
        -handleHubApi(url, req, res)
    }

    class ImprovementEventStore {
        +initialize()
        +subscribe()
        +listEvents(filter) ImprovementEvent[]
        +summarize(filter) Summary
    }

    class ScorecardAggregator {
        +computeScorecard(opts) Scorecard
    }

    class ObservatoryConfig {
        +enabled: boolean
        +port: number = 1729
        +cors: string[]
        +path: string = "/ws"
        +maxConnections: number = 100
        +httpApi: boolean = true
    }

    ThoughtEmitter <.. Channel : listens to events
    WebSocketServer *-- Channel : registers 1..*
    Channel <|-- ReasoningChannel : pattern="reasoning:~sessionId~"
    Channel <|-- ObservatoryChannel : pattern="observatory"
    Channel <|-- WorkspaceChannel : pattern="workspace"
    ReasoningChannel --> InMemorySessionStore : reads/writes
    ObservatoryServer --> WebSocketServer : owns
    ObservatoryServer --> InMemorySessionStore : reads
    ObservatoryServer ..> ImprovementEventStore : creates per request
    ObservatoryServer ..> ScorecardAggregator : creates per request
    ObservatoryServer ..> HubStorage : reads (injected)
    ScorecardAggregator --> ImprovementEventStore : reads
    ObservatoryServer ..> ObservatoryConfig : configured by
```

---

## Diagram 5 — Channel Subscription Model

Topic patterns, subscription lifecycle, and snapshot-on-join behavior.

```mermaid
sequenceDiagram
    participant Client as Browser Client
    participant WSS as WebSocketServer
    participant Chan as Channel

    Note over Client, Chan: Connection Phase
    Client->>WSS: WebSocket connect
    WSS->>WSS: Create ClientConnection<br/>{ id, socket, subscriptions: Set }

    Note over Client, Chan: Subscription Phase
    Client->>WSS: ["reasoning:abc123", "subscribe", { id: "sub_1" }]
    WSS->>WSS: findChannel("reasoning:abc123")<br/>→ matches "reasoning:<sessionId>"
    WSS->>WSS: connection.subscriptions.add("reasoning:abc123")
    WSS->>Client: ["reasoning:abc123", "subscribed", { id: "sub_1" }]

    Note over Client, Chan: Snapshot-on-Join
    WSS->>Chan: handleJoin(context)
    Chan->>Chan: Load session + thoughts + branches
    Chan->>Client: ["reasoning:abc123", "session:snapshot",<br/>{ session, thoughts, branches }]

    Note over Client, Chan: Live Updates
    loop Each new thought
        Chan->>WSS: broadcast("reasoning:abc123", "thought:added", ...)
        WSS->>WSS: Filter connections with<br/>"reasoning:abc123" in subscriptions
        WSS->>Client: ["reasoning:abc123", "thought:added", { thought }]
    end

    Note over Client, Chan: Unsubscription
    Client->>WSS: ["reasoning:abc123", "unsubscribe", {}]
    WSS->>WSS: connection.subscriptions.delete("reasoning:abc123")
    WSS->>Client: ["reasoning:abc123", "unsubscribed", {}]
```

### Topic Patterns

| Channel | Pattern | Dynamic Params | Snapshot on Join |
|---------|---------|----------------|------------------|
| ReasoningChannel | `reasoning:<sessionId>` | `sessionId` | Full session state (session + thoughts + branches) |
| ObservatoryChannel | `observatory` | (none) | Active sessions list |
| WorkspaceChannel | `workspace` | (none) | None (clients fetch via REST) |

### Message Wire Format

All WebSocket messages use the same 3-tuple JSON format:

```json
[topic, event, payload]
```

Examples:
```json
["reasoning:abc123", "subscribe", { "id": "sub_1" }]
["reasoning:abc123", "thought:added", { "thought": {...}, "sessionId": "abc123" }]
["observatory", "session:started", { "session": {...} }]
["workspace", "hub:event", { "type": "problem_created", "workspaceId": "ws_1", "data": {...} }]
```

---

## Startup Wiring

The Observatory is conditionally started during server initialization:

```mermaid
flowchart TD
    Start["src/index.ts<br/>main()"]
    CS[createStorage<br/>→ { storage, hubStorage }]
    MSO[maybeStartObservatory<br/>hubStorage?]
    Config[loadObservatoryConfig<br/>from env vars]
    Check{THOUGHTBOX_OBSERVATORY_ENABLED<br/>== 'true'?}
    Create[createObservatoryServer<br/>{ config, hubStorage }]
    StartSrv[server.start]
    Register[Register channels:<br/>reasoning, observatory, workspace]
    Attach[Attach WSS to HTTP server]
    Listen["Listen on port<br/>(default 1729)"]

    Start --> CS --> MSO --> Config --> Check
    Check -- No --> Skip[Return null]
    Check -- Yes --> Create --> StartSrv --> Register --> Attach --> Listen
```

Environment variables:
- `THOUGHTBOX_OBSERVATORY_ENABLED=true` — enable the server
- `THOUGHTBOX_OBSERVATORY_PORT=1729` — HTTP/WS port
- `THOUGHTBOX_OBSERVATORY_CORS=*` — allowed origins
- `THOUGHTBOX_OBSERVATORY_PATH=/ws` — WebSocket path
- `THOUGHTBOX_OBSERVATORY_MAX_CONN=100` — max concurrent connections
