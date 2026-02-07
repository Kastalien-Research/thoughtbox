# Master Behavioral Test Index

Single-source catalog of all behavioral tests for Thoughtbox MCP tools.

**Total tests: 116** across 8 domains, covering all 3 MCP tools and 60+ operations.

## Tools Under Test

| Tool | Operations | Test Files | Test Count |
|------|-----------|------------|------------|
| `thoughtbox_gateway` | 17 | gateway, thoughtbox, session, deep-analysis, mental-models, notebook, knowledge | 82 |
| `thoughtbox_hub` | 24 | hub | 25 |
| `observability_gateway` | 7 | observability | 9 |

## Test ID Conventions

| Prefix | Domain | File |
|--------|--------|------|
| GW | Gateway & Init | `gateway-behavioral.md` |
| TB | Thought Operations | `thoughtbox-behavioral.md` |
| SS | Session Management | `session-behavioral.md` |
| DA | Deep Analysis | `deep-analysis-behavioral.md` |
| MM | Mental Models | `mental-models-behavioral.md` |
| NB | Notebook | `notebook-behavioral.md` |
| KG | Knowledge Graph | `knowledge-behavioral.md` |
| HB | Hub Operations | `hub-behavioral.md` |
| OB | Observability | `observability-behavioral.md` |

---

## Complete Test Catalog

### GW: Gateway & Init (12 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| GW-001 | `get_state` | Returns current stage and available operations | |
| GW-002 | `list_sessions` | Lists sessions with limit filter | |
| GW-003 | `list_sessions` | Filters by project/task/aspect/search | |
| GW-004 | `navigate` | Moves to project/task/aspect in hierarchy | |
| GW-005 | `load_context` | Loads session, advances to Stage 1 | |
| GW-006 | `start_new` | Initializes new work, advances to Stage 1 | |
| GW-007 | `list_roots` | Returns MCP roots | |
| GW-008 | `bind_root` | Binds root URI as project scope | |
| GW-009 | `cipher` | Loads notation system, advances to Stage 2 | |
| GW-010 | Progressive disclosure | Stage 0 blocks Stage 1 ops with helpful error | |
| GW-011 | Progressive disclosure | Stage 1 blocks Stage 2 ops with helpful error | |
| GW-012 | End-to-end | Full stage progression: get_state → start_new → cipher → thought | |

### TB: Thought Operations (22 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| TB-001 | `thought` | Basic forward thinking flow (1→N) | |
| TB-002 | `thought` | Backward thinking flow (N→1) with session auto-creation | |
| TB-003 | `thought` | Branching flow with parallel exploration | |
| TB-004 | `thought` | Revision flow with isRevision/revisesThought | |
| TB-005 | `thought` | Guide request flow with includeGuide | |
| TB-006 | `thought` | Dynamic adjustment of totalThoughts | |
| TB-007 | `thought` | Input validation and error handling | |
| TB-008 | `thought` | Linked node structure (doubly-linked chain) | |
| TB-009 | `thought` | Tree structure from branching | |
| TB-010 | `thought` | Revision tracking in nodes | |
| TB-011 | `thought` | Auto-export on session close | |
| TB-012 | `thought` | Manual export tool | |
| TB-013 | `thought` | Node ID format consistency | |
| TB-014 | `thought` | Backward thinking linked structure | |
| TB-015 | `thought` | Gaps in thought numbers | |
| TB-016 | `read_thoughts` | By specific thoughtNumber | |
| TB-017 | `read_thoughts` | By last N thoughts | |
| TB-018 | `read_thoughts` | By range [start, end] | |
| TB-019 | `read_thoughts` | By branchId (branch-specific retrieval) | |
| TB-020 | `read_thoughts` | With sessionId (cross-session retrieval) | |
| TB-021 | `get_structure` | Returns graph topology without content | |
| TB-022 | `thought` | Multi-agent attribution (agentId, agentName) | |

### SS: Session Management (14 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| SS-001 | `session.list` | Returns sessions with metadata | |
| SS-002 | `session.list` | Filters by tags | |
| SS-003 | `session.list` | Pagination with limit/offset | |
| SS-004 | `session.get` | Returns full session details with thoughts | |
| SS-005 | `session.get` | Nonexistent ID returns clear error | |
| SS-006 | `session.search` | Searches by title/tags | |
| SS-007 | `session.resume` | Loads session into ThoughtHandler | |
| SS-008 | `session.resume` | Continuation after resume (add thought) | |
| SS-009 | `session.export` | JSON format with linked nodes | |
| SS-010 | `session.export` | Markdown format | |
| SS-011 | `session.export` | Cipher notation format | |
| SS-012 | `session.analyze` | Structure/quality metrics | |
| SS-013 | `session.extract_learnings` | Patterns and anti-patterns extraction | |
| SS-014 | `session.discovery` | List/hide/show tool operations | |

### DA: Deep Analysis (6 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| DA-001 | `deep_analysis` | Type `patterns` — revision/branch/length stats | |
| DA-002 | `deep_analysis` | Type `cognitive_load` — complexity score | |
| DA-003 | `deep_analysis` | Type `decision_points` — revisions/branches array | |
| DA-004 | `deep_analysis` | Type `full` — all analysis combined | |
| DA-005 | `deep_analysis` | With `options.includeTimeline` | |
| DA-006 | `deep_analysis` | Invalid sessionId returns clear error | |

### MM: Mental Models (6 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| MM-001 | `mental_models` | Discovery flow: list_tags → list_models | |
| MM-002 | `mental_models` | Model retrieval with full content | |
| MM-003 | `mental_models` | Error handling with guidance | |
| MM-004 | `mental_models` | Capability graph for knowledge init | |
| MM-005 | `mental_models` | Tag coverage (every tag has models) | |
| MM-006 | `mental_models` | Content quality (process scaffolds) | |

### NB: Notebook (10 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| NB-001 | `notebook` | Create and list notebooks | |
| NB-002 | `notebook` | Cell operations (add, list, get) | |
| NB-003 | `notebook` | Code execution flow | |
| NB-004 | `notebook` | Cell update flow | |
| NB-005 | `notebook` | Export/load roundtrip (.src.md) | |
| NB-006 | `notebook` | Template instantiation | |
| NB-007 | `notebook` | Dependency installation | |
| NB-008 | `notebook` | Error handling | |
| NB-009 | `notebook` | Load from filesystem path | |
| NB-010 | `notebook` | add_cell with position parameter | |

### KG: Knowledge Graph (12 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| KG-001 | `knowledge.create_entity` | Creates entity with name/type/label | |
| KG-002 | `knowledge.get_entity` | Retrieves entity by ID | |
| KG-003 | `knowledge.list_entities` | Lists all entities | |
| KG-004 | `knowledge.list_entities` | Filters by types/visibility/name_pattern/date | |
| KG-005 | `knowledge.add_observation` | Adds atomic fact to entity | |
| KG-006 | `knowledge.create_relation` | Links entities with typed relation | |
| KG-007 | `knowledge.query_graph` | Traverses from start entity | |
| KG-008 | `knowledge.query_graph` | With max_depth limit | |
| KG-009 | `knowledge.query_graph` | With relation_types filter | |
| KG-010 | `knowledge.stats` | Returns entity/relation counts | |
| KG-011 | `knowledge` | Error handling (missing params, bad IDs) | |
| KG-012 | `knowledge` | Full workflow end-to-end | |

### HB: Hub Operations (25 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| HB-001 | `register` | Registers agent, returns agentId | |
| HB-002 | `whoami` | Returns current agent identity | |
| HB-003 | `list_workspaces` | Lists available workspaces | |
| HB-004 | `create_workspace` | Creates workspace with name/description | |
| HB-005 | `join_workspace` | Joins existing workspace | |
| HB-006 | `workspace_status` | Returns workspace agents and status | |
| HB-007 | `create_problem` | Defines problem in workspace | |
| HB-008 | `claim_problem` | Claims problem, auto-generates branch | |
| HB-009 | `update_problem` | Updates status (open → in-progress → resolved → closed) | |
| HB-010 | `list_problems` | Lists all workspace problems | |
| HB-011 | `add_dependency` | Adds dependency between problems | |
| HB-012 | `remove_dependency` | Removes dependency between problems | |
| HB-013 | `ready_problems` | Returns problems with all deps resolved | |
| HB-014 | `blocked_problems` | Returns problems still blocked | |
| HB-015 | `create_sub_problem` | Creates hierarchical sub-problem | |
| HB-016 | `create_proposal` | Creates proposal with sourceBranch | |
| HB-017 | `review_proposal` | Reviews with approve/request-changes/comment | |
| HB-018 | `merge_proposal` | Merges approved proposal | |
| HB-019 | `list_proposals` | Lists all proposals | |
| HB-020 | `mark_consensus` | Marks consensus decision point | |
| HB-021 | `endorse_consensus` | Endorses existing consensus marker | |
| HB-022 | `list_consensus` | Lists consensus markers | |
| HB-023 | `post_message` | Posts to problem channel | |
| HB-024 | `read_channel` | Reads all messages in channel | |
| HB-025 | Progressive disclosure | Operations before registration fail with helpful error | |

### OB: Observability (9 tests)

| ID | Operation | Summary | Status |
|----|-----------|---------|--------|
| OB-001 | `health` | Returns status for all services | |
| OB-002 | `health` | With services filter | |
| OB-003 | `metrics` | Instant PromQL query | |
| OB-004 | `metrics_range` | Range query with start/end/step | |
| OB-005 | `sessions` | Lists active reasoning sessions | |
| OB-006 | `sessions` | With status filter (active/idle/all) | |
| OB-007 | `session_info` | Gets details for specific session | |
| OB-008 | `alerts` | Returns active/pending alerts | |
| OB-009 | `dashboard_url` | Returns Grafana dashboard URL | |

---

## Operation Coverage Matrix

### thoughtbox_gateway (17 operations → 82 tests)

| Operation | Stage | Tests |
|-----------|-------|-------|
| `get_state` | 0 | GW-001, GW-012 |
| `list_sessions` | 0 | GW-002, GW-003 |
| `navigate` | 0 | GW-004 |
| `load_context` | 0 | GW-005 |
| `start_new` | 0 | GW-006, GW-012 |
| `list_roots` | 0 | GW-007 |
| `bind_root` | 0 | GW-008 |
| `cipher` | 1 | GW-009, GW-012 |
| `thought` | 2 | TB-001–TB-015, TB-022, GW-012 |
| `read_thoughts` | 2 | TB-016–TB-020 |
| `get_structure` | 2 | TB-021 |
| `session` | 1 | SS-001–SS-014 |
| `deep_analysis` | 1 | DA-001–DA-006 |
| `mental_models` | 2 | MM-001–MM-006 |
| `notebook` | 2 | NB-001–NB-010 |
| `knowledge` | 2 | KG-001–KG-012 |

### thoughtbox_hub (24 operations → 25 tests)

All 24 operations have dedicated tests (HB-001–HB-024) plus progressive disclosure (HB-025).

### observability_gateway (7 operations → 9 tests)

All 7 operations have dedicated tests (OB-001–OB-009), with `health` and `sessions` each having an additional filter variant test.

---

## Remediation Protocol

When a test fails:

1. **Classify**: Schema gap | Stage enforcement bug | Handler error | Missing implementation | Stale docs
2. **File issue**: `bd create --title="[TEST-ID] Description" --type=bug --priority=2`
3. **Fix by category**:
   - Schema gap → Update enum in `src/server-factory.ts` or handler file
   - Stage enforcement → Fix `OPERATION_REQUIRED_STAGE` in `src/gateway/gateway-handler.ts`
   - Handler error → Debug handler (gateway → handler → storage)
   - Missing implementation → Implement following existing patterns
   - Stale docs → Update behavioral test file
4. **Re-run**: Verify fix and check for regressions in same domain

## Key Source Files

| File | Role |
|------|------|
| `src/gateway/gateway-handler.ts` | Gateway routing, stage enforcement, deep analysis |
| `src/thought-handler.ts` | Thought/read_thoughts/get_structure |
| `src/sessions/operations.ts` + `handlers.ts` | Session sub-operations |
| `src/notebook/index.ts` | Notebook sub-operations |
| `src/mental-models/index.ts` | Mental model operations |
| `src/knowledge/handler.ts` | Knowledge graph operations |
| `src/hub/hub-handler.ts` | Hub operation routing |
| `src/hub/hub-types.ts` | Hub types and stage definitions |
| `src/observability/gateway-handler.ts` | Observability operations |
| `src/tool-registry.ts` | Disclosure stage definitions |
| `src/server-factory.ts` | MCP tool registration and schemas |
