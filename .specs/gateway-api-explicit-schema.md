# Domain-Specific Gateway Tools

## Overview
Decompose the monolithic `thoughtbox_gateway` tool into a handful of logically grouped tools, each strictly typing their parameters. This replaces the opaque `args` record with explicit schemas. Mental models are removed from the system, and Progressive Disclosure is enforced via dynamic tool registration.

## Dynamic Tool Registration (Progressive Disclosure)

The MCP Server will no longer statically return all tools via `tools/list`. Instead, tools will be dynamically registered based on the session's current stage to enforce True Progressive Disclosure.

- **Stage 0 (No active session):** Exposes only `thoughtbox_init`.
- **Stage 1 (Initialized):** Exposes `thoughtbox_init` and `thoughtbox_session`.
- **Stage 2 (Active reasoning):** Exposes all tools (`thoughtbox_init`, `thoughtbox_session`, `thoughtbox_thought`, `thoughtbox_notebook`, `thoughtbox_knowledge`).

When a stage transition occurs, the MCP Server will emit the `notifications/tools/list_changed` event.

## Tool Definitions

Each tool will use a `z.discriminatedUnion` on the `operation` field for its specific subdomain.

### 1. thoughtbox_init (Stage 0)
Handles initialization and context loading.
- `get_state`
- `list_sessions`
- `load_context`
- `start_new`
- `navigate`
- `list_roots`
- `bind_root`

### 2. thoughtbox_session (Stage 1)
Handles session management and analysis.
- `session` (list, get, search, resume, export, analyze, extract_learnings, discovery)
- `deep_analysis`

### 3. thoughtbox_thought (Stage 2)
Handles all reasoning primitives.
- `thought`
- `read_thoughts`
- `get_structure`

### 4. thoughtbox_notebook (Stage 2)
Handles literate programming tasks.
- `notebook` (create, add_cell, update_cell, run_cell, install_deps, export)

### 5. thoughtbox_knowledge (Stage 2)
Handles graph operations.
- `knowledge_create_entity`
- `knowledge_get_entity`
- `knowledge_list_entities`
- `knowledge_add_observation`
- `knowledge_create_relation`
- `knowledge_query_graph`
- `knowledge_stats`

*Note: The `thoughtbox_mental_models` operations are officially deprecated and will be removed from the codebase.*

## Implementation Details
1. **Tool Registration & State Handling:** Modify `src/server-factory.ts` (or equivalent MCP tool registration logic) to dynamically register the 5 tools based on internal state. Implement firing of `list_changed` notifications upon state changes.
2. **Schema Definition:** Use Zod discriminated unions *within* each tool. For example, `thoughtbox_knowledge` will have a `z.discriminatedUnion("operation", [...])` covering its 7 specific operations.
3. **Deprecation:** Delete the mental models handler and associated specs/logic.
4. **Handler Delegation:** Top-level tool handlers will route the validated payloads directly to the internal Thoughtbox handlers.

## Acceptance Criteria
1. `tools/list` initially returns only `thoughtbox_init` when no session is active.
2. Firing `start_new` triggers a `list_changed` notification, and subsequent `tools/list` requests return newly unlocked tools.
3. The legacy `thoughtbox_gateway` tool is removed.
4. Attempting to call an operation with missing required parameters throws a standard MCP schema validation error.
5. All references to `mental_models` are purged from the system code.
