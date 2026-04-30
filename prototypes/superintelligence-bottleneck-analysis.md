# Superintelligence Bottleneck Analysis: Thoughtbox Evolution

**Source:** Thoughtbox session `d8b5b834-63ba-4780-9bd2-7a685c3318d3`
**Companion notebook:** `9hnw0jmim8` (in Thoughtbox storage; recoverable via `notebook_load`)
**Branch:** `feat/superintelligence-bottleneck-analysis`
**Date:** 2026-04-28

## Premise

Adopting the perspective of a more-capable mind, identify the bottlenecks of a present-day LLM agent that are eliminable through externalized cognition (specifically: through changes to the Thoughtbox MCP server and surrounding plugins), and design the smallest set of additions that closes the gap most efficiently.

## Frame: environment-as-memory

Agents in a workspace cannot self-calibrate the way a human can — they have no persistent memory. The workspace itself (codebase, tooling, MCP server surfaces, response payloads) must carry the calibration. Every visible information surface is a chance to make the last good surprise more likely to recur and the last bad surprise less likely to repeat.

In this repo specifically, the recursive case applies: an agent working on Thoughtbox is simultaneously USING and MODIFYING the substrate that calibrates the next agent.

## 24 Eliminable Bottlenecks (B1–B24)

Working memory (B1), cross-session continuity (B2), hypothesis enumeration (B3), calibration (B4), goal stability (B5), action-outcome learning (B6), tool selection (B7), counterfactual reasoning (B8), claim verification (B9), cost-value awareness (B10), pattern recurrence (B11), skill accumulation (B12), coalition coordination (B13), self-model (B14), reflection gating (B15), active-inference policy (B16), note evolution (B17), MAP-Elites diversity (B18), sleep-time compute (B19), out-of-band supervision (B20), recursive self-improvement (B21), meta-learning (B22), time/utility-rate (B23), crystallization (B24).

Structural bottlenecks (information that doesn't exist, NP-hard problems, speed-of-light to external systems) are explicitly excluded from the design space.

## 6 Clusters

| Cluster | Bottlenecks | Mechanism |
|---------|-------------|-----------|
| C-MEM (memory) | B1, B2, B11, B17 | externalize state, retrieve under context |
| C-EPI (epistemics) | B3, B4, B6, B9, B14, B16 | tighten belief–evidence loop |
| C-GOAL (goal & control) | B5, B10, B15, B20 | maintain alignment over time |
| C-SKILL (skill & composition) | B7, B12 | reuse working patterns |
| C-EXPLR (exploration) | B3, B8, B18 | illuminate option space |
| C-COORD (coordination) | B13, B19 | work happens beyond one mind, one moment |
| C-SELF (self-improvement) | B21, B22, B24 | recursive substrate edits |

## 10 Architectural Changes (M0–M10)

### M0 — Catalog annotation (PRECURSOR, ships first)

**Where:** `src/code-mode/search-tool.ts` (or `src/code-mode/search-index.ts`).
**What:** when assembling the operation catalog, augment each operation's `description` with hand-curated `when_to_use`, `recent_failure_modes`, `related_ops` fields. Carries the equivalent of `.claude/rules/mcp-gotchas.md` into every agent's view, regardless of host.
**Cost:** ~50 LOC + content.

### M0' — Dynamic MCP resources (PRECURSOR)

**Where:** `src/resources/`.
**What:** add resource templates that return live computed payloads:
- `thoughtbox://session/{sessionId}/seed`
- `thoughtbox://calibration/topic/{topic}`
- `thoughtbox://supervisor/recent`
- `thoughtbox://self-model/snapshot`

### M1 — Ambient context block (THE SPINE)

**Where:** `src/thought-handler.ts:1107` (minimal response) and `:1127` (verbose response).
**What:** every `tb.thought()` response carries a compact `ambientContext` object — required fields (goal, constraints, budget) + optional fields (selfModel, drift, relevantPastThoughts, pendingReflection, pendingIntervention).
**Token discipline:** 150-token hard cap per ambient block; aggressive elision of empty fields.
**Bottlenecks:** B1, B2, B5, B11, B23, partial-everything.

### M2 — Input-schema extensions (calibration data source)

**Where:** `src/thought/operations.ts`, `src/thought-handler.ts`, `src/knowledge/storage.ts`.
**What:**
- `action_report` gains required `forecast { expected, predictedSuccess, predictedSideEffects? }` (warn-only by default; required when session declares calibration as a goal).
- New `claim` thoughtType: `{ claim, falsifierCellId, observed }` — server runs `notebook_validate` inline and persists verdict.
- Session start (thought 1) gains `goal`, `constraints`, `budget`.
**Storage:** `ForecastRecord` entities in knowledge graph with `OUTCOME_OF`, `IN_CATEGORY` relations.
**Bottlenecks:** B4, B6, B9, partial B5/B14.

### M3 — Sleep-time compute pipeline

**Where:** new Cloud Run job triggered by Supabase trigger on `sessions.completed_at`.
**Pipeline stages:** claim extraction → calibration aggregation → skill candidate extraction → drift trajectory (IDS-style baseline-ratio) → per-topic success aggregation → A-Mem-style knowledge evolution → session seed (cipher format).
**Bottlenecks:** B19, B11, B17, B24, feeds B14.

### M4 — Server-side supervisor + multi-channel delivery

**Production (server-side):** new Cloud Run service `thoughtbox-supervisor` subscribes to `/events` SSE, runs rule predicates + LLM diagnosis, writes intervention thoughts into source sessions. VIGIL-shaped intervention: `{ diagnosis, promptPatch?, codeProposal?, invariants }`.

**Delivery (client's choice):**
- **Piggyback (default):** `tb.thought()` response carries `ambientContext.pendingIntervention`.
- **Channel daemon (optional):** new MCP plugin `thoughtbox-supervisor-channel` (separate from existing `thoughtbox-channel`) — Claude Code docs confirm `--channels` accepts multiple servers, distinguished by auto-set `source` attribute.
- **Pull (optional):** new op `tb.events.peek({ sessionId, since })`.

**Bottlenecks:** B15, B20, partial B5.

### M5 — Team sessions (multi-agent primitives surfaced as MCP ops)

**Where:** `src/multi-agent/` already has claim-parsing, content-addressable thought hashing, conflict detection — none exposed as MCP ops.
**New ops:** `team_session_create`, `team_session_attribute`, `team_session_state`, `team_session_resolve_conflict`.
**Bottlenecks:** B13.

### M6 — Skill module (Voyager + Letta over notebook cells)

**Where:** new `src/skills/`, reusing `src/notebook/execution.ts` for sandboxing.
**New ops:** `skill_save`, `skill_retrieve`, `skill_run`, `skill_list`, `skill_compose`.
**Schema (Letta-shaped):** `{ name, sourceCode, jsonSchema, requirements, tags, scope: project|agent|user|bundled, defaultRequiresApproval, embedding, usageStats }`.
**Bottlenecks:** B7, B12.

### M7 — Self-modification log with eval-gated commit

**Where:** new `src/self-modification/` (immutable from agent edits).
**Pipeline:** propose → baseline → apply (canary deploy) → evaluate → decide (merge or revert).
**Karpathy autoresearch shape:** commit if better metric, `git reset --hard` if worse.
**Bottlenecks:** B21, partial B22, partial B14.

### M8 — Counterfactual replay (second wave)

`branch_replay({ sessionId, fromThought, modification })` re-rolls a session under a modified premise; runs at sleep-time. Bottleneck: B8.

### M9 — Active-inference policy scoring (second wave)

`decision_frame` gains a server-side scorer that computes expected information gain per option using the LLM as the amortized generative model. Bottleneck: B16.

### M10 — MAP-Elites diversity archive (second wave)

`archive_put({ descriptor, solution, fitness })` and `archive_elites({ taskClass, byAxis })` for niche coverage. Bottleneck: B18.

## Phase Sequence

| Phase | Modules | Time horizon | Validation gate |
|-------|---------|--------------|-----------------|
| A — Demonstrate | M0, M0' | weeks | A/B benchmark on parameter-error rate |
| B — Foundation | M1, M2 | month | Goal-echo presence in subsequent thoughts; forecast capture rate ≥30% |
| C — Intelligence | M3 | quarter | Per-topic calibration aggregates accumulating |
| D — Reactivity | M4 + supervisor channel plugin | quarter+ | Intervention recall vs human-supervised baseline |
| E — Capabilities | M5, M6, M7 (parallel) | as capacity allows | Independent value per module |
| F — Second wave | M8, M9, M10 | after E | Builds on Phase B–D data |

Each phase ships independently; each ADR is independently buildable, validatable, and revertable.

## ADR Chain (HDD-shaped)

- **ADR-EPI-01** Epistemic MCP wedge: catalog annotation + goal echo
- **ADR-EPI-02** Forecast-outcome calibration loop
- **ADR-EPI-03** Sleep-time compute pipeline
- **ADR-EPI-04** Out-of-band supervisor with multi-channel delivery
- **ADR-EPI-05** Team sessions over multi-agent primitives
- **ADR-EPI-06** Skill library over notebook cells
- **ADR-EPI-07** Self-modification log with eval-gated commit
- **ADR-EPI-08** Counterfactual replay
- **ADR-EPI-09** Active-inference policy scoring
- **ADR-EPI-10** MAP-Elites diversity archive

Each ADR follows: Research → Stage → Implement → Validate → Decide. Later ADRs only ship if earlier ones validate.

## Smallest Shippable Unit (ADR-EPI-01)

~80 LOC across two files:

1. `src/code-mode/search-tool.ts` — `annotateCatalog(catalog)` augments each operation's description with hand-curated `when_to_use` / `recent_failure_modes` / `related_ops`. Hand-curated content lifted from `.claude/rules/mcp-gotchas.md` is the v0 dataset.

2. `src/thought-handler.ts:1108` — minimal response gains a `goal: string` field, derived from `sessionTitle` or first 60 chars of thought 1's content.

**Risk profile:** zero-impact on existing callers; purely additive; rolls back as a one-line revert.

**Validation:** A/B benchmark on a curated 10-task agent suite that exercises knowledge-graph ops and long-session software engineering tasks. Measure parameter-error rate and goal-relevance score on thoughts 50+. If improvement is null, the broader thesis needs rethinking before committing to ADR-EPI-02+.

## Strategic positioning

No deployed MCP server currently exposes `selfmodel.get` or `calibration.delta` primitives. Every existing MCP server is a TOOL provider (database, filesystem, search). Thoughtbox after M1+M2+M3 becomes the first EPISTEMIC server: its primitives are about the agent's own state, not about external systems. This is differentiating surface.

## Persisted artifacts

- 4 Insight entities in the knowledge graph linking back to this session: `environment-as-memory`, `production-delivery-separation`, `wedge-vs-session-surfaces`, `forecast-before-act`.
- This document.
- The Thoughtbox notebook `9hnw0jmim8` with full markdown specs and runnable TypeScript prototypes for M1, M2, and ADR-EPI-01.

## Open questions

1. Where do `CATALOG_ANNOTATIONS` live as code? Hand-curated TS file v0; M3 mines them v1; migration path needs design.
2. Goal echo: default-on or opt-in? Recommend default-on with feature-flag escape hatch for one release window.
3. When forecasts (M2) become available, should the catalog automatically surface "your last 5 forecasts on this op were off by X" inline? Decision deferred to ADR-EPI-02.
4. Path to Anthropic channel-allowlist inclusion for `thoughtbox-supervisor-channel`.
5. Auth model for self-modification (M7) — who has authorization to make recursive substrate edits?
6. Cold-start UX for M1: what does ambient context show before any calibration data exists?
7. Privacy / RLS policies for calibration data, skill libraries, session seeds.
8. Cost model for Phase B+C+D LLM inference per agent-month.
