# Observability Architecture

## 1. Embedded Observatory Server

### Description
The system includes an optional, embedded "Observatory" server that runs alongside the main MCP server. This server provides a real-time window into the system's state, serving both a web-based UI and a WebSocket API for live updates.

### Verification
-   **Factory Pattern**: `createObservatoryServer` encapsulates the server creation logic.
    -   [Source: src/observatory/server.ts:L49-L270] [Status: VERIFIED]
-   **Dual Protocol**: It initializes both a standard Node.js `http.Server` and a custom `WebSocketServer`.
    -   [Claim] Creates HTTP and WebSocket servers. [Source: src/observatory/server.ts:L188-L191] [Status: VERIFIED]

## 2. Channel-Based Real-Time Communication

### Description
WebSocket communication is organized into "Channels". This allows different parts of the system (e.g., reasoning loop, system metrics) to broadcast updates to interested clients without tight coupling.

### Verification
-   **Channel Registration**: The server explicitly registers channels for `reasoning` and `observatory`.
    -   [Claim] Registers reasoning and observatory channels. [Source: src/observatory/server.ts:L194-L198] [Status: VERIFIED]

## 3. Hybrid Interface (REST + WebSocket)

### Description
The Observatory exposes data through two complementary interfaces:
1.  **REST API**: For polling current state (health, active sessions, session details).
2.  **WebSocket**: For streaming events (new thoughts, system alerts).

### Verification
-   **REST Endpoints**: The HTTP handler processes requests for `/api/health`, `/api/sessions`, etc.
    -   [Source: src/observatory/server.ts:L104-L174] [Status: VERIFIED]
-   **UI Serving**: The server also acts as a static file server for the Observatory UI HTML.
    -   [Claim] Serves UI at root path. [Source: src/observatory/server.ts:L94-L100] [Status: VERIFIED]
