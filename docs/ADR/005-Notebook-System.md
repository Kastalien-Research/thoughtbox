# ADR 005: Notebook System Architecture

## Status
Verified

## Context
The `src/notebook` directory implements a literate programming environment exposed via MCP tools. This system allows agents to create, manage, and execute code within persistent notebooks.

## Architecture

### 1. Toolhost Pattern
The notebook system follows the "Toolhost" pattern, where a single MCP tool (`notebook`) acts as a dispatcher for multiple operations.

-   **Dispatcher**: `NotebookHandler.processTool` routes requests based on the `operation` argument [Source: `src/notebook/index.ts:417-457`] [Status: VERIFIED].
-   **Operations**: Supported operations include `create`, `list`, `load`, `add_cell`, `update_cell`, `run_cell`, `install_deps`, `list_cells`, `get_cell`, and `export` [Source: `src/notebook/index.ts:547-556`] [Status: VERIFIED].

### 2. State Management
State is managed by `NotebookStateManager`, which handles both in-memory state and filesystem synchronization.

-   **In-Memory**: Uses a `Map<string, Notebook>` to store active notebooks [Source: `src/notebook/state.ts:47`] [Status: VERIFIED].
-   **Filesystem Sync**:
    -   Notebooks are stored in a temporary directory (default: `os.tmpdir()/thoughtbox-notebooks`) [Source: `src/notebook/state.ts:52`] [Status: VERIFIED].
    -   Each notebook has its own directory containing `src/` for code files and `README.md` for the notebook content [Source: `src/notebook/state.ts:72-74`] [Status: VERIFIED].
    -   Changes to cells are immediately written to disk to ensure persistence and execution readiness [Source: `src/notebook/state.ts:216-220`] [Status: VERIFIED].

### 3. Execution Model
Code execution is handled by spawning child processes, ensuring isolation from the main server process.

-   **JavaScript**: Executed via `node` [Source: `src/notebook/execution.ts:40`] [Status: VERIFIED].
-   **TypeScript**: Executed via `tsx` (fast TypeScript execution engine) [Source: `src/notebook/execution.ts:51`] [Status: VERIFIED].
-   **Dependencies**: `npm install` is executed in the notebook's directory [Source: `src/notebook/execution.ts:60`] [Status: VERIFIED].
-   **Security**: Filenames are validated to prevent path traversal [Source: `src/notebook/execution.ts:11-18`] [Status: VERIFIED].

### 4. Template System
The system supports creating notebooks from predefined templates.

-   **Templates**: Stored in `src/notebook/templates.generated.js` (imported as `AVAILABLE_TEMPLATES`) [Source: `src/notebook/index.ts:15`] [Status: VERIFIED].
-   **Instantiation**: `createNotebookFromTemplate` substitutes placeholders (`[TOPIC]`, `[DATE]`, `[LANGUAGE]`) and decodes the content [Source: `src/notebook/state.ts:89-113`] [Status: VERIFIED].

### 5. Data Format
Notebooks are serialized to a custom markdown format (`.src.md`) via `encoding.ts`.

-   **Export**: `exportNotebook` encodes the notebook state into a string and optionally writes it to a file [Source: `src/notebook/state.ts:350-370`] [Status: VERIFIED].
-   **Import**: `loadNotebook` reads the file and decodes it back into the in-memory structure [Source: `src/notebook/state.ts:140-155`] [Status: VERIFIED].

## Decision
The notebook system provides a robust, persistent, and executable environment for agents. The separation of state management, execution, and tool handling ensures modularity and testability. The use of `tsx` allows for seamless TypeScript execution without manual compilation steps.
