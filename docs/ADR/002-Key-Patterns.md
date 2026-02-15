# Key Architectural Patterns

## 1. Gateway Pattern

### Description
Instead of exposing individual tools for every operation (which can clutter the client interface and cause synchronization issues), the system exposes a single "Gateway" tool (`thoughtbox_gateway`). This tool acts as a router, dispatching requests to internal handlers based on an `operation` argument.

### Verification
-   **Single Entry Point**: The server registers `thoughtbox_gateway` as the primary tool.
    -   [Source: src/server-factory.ts:L333-L390] [Status: VERIFIED]
-   **Internal Routing**: The `GatewayHandler` switches on the `operation` field to call specific sub-handlers.
    -   [Source: src/gateway/gateway-handler.ts:L406-L461] [Status: VERIFIED]
-   **Schema Definition**: The input schema is a discriminated union of all possible operations.
    -   [Source: src/gateway/gateway-handler.ts:L31-L247] [Status: VERIFIED]

## 2. Progressive Disclosure

### Description
The system enforces a "Progressive Disclosure" model where advanced tools and operations are only available after specific initialization stages are met. This prevents the user (or agent) from accessing complex functionality before the necessary context is established.

### Verification
-   **Stage Definition**: Stages are defined in `DisclosureStage` (implied by usage).
-   **Stage Enforcement**: The `GatewayHandler` checks the current stage against the required stage for each operation before execution.
    -   [Claim] `isStageAtLeast` check prevents unauthorized access. [Source: src/gateway/gateway-handler.ts:L395-L401] [Status: VERIFIED]
-   **Stage Mapping**: Operations are explicitly mapped to required stages.
    -   [Claim] `OPERATION_REQUIRED_STAGE` map defines requirements. [Source: src/gateway/gateway-handler.ts:L263-L283] [Status: VERIFIED]
-   **Stage Advancement**: Successful operations can trigger a stage advancement.
    -   [Claim] `OPERATION_ADVANCES_TO` map defines transitions. [Source: src/gateway/gateway-handler.ts:L471-L479] [Status: VERIFIED]

## 3. Unified Prompt/Resource Pattern

### Description
To provide flexibility in how the agent consumes information, the system implements a "Unified Pattern" where content is exposed as *both* a Prompt (for direct insertion into the context) and a Resource (for reference or reading).

### Verification
-   **Evolution Check**: The "Evolution Check" content is registered as a prompt (`evolution-check`) and a resource (`thoughtbox://prompts/evolution-check`).
    -   [Claim] Prompt registration. [Source: src/server-factory.ts:L546] [Status: VERIFIED]
    -   [Claim] Resource registration. [Source: src/server-factory.ts:L945-L961] [Status: VERIFIED]
-   **Subagent Summarize**: Similarly, the "Subagent Summarize" pattern is available as both.
    -   [Source: src/server-factory.ts:L491] (Prompt) and [Source: src/server-factory.ts:L965] (Resource) [Status: VERIFIED]

## 4. Sub-Agent Context Isolation

### Description
The system encourages a pattern where complex retrieval or analysis tasks are delegated to sub-agents to preserve the main agent's context window. This is facilitated by specific prompts that instruct the agent to spawn a sub-task.

### Verification
-   **Implementation**: The `subagent-summarize` prompt explicitly instructs the model to use the `Task` tool to spawn a sub-agent.
    -   [Claim] Prompt contains instructions for "Task" tool usage. [Source: src/server-factory.ts:L509-L519] [Status: VERIFIED]
-   **Evolution Check**: The `evolution-check` prompt also uses this pattern to spawn a "Haiku sub-agent".
    -   [Claim] Prompt instructs to spawn a Haiku sub-agent. [Source: src/server-factory.ts:L566-L578] [Status: VERIFIED]

## 5. Deferred Initialization

### Description
Some components, particularly the initialization flow, are built asynchronously to avoid blocking server startup. The system handles this by checking for the existence of handlers before use.

### Verification
-   **Async Build**: `createInitFlow` is called but not awaited at the top level; it assigns `initHandler` when complete.
    -   [Source: src/server-factory.ts:L283-L309] [Status: VERIFIED]
-   **Runtime Check**: The `gatewayTool` callback checks if `gatewayHandler` is ready, and if not, attempts to create it or returns an error.
    -   [Source: src/server-factory.ts:L341-L367] [Status: VERIFIED]

## 6. Toolhost Dispatcher & Self-Describing Response

### Description
Complex tools like the Notebook use a "Toolhost Dispatcher" pattern where a single tool handles multiple sub-operations. Crucially, the response often includes the operation definition as an embedded resource, making the tool self-describing to the agent.

### Verification
-   **Dispatcher**: The `processTool` method switches on the `operation` argument to call specific internal methods.
    -   [Source: src/notebook/index.ts:L417-L457] [Status: VERIFIED]
-   **Self-Describing**: The response includes a `resource` block containing the operation's definition and metadata.
    -   [Claim] Response embeds operation definition. [Source: src/notebook/index.ts:L468-L482] [Status: VERIFIED]
