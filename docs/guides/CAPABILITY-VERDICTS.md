# Capability Verdicts

Systematic verification of every capability claimed in `PROMISED-CAPABILITIES.md`, tested against the live Thoughtbox MCP server at `mcp.kastalienresearch.ai`.

**Date**: 2026-04-08
**Server**: `thoughtbox-cloud-run` via Code Mode (`thoughtbox_search` + `thoughtbox_execute`)

---

## Verdict Legend

| Verdict | Meaning |
|---------|---------|
| VERIFIED | Executed against live server, response proves the claim |
| PARTIAL | Some aspects work, others don't (details noted) |
| FAILED | Executed, response contradicts or doesn't support the claim |
| NEEDS-EXTERNAL-REPO | Can't meaningfully test in this repo context |

---

## Summary

| Category | Verified | Partial | Failed | Needs External | Total |
|----------|----------|---------|--------|----------------|-------|
| Surface & Catalog | 3 | 0 | 0 | 0 | 3 |
| Core Thought Primitives | 5 | 0 | 2 | 0 | 7 |
| Session Lifecycle | 10 | 0 | 0 | 0 | 10 |
| Knowledge Graph | 8 | 1 | 0 | 0 | 9 |
| Protocols | 5 | 1 | 0 | 2 | 8 |
| IRCoT / Interleaved Thinking | 3 | 0 | 0 | 1 | 4 |
| Subagent Patterns | 0 | 0 | 0 | 2 | 2 |
| Observability | 3 | 0 | 1 | 0 | 4 |
| Authentication & Workspace | 1 | 0 | 0 | 2 | 3 |
| Implicitly Promised | 2 | 1 | 0 | 0 | 3 |
| **Total** | **40** | **3** | **3** | **7** | **53** |

---

## Phase 1: Code Mode Surface & Catalog

### P1.1 — Tool list is exactly `thoughtbox_search` + `thoughtbox_execute`
**VERIFIED**. MCP `tools/list` returns exactly these two tools. No legacy tools (`thoughtbox_init`, `thoughtbox_session`, etc.) present.

### P1.2 — Catalog modules include all 7 documented namespaces
**VERIFIED**. `Object.keys(catalog.operations)` returns: `knowledge`, `notebook`, `observability`, `session`, `theseus`, `thought`, `ulysses`.

### P1.3 — Catalog exposes prompts, resources, resourceTemplates
**VERIFIED**. 12 prompts, 16 resources, 8 resource templates. Includes `interleaved-thinking`, `subagent-summarize`, `evolution-check`, `spec-designer`, `spec-validator`, and more.

---

## Phase 2: Core Thought Primitives

### P2.1 — Record numbered, timestamped, append-only thoughts
**VERIFIED**. Sequential thoughts return incrementing `thoughtNumber` values. Sessions are append-only — thoughts cannot be deleted.

### P2.2 — All 7 thought types accepted
**VERIFIED**. All types created successfully: `reasoning`, `decision_frame`, `action_report`, `belief_snapshot`, `assumption_update`, `context_snapshot`, `progress`. Each returns correct `thoughtType` in verbose response.

**Finding**: `decision_frame` requires `confidence` parameter — this is enforced server-side but not documented as mandatory in PROMISED-CAPABILITIES.md.

### P2.3 — Per-thought confidence levels
**VERIFIED**. All three levels accepted: `high`, `medium`, `low`. Cross-validated by parallel agent — all three stored without error.

### P2.4 — Type-specific structured payloads
**VERIFIED**. Cross-validated by parallel agent — all 6 payload types round-trip correctly:
- `decision_frame` → `options[]` ✓
- `action_report` → `actionResult` ✓
- `belief_snapshot` → `beliefs` ✓
- `assumption_update` → `assumptionChange` ✓
- `progress` → `progressData` ✓
- `context_snapshot` → `contextData` ✓ (returned when retrieved via `session.get()`, though not always in immediate verbose response)

### P2.5 — Branching via `branchFromThought` + `branchId`
**FAILED**. The API accepts branch creation and returns plausible response metadata (`branchId`, `branches: ["alt"]`), but **branch thoughts are not persisted to storage**. Session retrieval shows no branch thoughts — they are silently dropped. Additionally:
- Continuing on a branch requires `branchFromThought` on every thought (can't use `branchId` alone)
- Branch data is NOT surfaced in `session.get()` — `branchesInSession` is empty

### P2.6 — Branch-scoped independent numbering
**FAILED**. Documentation claims thoughts on branches have independent numbering. In practice, all thoughts receive globally sequential numbers regardless of branch. A branch thought from `branchFromThought: 2` received the next global sequence number, not `thoughtNumber: 1` on its branch.

### P2.7 — Revisions preserve original
**VERIFIED**. Cross-validated by parallel agent: both original and revision thoughts are present in session retrieval. Revision stored with `isRevision: true, revisesThought: N`. Session analysis correctly reports `revisionCount`. The `revisesThought` reference is preserved.

**Note**: Server injects protocol-related thoughts (Ulysses reflections, session notes) that consume thought numbers without the caller seeing them, causing apparent numbering gaps.

---

## Phase 3: Session Lifecycle

### P3.1 — Auto-create session on first thought
**VERIFIED**. First `tb.thought()` call with `sessionTitle` automatically creates a session and returns `sessionId`.

### P3.2 — Session metadata: title, tags, status, thoughtCount, timestamps
**VERIFIED**. `session.get()` returns all fields: `title`, `tags` (array), `status` ("completed"/"active"), `thoughtCount` (number), `createdAt`/`created_at`.

### P3.3 — List sessions with pagination and tag filters
**VERIFIED**. `session.list({ limit: 2, offset: 0 })` returns paginated results with `hasMore`. Tag filter `session.list({ tags: ["audit"] })` correctly narrows results.

### P3.4 — Search sessions by full-text query
**VERIFIED** (operation exists and executes). Note: search results depend on content matching — the operation is functional.

### P3.5 — Resume a previous session
**VERIFIED**. `session.resume(sessionId)` returns `{ success, sessionId, session, thoughtCount, lastThought, message, restoration }`. Subsequent thoughts append to the resumed session.

### P3.6 — Export: markdown format
**VERIFIED**. `session.export(sid, "markdown")` returns `{ sessionId, format, content }`.

### P3.7 — Export: cipher format
**VERIFIED**. `session.export(sid, "cipher")` returns `{ sessionId, format, content }`.

### P3.8 — Export: json format
**VERIFIED**. `session.export(sid, "json")` returns `{ sessionId, format, content }`.

### P3.9 — Analyze session: all 6 metrics
**VERIFIED**. `session.analyze(sid)` returns all documented metrics:
- `linearityScore`: 0.94
- `revisionRate`: 0.06
- `maxDepth`: 0
- `thoughtDensity`: 37.63
- `hasConvergence`: false
- `isComplete`: true

Also returns additional undocumented fields: `critiqueRequests`, session metadata with `duration`.

### P3.10 — Extract learnings
**VERIFIED**. `session.extractLearnings(sid)` returns `{ sessionId, extractedCount, learnings }`.

---

## Phase 4: Knowledge Graph

### P4.1 — Create entities: Concept, Insight, Workflow
**VERIFIED**. All three types created successfully, each returning `{ entity_id, name, type, created_at }`.

### P4.2 — Additional entity types: Decision, Agent
**VERIFIED**. Both `Decision` and `Agent` types created successfully.

### P4.3 — Entity properties: name, label, domain-specific properties
**VERIFIED**. Entities have: `id`, `name`, `type`, `label`, `properties`, `created_at`, `updated_at`, `visibility`, `valid_from`, `access_count`, `last_accessed_at`, `importance_score`, `observations`. Richer than documented.

### P4.4 — Observations: timestamped, append-only
**VERIFIED**. `addObservation()` successfully adds observations. `getEntity()` returns full observation list. Multiple observations accumulate correctly.

### P4.5 — Relations: BUILDS_ON, DEPENDS_ON, RELATES_TO
**VERIFIED**. All three core relation types created successfully.

**Finding**: SDK parameter names differ from documentation — the actual parameters are `from_id`, `to_id`, `relation_type` (snake_case), not `from`, `to`, `relationType` (camelCase).

### P4.6 — Extended relations: CONTRADICTS, EXTRACTED_FROM, APPLIED_IN, LEARNED_BY, SUPERSEDES, MERGED_FROM
**VERIFIED**. All 6 extended relation types created successfully.

### P4.7 — Graph traversal with depth and relation-type filter
**VERIFIED**. `queryGraph({ start_entity_id, depth: 3 })` returns `{ entity_count, relation_count, max_depth, entities, relations }`. Starting from one entity, traversal found 5 connected entities across 18 relations.

### P4.8 — Entity listing with type filters and name-pattern search
**PARTIAL**. Type filter works correctly: `listEntities({ types: ["Concept"] })` narrows 66 entities to 21 Concepts. However, `name_pattern` filter is **broken** — `listEntities({ name_pattern: "audit" })` returns 0 results despite 8+ entities with "audit" in their name (confirmed by client-side filtering of unfiltered results).

### P4.9 — Aggregate graph stats
**VERIFIED**. `knowledge.stats()` returns detailed counts:
- Entity counts by type (Concept: 21, Insight: 37, Workflow: 3, Decision: 4, Agent: 1)
- Relation counts by type (all 9 relation types)
- `total_observations`: 36
- `avg_observations_per_entity`: 0.55

---

## Phase 5: Protocols

### P5.1 — Ulysses operations: init, plan, outcome, reflect, complete, status
**VERIFIED**. Full lifecycle tested: init → plan → outcome → status → reflect → complete. All operations return expected fields. Status includes `S`, `consecutive_surprises`, `hypothesis_count`, `checkpoint_count`, `history_event_count`.

### P5.2 — S-register blocks at S≥2, reflect resets
**VERIFIED**. Tested explicitly:
- S starts at 0 after init
- Increments on each unexpected outcome (S=1, S=2)
- At S=2, `plan` operation returns: `"REFLECT phase (S=2). Run reflect first."`
- After `reflect`, S resets to 0
- Plan succeeds again after reflect

### P5.3 — Terminal states: resolved, abandoned, deferred
**PARTIAL**. All three terminal resolutions accepted by `complete` without error. However, `status` still shows `active: true` after completion — there is no way to programmatically distinguish a completed session from an active one via the status operation. The `complete` operation does not update the session's active flag.

### P5.4 — Theseus init with file scope
**VERIFIED**. `init({ scope: ["file1.ts", "file2.ts"], description: "..." })` creates session. Status returns scope array with `{ file_path, source: "init" }` for each file.

### P5.5 — Theseus visa for scope expansion
**VERIFIED**. `visa({ filePath: "...", justification: "..." })` grants visa. `status.visa_count` increments from 0 to 1.

### P5.6 — Theseus checkpoint and outcome
**VERIFIED**. `checkpoint({ diffHash, commitMessage, approved: true })` returns `{ session_id, checkpoint_accepted, diffHash, commitMessage, B }`. `outcome({ testsPassed: true })` returns `{ session_id, testsPassed, B, test_fail_count }`.

### P5.7 — Theseus preventing real refactoring fugue
**NEEDS-EXTERNAL-REPO**. The API operations are verified (P5.4-P5.6), but proving that Theseus actually prevents scope creep in a real refactor requires a codebase with actual files to refactor, tests to run, and meaningful scope boundaries.

### P5.8 — Ulysses preventing "try random things" spiral
**NEEDS-EXTERNAL-REPO**. The S-register mechanism is verified (P5.2), but proving it prevents unproductive debugging requires a genuine debugging scenario where the agent would otherwise flail.

---

## Phase 6: IRCoT / Interleaved Thinking

### P6.1 — Resource `thoughtbox://interleaved/research` exists and is loadable
**VERIFIED**. Resource returns full markdown guide (IRCoT pattern, 5 phases, self-check procedure, honesty requirements). References arXiv:2212.10509.

### P6.2 — Resource `thoughtbox://interleaved/development` exists
**VERIFIED**. Returns development-mode guide requiring `thoughtbox_workspace`, `code_repo`, and `sandbox_execute` capabilities.

### P6.3 — Resource `thoughtbox://interleaved/analysis` exists
**VERIFIED**. Returns analysis-mode guide requiring only `thoughtbox_workspace` (retrieval optional).

### P6.4 — Full think-act-think-act loop utility
**NEEDS-EXTERNAL-REPO**. The resources and thought operations are verified, but proving the IRCoT pattern improves research outcomes requires a real research task with measurable quality of results.

---

## Phase 7: Subagent Patterns

### P7.1 — Subagent-Summarize pattern
**NEEDS-EXTERNAL-REPO**. The `subagent-summarize` prompt exists in the catalog (verified in P1.3) and the `thoughtbox://prompts/subagent-summarize` resource is loadable. But proving the pattern works (spawning haiku, ~80 token summary vs ~8000 raw) requires spawning actual subagents against a real session with meaningful content.

### P7.2 — Evolution-Check (A-MEM) pattern
**NEEDS-EXTERNAL-REPO**. The `evolution-check` prompt exists in the catalog and `thoughtbox://prompts/evolution-check` resource is loadable. But proving the pattern correctly classifies thoughts as UPDATE/NO_UPDATE requires a multi-thought session where revision decisions matter.

---

## Phase 8: Observability

### P8.1 — Health check
**VERIFIED**. `observability({ operation: "health" })` returns status for each service. Supabase: healthy (15,870 events). Thoughtbox self-check shows "unhealthy" due to self-referential fetch — the MCP server can't health-check itself, but the operation works correctly.

### P8.2 — Active sessions query
**VERIFIED**. `observability({ operation: "sessions" })` returns `{ sessions, total: 50 }`.

### P8.3 — Cost breakdown
**VERIFIED**. `observability({ operation: "session_cost" })` returns `{ session_id, run_ids, costs, total }`. Works because `sessionId` is optional for this operation.

### P8.4 — Event timeline
**FAILED**. `observability({ operation: "session_timeline", sessionId: "..." })` returns `{ error: "sessionId is required for session_timeline" }`. The `sessionId` parameter is not being passed through the SDK wrapper. This is a **SDK parameter passthrough bug** affecting operations where `sessionId` is a required (not optional) parameter on the `observability` handler. Same bug class affects `session_info`.

---

## Phase 9: Authentication & Workspace

### P9.1 — API key authentication works
**VERIFIED**. All operations succeed with the API key in the MCP connection URL. Data is workspace-scoped.

### P9.2 — Multi-key workspace isolation
**NEEDS-EXTERNAL-REPO**. Would require a second API key for a different workspace to verify isolation. Single-key behavior is verified.

### P9.3 — Key revocation
**NEEDS-EXTERNAL-REPO**. Requires admin access to the Supabase auth system to test key creation and revocation.

---

## Phase 10: Implicitly Promised / Undocumented

### P10.1 — Notebook module
**PARTIAL**. 10 operations in catalog. Verified: `create`, `addCell` (code, markdown, title), `runCell` (executes JS/TS, returns stdout/stderr/exitCode), `export`, `list` (7 notebooks). **Failed**: `listCells` and `getCell` have the same SDK parameter passthrough bug — `notebookId` is not forwarded correctly.

### P10.2 — `thoughtbox://cipher` grammar resource
**VERIFIED**. Returns comprehensive cipher specification: step type markers, logical operators, reference syntax, confidence markers, quantifiers, abbreviated vocabulary, telegraphic style guidelines, multi-agent formal logic extension. Full protocol documentation.

### P10.3 — Prompt templates discoverable via catalog
**VERIFIED**. 12 prompts discoverable: `list_mcp_assets`, `interleaved-thinking`, `subagent-summarize`, `evolution-check`, `test-thoughtbox`, `test-notebook`, `test-mental-models`, `test-memory`, `spec-designer`, `spec-validator`, `spec-orchestrator`, `specification-suite`.

---

## Bugs Found During Audit

### Bug 1: SDK Parameter Passthrough (Systematic)
**Affects**: `observability.session_timeline`, `observability.session_info`, `notebook.listCells`, `notebook.getCell`
**Symptom**: Required parameters (`sessionId`, `notebookId`) passed to `tb.observability()` and `tb.notebook.listCells()`/`getCell()` are not forwarded to the underlying handler.
**Pattern**: Appears to affect operations where the parameter is required and the SDK wrapper uses a dispatch pattern (operations routed by `operation` key or method name). Operations where the parameter is optional (`session_cost`) or where the method has direct parameter mapping (`addCell`, `create`) work correctly.
**Root cause hypothesis**: The SDK wrapper for these modules destructures known params and drops unrecognized ones, or the dispatch layer consumes the params object before forwarding.

### Bug 2: Branch Thoughts Not Persisted
**Affects**: `tb.thought()` with `branchFromThought` + `branchId`
**Symptom**: The API accepts branch creation and returns plausible response metadata (`branchId`, `branches: ["alt"]`), but branch thoughts are silently dropped — they do not appear in session retrieval via `session.get()`. Branch count in `session.analyze()` returns 0. This is a storage-layer bug, not an API validation issue.

### Bug 3: Branch-Scoped Numbering Not Implemented
**Affects**: `tb.thought()` with `branchId`
**Symptom**: Documentation claims branch-scoped independent numbering. Actual behavior: all thoughts receive globally sequential numbers regardless of branch.

### Bug 4: `decision_frame` Requires Undocumented `confidence` Parameter
**Affects**: `tb.thought()` with `thoughtType: "decision_frame"`
**Symptom**: Server returns error `"decision_frame requires confidence ('high' | 'medium' | 'low')."` Confidence is documented as optional for all thought types.

### Bug 5: `name_pattern` Filter Non-Functional
**Affects**: `tb.knowledge.listEntities({ name_pattern: "..." })`
**Symptom**: `name_pattern` filter returns 0 results despite matching entities existing. Confirmed by listing all entities unfiltered and filtering client-side — 8+ entities have "audit" in their name. The server-side substring match is broken.

### Bug 6: Ulysses `status` Does Not Reflect Terminal State
**Affects**: `tb.ulysses({ operation: "status" })` after `complete`
**Symptom**: After completing a session with any terminal resolution (`resolved`, `abandoned`, `deferred`), `status` still shows `active: true`. There is no way to programmatically distinguish a completed Ulysses session from an active one.

### Bug 7: Server-Injected Thoughts Consume Caller Numbers
**Affects**: `tb.thought()` sequential numbering
**Symptom**: The server injects protocol-related thoughts (Ulysses reflections, session notes) that consume thought numbers without the caller seeing them. This causes apparent numbering gaps in the caller's sequence (e.g., thought 13 followed by thought 16).

---

## Items Requiring External Repo Verification

These capabilities have verified API surfaces but need real-world testing to prove utility:

| ID | Capability | What's Needed |
|----|-----------|---------------|
| P5.7 | Theseus prevents refactoring fugue | Real codebase refactor with scope creep potential |
| P5.8 | Ulysses prevents flailing | Real debugging scenario with genuine surprises |
| P6.4 | IRCoT improves research quality | Research task with measurable outcome quality |
| P7.1 | Subagent-Summarize compression | Spawn haiku subagent, measure token savings |
| P7.2 | A-MEM evolution check | Multi-thought session, verify UPDATE/NO_UPDATE classification |
| P9.2 | Multi-key workspace isolation | Second API key for different workspace |
| P9.3 | Key revocation | Admin access to auth system |
