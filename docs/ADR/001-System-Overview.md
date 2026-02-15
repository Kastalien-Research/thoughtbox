# System Overview

## 1. High-Level Architecture

The Thoughtbox MCP Server is designed as a modular, event-driven system that exposes a single primary gateway tool to the client, while managing complex state and logic internally. It supports both HTTP and Stdio transports.

### 1.1 Entry Point & Transport
The application entry point is `src/index.ts`. It determines the transport mode based on environment variables (`THOUGHTBOX_TRANSPORT`).

-   **HTTP Transport**: Uses `StreamableHTTPServerTransport` for standard MCP communication over HTTP.
    -   [Claim] Supports HTTP transport. [Source: src/index.ts:L100-L218] [Status: VERIFIED]
-   **Stdio Transport**: Uses `StdioServerTransport` for local integration.
    -   [Claim] Supports Stdio transport. [Source: src/index.ts:L220-L253] [Status: VERIFIED]

### 1.2 Server Composition
The server is composed in `src/server-factory.ts` using a factory pattern. This ensures a side-effect-free creation process that can be tested or instantiated multiple times.

-   **Factory Function**: `createMcpServer` handles the wiring of all components.
    -   [Claim] Server creation is encapsulated in a factory function. [Source: src/server-factory.ts:L140] [Status: VERIFIED]

## 2. Core Components

### 2.1 Gateway Handler
The system uses a "Gateway Pattern" where a single MCP tool (`thoughtbox_gateway`) acts as the router for all operations. This avoids issues with client-side tool list refreshing and enables strict internal state management.

-   **Router**: The `GatewayHandler` receives the `operation` argument and delegates to specific handlers (Thought, Notebook, Session, etc.).
    -   [Claim] GatewayHandler routes operations like 'thought', 'notebook', 'session'. [Source: src/gateway/gateway-handler.ts:L406-L461] [Status: VERIFIED]

### 2.2 Storage Layer
Persistence is abstracted via the `ThoughtboxStorage` interface, with `FileSystemStorage` being the default implementation for local-first data ownership.

-   **Abstraction**: `createStorage` factory determines the backend.
    -   [Claim] Storage defaults to FileSystemStorage but supports InMemoryStorage. [Source: src/index.ts:L42-L83] [Status: VERIFIED]

### 2.3 Observability
The system includes a dedicated observability server and a separate gateway tool for metrics.

-   **Observatory Server**: A separate server instance for real-time observation.
    -   [Claim] Observatory server is optionally started. [Source: src/index.ts:L90-L98] [Status: VERIFIED]
-   **Observability Gateway**: A distinct tool (`observability_gateway`) allows querying metrics without session initialization.
    -   [Claim] Observability gateway tool registered separately. [Source: src/server-factory.ts:L423-L439] [Status: VERIFIED]

## 3. Component Wiring
The `createMcpServer` function wires together the following handlers:

1.  **ThoughtHandler**: Manages the core reasoning loop.
2.  **NotebookHandler**: Handles literate programming operations.
3.  **SessionHandler**: Manages session lifecycle and storage.
4.  **MentalModelsHandler**: Provides reasoning frameworks.
5.  **KnowledgeHandler**: Manages the knowledge graph (optional).
6.  **InitToolHandler**: Manages the initialization workflow.

-   [Claim] Handlers are instantiated and injected into the GatewayHandler. [Source: src/server-factory.ts:L345-L355] [Status: VERIFIED]
