# ADR 007: Initialization Flow Architecture

## Status
Verified

## Context
The `src/init` directory implements the initialization workflow for the Thoughtbox server. This flow guides the agent through project selection, task definition, and context loading, ensuring a structured start to every session.

## Architecture

### 1. State Machine
The initialization process is modeled as a finite state machine managed by `InitHandler`.

-   **States**:
    -   `entry`: Initial state.
    -   `project-selection`: Choosing a project.
    -   `task-selection`: Choosing a task within a project.
    -   `aspect-selection`: Choosing an aspect (e.g., implementation, testing).
    -   `context-loaded`: Terminal state where work begins.
    -   `new-work`: Terminal state for starting fresh.
    [Source: `src/init/init-handler.ts:23-35`] [Status: VERIFIED].
-   **Transitions**: Transitions are determined by the presence of parameters (`mode`, `project`, `task`, `aspect`) in the `InitParams` object [Source: `src/init/init-handler.ts:107-134`] [Status: VERIFIED].

### 2. Session State Management
`StateManager` tracks the state of each MCP connection session independently.

-   **Storage**: Uses an in-memory `Map<string, SessionState>` keyed by session ID [Source: `src/init/state-manager.ts:92`] [Status: VERIFIED].
-   **Connection Stages**:
    -   `STAGE_1_UNINITIALIZED`: No init tool call yet.
    -   `STAGE_2_INIT_STARTED`: Init process begun.
    -   `STAGE_3_FULLY_LOADED`: Context loaded, ready for work.
    [Source: `src/init/state-manager.ts:27-31`] [Status: VERIFIED].
-   **Bound Root**: Supports binding a specific filesystem root to a session (SPEC-011 compliance) [Source: `src/init/state-manager.ts:36-41`] [Status: VERIFIED].

### 3. Resource-Based Navigation
The flow is exposed via dynamic resources, allowing agents to "navigate" by requesting URIs.

-   **URI Scheme**: `thoughtbox://init/{mode}/{project}/{task}/{aspect}` [Source: `src/init/init-handler.ts:256`] [Status: VERIFIED].
-   **Rendering**: `InitHandler` delegates to `MarkdownRenderer` to generate the content for each state (e.g., lists of projects, tasks) [Source: `src/init/init-handler.ts:71-92`] [Status: VERIFIED].

### 4. Indexing
The `IndexBuilder` (and `FileSystemIndexSource`) scans the filesystem to discover existing projects and tasks, populating the `SessionIndex` used by the handler.

-   **Source**: `FileSystemIndexSource` reads from the exports directory [Source: `src/init/index.ts:181-183`] [Status: VERIFIED].
-   **Builder**: `IndexBuilder` processes the source data to build the index [Source: `src/init/index.ts:186-190`] [Status: VERIFIED].

## Decision
The initialization flow ensures that agents have the necessary context before beginning work. The state machine approach provides a predictable and verifiable path to a "fully loaded" state. Using dynamic resources for navigation allows the agent to explore the available context naturally.
