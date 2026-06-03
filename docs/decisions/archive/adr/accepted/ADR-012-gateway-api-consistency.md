# ADR-012: Gateway API Consistency -- Flatten Sub-Operations

**Status**: Accepted
**Date**: 2026-03-11
**Deciders**: Thoughtbox development team

## Context

The Thoughtbox gateway (`thoughtbox_gateway`) routes 69 operations across 7 modules. Three friction points have emerged from testing and development:

### Problem 1: Three incompatible dispatch patterns

The gateway has three different call shapes depending on which module you target:

1. **Gateway-native operations** (init, gateway -- 12 ops): Flat dispatch.
   ```
   { operation: "thought", args: { thought: "...", nextThoughtNeeded: true } }
   ```

2. **Toolhost-proxied operations** (notebook, session, mental_models -- 22 ops): Double-nested dispatch. The gateway `args` contain an inner `operation` + `args` pair.
   ```
   { operation: "notebook", args: { operation: "create", args: { title: "...", language: "typescript" } } }
   ```

3. **Knowledge operations** (7 ops): Flat args but uses `action` instead of `operation`.
   ```
   { operation: "knowledge", args: { action: "create_entity", name: "...", type: "Insight", label: "..." } }
   ```

An agent calling the gateway must learn three dispatch conventions. The double-nesting pattern is the worst offender: agents frequently send `{ operation: "notebook", args: { title: "..." } }` (missing the inner nesting), get a cryptic error, and retry.

### Problem 2: Knowledge uses `action` instead of `operation`

`gateway-handler.ts` line 1122 checks `args.action` for knowledge dispatch while line 926 checks `args.operation` for notebook/session/mental-models dispatch. This asymmetry means an agent that learns one pattern gets the other wrong.

### Problem 3: Cipher docs reference nonexistent tool

`src/resources/thoughtbox-cipher-content.ts` line 278 instructs agents to "Call `thoughtbox_cipher` tool" -- but no such tool exists. The correct call is `thoughtbox_gateway { operation: "cipher" }`. The cipher also has no examples showing correct API parameter names, leaving agents to guess.

### Current state by the numbers

| Module | Operations | Dispatch pattern | Field name |
|--------|-----------|-----------------|------------|
| Gateway | 5 | flat | `operation` |
| Init | 7 | flat | `operation` |
| Session | 8 | double-nested | `operation` |
| Notebook | 10 | double-nested | `operation` |
| Mental Models | 4 | double-nested | `operation` |
| Knowledge | 7 | flat args, different key | `action` |
| Hub | 28 | flat (separate tool) | `operation` |
| **Total** | **69** | | |

### Constraints from existing ADRs

- **ADR-009 (Passthrough rule)**: Any new field flowing through gateway-handler.ts needs tests at the gateway boundary, not just handler internals. STILL VALID. This change modifies the dispatch layer, not field passthrough, but the testing principle applies: test flattened operations at the gateway level.

- **ADR-010 (3-layer verification)**: Handler passthrough, type cast, schema declaration must stay in sync. STILL VALID. Flattening changes the dispatch layer but preserves the 3-layer invariant for data fields.

- **ADR-011 (Gateway schema surfacing)**: First-call-only schema embedding via `sessionSchemasSeen`. Operations catalog tool aggregates from 7 modules. NEEDS AMENDMENT -- ADR-011 assumes consistent operation dispatch but the catalog currently serves operation names that differ from what agents must actually send (e.g., catalog shows `create` for notebook but the agent must send `{ operation: "notebook", args: { operation: "create" } }`). After flattening, catalog names match gateway names exactly.

### Non-breaking change justification

Thoughtbox consumers are AI agents, not human developers with muscle memory. Agents read tool descriptions on every connection and adapt to whatever the schema declares. As long as the tool description is correct, agents will use the new API shape immediately. No backward compatibility layer is needed.

## Decision

### Flatten all sub-operations into top-level gateway enum

Replace the 4 toolhost proxy entries (`notebook`, `session`, `mental_models`, `knowledge`) with their 29 individual sub-operations, using `domain_verb` naming:

- Session (8): `session_list`, `session_get`, `session_search`, `session_resume`, `session_export`, `session_analyze`, `session_extract_learnings`, `session_discovery`
- Notebook (10): `notebook_create`, `notebook_list`, `notebook_load`, `notebook_add_cell`, `notebook_update_cell`, `notebook_run_cell`, `notebook_install_deps`, `notebook_list_cells`, `notebook_get_cell`, `notebook_export`
- Mental Models (4): `models_get`, `models_list`, `models_list_tags`, `models_capability_graph`
- Knowledge (7): `knowledge_create_entity`, `knowledge_get_entity`, `knowledge_list_entities`, `knowledge_add_observation`, `knowledge_create_relation`, `knowledge_query_graph`, `knowledge_stats`

The gateway enum grows from 14 to 39 entries. Hub operations remain in the separate `thoughtbox_hub` tool (already flat).

### Standardize on `operation`, not `action`

Knowledge handler changes from `args.action` to standard `operation` field routing. All 69 operations use the same field name.

### Single-level args

After flattening, every gateway call uses: `{ operation: "<flat_name>", args: { ... } }`. No inner `operation`, no inner `args`, no `action` field.

### Fix cipher docs

Replace `thoughtbox_cipher` reference with correct gateway call. Add API quick reference card showing common call shapes.

### Normalize mental-models schema field

`src/mental-models/operations.ts` uses `inputs` instead of `inputSchema` in its operation definitions. Rename to `inputSchema` for cross-module consistency.

## Consequences

### Positive

- **One pattern to learn**: Agents learn `{ operation, args }` once and it works for all 69 operations. No more double-nesting errors.
- **Catalog accuracy**: `thoughtbox_operations` (ADR-011) returns names that match exactly what agents send. No translation layer between catalog and actual calls.
- **Cipher correctness**: Agents loading cipher get accurate API examples instead of references to nonexistent tools.
- **Grep-friendly**: `rg "session_list"` finds the operation everywhere -- enum, handler, tests, docs. With double-nesting, finding session list operations required searching for both `"session"` and `"list"` and correlating.

### Tradeoffs

- **Larger enum**: The gateway enum grows from 14 to 39 entries. This is manageable -- agents see the enum via tool description, and the `thoughtbox_operations` catalog provides searchable discovery.
- **Larger OPERATION_REQUIRED_STAGE map**: 39 entries instead of 14. Each flattened operation inherits the stage of its former parent (e.g., all `notebook_*` ops are Stage 2).
- **Breaking change for existing sessions**: Any in-progress sessions using old names will fail. This is acceptable because sessions are ephemeral and agents reconnect frequently.

### Follow-ups

- **ADR-011 amendment**: Update ADR-011 to note that catalog names now match gateway names exactly. The first-call-only schema embedding logic is unaffected (it keys on the operation name string, which changes but the mechanism stays the same).
- **Hub comment fix**: `src/hub/operations.ts` header says "27 hub operations" but the actual count is 28. Fix the comment.

## Hypotheses

### Hypothesis 1: Knowledge uses `action` field instead of `operation`
**Prediction**: `gateway-handler.ts` line 1122 dispatches knowledge on `args.action`; lines 926, 939, 953 dispatch notebook/session/mental-models on `args.operation`.
**Validation**: Read both dispatch paths in gateway-handler.ts, confirm different field names.
**Outcome**: CONFIRMED + FIXED. `grep 'action'` returns 0 hits in `src/knowledge/`. Handler dispatches on `args.operation`. Gateway passes `{ operation: '<sub_op>' }`.

### Hypothesis 2: Notebook/session/mental-models use double-nested `{operation, args: {operation, args}}`; knowledge is flat
**Prediction**: `handleNotebook` (line 925-937) extracts `args.operation` then `args.args` as inner args. `handleKnowledge` (line 1109-1144) passes entire `args` to `processOperation` without extracting inner operation/args.
**Validation**: Read both code paths and compare arg extraction.
**Outcome**: CONFIRMED + FIXED. All 29 flattened operations have individual `case` entries. Prefix stripped via `operation.slice()` at lines 450, 467, 478. Old proxy methods removed.

### Hypothesis 3: Cipher docs reference nonexistent `thoughtbox_cipher` tool
**Prediction**: `thoughtbox-cipher-content.ts` line 278 contains the string `thoughtbox_cipher` in the usage protocol section. No MCP tool with that name is registered anywhere in the codebase.
**Validation**: Read cipher content, grep for `thoughtbox_cipher` in tool registration code (`server-factory.ts`, `tool-registry.ts`).
**Outcome**: CONFIRMED + FIXED. Replaced with `thoughtbox_gateway { operation: "cipher" }`. Zero hits for `thoughtbox_cipher` post-fix.

### Hypothesis 4: All sub-operations are enumerable and total 69
**Prediction**: Gateway 5 + Init 7 + Session 8 + Notebook 10 + Mental Models 4 + Knowledge 7 + Hub 28 = 69.
**Validation**: Count entries in each module's `*_OPERATIONS` array. Cross-reference with `thoughtbox_operations { operation: "list" }` which reported 69 in ADR-011 validation.
**Outcome**: CONFIRMED. Gateway enum has 41 entries (12 unchanged + 29 flattened). Hub's 28 remain in separate `thoughtbox_hub` tool. Total across all modules: 69. Spec's "14 → 39" arithmetic was wrong (should be 41); corrected.

### Hypothesis 5: Flattening requires updates to 3 gateway layers per operation
**Prediction**: Each flattened operation needs: (1) enum entry in `gatewayToolInputSchema`, (2) case in the dispatch switch, (3) entry in `OPERATION_REQUIRED_STAGE` and `OPERATION_ADVANCES_TO` maps. Per-module operations.ts files need name field updates. Total touch points: gateway-handler.ts (enum + switch + 2 maps), plus one operations.ts per module (4 files).
**Validation**: Read gateway-handler.ts structure, identify all places that reference the operation enum.
**Outcome**: CONFIRMED. All four layers updated: 41-entry enum, 41 switch cases, 41 entries in each stage map. Handler layer unchanged (prefix stripped before delegation) except knowledge (`action` → `operation`).

### Hypothesis 6: Operations catalog (ADR-011) absorbs flattened names without breaking
**Prediction**: `getOperationsCatalog()` in each module builds its catalog from the `*_OPERATIONS` array. If operation `name` fields are updated to flattened names at the source, the catalog automatically serves correct names. `getOperation(name)` lookup works with new names. No changes needed to the `thoughtbox_operations` aggregation logic in `server-factory.ts`.
**Validation**: Verify that `thoughtbox_operations` reads from module catalogs (not hardcoded names), and that renaming `name` fields flows through.
**Outcome**: CONFIRMED. `getOperation('notebook_create')` returns the definition. `getOperation('create')` returns undefined. 406/406 tests pass including operations-tool handler tests.

## Reconciliation

### ADR-011: NEEDS AMENDMENT

ADR-011 (Gateway Schema Surfacing) assumes operation names in catalogs match what agents send to the gateway. Currently they do not for 4 modules:

- Catalog shows `create` (notebook) but agent must send `{ operation: "notebook", args: { operation: "create" } }`
- Catalog shows `list` (session) but agent must send `{ operation: "session", args: { operation: "list" } }`
- Catalog shows `create_entity` (knowledge) but agent must send `{ operation: "knowledge", args: { action: "create_entity" } }`
- Catalog shows `get_model` (mental-models) but agent must send `{ operation: "mental_models", args: { operation: "get_model" } }`

After ADR-012, catalog names match gateway names exactly (e.g., `notebook_create`, `session_list`, `knowledge_create_entity`, `models_get`).

Amendment scope: Update ADR-011's Hypothesis 2 validation note to reflect that operation names changed. No architectural changes to ADR-011's mechanisms (first-call-only embedding, catalog tool) are needed.

### ADR-009: STILL VALID

The passthrough rule (test at gateway boundary, not handler internals) applies to this change. Flattened operations must be tested via gateway calls, not by calling handlers directly.

### ADR-010: STILL VALID

The 3-layer verification pattern (handler, type cast, schema declaration) is unaffected. This change modifies dispatch routing, not data field passthrough.

## Post-Review Amendments

#### Amendment 1: Mental models prefix-strip produces wrong operation names (2026-03-12)
**Found by**: Greptile (automated PR review on PR #159)
**Finding**: `operation.slice('models_'.length)` converts `models_get` → `"get"`, but `MentalModelsHandler.processTool` expects `"get_model"`. Three of four mental models operations silently fell into the handler's `default` branch.
**Gap**: H5 tested that flattened operations reach their handlers, but not that the *value* arriving at the inner switch was correct. A missing hypothesis: "H7: Each `models_*` gateway operation resolves to the correct internal handler name after prefix stripping."
**Fix**: Replaced prefix-strip with explicit mapping table `MODELS_OP_MAP` in `gateway-handler.ts:475-480` (commit d724ca8).
**Pattern**: When operation names are derived by string manipulation (prefix-strip, substring), and the internal handler uses different names than the external API, test each mapping individually. The compiler can't catch this when the handler accepts `string`.

## Spec

[SPEC: Gateway API Consistency](../../specs/gateway-api-consistency.md)

## Links

- [ADR-009: Merge Auditability Experiments](../accepted/ADR-009-merge-auditability-experiments.md) -- passthrough rule: STILL VALID
- [ADR-010: Observatory Structured Rendering](../accepted/ADR-010-observatory-structured-rendering.md) -- 3-layer verification: STILL VALID
- [ADR-011: Gateway Schema Surfacing](../accepted/ADR-011-gateway-schema-surfacing.md) -- catalog names: NEEDS AMENDMENT
- `src/gateway/gateway-handler.ts` -- dispatch logic (enum lines 35-63, switch lines 323-385, knowledge handler lines 1109-1144)
- `src/gateway/operations.ts` -- gateway operations catalog (5 ops)
- `src/sessions/operations.ts` -- session operations catalog (8 ops)
- `src/notebook/operations.ts` -- notebook operations catalog (10 ops)
- `src/mental-models/operations.ts` -- mental models operations catalog (4 ops, uses `inputs` not `inputSchema`)
- `src/knowledge/operations.ts` -- knowledge operations catalog (7 ops)
- `src/hub/operations.ts` -- hub operations catalog (28 ops, header says 27)
- `src/init/operations.ts` -- init operations catalog (7 ops)
- `src/resources/thoughtbox-cipher-content.ts` -- cipher docs (references nonexistent `thoughtbox_cipher`)
