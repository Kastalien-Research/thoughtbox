# SPEC: Gateway API Consistency -- Flatten Sub-Operations

**ADR**: ADR-012
**Date**: 2026-03-11

---

## Universal Call Shape

After this work, every Thoughtbox gateway call uses a single shape:

```
thoughtbox_gateway { operation: "<operation_name>", args: { ... } }
```

- `operation`: A flat string from the enum below. No nesting.
- `args`: A flat object of operation-specific parameters. No inner `operation` or `action` fields.

The field name is always `operation`, never `action`.

---

## Flattened Operation Enum (69 operations)

### Gateway Operations (5)

| Flat Name | Current Name | Module | Stage | Args Schema |
|-----------|-------------|--------|-------|-------------|
| `thought` | `thought` | gateway | 2 | See `src/gateway/operations.ts` `thought` |
| `read_thoughts` | `read_thoughts` | gateway | 2 | See `src/gateway/operations.ts` `read_thoughts` |
| `get_structure` | `get_structure` | gateway | 2 | See `src/gateway/operations.ts` `get_structure` |
| `cipher` | `cipher` | gateway | 1 | `{}` |
| `deep_analysis` | `deep_analysis` | gateway | 1 | See `src/gateway/operations.ts` `deep_analysis` |

No changes. These already use the target shape.

### Init Operations (7)

| Flat Name | Current Name | Module | Stage | Args Schema |
|-----------|-------------|--------|-------|-------------|
| `get_state` | `get_state` | init | 0 | `{}` |
| `list_sessions` | `list_sessions` | init | 0 | See `src/init/operations.ts` `list_sessions` |
| `navigate` | `navigate` | init | 0 | See `src/init/operations.ts` `navigate` |
| `load_context` | `load_context` | init | 0 | See `src/init/operations.ts` `load_context` |
| `start_new` | `start_new` | init | 0 | See `src/init/operations.ts` `start_new` |
| `list_roots` | `list_roots` | init | 0 | `{}` |
| `bind_root` | `bind_root` | init | 0 | See `src/init/operations.ts` `bind_root` |

No changes. These already use the target shape.

### Session Operations (8)

These currently require double-nesting: `{ operation: "session", args: { operation: "list", args: { ... } } }`.
After flattening, each becomes a top-level operation prefixed with `session_`.

| Flat Name | Current Sub-Op | Module | Stage | Args Schema |
|-----------|---------------|--------|-------|-------------|
| `session_list` | `list` | session | 1 | See `src/sessions/operations.ts` `list` |
| `session_get` | `get` | session | 1 | `{ sessionId: string }` |
| `session_search` | `search` | session | 1 | `{ query: string, limit?: number }` |
| `session_resume` | `resume` | session | 1 | `{ sessionId: string }` |
| `session_export` | `export` | session | 1 | See `src/sessions/operations.ts` `export` |
| `session_analyze` | `analyze` | session | 1 | `{ sessionId: string }` |
| `session_extract_learnings` | `extract_learnings` | session | 1 | See `src/sessions/operations.ts` `extract_learnings` |
| `session_discovery` | `discovery` | session | 1 | `{ action: string, toolName?: string }` |

### Notebook Operations (10)

These currently require double-nesting: `{ operation: "notebook", args: { operation: "create", args: { ... } } }`.
After flattening, each becomes a top-level operation prefixed with `notebook_`.

| Flat Name | Current Sub-Op | Module | Stage | Args Schema |
|-----------|---------------|--------|-------|-------------|
| `notebook_create` | `create` | notebook | 2 | See `src/notebook/operations.ts` `create` |
| `notebook_list` | `list` | notebook | 2 | `{}` |
| `notebook_load` | `load` | notebook | 2 | `{ path?: string, content?: string }` |
| `notebook_add_cell` | `add_cell` | notebook | 2 | See `src/notebook/operations.ts` `add_cell` |
| `notebook_update_cell` | `update_cell` | notebook | 2 | See `src/notebook/operations.ts` `update_cell` |
| `notebook_run_cell` | `run_cell` | notebook | 2 | `{ notebookId: string, cellId: string }` |
| `notebook_install_deps` | `install_deps` | notebook | 2 | `{ notebookId: string }` |
| `notebook_list_cells` | `list_cells` | notebook | 2 | `{ notebookId: string }` |
| `notebook_get_cell` | `get_cell` | notebook | 2 | See `src/notebook/operations.ts` `get_cell` |
| `notebook_export` | `export` | notebook | 2 | See `src/notebook/operations.ts` `export` |

### Mental Models Operations (4)

These currently require double-nesting: `{ operation: "mental_models", args: { operation: "get_model", args: { ... } } }`.
After flattening, each becomes a top-level operation prefixed with `models_`.

| Flat Name | Current Sub-Op | Module | Stage | Args Schema |
|-----------|---------------|--------|-------|-------------|
| `models_get` | `get_model` | mental-models | 2 | `{ model: string }` |
| `models_list` | `list_models` | mental-models | 2 | `{ tag?: string }` |
| `models_list_tags` | `list_tags` | mental-models | 2 | `{}` |
| `models_capability_graph` | `get_capability_graph` | mental-models | 2 | `{}` |

### Knowledge Operations (7)

These currently require: `{ operation: "knowledge", args: { action: "create_entity", ... } }`.
The `action` field is used instead of `operation`, and args are flat (no inner `args` object).
After flattening, each becomes a top-level operation prefixed with `knowledge_`.

| Flat Name | Current Sub-Op | Module | Stage | Args Schema |
|-----------|---------------|--------|-------|-------------|
| `knowledge_create_entity` | `create_entity` | knowledge | 2 | See `src/knowledge/operations.ts` `create_entity` |
| `knowledge_get_entity` | `get_entity` | knowledge | 2 | `{ entity_id: string }` |
| `knowledge_list_entities` | `list_entities` | knowledge | 2 | See `src/knowledge/operations.ts` `list_entities` |
| `knowledge_add_observation` | `add_observation` | knowledge | 2 | See `src/knowledge/operations.ts` `add_observation` |
| `knowledge_create_relation` | `create_relation` | knowledge | 2 | See `src/knowledge/operations.ts` `create_relation` |
| `knowledge_query_graph` | `query_graph` | knowledge | 2 | See `src/knowledge/operations.ts` `query_graph` |
| `knowledge_stats` | `stats` | knowledge | 2 | `{}` |

### Hub Operations (28)

Hub operations are dispatched through `thoughtbox_hub`, not `thoughtbox_gateway`. They already use single-level `{ operation, args }` dispatch internally. No structural change needed for hub. Listed here for completeness since the operations catalog (ADR-011) aggregates across all modules.

| Flat Name | Category | Stage | Args Schema |
|-----------|----------|-------|-------------|
| `register` | identity | 0 | `{ name: string, profile?: string, clientInfo?: string }` |
| `quick_join` | identity | 0 | `{ name: string, workspaceId: string, profile?: string }` |
| `list_workspaces` | identity | 0 | `{}` |
| `whoami` | agent | 1 | `{}` |
| `create_workspace` | agent | 1 | `{ name: string, description: string }` |
| `join_workspace` | agent | 1 | `{ workspaceId: string }` |
| `get_profile_prompt` | agent | 1 | `{ profile: string }` |
| `create_problem` | problems | 2 | See `src/hub/operations.ts` |
| `claim_problem` | problems | 2 | See `src/hub/operations.ts` |
| `update_problem` | problems | 2 | See `src/hub/operations.ts` |
| `list_problems` | problems | 2 | `{ workspaceId: string }` |
| `add_dependency` | problems | 2 | See `src/hub/operations.ts` |
| `remove_dependency` | problems | 2 | See `src/hub/operations.ts` |
| `ready_problems` | problems | 2 | `{ workspaceId: string }` |
| `blocked_problems` | problems | 2 | `{ workspaceId: string }` |
| `create_sub_problem` | problems | 2 | See `src/hub/operations.ts` |
| `create_proposal` | proposals | 2 | See `src/hub/operations.ts` |
| `review_proposal` | proposals | 2 | See `src/hub/operations.ts` |
| `merge_proposal` | proposals | 2 | See `src/hub/operations.ts` |
| `list_proposals` | proposals | 2 | `{ workspaceId: string }` |
| `mark_consensus` | consensus | 2 | See `src/hub/operations.ts` |
| `endorse_consensus` | consensus | 2 | See `src/hub/operations.ts` |
| `list_consensus` | consensus | 2 | `{ workspaceId: string }` |
| `post_message` | channels | 2 | See `src/hub/operations.ts` |
| `read_channel` | channels | 2 | See `src/hub/operations.ts` |
| `post_system_message` | channels | 2 | See `src/hub/operations.ts` |
| `workspace_status` | status | 2 | `{ workspaceId: string }` |
| `workspace_digest` | status | 2 | `{ workspaceId: string }` |

---

## Dispatch Pattern Changes

### Before (3 incompatible patterns)

1. **Gateway-native ops** (init, gateway): `{ operation: "thought", args: { thought: "..." } }` -- flat, uses `operation`
2. **Double-nested ops** (notebook, session, mental_models): `{ operation: "notebook", args: { operation: "create", args: { title: "..." } } }` -- nested, uses `operation` at both levels
3. **Knowledge ops**: `{ operation: "knowledge", args: { action: "create_entity", name: "...", type: "..." } }` -- flat args but uses `action` instead of `operation`

### After (1 pattern)

All operations: `{ operation: "<flat_name>", args: { ... } }` -- single-level, uses `operation`.

---

## Gateway Schema Enum Changes

The `gatewayToolInputSchema.operation` enum in `src/gateway/gateway-handler.ts` changes from 14 entries to **41** entries.

Remove 4 toolhost proxy entries: `notebook`, `session`, `mental_models`, `knowledge` (-4).
The remaining 10 unchanged entries: `get_state`, `list_sessions`, `navigate`, `load_context`, `start_new`, `list_roots`, `bind_root`, `cipher`, `thought`, `read_thoughts`, `get_structure`, `deep_analysis` (12 entries, not 10 — the original count of 14 included the 4 proxies, leaving 10; plus `read_thoughts` and `get_structure` were already present = 12).

Add 29 flattened sub-operations:
- 8 session: `session_list`, `session_get`, `session_search`, `session_resume`, `session_export`, `session_analyze`, `session_extract_learnings`, `session_discovery`
- 10 notebook: `notebook_create`, `notebook_list`, `notebook_load`, `notebook_add_cell`, `notebook_update_cell`, `notebook_run_cell`, `notebook_install_deps`, `notebook_list_cells`, `notebook_get_cell`, `notebook_export`
- 4 mental models: `models_get`, `models_list`, `models_list_tags`, `models_capability_graph`
- 7 knowledge: `knowledge_create_entity`, `knowledge_get_entity`, `knowledge_list_entities`, `knowledge_add_observation`, `knowledge_create_relation`, `knowledge_query_graph`, `knowledge_stats`

Net: 12 unchanged + 29 new = **41** gateway enum entries.

Hub's 28 operations remain in `thoughtbox_hub` (separate tool, not in gateway enum).

---

## Cipher Documentation Changes

The cipher in `src/resources/thoughtbox-cipher-content.ts` has two issues:

1. **Wrong tool name**: Line 278 references `thoughtbox_cipher` -- this tool does not exist. The correct call is `thoughtbox_gateway { operation: "cipher" }`.
2. **No API examples**: The cipher has no examples showing correct parameter names for common operations.

Changes:
- Replace `thoughtbox_cipher` with `thoughtbox_gateway { operation: "cipher" }`.
- Add a "Common API Calls" quick reference after the Quick Reference Card showing correct call shapes for `thought`, `read_thoughts`, `session_list`, `notebook_create`.

---

## Operations Catalog Changes (ADR-011)

The `thoughtbox_operations` tool aggregates from 7 module `getOperationsCatalog()` functions. After flattening:

1. Each module's catalog returns flattened names (e.g., notebook catalog lists `notebook_create` not `create`).
2. Resource URI pattern `thoughtbox://notebook/operations/{op}` accepts flattened names.
3. The `getOperation(name)` lookup accepts flattened names.
4. The `search` operation indexes on flattened names.

---

## Additional Inconsistency: mental-models `inputs` vs `inputSchema`

`src/mental-models/operations.ts` uses `inputs` as the field name in its `MENTAL_MODELS_OPERATIONS` array, while all other modules use `inputSchema`. This must be normalized to `inputSchema` as part of this work.

---

## Files Modified

| File | Change |
|------|--------|
| `src/gateway/gateway-handler.ts` | Expand enum to 39 entries. Replace 4 toolhost proxy handlers with direct dispatch using flattened names. Update `OPERATION_REQUIRED_STAGE` and `OPERATION_ADVANCES_TO` maps. Update `GATEWAY_TOOL.description`. |
| `src/notebook/operations.ts` | Rename `name` fields to `notebook_*` prefix. |
| `src/sessions/operations.ts` | Rename `name` fields to `session_*` prefix. |
| `src/mental-models/operations.ts` | Rename `name` fields to `models_*` prefix. Fix `inputs` field to `inputSchema`. |
| `src/knowledge/operations.ts` | Rename `name` fields to `knowledge_*` prefix. |
| `src/resources/thoughtbox-cipher-content.ts` | Fix `thoughtbox_cipher` reference. Add API quick reference. |
| `src/server-factory.ts` | Update resource template URIs if needed. |
| `src/knowledge/index.ts` (or handler) | Accept `operation` field instead of `action` field in `processOperation`. |

---

## Acceptance Criteria

1. **AC-1**: `thoughtbox_gateway { operation: "notebook_create", args: { title: "Test", language: "typescript" } }` creates a notebook.
2. **AC-2**: `thoughtbox_gateway { operation: "session_list", args: { limit: 5 } }` lists sessions.
3. **AC-3**: `thoughtbox_gateway { operation: "knowledge_create_entity", args: { name: "test", type: "Insight", label: "Test" } }` creates an entity.
4. **AC-4**: `thoughtbox_gateway { operation: "models_get", args: { model: "five-whys" } }` returns the mental model.
5. **AC-5**: Old proxy names (`notebook`, `session`, `mental_models`, `knowledge`) return "Unknown operation" errors.
6. **AC-6**: `thoughtbox_operations { operation: "list" }` returns all 69 operations with flattened names.
7. **AC-7**: `thoughtbox_operations { operation: "search", args: { query: "notebook" } }` returns `notebook_*` operations.
8. **AC-8**: Cipher content no longer references `thoughtbox_cipher` and includes API quick reference.
9. **AC-9**: All existing vitest tests pass after updating to flattened operation names.
10. **AC-10**: `GATEWAY_TOOL.description` documents flattened operation names.
