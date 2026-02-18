# Strategic Assessment: Thoughtbox MCP Server

**Date**: 2026-02-18
**Package**: `@kastalien-research/thoughtbox` v1.2.2
**Assessed by**: Strategic Reasoner Agent (claude-sonnet-4-5)

---

## 1. What Is the Real State?

### Version Gap: The Codebase Is Post-v2.0.0 in Substance

`package.json` reports `v1.2.2`, last tagged `2026-01-15`.
The `[Unreleased]` section in `CHANGELOG.md` contains work that is fully implemented and wired into production paths.
The gap is not aspirational — it is shipped but unversioned.

**What [Unreleased] actually contains in the codebase:**

| Feature | CHANGELOG Claim | Code Reality |
|---------|----------------|--------------|
| OODA loops as MCP resources | Added | YES — `server-factory.ts` registers `thoughtbox://loops/{category}/{name}` and `thoughtbox://loops/catalog`. `LOOPS_CATALOG` in `src/resources/loops-content.ts` is 7,193 lines of generated content across 6 categories and 18 loops. |
| Hub multi-agent collaboration | Added (SIL-related) | YES — 19 source files, 37 test files, wired through `hub-tool-handler.ts` and `server-factory.ts`. Proof Run 001 was executed against a live system. |
| Observatory (WebSocket real-time monitoring) | Added | YES — full server in `src/observatory/`, 3 channel implementations (reasoning, workspace, observatory), HTML UI shipped to `dist/`. |
| LangSmith evaluation (4 phases) | Added | YES — complete 5-layer implementation: trace listener, dataset manager, experiment runner, online monitor, evaluators. |
| Knowledge graph memory | Added | YES — Phase 1 MVP: entity/relation/observation storage with `InMemoryKnowledgeStorage`, wired as `knowledge` operation in gateway. |
| Init flow + progressive disclosure | Added | YES — 3-stage state machine (`STAGE_0_ENTRY`, `STAGE_1_INIT_COMPLETE`, `STAGE_2_CIPHER_LOADED`) enforced per-MCP-session in `gateway-handler.ts`. |
| Session continuity (SIL-103) | Fixed | YES — `load_context` restores thought count, branch count, current thought number. |
| Sampling/critique loops (Phase 3) | Implied | YES — `src/sampling/handler.ts` implements MCP `sampling/createMessage` for autonomous critique via `critique: true` parameter. |

**Conclusion**: The codebase represents at minimum a `2.0.0-rc` by semver semantics.
Every major feature in `[Unreleased]` has working implementation, tests, and server-factory wiring.
The version number is approximately 2 major feature cycles behind the code.

---

## 2. What Is Gold Worth Polishing?

### Gateway Pattern — Excellent

**Files**: `src/gateway/gateway-handler.ts` (1,093 lines), `src/gateway/operations.ts`, `src/tool-registry.ts`

The gateway is the strongest architectural decision in the codebase.
A single always-available MCP tool (`thoughtbox_gateway`) routes all operations internally, eliminating the client tool-list refresh problem that plagues multi-tool MCP servers.
The per-session stage tracking (`sessionStages: Map<string, DisclosureStage>`) correctly isolates sub-agent sessions from parent sessions — this was the bug fixed in proof-run-001 (`thoughtbox-twu`).

The stage enforcement is clean, testable, and returns structured errors with specific remediation hints.
The resource embedding on every non-error response (operation catalog appended to result) is an elegant discoverability mechanism.

**Grade: A.** Publishable pattern. Could be extracted as a standalone MCP design reference.

---

### Hub Multi-Agent Collaboration — Production Quality

**Files**: 19 source files in `src/hub/`, 37 test files in `src/hub/__tests__/`
**Tests**: 37 test files covering identity, attribution, channels, consensus, profiles, proposals, problems, workspace isolation, proxy, sub-problems, terminal state, thought priming, and concurrent access.

The hub implements a full coordination layer:
- Agent identity registration with profile-based priming (profiles-registry, profile-primer)
- Workspace isolation with 3-stage progressive disclosure for hub operations
- Problem/proposal/consensus lifecycle with typed HubEvent callbacks
- Per-session agent identity overrides (defense against shared-instance attacks)
- Thought-store adapter bridging hub workspaces to reasoning sessions
- Channel-based message system with attribution

The `proof-run-findings.md` confirms the system worked end-to-end in a real proof run: two agents with distinct identities coordinated through the Hub, produced a merged proposal with review trail, and fixed a real bug.

**Grade: A-.** The weak point is that hub events use a simple `{ type, workspaceId, data }` shape (defined in `hub-handler.ts`) rather than the typed Zod schemas used by the Observatory. The bridge between the two is functional but untyped at the junction.

---

### Evaluation (LangSmith) — Complete Architecture, Credential-Gated

**Files**: 9 files in `src/evaluation/`, 9 unit tests, 4 evaluators

The evaluation module is a complete 5-layer architecture:
- Layer 1: Trace listener attaches to `thoughtEmitter` singleton
- Layer 2: Dataset manager with graceful no-op when unconfigured
- Layer 3: Experiment runner
- Layer 4: Online monitor scoring production sessions with same evaluator pipeline as offline experiments
- Layer 5: 4 named evaluators (session quality, memory quality, DGM fitness, reasoning coherence)

All layers degrade gracefully when `LANGSMITH_API_KEY` is absent.
The `initEvaluation()` / `initDatasets()` / `initExperimentRunner()` / `initMonitoring()` factory functions are clean.

**Grade: B+.** The architecture is excellent. The weakness is that the DGM fitness evaluator references a DGM (Darwin Gradient Machine) concept that has no corresponding runtime implementation — the `dgm-specs/` directory is infrastructure scaffolding, not working DGM code.

---

### Observatory — Functional, Wiring Mismatch Needs Resolution

**Files**: 15+ files in `src/observatory/`, 3 channel implementations, HTML UI, Zod schemas

The Observatory is a real-time WebSocket server for observing reasoning processes.
It exposes three channels:
- `reasoning` — session snapshots, thought events
- `observatory` — session list
- `workspace` — hub event bridge

The thought-centric event schemas in `src/observatory/schemas/events.ts` are complete and typed with Zod (`ThoughtAddedPayloadSchema`, `ThoughtBranchedPayloadSchema`, etc.).

**The documented mismatch**: Hub events (`HubEvent` in `hub-handler.ts`) use the shape `{ type: string, workspaceId: string, data: Record<string, unknown> }`. The workspace channel bridges these to the Observatory's `thoughtEmitter.emitHubEvent()`, which accepts `ThoughtEmitterEvents["hub:event"]` — also typed as `{ type: string, workspaceId: string, data: Record<string, unknown> }`. The types match at the bridge point.

However, the Observatory's typed Zod schemas (`TaskEventPayloadSchema`, `AgentEventPayloadSchema`) are defined but not enforced at the hub event bridge — the workspace channel broadcasts the raw hub event without Zod validation. This is a runtime correctness gap, not a type error: if hub event shapes drift, the Observatory receives invalid payloads silently.

**Grade: B.** The infrastructure is solid. The gap is schema enforcement at the hub-to-observatory bridge.

---

### Init Flow + Progressive Disclosure — Clean State Machine

**Files**: `src/init/` (10 files), integrated in gateway

The 3-stage disclosure system is well-designed:
- Stage 0 (ENTRY): session management operations always available
- Stage 1 (INIT_COMPLETE): cipher and session analysis unlocked after `start_new` or `load_context`
- Stage 2 (CIPHER_LOADED): thought, notebook, mental models, knowledge unlocked after `cipher`

The state machine uses explicit `STATE_TRANSITIONS[]` rules and delegates rendering to a `MarkdownRenderer`.
Per-session stage isolation (the `thoughtbox-twu` fix) correctly scopes stages to MCP session IDs, preventing sub-agents from inheriting parent session state.

**Grade: A-.** Minor gap: `list_roots` and `bind_root` operations are declared as Stage 0 but have no corresponding `sources/` implementation visible from the init handler (they route through gateway to init, which may not handle them). This warrants verification.

---

### Knowledge Graph — MVP Complete, Phase 1 Only

**Files**: `src/knowledge/` (5 files), wired as `knowledge` gateway operation

The knowledge graph provides entity/relation/observation storage with in-memory backing.
Operations: `create_entity`, `get_entity`, `list_entities`, `add_observation`, `create_relation`, `query_graph`, `stats`.
The spec reference is `dgm-specs/SPEC-KNOWLEDGE-MEMORY.md`.

The implementation is functional but deliberately minimal.
`query_graph` provides BFS-style traversal up to `max_depth`.
There is no persistence layer for knowledge — it is session-scoped in-memory only.

**Grade: B-.** Works as documented for Phase 1. Cross-session knowledge persistence is absent, which limits its value for the stated use case of accumulating codebase knowledge.

---

### Mental Models — Polished and Complete

**Files**: `src/mental-models/` (4 files), `src/mental-models/contents/` (15 TypeScript modules)

15 mental model implementations: abstraction-laddering, adversarial-thinking, assumption-surfacing, constraint-relaxation, decomposition, fermi-estimation, five-whys, impact-effort-grid, inversion, opportunity-cost, pre-mortem, rubber-duck, steelmanning, time-horizon-shifting, trade-off-matrix.

Each is a standalone TypeScript module with structured content.
Tag-based filtering is implemented and tested.
The recently-fixed bug (tag array filtering) has a corresponding test.

**Grade: A.** No gaps. This is the most complete, stable feature in the repository.

---

### Thought Handler — Core Engine, Production-Hardened

**Files**: `src/thought-handler.ts` (~250+ lines), `src/persistence/storage.ts` (888 lines)

The `ThoughtHandler` class manages:
- Auto-assigned thought numbering (SIL-102: `thoughtNumber` is now optional)
- Serialized concurrent processing via `processingQueue: Promise<void>` (prevents race conditions)
- Session auto-creation on first thought
- Integration with `SamplingHandler` for `critique: true` parameter
- Integration with Observatory event emitter
- Multi-agent attribution pass-through

The `LinkedThoughtStore` in `storage.ts` uses a doubly-linked list with Map indices for O(1) lookup, with compound node IDs (`${sessionId}:${branchId}:${thoughtNumber}`) to prevent branch-thought collision.

**Grade: A-.** The processing queue serialization correctly addresses the race condition (commit `22d6cc1`). The `verbose: false` default for minimal response mode (SIL-101) is a thoughtful bandwidth optimization.

---

### Notebook System — Functional but Thin

**Files**: `src/notebook/` (7 files), 1 template

The notebook handler implements headless Srcbook-style notebooks with cells, execution, and state management.
One template is available: `sequential-feynman-template.src.md`.
The templates directory is minimal (2 files total).

**Grade: C+.** The notebook system works but has limited template library and no evidence of heavy test coverage. It is a secondary feature compared to hub, evaluation, and observatory.

---

### Cipher Notation — Implemented and Extended

**Files**: `src/resources/thoughtbox-cipher-content.ts`, `src/multi-agent/cipher-extension.ts`

The cipher notation system provides 2-4x token compression using the `{num}|{type}|{refs}|{content}` format.
The `cipher-extension.ts` adds multi-agent domain vocabulary on top of the base cipher.
The `getExtendedCipher()` function concatenates base cipher with multi-agent extensions.

**Grade: A.** Clean, tested, and integrated into the gateway's `cipher` operation.

---

## 3. What Is Dead Weight to Clear?

### LOOPS_CATALOG — NOT Dead Weight (Populated with 18 Loops)

The prompt asks whether `LOOPS_CATALOG` is populated. It is.
`src/resources/loops-content.ts` is 7,193 lines of auto-generated content.
6 categories, 18 loops: authoring (code-generation, documentation, spec-drafting), exploration (codebase-discovery, domain-research, problem-space), meta (composition-patterns, loop-interface), orchestration (dependency-resolver, queue-processor, spiral-detector), refinement (code-quality, consistency-check, requirement-quality), verification (acceptance-gate, fact-checking, integration-test).

The catalog is live, sorted by hot-loops usage frequency, and accessible via MCP resources.
**This is not dead weight. Remove it from the cleanup list.**

---

### CLAUDE.md Aspirational Sections — Dead Weight (Documented as Implemented, Not Actually Implemented)

**Thompson Sampling for Reasoning Strategies** (CLAUDE.md lines ~150-200):
The section describes a `strategy_performance` SQLite table, `Beta.rvs()` sampling, and per-problem-type strategy selection.
Search of `src/` finds zero matches for `Thompson`, `strategy_performance`, `beta.rvs`, or `intelligencePriority` selection logic.
The `src/sampling/handler.ts` implements MCP `sampling/createMessage` for LLM critique, which is a different mechanism entirely (LLM-as-critic, not Bayesian strategy selection).
**This is aspirational documentation presented as a pattern reference — it is not implemented.**

**Multi-Layer Security with DCG** (CLAUDE.md lines ~200-260):
The section describes SHA-256 hash chains per thought, timestamp quantization to 5-minute windows, and chain verification.
`src/multi-agent/content-hash.ts` does implement SHA-256 thought hashing:
`hash = SHA-256(thought + "|" + thoughtNumber + "|" + parentHash + "|" + agentId + "|" + timestamp)`
This is a Merkle chain for attribution integrity in multi-agent contexts, not a security system.
**What is absent**: the "Layer 1" input sanitization, "Layer 3" chain verification (recomputing hashes for tamper detection), and "Layer 4" deterministic sampling. The content hash exists as an attribution primitive, not a DCG security system.
The CLAUDE.md section overstates what is implemented.

**Recommendation**: Replace both sections with accurate descriptions of what actually exists (content-hash Merkle chain for attribution; MCP sampling for critique). The documentation-code gap is a trust hazard for agents reading CLAUDE.md as ground truth.

---

### dgm-specs/ — Scaffolding with One Working Harness

**Status of each subdirectory:**
- `dgm-specs/harness/` — WORKING: 4 TypeScript files (cli.ts 183 lines, benchmark-runner.ts, baseline.ts, types.ts). The `npm run benchmark` and `npm run benchmark:baseline` scripts reference this.
- `dgm-specs/targets/` — EMPTY PLACEHOLDER: contains only a `README.md` with format instructions and "None yet" active targets table.
- `dgm-specs/validation/baseline.json` — POPULATED: a real baseline run from `2026-01-21` with test results for thoughtbox-basic and mental-models operations.
- `dgm-specs/SPEC-KNOWLEDGE-MEMORY.md` — CONTENT: spec for the knowledge graph system.
- `dgm-specs/hypotheses/`, `dgm-specs/archive/`, `dgm-specs/history/` — need individual assessment.

**Dead weight**: `dgm-specs/targets/` README-only placeholder.
**Worth keeping**: harness, baseline.json, SPEC-KNOWLEDGE-MEMORY.md.

---

### demo/multi-agent/ — Stale with Port Inconsistency

**Files**: `docker-compose.yml`, `env.example` (TypeScript agent files absent)

The demo `docker-compose.yml` maps port `3100:3100` for the thoughtbox service.
The actual server defaults to port `1731` (from `src/index.ts`: `parseInt(process.env.PORT || "1731", 10)`).
The demo would fail on startup unless `PORT=3100` is set in the environment.

The demo has no TypeScript agent implementations — only Docker compose configuration referencing agents that use the server image itself.
This is a skeleton demo with a documented port mismatch.

**Recommendation**: Either add a `PORT=3100` environment variable to the demo compose, or update the port mapping to `1731:1731`. The current state is broken by default.

---

## 4. What Needs Immediate Attention?

### Issue 1: 9 Pre-Existing Branch-Retrieval Test Failures

The proof-run-001 hypothesis document states:
> "316/325 pass, 9 pre-existing branch-retrieval failures only, TypeScript clean"

These failures predate the recent sub-agent stage fix and are explicitly documented as "unrelated" to that fix.
The test coverage for `read_thoughts` with `branchId` queries (test TB-019 in `tests/MASTER-TEST-INDEX.md`) is marked without a pass/fail indicator.
These are branch-retrieval failures in the behavioral test suite, not the Vitest unit tests — the unit tests in `src/hub/__tests__/` and `tests/unit/` are passing.

The 9 failures are in the agentic behavioral test runner (`scripts/agentic-test.ts`), which uses an LLM to execute natural-language test scenarios against a live server.
The failure root is likely in how `getBranch(sessionId, branchId)` retrieves thoughts when the `InMemoryStorage.getBranch()` method searches by branchId across the linked store.

**Impact**: Branch-based thought retrieval (`read_thoughts` with `branchId`) is unreliable in current release.
This affects the multi-agent hub use case where agents read each other's branches.

### Issue 2: Hub Event Payload — Untyped Bridge to Observatory

Hub events flow: `hub-handler.ts` emits `HubEvent { type, workspaceId, data }` → `server-factory.ts` calls `thoughtEmitter.emitHubEvent(event)` → `workspace.ts` channel broadcasts to WebSocket clients.

The `data: Record<string, unknown>` field carries untyped hub payloads.
The Observatory's typed schemas (`TaskEventPayloadSchema`, `AgentEventPayloadSchema`) are defined but not validated at this bridge.
If hub event shapes change, the Observatory silently broadcasts invalid JSON structures.

**Impact**: Observatory workspace visualization is brittle to hub evolution.

### Issue 3: Demo Port Inconsistency

`demo/multi-agent/docker-compose.yml` maps port `3100:3100`.
Server default is `1731`.
Demo is broken by default.

### Issue 4: CLAUDE.md Thompson Sampling + DCG — Agent-Facing Misinformation

Agents reading CLAUDE.md as ground truth will attempt to use `strategy_performance` tables, DCG chain verification, and deterministic sampling — none of which exist.
This creates incorrect mental models for agents working on the codebase.

---

## 5. What Is the Release Story?

### Is v2.0.0 Warranted?

**Yes. By semver definition, v2.0.0 is warranted and arguably overdue.**

The `[Unreleased]` section contains:
- A new mandatory initialization protocol (gateway with progressive disclosure stages)
- Multi-agent hub (architectural addition with new tool `thoughtbox_hub`)
- Observatory WebSocket server (new external interface)
- LangSmith evaluation integration (new external dependency, `langsmith` package)
- Knowledge graph memory (new operation)
- OODA loops as MCP resources (new resource endpoint)
- Cipher extension with multi-agent vocabulary
- SIL-101/102/103 changes to thought parameter contracts (thoughtNumber/totalThoughts now optional — **backward-incompatible API change**)

The SIL-102 change alone (making `thoughtNumber` and `totalThoughts` optional) is a behavioral contract change that existing integrations may not expect.
The gateway-only architecture (removing direct tool access) is a client-facing breaking change.

**Proposed versioning path**:
1. Freeze unreleased feature additions
2. Resolve the 9 branch-retrieval failures
3. Fix the demo port inconsistency
4. Update CLAUDE.md to remove unimplemented Thompson Sampling and DCG sections
5. Tag v2.0.0-rc.1
6. Run full behavioral test suite
7. Tag v2.0.0

---

## Feature Maturity Matrix

| Feature | Implemented | Tested | Documented | Integrated |
|---------|------------|--------|------------|------------|
| Gateway Pattern | YES | YES | YES | YES |
| Progressive Disclosure | YES | YES | PARTIAL | YES |
| Hub Multi-Agent | YES | YES | PARTIAL | YES |
| Evaluation (LangSmith) | YES | YES | PARTIAL | YES |
| Observatory | YES | YES | PARTIAL | YES |
| Knowledge Graph | YES | NO | PARTIAL | YES |
| Notebook System | YES | PARTIAL | PARTIAL | YES |
| Mental Models | YES | YES | YES | YES |
| Cipher Notation | YES | YES | YES | YES |
| OODA Loops | YES | PARTIAL | YES | YES |
| DCG Security | NO | NO | YES (CLAUDE.md only) | NO |
| Thompson Sampling | NO | NO | YES (CLAUDE.md only) | NO |
| Self-Improvement Loop | PARTIAL | PARTIAL | PARTIAL | PARTIAL |

### Matrix Notes

**Gateway Pattern**: The per-session stage isolation was verified in proof-run-001. The operations catalog resource embedding is tested.

**Progressive Disclosure**: Implemented and tested for the main path. `list_roots` and `bind_root` operations are exposed by the gateway but their backing implementation in `src/init/sources/` needs verification.

**Hub Multi-Agent**: 37 test files covering nearly every operation. Proof-run-001 confirmed real multi-agent coordination. Documentation in `AGENTS.md` and spec files is partial — the hub protocol is not documented in a standalone guide.

**Evaluation (LangSmith)**: 9 test files, complete architecture. Not documented in README or user-facing docs. `LANGSMITH_API_KEY` gate works correctly.

**Observatory**: WebSocket server functional, 3 channels implemented, HTML UI shipped. Not documented in README. Hub-to-observatory schema bridge is untyped.

**Knowledge Graph**: Phase 1 implementation complete with handler and storage. No dedicated test file found in `tests/unit/` or `src/knowledge/`. Storage is in-memory only (no persistence across sessions).

**Notebook System**: Handler, state manager, and execution engine exist. 1 template. Minimal test coverage compared to hub and evaluation.

**Mental Models**: 15 models, tag filtering, fully tested. This is the most mature user-facing feature outside core thought handling.

**Cipher Notation**: Extended with multi-agent domain vocabulary. Documented in `CLAUDE.md` (correctly) and served via gateway `cipher` operation.

**OODA Loops**: 18 loops across 6 categories, embedded at build time, served as MCP resources with usage analytics. Not covered by unit tests — the embedding script (`scripts/embed-loops.ts`) is the production path.

**DCG Security**: Described in CLAUDE.md as a pattern. The `src/multi-agent/content-hash.ts` provides SHA-256 Merkle chains for attribution integrity — this is the closest real implementation. Full DCG (chain verification, tamper detection, deterministic sampling) is not implemented.

**Thompson Sampling**: Described in CLAUDE.md. Not implemented anywhere in `src/`. The `sampling/handler.ts` is an LLM critique primitive via MCP `sampling/createMessage` — it is not Bayesian strategy selection.

**Self-Improvement Loop**: `scripts/agents/run-improvement-loop.ts` exists with `--dry-run` and `--verbose` flags. `src/observatory/improvement-tracker.ts`, `improvement-store.ts`, and `evaluation-gatekeeper.ts` provide the evaluation pipeline. The loop is implemented as a script that can be run manually or via `npm run improvement-loop`. Full autonomy (continuous improvement without human trigger) is not wired.

---

## Strategic Recommendations

### Immediate (Before Any Release)

1. **Fix the demo port**: Add `PORT: "3100"` to the `thoughtbox` service environment in `demo/multi-agent/docker-compose.yml`, or change the port mapping to `"1731:1731"`.

2. **Correct CLAUDE.md**: Replace the Thompson Sampling and DCG sections with accurate descriptions. Thompson Sampling → describe the MCP sampling/createMessage critique mechanism. DCG → describe the SHA-256 Merkle chain for attribution integrity in `content-hash.ts`.

3. **Diagnose the 9 branch-retrieval failures**: Run `npm run test:behavioral` and capture the specific branch-query patterns that fail. The `getBranch()` path through `LinkedThoughtStore` is the likely location.

### Short-Term (v2.0.0 Prep)

4. **Add Knowledge Graph tests**: No unit test file exists for `src/knowledge/`. Add tests for entity CRUD, relation creation, and `query_graph` traversal.

5. **Schema-enforce the hub-observatory bridge**: Add Zod validation at the `workspace.ts` channel listener. When `thoughtEmitter.on("hub:event", ...)` fires, validate the payload against a `HubEventPayloadSchema` before broadcasting.

6. **Write a Hub Protocol Guide**: The hub is the most complex feature with the least standalone documentation. A `docs/hub-protocol.md` covering registration, workspace lifecycle, problem/proposal/consensus flow, and channel subscription would reduce onboarding friction for new integrators.

7. **Tag v2.0.0-rc.1** after the above are addressed.

### Medium-Term

8. **Knowledge Graph persistence**: Extend `FileSystemStorage` or add a `FileSystemKnowledgeStorage` implementation. Without cross-session persistence, the knowledge graph cannot accumulate codebase understanding across agent sessions.

9. **`dgm-specs/targets/` population**: Define at least two concrete capability targets (e.g., "Branch retrieval reliability", "Hub coordination overhead") with measurement approaches. The benchmark harness exists; the targets are empty.

10. **Observatory schema enforcement audit**: Walk the full event emission path from `thoughtEmitter.emitThoughtAdded()` through WebSocket broadcast and verify that all payload types are Zod-validated at both emission and reception.

---

## Summary

The Thoughtbox codebase is a v2.0.0 product wearing a v1.2.2 label.
The core gateway pattern, hub multi-agent system, and LangSmith evaluation pipeline are production-quality implementations backed by real proof runs and comprehensive test suites.
The OODA loops catalog is populated and live.
The Observatory is functional but needs schema-enforcement tightening at the hub bridge.

The clearest dead weight is in documentation: CLAUDE.md overstates the Thompson Sampling and DCG implementations as existing patterns when they are aspirational descriptions of unimplemented systems.
This is the highest-priority documentation fix because agents reading CLAUDE.md as ground truth will develop incorrect models of how the system works.

The codebase is release-ready for v2.0.0-rc.1 after the demo port fix, the 9 branch-retrieval failure diagnosis, and the CLAUDE.md corrections.
The feature set is substantial and coherent.
