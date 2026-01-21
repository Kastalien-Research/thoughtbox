# Thoughtbox Server Architecture

> **Version:** 1.3.0
> **Last Updated:** 2026-01-21
> **Purpose:** Source of truth for Thoughtbox server architecture and data design

---

## Documentation Index

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** (this file) | System overview, diagrams, core concepts |
| **[DATA-MODELS.md](./DATA-MODELS.md)** | Complete data model schemas (~40 types) |
| **[TOOL-INTERFACES.md](./TOOL-INTERFACES.md)** | Gateway routing, tool specs, storage interface |
| **[CONFIGURATION.md](./CONFIGURATION.md)** | Environment variables, cipher protocol, appendices |

---

## System Overview

Thoughtbox is an MCP (Model Context Protocol) server providing infrastructure for structured reasoning. It functions as a "reasoning ledger" for AI agents, enabling:

- **Thought Chain Management**: Track reasoning across multiple thoughts with revisions and branches
- **Auto-Numbering (SIL-102)**: Optional thought numbers - server auto-assigns if omitted
- **Session Continuity (SIL-103)**: Seamless state restoration on reconnect via `restoreFromSession()`
- **Event Streaming (SIL-104)**: JSONL event output for external consumers
- **Progressive Disclosure**: Stage-based tool availability for guided agent onboarding
- **Formal Protocol**: Cipher notation for deterministic server-side parsing
- **Real-Time Visualization**: Observatory WebSocket server for live reasoning graphs
- **Autonomous Critique**: MCP sampling API integration for LLM-based critique loops

```mermaid
graph TB
    subgraph "Client Layer"
        Agent[AI Agent / Claude]
        Client[MCP Client]
    end

    subgraph "Transport Layer"
        STDIO[stdio Transport]
        HTTP[Streamable HTTP]
    end

    subgraph "Thoughtbox Server"
        Gateway[Gateway Handler]
        Registry[Tool Registry]

        subgraph "Core Handlers"
            Thought[Thought Handler]
            Init[Init Handler]
            Session[Session Handler]
            Notebook[Notebook Handler]
            MentalModels[Mental Models Handler]
        end

        subgraph "Support Systems"
            Sampling[Sampling Handler]
            Discovery[Discovery Registry]
            Emitter[Thought Emitter]
            Events[Event Streamer SIL-104]
        end
    end

    subgraph "Persistence Layer"
        InMemory[In-Memory Storage]
        FileSystem[FileSystem Storage]
        LinkedStore[Linked Thought Store]
    end

    subgraph "Observatory"
        WSServer[WebSocket Server]
        UI[Web UI]
    end

    Agent --> Client
    Client --> STDIO
    Client --> HTTP
    STDIO --> Gateway
    HTTP --> Gateway
    Gateway --> Registry
    Registry --> Thought
    Registry --> Init
    Registry --> Session
    Registry --> Notebook
    Registry --> MentalModels
    Thought --> Sampling
    Thought --> Emitter
    Thought --> LinkedStore
    LinkedStore --> InMemory
    LinkedStore --> FileSystem
    Emitter --> WSServer
    WSServer --> UI
```

---

## Component Interaction Flow

```mermaid
sequenceDiagram
    participant A as Agent
    participant G as Gateway
    participant R as Tool Registry
    participant T as Thought Handler
    participant S as Storage
    participant O as Observatory

    Note over A,O: Session Initialization
    A->>G: gateway { operation: "start_new" }
    G->>R: Advance to Stage 1
    R-->>A: Session created

    Note over A,O: Load Protocol
    A->>G: gateway { operation: "cipher" }
    G->>R: Advance to Stage 2
    R-->>A: Cipher protocol loaded

    Note over A,O: Recording Thoughts
    A->>G: gateway { operation: "thought", thought: "..." }
    G->>T: Process thought
    T->>S: Persist thought
    T->>O: Emit thought event
    T-->>A: Thought recorded
```

---

## Module Dependency Graph

```mermaid
graph LR
    subgraph "Entry Points"
        index[index.ts]
        factory[server-factory.ts]
    end

    subgraph "Core"
        gateway[gateway/]
        thought[thought-handler.ts]
        registry[tool-registry.ts]
    end

    subgraph "Features"
        init[init/]
        sessions[sessions/]
        notebook[notebook/]
        mental[mental-models/]
    end

    subgraph "Infrastructure"
        persistence[persistence/]
        sampling[sampling/]
        observatory[observatory/]
        discovery[discovery-registry.ts]
        events[events/]
        references[references/]
    end

    index --> factory
    factory --> gateway
    factory --> registry
    factory --> discovery
    gateway --> thought
    gateway --> init
    gateway --> sessions
    gateway --> notebook
    gateway --> mental
    thought --> persistence
    thought --> sampling
    thought --> observatory
    thought --> events
    init --> persistence
    sessions --> persistence
    sessions --> references
```

---

## Progressive Disclosure System

The Tool Registry manages 4 stages of tool availability:

```mermaid
stateDiagram-v2
    [*] --> Stage0: Connection Start
    Stage0 --> Stage1: start_new / load_context
    Stage1 --> Stage2: cipher operation
    Stage2 --> Stage3: domain selection

    Stage0: Entry
    note right of Stage0
        Tools: thoughtbox_gateway
    end note

    Stage1: Init Complete
    note right of Stage1
        + session operations
    end note

    Stage2: Cipher Loaded
    note right of Stage2
        + thought, notebook, mental_models
    end note

    Stage3: Domain Active
    note right of Stage3
        + domain-filtered mental models
    end note
```

| Stage | Name | Tools Available | Trigger |
|-------|------|-----------------|---------|
| **0** | Entry | `thoughtbox_gateway` | Connection start |
| **1** | Init Complete | + `session`, `deep_analysis` operations | `start_new` or `load_context` |
| **2** | Cipher Loaded | + `thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models` | `cipher` operation |
| **3** | Domain Active | + domain-filtered mental models | Domain selected |

**Implementation:** `src/tool-registry.ts`

---

## Session Management

### State Machine

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Stage0: Client connects

    Stage0 --> Stage1: start_new / load_context
    Stage1 --> Stage2: cipher
    Stage2 --> Stage2: thought / notebook / mental_models

    Stage0 --> Stage0: get_state / list_sessions
    Stage1 --> Stage1: session operations

    Stage2 --> Stage1: session.resume (different session)

    Stage0: Entry\n(gateway only)
    Stage1: Init Complete\n(+ session)
    Stage2: Cipher Loaded\n(+ thought/notebook/mental_models)
```

### Session Lifecycle

```mermaid
sequenceDiagram
    participant A as Agent
    participant I as Init Handler
    participant S as StateManager
    participant P as Persistence

    Note over A,P: New Session Flow
    A->>I: start_new { title: "Debug API" }
    I->>S: setSessionId(uuid)
    I->>S: advanceStage(1)
    I->>P: createSession(...)
    I-->>A: Session created, Stage 1

    Note over A,P: Resume Session Flow
    A->>I: load_context { sessionId: "..." }
    I->>P: getSession(sessionId)
    P-->>I: Session data
    I->>S: setSessionId(sessionId)
    I->>S: advanceStage(1)
    I-->>A: Session loaded, Stage 1
```

### Session Continuity (SIL-103)

When an MCP connection resets (client disconnect, network interruption), Thoughtbox preserves session state:

```mermaid
sequenceDiagram
    participant A as Agent
    participant I as Init Handler
    participant S as StateManager
    participant L as LinkedStore
    participant P as Persistence

    Note over A,P: Reconnection with load_context
    A->>I: load_context { sessionId: "..." }
    I->>P: getSession(sessionId)
    P-->>I: Session data
    I->>S: setSessionId(sessionId)
    I->>L: restoreFromSession(sessionId)
    L->>P: getAllThoughts(sessionId)
    P-->>L: All thought data
    L->>L: Rebuild linked graph
    L-->>I: Restoration complete
    I->>S: advanceStage(1)
    I-->>A: Session restored, ready to continue
```

**Key behaviors:**
- Full thought chain reconstruction from persistence
- Branch and revision links restored
- Next thought number calculated automatically
- Seamless continuation from last thought

**Implementation:** `src/sessions/handlers.ts:restoreFromSession()`

---

## Event Streaming (SIL-104)

External consumers can receive Thoughtbox events via JSONL streaming:

```mermaid
graph LR
    subgraph "Thoughtbox Server"
        TH[ThoughtHandler]
        EE[EventEmitter]
        Stream[Event Stream]
    end

    subgraph "Output Targets"
        STDERR[stderr]
        STDOUT[stdout]
        FILE[File]
    end

    subgraph "Consumers"
        Logger[Log Aggregator]
        Monitor[Monitoring System]
        Pipeline[Data Pipeline]
    end

    TH -->|emit| EE
    EE --> Stream
    Stream --> STDERR
    Stream --> STDOUT
    Stream --> FILE
    STDERR --> Logger
    STDOUT --> Monitor
    FILE --> Pipeline
```

**Event Types:**
- `thought_added` - New thought recorded
- `thought_revised` - Thought revision created
- `branch_created` - New branch started
- `session_started` - New session created
- `session_loaded` - Existing session loaded
- `cipher_loaded` - Protocol notation loaded
- `stage_changed` - Progressive disclosure stage advanced

**Configuration:** See [CONFIGURATION.md](./CONFIGURATION.md#event-streaming)

---

## Observatory (Real-Time Visualization)

```mermaid
graph LR
    subgraph "Server"
        TH[ThoughtHandler]
        TE[ThoughtEmitter]
        WSS[WebSocketServer]
        CH[Channels]
    end

    subgraph "Client"
        UI[Web UI]
        Graph[Graph Renderer]
        Detail[Detail Panel]
    end

    TH -->|emitThoughtAdded| TE
    TE -->|broadcast| WSS
    WSS -->|channel messages| CH
    CH -->|WebSocket| UI
    UI --> Graph
    UI --> Detail
```

| Feature | Description |
|---------|-------------|
| Live Graph | Real-time reasoning visualization |
| Snake Layout | Compact left-to-right flow |
| Branch Rendering | Hierarchical branch display |
| Node Expansion | Click to explore thought details |
| Session Switching | Multi-session support |
| Detail Panel | Full thought inspection |

**Default port:** 1729 (taxicab number)

---

## Sampling Handler (Autonomous Critique)

```mermaid
sequenceDiagram
    participant A as Agent
    participant G as Gateway
    participant T as ThoughtHandler
    participant S as SamplingHandler
    participant MCP as MCP Client
    participant LLM as External LLM

    A->>G: thought { ..., critique: true }
    G->>T: addThought(...)
    T->>T: Store thought
    T->>S: requestCritique(thought)
    S->>MCP: sampling/createMessage
    MCP->>LLM: Critique request
    LLM-->>MCP: Critique response
    MCP-->>S: Response
    S-->>T: Critique text + metadata
    T->>T: Attach critique to thought
    T-->>A: Thought + critique
```

---

## Key Architectural Patterns

### Gateway-Only Architecture

All operations route through a single `thoughtbox_gateway` tool. This bypasses client tool list refresh limitations common in streaming HTTP.

### Linked Thought Store

O(1) thought lookups via node ID map. Supports trees through multiple `next` pointers per node.

### Progressive Disclosure

Stage-based tool visibility guides agents through proper initialization sequence.

### Fire-and-Forget Events

Observatory emitter doesn't block reasoning on listener failures.

### Atomic Filesystem Writes

FileSystemStorage uses temp files + atomic rename to prevent corruption.

---

## Quick Reference

### Core Data Types

| Type | Purpose | See |
|------|---------|-----|
| `ThoughtData` | Individual reasoning step | [DATA-MODELS.md](./DATA-MODELS.md#thoughtdata-schema) |
| `Session` | Container for thought chains | [DATA-MODELS.md](./DATA-MODELS.md#session-schema) |
| `ThoughtNode` | Graph node for linked store | [DATA-MODELS.md](./DATA-MODELS.md#thoughtnode-schema-linked-store) |

### Gateway Operations

| Operation | Stage | Purpose | See |
|-----------|-------|---------|-----|
| `start_new` | 0 → 1 | Create new session | [TOOL-INTERFACES.md](./TOOL-INTERFACES.md#gateway-architecture) |
| `load_context` | 0 → 1 | Resume existing session (SIL-103) | [TOOL-INTERFACES.md](./TOOL-INTERFACES.md#gateway-architecture) |
| `cipher` | 1 → 2 | Load protocol notation | [CONFIGURATION.md](./CONFIGURATION.md#cipher-protocol) |
| `thought` | 2 | Record reasoning step (SIL-102 auto-number) | [TOOL-INTERFACES.md](./TOOL-INTERFACES.md#thought-tool) |
| `read_thoughts` | 2 | Query thoughts from session | [TOOL-INTERFACES.md](./TOOL-INTERFACES.md#read-thoughts-tool) |
| `get_structure` | 2 | Get reasoning graph topology | [TOOL-INTERFACES.md](./TOOL-INTERFACES.md#get-structure-tool) |
| `deep_analysis` | 1 | Advanced session pattern analysis | [TOOL-INTERFACES.md](./TOOL-INTERFACES.md#deep-analysis-tool) |

### Configuration

| Variable | Default | See |
|----------|---------|-----|
| `THOUGHTBOX_TRANSPORT` | `http` | [CONFIGURATION.md](./CONFIGURATION.md#environment-variables) |
| `THOUGHTBOX_STORAGE` | `fs` | [CONFIGURATION.md](./CONFIGURATION.md#environment-variables) |
| `PORT` | `1731` | [CONFIGURATION.md](./CONFIGURATION.md#environment-variables) |
| `THOUGHTBOX_EVENT_OUTPUT` | `none` | [CONFIGURATION.md](./CONFIGURATION.md#event-streaming) |

---

*This document is the source of truth for Thoughtbox server architecture.*

*For detailed specifications, see: [Data Models](./DATA-MODELS.md) | [Tool Interfaces](./TOOL-INTERFACES.md) | [Configuration](./CONFIGURATION.md)*
