# Prioritized Implementation Plan — Highest-Value Designs in `.specs/`

> **Status**: Proposal (review artifact)
> **Created**: 2026-06-03
> **Author**: Cloud agent review of the `.specs/` corpus (171 files)
> **Scope**: This document does **not** change product behavior. It reviews the
> spec corpus, selects the highest-value ideas, and proposes a sequenced plan
> with explicit reasoning for each choice. It is intended as input to the HDD
> lifecycle (`.adr/staging/`) — each accepted initiative below should graduate
> into its own staging ADR + spec pair before implementation.

---

## 1. Purpose

The `.specs/` directory contains a large, valuable, but uneven body of design
work: ~171 files spanning ~30 spec suites. Some specs are already implemented,
some are half-built, many are prose-only research, and a few are stale relative
to the current Code Mode architecture.

This plan answers one question: **if we want the most product and trust value
per unit of implementation risk, what should we build next, and why?**

It is deliberately opinionated. Selection reasoning is given for every pick, and
— just as importantly — for the high-profile ideas that are **deliberately
deferred**.

---

## 2. Grounding: what Thoughtbox is meant to be

Choices below are anchored to settled product intent
(`.specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md`) and to verified
production reality (`.specs/production-overview/PRODUCTION-SYSTEM-MAP.md`):

- **Thoughtbox is a reasoning workstation for agents.** The primary user is an
  autonomous agent, not a human.
- **The core promise is durable, versioned reasoning** over long, complex
  problems — a "Git-like reasoning repository."
- **Code Mode is the public interaction model.** The live MCP surface is exactly
  three tools: `thoughtbox_search`, `thoughtbox_execute`, `thoughtbox_peer_notebook`
  (verified: `src/server-factory.ts:581-583`).
- **North star**: a single mandatory, intelligent control plane through which
  agents act, plus "stateless ML" — the environment learns to shape itself for
  future agents between sessions.
- **The web app should make multi-agent reasoning legible** as a structure that
  grows visibly.

A recurring pattern in this corpus, confirmed by code inspection, is that
**backends are frequently ahead of their surfaces**: the audit engine, knowledge
graph, evaluation harness, hub profiles, and peer-notebook control plane all have
working server-side code that is not yet exposed, wired, or made legible. The
cheapest high-value wins therefore tend to be *finishing the last mile* of
already-built capabilities, not greenfield builds.

---

## 3. Selection rubric

Every candidate was scored on four axes. The reasoning column in each initiative
references these.

| Axis | Question | Why it matters |
| --- | --- | --- |
| **Intent fit** | Does it advance the settled product center of gravity (durable reasoning, Code Mode, legibility, control-plane learning)? | Avoids polishing accidental surfaces. |
| **Leverage on existing code** | Is the hard part already built and merely unexposed/unwired? | Last-mile work is the cheapest, lowest-risk value. |
| **Friction / risk** | How invasive is the diff? New subsystem vs wiring/copy? | Lower friction ships sooner with fewer regressions. |
| **Trust / correctness floor** | Does it fix data loss, security exposure, or actively misleading agent guidance? | Correctness and safety dominate feature polish. |

**Decision rule**: prioritize high *intent fit* × high *leverage* × low *friction*,
and treat any **trust/correctness floor** issue (data loss, security, misleading
agents) as non-negotiable and top of queue regardless of feature appeal.

---

## 4. Corpus landscape at a glance

What the field looks like after cross-referencing each suite against `/workspace/src`:

| Suite / idea | Headline status | Notes |
| --- | --- | --- |
| Code Mode public surface | **Shipped** | 3-tool surface live; discoverability copy partly stale. |
| Protocol tools (Theseus/Ulysses) | **Shipped via `tb.*`** | Handlers + HTTP enforcement + Supabase live. |
| Auditability (AUD-001..010) | **Backend ahead of UI** | Structured fields, gap/critique engine exist; UI partial. |
| Cognitive harness (CHX-01..11, HARNESS T1-T3) | **Mostly absent / partial** | Several are docs+schema-only changes. |
| Knowledge graph | **Backend live, no web UI** | Populated via MCP, invisible in app. |
| Peer notebooks (ADR-022) | **Control plane live, runtime mocked** | Durable plane done; lifecycle + inspection + real runtime absent. |
| Notebooks / Agentic Runbooks | **Scaffold + stub runtime** | Domain model real; execution in-memory stub. |
| Eval system (SPEC-EVAL-001) | **Coded, loop open** | LangSmith path real; gatekeeper pass-through, no baselines. |
| Sleep-time / evolution-check | **Prompt + queue exist, classifier absent** | Worker skeleton present. |
| Hub roles (HUB-002) | **Phase 1 done, priming unwired** | `getProfilePriming` used only in tests. |
| Srcbook port (SRC-001..006) | **Mostly not started** | SRC-006 is a data-loss fix; rest is notebook DX. |
| Observability sidecar (OBS-001) | **Not started** | Infra-heavy; partial `tb.observability()` exists. |
| Security audits | **Partially remediated, open gaps** | Unauthenticated hub/SSE paths still open. |
| Canonical IR / TBX-C1, RLM, MAP-Elites, Unified Autonomy Loop | **Prose / research** | High ambition, high friction, speculative. |

---

## 5. The plan — four waves

Initiatives are grouped into waves by dependency and risk, not calendar time.
Within each wave they are roughly ordered by priority.

### Wave 0 — Trust & safety floor (do first, non-negotiable)

These are not features; they are correctness and security obligations for a
product whose entire value proposition is *durable, trustworthy* reasoning.

---

#### 0.1 — Lock down unauthenticated workspace surfaces

- **Source**: `.specs/workspace-isolation-audit.md`, `.specs/security/identity-binding-audit.md`
- **Idea**: The local/non-multi-tenant HTTP surfaces accept client-controlled
  workspace identity with no auth.
- **Why high value (reasoning)**: Trust/correctness floor. Verified directly:
  `GET /events` defaults `workspace_id` to `"*"` (`src/http/event-stream.ts:39-44`)
  and `POST /hub/api` reads `agentId` from the request body with no
  authentication (`src/http/hub-http.ts:12-37`). These mount in non-multi-tenant
  mode; any deployment that binds `0.0.0.0` without the multi-tenant path leaks
  cross-workspace hub state and event streams. For a product selling auditable,
  isolated reasoning, an "any workspace" wildcard is a credibility-ending bug.
- **Status**: Open. `/mcp` and OTLP are correctly scoped; hub/SSE are not.
- **Scope**: Require an auth/workspace assertion on `/hub/api` and `/events`;
  reject the `"*"` wildcard from untrusted callers; align with the `/mcp`
  multi-tenant auth pattern. Add regression tests.
- **Friction**: Low–Medium. Localized to `src/http/*` and mount conditions in
  `src/index.ts`.
- **Companion fixes (same wave, from the identity audit)**: OAuth callback open
  redirect via unvalidated `next` (`apps/web/src/app/api/auth/callback/route.ts`);
  finish the C6 workspace-scoping sweep across knowledge/persistence/otel
  handlers (a `WorkspaceScopedClient` wrapper) rather than relying on per-call
  `.eq("workspace_id", …)` discipline; defend `updateProfileAction` at the action
  layer.
- **Acceptance**: No unauthenticated path accepts a client-supplied or wildcard
  workspace id; tests prove cross-workspace reads/writes are rejected.

---

#### 0.2 — Session recovery via MCP root (data-loss prevention)

- **Source**: `.specs/SPEC-SRC-006-session-recovery-via-mcp-root.md`
- **Idea**: Bind sessions to the MCP root URI so `load_context`/resume without a
  `sessionId` auto-recovers the most recent session for that project directory.
- **Why high value (reasoning)**: Trust/correctness floor + maximum intent fit.
  The core product promise is *durable* reasoning. Today, when an MCP client
  session times out (~15 min idle), the agent loses the session id and the
  thought chain is effectively orphaned — the agent must remember an id it has no
  reliable way to hold. Verified: `Session`/`SessionFilter` carry no
  `mcpRootUri` field (`src/persistence/types.ts`, grep: 0 matches). This is a
  small server-only diff that directly protects the thing the product exists to
  protect.
- **Status**: Not implemented.
- **Scope**: Add `mcpRootUri` to the session model and storage filter; persist it
  on session create from the bound root; add auto-recovery-by-root to the
  resume/load path.
- **Friction**: Medium, server-only. No web or infra changes.
- **Acceptance**: After a simulated client timeout, an agent resumes the correct
  session by root with no id supplied; wrong-root never recovers another
  project's session.

---

### Wave 1 — Cheap correctness & ergonomics on the shipped surface

These make the **already-public Code Mode surface** stop misleading agents and
stop charging token tax. All are low-friction, high-leverage.

---

#### 1.1 — Code Mode discoverability cleanup

- **Source**: `.specs/code-mode/cleanup-review-notes.md`, `.specs/code-mode/target-state.md`
- **Idea**: Purge stale `init` / `gateway` / `THOUGHTBOX_PROJECT` / `tb.hub`
  guidance from the content that `thoughtbox_search` ingests and from resource
  text agents read.
- **Why high value (reasoning)**: Intent fit + trust. The public surface already
  shipped, but discoverability still teaches dead workflows
  (`src/resources/server-architecture-content.ts` references `THOUGHTBOX_PROJECT`;
  catalogs reference removed `init`). Misleading guidance on a live agent-facing
  surface causes failed tool calls and wasted context — pure negative value that
  costs almost nothing to remove.
- **Status**: Partial. `init`/`gateway` tools are unregistered, but their copy
  lingers.
- **Scope**: Edit resource/prompt/search-index content; align example payloads
  with the real `tb.*` SDK; remove `tb.hub` references the surface test already
  asserts are absent.
- **Friction**: Low (copy + metadata).
- **Acceptance**: No discoverability content references unregistered tools or env
  vars; search results describe only the real surface.

---

#### 1.2 — Finish the project-scoping contract (ADR-013)

- **Source**: `.specs/knowledge-storage-project-scoping.md`
- **Idea**: Resolve project scope from `workspaceId` / MCP roots at runtime;
  remove the `THOUGHTBOX_PROJECT` startup path and the silent `"default"`
  fallback; make pre-scope operations fail loudly with accurate messages.
- **Why high value (reasoning)**: Trust/correctness + intent fit (multi-tenant).
  The dangerous failure mode is silent: a mis-scoped session returns an **empty
  knowledge graph** instead of an error, so agents conclude "nothing is known"
  when the data is simply in another scope. `resolveProject()` already exists in
  `server-factory.ts`; the work is removing fallbacks and fixing error copy that
  still says "Call bind_root or start_new" (no longer public tools).
- **Status**: Partial.
- **Scope**: Remove `THOUGHTBOX_PROJECT`/`default` fallbacks; correct error
  strings; confirm Supabase construction-time scoping is consistent.
- **Friction**: Medium, mostly wiring/copy.
- **Acceptance**: A mis-scoped operation errors loudly; no silent empty-graph
  result; no references to removed tools in error text.

---

#### 1.3 — Cognitive-harness quick wins (CHX-01, HARNESS-T2 defaults, CHX-03, CHX-07/08)

- **Source**: `.specs/cognitive-harness-improvements/*`, `.specs/harness-optimization/SPEC-HARNESS-T2.md`, `.specs/SPEC-CHX-001-…md`
- **Idea**: A bundle of small ergonomics/correctness fixes derived from a real
  146-thought session:
  - **CHX-01 + T2 defaults**: stop documenting/requiring fields the server
    already auto-assigns (`thoughtNumber`) or defaults (`thoughtType`,
    `nextThoughtNeeded`). The handler already auto-numbers and defaults
    `thoughtType` to `reasoning`; only the Zod schema/SDK/docs disagree.
  - **CHX-03 mid-session recall**: expose `getThought(N)` / `recent(n)` /
    `searchWithin` on `tb.session`. `ThoughtboxStorage.getThought()` already
    exists; only the SDK wiring is missing.
  - **CHX-07/08 deliberation + typed audit**: allow a `decision_frame` to record
    "leaning toward X" without forcing exactly one selection, and route gap
    detection by `sessionType` so research sessions stop getting false
    "decision-without-action" flags. Verified: the handler hard-requires exactly
    one `selected: true` (`src/thought-handler.ts:482-485`) and `detectGaps`
    hardcodes the decision→action window (`src/audit/manifest-generator.ts:178-195`).
- **Why high value (reasoning)**: Leverage + intent fit. These are the friction
  points agents hit *while doing the core activity*. The hard logic is already in
  the handler/storage; the changes are schema, SDK surface, and audit routing.
  CHX-02's estimate alone is ~17k tokens saved per long session. The false audit
  flags actively erode trust in the audit engine we want agents to rely on.
- **Status**: Partial/absent at the SDK & schema layer; foundations exist.
- **Scope**: Schema relaxations + SDK helpers + audit routing + doc/example
  updates. Each item is independently shippable.
- **Friction**: Low–Medium per item; no new subsystems.
- **Acceptance**: Required fields drop where the server already supplies them;
  `tb.session.getThought/recent/searchWithin` work; deliberating decision frames
  persist; research sessions no longer raise action-gap false positives.
- **Note**: CHX-04/11 (structured subagent attachment) are **excluded** here —
  high impact but high friction (multi-agent runtime contract). Defer to Wave 3
  thinking.

---

#### 1.4 — Citation fields on thoughts

- **Source**: `.specs/architecture-exa-composition-and-thoughtbox-upgrades.md` (punch-list #2)
- **Idea**: Add `citesThoughtIds` / `citesEntityIds` to the thought schema.
- **Why high value (reasoning)**: Intent fit + leverage. The flagship vision is a
  *versioned reasoning graph*. Citations are the edges that make reasoning
  provenance a real DAG instead of a flat list, and they are the prerequisite for
  later groundedness tooling and the "merge evidence" model. It is a small,
  additive schema change with no new subsystem — a foundational primitive bought
  cheaply now.
- **Status**: Not started.
- **Scope**: Schema + validation in `src/thought/tool.ts` / handler; persist and
  surface in export/UI.
- **Friction**: Low.
- **Acceptance**: Thoughts can reference prior thoughts/entities; citations
  round-trip through storage and export.

---

### Wave 2 — Make built capabilities legible (product surface)

The product intent says the web app should make reasoning structure *visible*.
Several powerful backends are currently invisible. These waves turn existing data
into product.

---

#### 2.1 — Surface the audit engine in the web session UI

- **Source**: `.specs/auditability/SPEC-AUD-003`, `SPEC-AUD-004`; supported by `SPEC-AUD-001/010`
- **Idea**: Render the audit manifest (decision/action gaps, unaddressed
  critiques, action blast-radius, confidence trail) that is already generated at
  session close — plus a dedicated Actions view and inline critique display.
- **Why high value (reasoning)**: Maximum leverage. `src/audit/manifest-generator.ts`
  already computes gaps, critique overrides, and action stats at session close,
  and `critique` is already passed through web view-models — but **nothing
  renders it**. This is the difference between "we have an audit engine" and
  "agents and operators can actually answer *where did it go wrong?*" The web app
  is already ahead of Observatory on filters and the fork rail, so it is the right
  home.
- **Status**: Backend ~50%+, UI ~15%. Observatory structured rendering (AUD-010)
  is ~90% done and can be the reference.
- **Scope**: Web components reading already-persisted audit data; Actions list
  with decision-proximity linking; collapsible critique sections with a
  "not addressed" badge.
- **Friction**: Medium, mostly UI on existing data.
- **Acceptance**: A finished session shows its audit manifest, action log, and
  unaddressed critiques in the web UI without new backend work.

---

#### 2.2 — Knowledge Graph web UI

- **Source**: `.specs/monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI.md`, `INTEGRATION-MAP.md`
- **Idea**: A `/w/[slug]/knowledge` page rendering `entities`/`relations` as an
  interactive graph with an observations detail panel.
- **Why high value (reasoning)**: Intent fit (the "graph that grows" vision) +
  leverage. The knowledge graph is written live via MCP
  (`src/knowledge/supabase-storage.ts`) and workspace RLS policies already exist,
  but the graph is **invisible** in the product — the single most under-marketed
  capability. This is read-only UI over existing, already-secured data.
- **Why after 2.1**: 2.1 reuses an existing engine with near-zero new surface;
  2.2 adds a new page and a graph dependency (Cytoscape), slightly more.
- **Status**: Not started in web; backend live.
- **Scope**: Web page + RLS-scoped reads + Cytoscape. **Security note**: every
  query must enforce `workspace_member_access` — treat as part of Wave 0's
  isolation discipline.
- **Friction**: Medium (~8 web files + dep).
- **Acceptance**: A workspace's KG renders interactively, scoped strictly to that
  workspace.

---

#### 2.3 — Wire hub profile priming into the thought path (HUB-002 Phase 3)

- **Source**: `.specs/SPEC-HUB-002-hierarchical-agent-roles.md`
- **Idea**: Inject `getProfilePriming()` into the thought/branch response path so
  agent roles (MANAGER/ARCHITECT/DEBUGGER/…) become behavioral, not documentary.
- **Why high value (reasoning)**: Leverage + intent fit (multi-agent Hub). The
  registry, `register`/`whoami`, priming builder, and tests already exist
  (`src/hub/*`); `getProfilePriming` is currently **only called in tests**.
  Wiring it into the runtime is a bounded change that turns a built-but-dormant
  feature into the scaffolding that makes multi-agent teams adhere to process via
  infrastructure rather than memory.
- **Status**: Phase 1 done; Phase 3 unwired.
- **Scope**: Hub/thought-handler integration; optional per-profile critique
  validation.
- **Friction**: Medium, contained to `src/hub` + thought handler.
- **Acceptance**: A registered profile measurably changes thought-loop priming at
  runtime, not just in tests.

---

#### 2.4 — Coherent "one run" view (SHIP-CHECKLIST / Usability cutline P0)

- **Source**: `.specs/thoughtbox-v1-finalstretch/SHIP-CHECKLIST.md`, `SPEC-USABILITY-CUTLINE.md`
- **Idea**: A single work-period view joining reasoning thoughts + OTEL tool
  events + files changed + cost for one real coding session.
- **Why high value (reasoning)**: Intent fit (legibility) + leverage. Run binding
  (`runs` table), OTLP ingestion, auto-bind, and the session detail page already
  exist and join the data; the remaining work is an end-to-end real-run
  verification pass plus explicit empty/error states. This is the lowest-friction
  path to a *demoable* product narrative ("here is exactly what the agent did").
- **Status**: ~70% per checklist.
- **Scope**: E2E verification with a fresh real run; explicit failure/empty states
  when OTEL or session data is missing.
- **Friction**: Low–Medium (verification + UX polish).
- **Acceptance**: A fresh Claude Code work period renders as one coherent,
  unambiguous run view, including graceful degradation.

---

### Wave 3 — Strategic bets toward the north star

Higher friction, higher ambition, but each builds on a real foundation rather
than starting from prose. These should each get their own staging ADR.

---

#### 3.1 — Close the sleep-time learning loop (automate evolution-check)

- **Source**: `.specs/agent-governance-substrate/SPEC-THOUGHTBOX-SLEEP-TIME.md`, `SPEC-EVOLUTION-CHECK-GENERALIZED.md`
- **Idea**: Run the evolution-check classifier asynchronously in
  `supabase/functions/process-thought-queue` so prior thoughts/knowledge are
  revised between sessions — the concrete instance of "stateless ML / the
  environment learns."
- **Why high value (reasoning)**: Highest intent fit (this *is* the north star)
  with surprisingly contained scope. The queue, the worker skeleton, and the
  evolution-check prompt content already exist; what is missing is the classifier
  wiring (~150–250 lines). It converts the most strategic product thesis from
  prose into a running loop.
- **Status**: Scaffolding only; classifier absent.
- **Scope**: Implement the classifier in the queue worker; apply UPDATE/NO_UPDATE
  revisions; guard with idempotency and cost limits.
- **Friction**: Medium; depends on Anthropic API in edge functions.
- **Acceptance**: New significant thoughts trigger durable, bounded revision of
  prior reasoning, observably and idempotently.

---

#### 3.2 — Peer notebooks: manifest lifecycle + web inspection (ADR-022 Parts 2 & web)

- **Source**: `.specs/mcp-peer-notebooks/PROMPT-PART-2-MANIFEST-LIFECYCLE.md`, `SPEC-CONTROL-PLANE.md`, `NEXT-IMPLEMENTATION-HANDOFF.md`
- **Idea**: Compile `peer.manifest.json` from real notebook sources (parse-only),
  add explicit draft→approve→activate→retire transitions, enforce the active hash,
  and add read-only web views over the existing Supabase peer tables.
- **Why high value (reasoning)**: Intent fit (control plane + notebooks-as-peers)
  + leverage. The durable control plane (Part 1) is **shipped**: broker,
  persistence, trace/artifact readback, and rejection of non-active manifests all
  exist and are tested. The next units are the governance boundary (manifest
  lifecycle) and legibility (web inspection) — both build directly on shipped
  infrastructure without requiring the hard, deferred parts (real runtime,
  smolvm isolation).
- **Status**: Part 1 done; Part 2 + web inspection absent; runtime still mocked.
- **Scope**: Manifest compiler wiring + lifecycle transitions + broker guards
  (Part 2); Next.js read-only peer routes (invocations, denied-outbound traces,
  artifacts).
- **Friction**: Medium each; **explicitly excludes** the real runtime
  (`thoughtbox-s7f`) and smolvm isolation (`thoughtbox-vdw`), which are the
  high-friction tail.
- **Acceptance**: A notebook can be graduated to a governed peer only via explicit
  manifest approval; peer activity is inspectable in the web app.
- **Process note**: Follow `peer-notebook-delivery-guard` skill — no mock
  substitution for acceptance evidence.

---

## 6. Deliberately deferred (and why)

Choosing what *not* to do is half of prioritization. These ideas are valuable but
fail the rubric for *next* — almost always on friction/risk or speculativeness,
not on ambition.

| Idea | Source | Why deferred |
| --- | --- | --- |
| **Canonical IR + TBX-C1 codec** | `SPEC-CORE-002` (layers B–D) | Large new persistence + codec layer with dual-write risk; the pragmatic near-term slice (the `tb` authoring API) is already shipped. High friction, low marginal user value now. |
| **Standalone `rlm_repl` tool** | `SPEC-RLM-001` | Explicitly superseded by `SPEC-NOTEBOOK-RLM` (durable notebooks over an ephemeral tool); zero code exists. Build the notebook-native version later if needed. |
| **Agentic Runbooks full engine + Cloud Run runner** | `.specs/agentic-runbooks.md` | Domain model is real but the runtime is an in-memory stub; the full engine is a large async-execution build. Peer-notebook lifecycle (3.2) is the higher-leverage notebook investment first. |
| **Srcbook preview lifecycle (SRC-001/002/003)** | `SPEC-SRC-001..003` | Arbitrary process spawn is a HIGH security surface and a notebook-DX feature, not core to durable reasoning. SRC-006 (data loss) is pulled forward; the rest waits. |
| **OBS-001 sidecar stack (Prometheus/Grafana)** | `SPEC-OBS-001` | Infra-heavy operator tooling; the agent-facing `tb.observability()` already covers health/sessions. Operator dashboards are valuable but not the agent-user center of gravity. |
| **MAP-Elites + Unified Autonomy Loop** | `quality-diversity/*`, `unified-autonomy-loop/*` | Mostly prose; depends on a `research-workflows/workflows.db` and orchestration that do not exist. ADR-017 itself marks the loop folder non-authoritative. High ambition, very high friction; revisit after 3.1 proves the simplest learning loop. |
| **Eval flywheel closure (SPEC-EVAL-001 loop)** | `SPEC-EVAL-001`, eval strategy | Infrastructure is coded but the gatekeeper is pass-through and there are no baselines/datasets. Valuable, but needs dataset engineering investment; pairs naturally with 3.1 once a learning signal exists. |
| **Theseus v0.2 reference monitor** | `theseus-improvements.md` | v1 protocol works; v0.2 is a large security/governance build (LLM tollbooth, expiring visas, Supabase write mediator). Defer until protocol usage justifies it. |
| **Connection tracking / Failure state machine** | `SPEC-CONNECTION-TRACKING`, `SPEC-FAILURE-STATE-MACHINE` | New tables + lifecycle hooks; partly overlaps the cheaper "one run view" (2.4). Do 2.4 first, then reassess whether connection granularity is still needed. |
| **Control-plane CI gate** | `unified-autonomy-control-plane` | Worth doing (generator/checker exist; just add `check:control-plane` to CI) — a cheap governance win, but it is repo-tooling rather than product. Fold into Wave 1 housekeeping if capacity allows. |

---

## 7. Sequencing and dependencies

```text
Wave 0  (safety/correctness floor)
  0.1 isolation hardening ─────────────┐ (also gates 2.2 KG UI security)
  0.2 session recovery by MCP root      │
                                        │
Wave 1  (cheap correctness on shipped surface)
  1.1 discoverability cleanup           │
  1.2 project-scoping contract ─────────┘
  1.3 harness quick wins
  1.4 citation fields ───────────────► enables future provenance/merge-evidence
                                        │
Wave 2  (legibility of built backends)
  2.1 audit UI         (reuses audit engine)
  2.2 knowledge graph UI   (needs 0.1 isolation discipline)
  2.3 hub priming wiring
  2.4 coherent run view
                                        │
Wave 3  (strategic, ADR each)
  3.1 sleep-time evolution loop  ──► later pairs with eval flywheel
  3.2 peer-notebook lifecycle + web inspection (builds on shipped Part 1)
```

Independence: every Wave 0/1 item is independently shippable. Wave 2.2 should not
ship before 0.1's isolation discipline is in place. Wave 3 items each warrant a
staging ADR before code.

---

## 8. Recommended immediate next step

Per repo workflow (`AGENTS.md` → HDD is mandatory for architectural decisions and
new features), the next action is **not** to start coding. It is to graduate the
Wave 0 and Wave 1 picks into staging ADR + spec pairs in `.adr/staging/`, since
they are the highest-confidence, lowest-friction value and several are correctness
obligations. Wave 0.1 (isolation) and 0.2 (session recovery) should be staged
first.

---

## 9. Sources reviewed

This plan synthesizes the full `.specs/` corpus. Primary anchors:
`product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md`,
`production-overview/PRODUCTION-SYSTEM-MAP.md`, the Code Mode suite, the
auditability suite, the cognitive-harness suite, the MCP peer-notebooks suite,
the agent-governance-substrate suite, `monorepo-merge/INTEGRATION-MAP.md`, the
security audits, and the v1 finalstretch suite. Implementation-status claims were
cross-referenced against `/workspace/src` and `/workspace/apps/web`; the
load-bearing security, session-model, and surface claims were verified directly
against source.
