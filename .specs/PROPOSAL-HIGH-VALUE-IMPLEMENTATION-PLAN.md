# Proposal: Highest-Value Implementation Plan from `.specs/`

> Status: proposal (not an accepted ADR)
> Created: 2026-06-03
> Author: review pass over the entire `.specs/` corpus (171 files, ~23 clusters)
> Scope: identify the highest-value designs in `.specs/` and propose how to implement them, with explicit reasoning for every choice.

## What this document is

This is a **prioritization and sequencing proposal**, not a spec or an ADR. It reads the whole `.specs/` folder, grounds each idea against two reality anchors —
`.specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md` (settled intent) and
`.specs/production-overview/PRODUCTION-SYSTEM-MAP.md` (what is actually live) — and proposes which ideas to build, in what order, and why.

It deliberately does **not** rewrite the underlying specs. Each plan points back to the authoritative spec(s) that should be promoted through the repo's HDD lifecycle (`.adr/staging/` → `.adr/accepted/`) before code lands.

## How "highest value" was judged

A design scores high only if it wins on most of these axes. I state the axes up front so the ranking is auditable rather than a matter of taste.

1. **Intent alignment.** Does it serve the settled product center of gravity? Per `PRODUCT-INTENT-AND-DIVERGENCE.md`, that center is: a *reasoning workstation for autonomous agents*, whose flagship object is a *durable, Git-like, versioned reasoning graph (the Hub)*, exposed through *Code Mode*, with *notebooks as executable evidence* and a *control plane that learns* as the long-term north star.
2. **Leverage = value × proximity to done.** A high-value idea that is 80% built beats an equally valuable idea that is greenfield. Partial implementations are treated as assets.
3. **Unblocking power.** Does it remove a dependency that many other ideas sit behind?
4. **Risk / blast radius.** Security-critical and irreversible work is discounted unless it is also a gate.
5. **Falsifiability.** Can we prove it works (and that it actually helps agents), or is it a demo?

I verified the load-bearing status claims against current source rather than trusting spec metadata. Key verified facts used below:

- Public MCP tool surface is exactly three tools: `thoughtbox_search`, `thoughtbox_execute`, `thoughtbox_peer_notebook` (`src/code-mode/`, `src/server-factory.ts`, `src/peer-notebook/tool.ts`).
- The Code Mode `tb` SDK wires `thought`, `session`, `knowledge`, `notebook`, `theseus`, `ulysses`, `observability`, `branch` — **but not `hub`** (`src/code-mode/execute-tool.ts` deps block).
- Hub is heavily built (`src/hub/*`, 27 operations, profiles, consensus, channels) but has **filesystem-only storage** (`src/hub/hub-storage-fs.ts`; no `SupabaseHubStorage`).
- Branch workers are partially live: `src/branch/handlers.ts`, `supabase/functions/tb-branch/`, and `tb.branch.*` in Code Mode.
- Evaluation has substantial code already (`src/evaluation/*`: trace listener, evaluators, experiment runner, online monitor, dataset manager).
- Peer-notebook control plane Part 1 shipped (`src/peer-notebook/*` incl. `supabase-repository.ts`, `broker.ts`, `mock-runtime-provider.ts`).

## The landscape in one picture

The corpus splits cleanly into two product tracks plus a research frontier:

- **Track A — The flagship reasoning object.** Hub + branches + Code Mode `tb.*` + the core thought tool's ergonomics. This is where intent alignment is strongest and where a surprising amount is already built but *not wired through to the public surface*.
- **Track B — Making the hosted product real, legible, and safe.** `runs` correlation, web visualization of the graph, auditability rendering, isolation/auth hardening, evaluation. This is what turns the live Cloud Run + Vercel + Supabase stack from "up" into "demoable and trustworthy."
- **Frontier — Control-plane learning / self-improvement.** Sleep-time evolution, tool pedagogy, DGM/MAP-Elites. Strategically the north star, but mostly research; only thin slices are buildable now.

The highest-value work is concentrated where Track A and Track B *overlap*: closing the gap between systems that already exist in `src/` and the public/observable surface agents and inspectors actually touch. Most of the top plans below are **wiring, persistence, and hardening of already-built capability**, not greenfield invention. That is deliberate — it is the highest-leverage shape of work in this repo right now.

---

## Ranked plans

Each plan states: the idea, the source spec(s), **why it is highest value (reasoning)**, current state, a phased scope, dependencies, risks, and an acceptance bar.

### Plan 1 — Make the Hub real on the public surface: durable storage → `tb.hub` → auth

**Source specs:** `.specs/hub-deployed/SCOPE-LAYER-2-SUPABASE-HUB-STORAGE.md`, `.specs/workspace-isolation-audit.md`, `.specs/security/identity-binding-audit.md`, `.specs/SPEC-BRANCH-WORKERS.md`, `.specs/SPEC-HUB-002-hierarchical-agent-roles.md`.

**The idea.** Finish the flagship: persist Hub state in Supabase, expose the Hub through Code Mode as `tb.hub`, and authenticate the Hub HTTP routes so it is safe multi-tenant.

**Why this is #1 (reasoning).** The settled intent names the Git-like multi-agent reasoning graph as *the* flagship — "the core thought tool and Git-like Hub should converge into one essential product object." The striking finding from the review is that this flagship is ~80% built and invisible: 27 Hub operations, profiles, consensus, channels, and per-session identity all exist in `src/hub/*`, branch workers are partially live, yet (a) Hub state lives only on the local filesystem so it evaporates on Cloud Run restart, (b) `tb.hub` is *not* in the Code Mode SDK, so agents literally cannot reach the flagship through the public surface, and (c) `/hub/api` is unauthenticated and trusts a client-supplied `workspaceId`. This is the single largest gap between intent and reality, and it is closable by wiring rather than invention — the definition of leverage. The `hub_*` tables noted as having "zero writers" in the 2026-04-20 handoff confirm the persistence seam is already anticipated.

**Current state.** Hub logic: built. Storage: FS-only (`src/hub/hub-storage-fs.ts`). Code Mode: `tb.hub` absent (`src/code-mode/execute-tool.ts`). Auth: `/hub/api` open (`src/http/hub-http.ts`). Branches: `tb.branch.*` live; C6 cross-workspace branch-spawn vuln already fixed per the identity audit.

**Phased scope.**
- **1a. Auth on Hub HTTP (gate, do first).** Apply the same OAuth-JWT / `tbx_*` API-key check used by `/mcp` to `/hub/api` and `/hub/events`; preserve local-mode bypass. This is small and is a *prerequisite for any deployed Hub exposure*.
- **1b. `SupabaseHubStorage` (Layer 2).** Implement the 17-method storage interface over the `hub_*` tables, mirroring the existing `SupabaseStorage` pattern; switch storage in `src/index.ts` by mode; regenerate `database.types.ts`. Tenant isolation via `tenant_workspace_id`.
- **1c. `tb.hub` in Code Mode (Layer 1).** Add the `hubHandler` dependency to `execute-tool.ts` and expose a minimal, intent-shaped verb set first: `tb.hub.join`, `tb.hub.problem`, `tb.hub.proposal`, `tb.hub.review`, `tb.hub.status`. Wire into the search index so it is discoverable.
- **1d. (Follow-on) Hierarchical profiles (SPEC-HUB-002).** Profiles already exist in `src/hub/profiles-*`; bind them into the thought-priming loop once 1a–1c are stable.

**Dependencies.** Supabase multi-tenant mode (live); existing `SupabaseStorage` pattern; `WorkspaceScopedClient` recommended by the identity audit.

**Risks.** Security-critical (multi-tenant isolation) — mitigated by doing 1a as a gate and reusing the audited branch-worker scoping. Storage migration is medium but bounded (well-specified 17-method interface).

**Acceptance.** Two agents in different workspaces collaborate on one problem through `tb.hub`, state survives a container restart, and a cross-workspace read is rejected. Map every acceptance item to a test in the Hub suite (`src/hub/__tests__/*`).

---

### Plan 2 — Consolidate the Code Mode public surface and kill the documented drift

**Source specs:** `.specs/code-mode/target-state.md`, `.specs/code-mode/cleanup-review-notes.md`, `.specs/SPEC-CORE-002-code-mode-thoughtbox.md` (transport layer only), supported by `.specs/architecture-exa-composition-and-thoughtbox-upgrades.md`.

**The idea.** Make `thoughtbox_search` + `thoughtbox_execute` the single, coherent discovery+action surface: remove the legacy gateway/init/cipher "unlock" model from docs and the search index, fold workflow/prompt guidance into search, and reconcile the README/resource drift (`tb.hub`, `thoughtbox_operations`, `tb` claims).

**Why this is #2 (reasoning).** Code Mode is the *settled* public interaction model, and it is already the production shape — so this is pure value capture at near-zero architectural risk. The review surfaced a thick layer of drift: README/resources still advertise `tb.hub` (unavailable), `thoughtbox_operations` (not registered), progressive disclosure and init/cipher flows (collapsed), and `api.thoughtbox.dev` defaults that time out. Every one of these is a live failure mode where an agent calls something that does not exist or reads stale guidance. Fixing the surface is the cheapest possible improvement to agent success rate, and it must precede Plan 1c (adding `tb.hub`) so the new verb lands in a clean, single discovery path instead of a contradictory one. It is ranked above the deeper IR/compression work in SPEC-CORE-002 because that long-horizon Canonical-IR/TBX-C1 layer is unbuilt, high-risk, and optional; the thin transport surface already delivers the token-economy win.

**Current state.** Three-tool surface live; search index exists (`src/code-mode/search-index.ts`); legacy gateway/init content still present in resources and docs; `tb.hub` advertised but absent.

**Phased scope.**
- Audit resources/docs/search-index for references to removed concepts (init, cipher unlock, gateway-first, `thoughtbox_operations`, `tb.hub` until Plan 1c, `api.thoughtbox.dev`, `/runs`, `/projects`).
- Fold workflow/prompt guidance (the goal behind `SPEC-WRK-001` and `SPEC-GW-011`) *into* the search index rather than as separate Stage-2 tools, eliminating duplicate discovery paths.
- Update the README and `apps/web/README.md` route/deploy claims to match `PRODUCTION-SYSTEM-MAP.md`.

**Dependencies.** None blocking; coordinate the `tb.hub` mention with Plan 1c timing.

**Risks.** Low — mostly content and search-index hygiene. Risk is *omission* (missing a stale reference), mitigated by grepping for each retired term.

**Acceptance.** A fresh agent, given only `thoughtbox_search`, can discover every available `tb.*` capability and *cannot* discover anything unimplemented. No doc claims a capability the surface lacks.

---

### Plan 3 — Core thought-tool ergonomics and mid-session recall

**Source specs:** `.specs/cognitive-harness-improvements/` (esp. `01-auto-numbering-surfacing.md`, `02-terse-shorthand.md`, `03-mid-session-recall-primitives.md`, `09-named-checkpoints.md`), `.specs/harness-optimization/SPEC-HARNESS-T2.md`, `.specs/SPEC-CHX-001-cognitive-harness-improvements.md`, `.specs/cognitive-harness-improvements/TYPE-SYSTEM-PRINCIPLES.md`.

**The idea.** Lower the token cost of externalizing reasoning (auto-numbering surfaced + `tb.t()` shorthand + sensible defaults) and make prior reasoning *addressable mid-session* (`session.getThought`, `recentThoughts`, `searchWithin`, and named checkpoints).

**Why this is #3 (reasoning).** Product intent says the core tool must make prior reasoning "addressable, revisable, branchable, comparable, and durable," and explicitly names the failure it fixes: "durable prior reasoning is inaccessible during long or complex work." These specs come from a real 146-thought session where the agent paid ~17.5k tokens of ceremony and repeatedly lost the shape of its own earlier reasoning. Two reasons this ranks just below the flagship plumbing: (1) it is the substrate that makes *every other* reasoning feature worth using — if externalizing a thought is expensive and recalling one is impossible, agents stay in native context and the whole product thesis collapses; (2) it is cheap and parallelizable — server-side auto-numbering already exists (`SIL-102` in the thought handler), so surfacing it, adding shorthand, and adding three recall handlers plus a checkpoints index are low/medium PRs with no architectural risk. Recall + checkpoints are paired because together they give long sessions both random access (`getThought`) and a navigable table of contents.

**Current state.** Auto-numbering implemented in handler but Zod still accepts client `thoughtNumber`; `tb.t()` absent; bulk `getThoughts` exists but granular recall + FTS `searchWithin` not built; checkpoints improvised as `progress` thoughts.

**Phased scope.**
- **3a. Ergonomics (parallel quick wins):** surface auto-numbering (reject client `thoughtNumber` via types), add `tb.t()`/`tb.end()` shorthand, add HARNESS-T2 defaults (`thoughtType`, `nextThoughtNeeded`).
- **3b. Recall primitives:** `session.getThought`, `recentThoughts`, `searchWithin` (Postgres FTS GIN index).
- **3c. Named checkpoints:** `tb.session.checkpoint` + indexed retrieval.

**Dependencies.** `src/thought/tool.ts`, `src/sessions/handlers.ts`, a Postgres migration for FTS, Code Mode catalog. Follows the `TYPE-SYSTEM-PRINCIPLES.md` "illegal states unrepresentable" guidance.

**Risks.** Low–medium. The one breaking change (rejecting client `thoughtNumber`) needs a compatibility path for revise/restart callers.

**Acceptance.** On a 100+ thought session, an agent retrieves an arbitrary prior conclusion in one call and jumps to a named checkpoint without re-reading the chain; ceremony tokens per thought drop measurably.

---

### Plan 4 — Prove the claim: the causal evaluation loop

**Source specs:** `.specs/SPEC-EVAL-001-unified-evaluation-system.md`, `.specs/evaluation/thoughtbox-eval-strategy.md`.

**The idea.** Stand up the four-condition ablation (no tool / scratchpad / full Thoughtbox / ablated) over task-family datasets, with diagnostic metrics (`critique_delta`, `overthinking_tax`, `auditability_score`, `memory_contamination_rate`) flowing through the existing LangSmith-backed eval code.

**Why this is #4 (reasoning).** Everything above this line is a bet that structured reasoning helps agents. This plan is the only one that *tests that bet*. Without it, the workstation is a collection of plausible affordances; with it, "Thoughtbox improves agent outcomes" becomes a falsifiable, regression-guarded claim. It ranks here rather than higher because it depends on the surface being stable (Plans 2–3) to measure cleanly, and because a large fraction of the machinery already exists — `src/evaluation/` has the trace listener, evaluators, experiment runner, and online monitor wired via `initEvaluation()`. The missing piece is the *operational* layer: curated datasets and the ablation scoreboards from the strategy doc. That makes it high leverage (value × proximity), but it is sequenced after the things it measures.

**Current state.** Substantial code present and wired; datasets, populated baselines, and ablation harness not evidenced.

**Phased scope.** Seed one or two task-family datasets → implement the named diagnostic evaluators → run the four-way ablation on a small set → publish a baseline scoreboard → enable online monitoring on production traces.

**Dependencies.** `LANGSMITH_API_KEY`; `ThoughtEmitter`/trace metadata (built); stable Code Mode surface.

**Risks.** High operationally (external SaaS, variance, cost; fire-and-forget + graceful degradation required) — keep the MVP small (one dataset, one ablation) before scaling.

**Acceptance.** A reproducible report shows a directional, signed effect of Thoughtbox vs scratchpad vs baseline on at least one task family, with the diagnostic metrics distinguishing "task failed" from "tool used poorly."

---

### Plan 5 — Make the reasoning graph visible: Knowledge Graph UI + auditability rendering

**Source specs:** `.specs/monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI.md`, `.specs/monorepo-merge/INTEGRATION-MAP.md`, `.specs/auditability/SPEC-AUD-010-observatory-structured-rendering.md`, `.specs/auditability/SPEC-AUD-004-external-actions.md`, `.specs/auditability/SPEC-AUD-005-session-context-fault-attribution.md`.

**The idea.** Surface the persistent knowledge/reasoning graph in the Vercel web app as an interactive growing graph, and finish structured auditability rendering (decision/action/belief cards, branch points, blast-radius/actions view, fault attribution).

**Why this is #5 (reasoning).** Settled intent says "the web app should show the multi-agent reasoning structure as a graph growing in the UI," and `INTEGRATION-MAP.md` identifies the knowledge graph as the product's *largest under-claimed capability*: real `entities`/`relations`/`observations` in Supabase with **zero web surface**. This is the most direct expression of the product's visual thesis, and it is well-scoped (~600–900 LOC, Cytoscape.js, no new backend). The auditability specs (AUD-010 largely shipped server-side; AUD-004 "external actions / blast radius" is the spec's own self-named "biggest gap") are paired because the backend manifest logic already exists in `src/audit/manifest-generator.ts` and only needs UI. It ranks below evaluation because visualization is a value *multiplier* on a working substrate rather than the substrate itself — but it is the highest-value human-facing surface and the thing that makes the product legible to anyone who is not driving it via MCP.

**Current state.** KG: backend-complete, no UI route. Auditability: AUD-010 accepted and partially landed; AUD-004/005 backend-ahead-of-UI.

**Phased scope.** KG graph route at `/w/[workspaceSlug]/knowledge` (entities/relations/observations, filters, orphan/provenance highlighting) → finish AUD-010 acceptance gaps (time-gap separators) → Actions/blast-radius tab (AUD-004) → session-context + fault-attribution panel (AUD-005).

**Dependencies.** `apps/web/` (live), Supabase tables + RLS, `apps/web/AGENTS.md` conventions. Note the dual-UI drift risk between `src/observatory/` and `apps/web/` — converge on the web app per the peer-notebook direction.

**Risks.** Medium; graph performance at 500+ nodes; avoid duplicating rendering across Observatory and web app.

**Acceptance.** A workspace's knowledge graph renders interactively in the web app, and an inspector can reconstruct a session's decisions, external actions, and a fault attribution from the UI in under a minute.

---

### Plan 6 — Notebooks as executable evidence, and merges that carry proof

**Source specs:** `.specs/agentic-runbooks.md` (ADR-014), `.specs/mcp-peer-notebooks/` (ADR-022: README, SPEC-CONTROL-PLANE, PROMPT-PART-2-MANIFEST-LIFECYCLE), `.specs/product-shape/branches/001-merge-evidence-notebooks.md`, `.specs/thoughtbox-v1-finalstretch/SPEC-NOTEBOOK-RLM.md`.

**The idea.** Finish the Notebook Evidence Engine (replayable `.src.md` runbooks/simulations/eval/ADR-evidence modes), complete the peer-notebook manifest lifecycle so notebooks become governed callable specialists, and connect both to the Hub so a reasoning *merge* attaches a replayable evidence notebook + structured verdict.

**Why this ranks here (reasoning).** This is the most *differentiating* idea in the corpus — "merges carry executable evidence packets" is something generic agent stacks do not have, and it ties three product pillars (Hub merges, notebooks, evidence) into one story. It is ranked sixth, not higher, on honest leverage grounds: it is the largest and highest-complexity track (multi-plane control vs execution, secure isolation, manifest governance, real runtime beyond the current mock), and the merge-evidence payoff is still *exploratory* (`001-merge-evidence-notebooks.md` is a hypothesis with open questions on who approves merges). The right move is to advance it incrementally on the foundation already shipped (peer control-plane Part 1, notebook engine modes/templates) rather than to front-load it ahead of the flagship wiring and the surface/ergonomics work that make it usable. SPEC-NOTEBOOK-RLM (notebook-as-REPL) is preferred over the standalone `rlm_repl` tool (`SPEC-RLM-001`) because it keeps long-horizon recursive reasoning on the durable notebook substrate instead of a parallel one.

**Current state.** Notebook engine: partial (modes, templates, persist/run). Peer notebooks: Part 1 durable control plane shipped (`src/peer-notebook/*`, mock runtime); Part 2 manifest lifecycle ready to implement; web inspection + real isolation deferred. Merge-evidence: hypothesis only.

**Phased scope.** Finish ADR-014 acceptance for the highest-value modes (runbook, eval, adr_evidence) → peer-notebook manifest lifecycle (compile → approve → activate → enforce, `thoughtbox-g5t`) → peer web inspection → only then prototype merge-evidence on top of a working Hub (depends on Plan 1).

**Dependencies.** Plan 1 (Hub) for merge-evidence; Supabase; the `peer-notebook-delivery-guard` skill governs ADR-022 units; honor `source-of-truth-preflight` before manifest work.

**Risks.** High (isolation/security for real runtime; manifest governance; product semantics of merge approval undecided). Mock accountability rule from the handoff applies: mocks are contract fixtures, not substitutes.

**Acceptance.** A peer notebook is invoked through `thoughtbox_peer_notebook` under an approved manifest with a durable trace + artifact; later, a Hub merge attaches a replayable evidence notebook with a structured verdict.

---

### Plan 7 — Ship-hardening: `runs` correlation, frictionless init, explicit failure states

**Source specs:** `.specs/thoughtbox-v1-finalstretch/SPEC-USABILITY-CUTLINE.md` (authoritative for v1 priorities), `SHIP-CHECKLIST.md`, `DEPENDENCY-LEDGER.md`, `SPEC-CORRELATION-CONTRACT.md`, `SPEC-CLI-INIT.md`, `SPEC-FAILURE-STATE-MACHINE.md`, `SPEC-WORKSPACE-SCOPING-CUT.md`; plus `.specs/thoughtbox-v1-finalstretch/WEB-APP-OTEL-QUERY-FIX.md` (done).

**The idea.** Deliver the "one coherent work period" bar: one Claude Code session produces one provable `runs` row bridging MCP reasoning and OTEL tool telemetry, with one-command `init`, a work-period UI, and explicit failure states (no blank dashboards / no inferred health).

**Why this ranks here (reasoning).** The `USABILITY-CUTLINE` is the most disciplined spec in the repo — it correctly defers project-model and blast-radius gold-plating in favor of a provable end-to-end demo. Its value is real and its `runs` correlation work is partly built (the OTEL query bridge fix already landed). It is ranked seventh because it is *operational ship-hardening* rather than flagship capability: it makes the existing stack legible and demoable, which matters, but it does not advance the reasoning-graph thesis the way Plans 1–6 do, and its hardest dependency (live hook delivery + migrations on the OTLP DB, no staging) is an environment problem rather than a design problem. It pairs naturally with Plan 5's web rendering. I keep it on the list (rather than cutting) because "demoable + honest about failure" is a prerequisite for the evaluation loop (Plan 4) to trust production traces.

**Current state.** `runs` schema + reconciliation designed and largely coded; OTEL query fix done; plugin `init` partially shipped (0.1.5); failure-state tables parked on a defer branch; `doctor` cut.

**Phased scope.** Verify `runs` binding end-to-end on a real work period → finish `init` (safe settings merge, OTLP + MCP URL) → work-period UI (with Plan 5) → failure-state surfacing (`binding_missing` after 15s, no silent-healthy views) → adopt the workspace-as-project cut to remove activation blockers.

**Dependencies.** Deployed MCP + Vercel + Supabase (live); hook OTLP auth; a staging path to prove the async hook binding.

**Risks.** High operationally (async hook latency, no staging today), low architecturally.

**Acceptance.** A single agent work period renders as one timeline in the web app linking reasoning + tool calls, and an unbound run is shown as explicitly degraded rather than healthy-empty.

---

### Plan 8 (frontier, thin slices only) — Control-plane learning toward the north star

**Source specs:** `.specs/agent-governance-substrate/SPEC-THOUGHTBOX-SLEEP-TIME.md`, `SPEC-EVOLUTION-CHECK-GENERALIZED.md`, `SPEC-SEVEN-LAYER-ARCHITECTURE.md`, `STARTER-TIER-A.md`; `.specs/unified-autonomy-loop/05-tool-pedagogy-optimization.md`; `.specs/codebase-control/audit-summary.md` (+ `gpt-5-4-pro.md`).

**The idea.** Begin the "environment learns for the next agent" north star with the *buildable* slices: an async sleep-time worker that runs evolution-check on new thoughts, platform-level governance gates (Tier A: branch protection + outbound claim-truth), and trace-driven MCP tool-pedagogy proposals.

**Why this is ranked last but still included (reasoning).** Control-plane learning is the explicit long-term north star, so it belongs in any honest highest-value list — but intellectual honesty requires distinguishing the buildable from the aspirational. The full programs here (the `codebase-control` paragon's `src/control/` meta-controller, the DGM self-modification loop in `letta-specific/`, the MAP-Elites workflow population) are multi-quarter research and, per intent, `automation-self-improvement/` "is its own thing... should not automatically be treated as core product." What *is* buildable now and compounds without autonomous merge-to-main: (1) sleep-time evolution-check — the Supabase pgmq/pg_cron skeleton already exists (`supabase/functions/process-thought-queue/`) and thought-evolution already ships as a skill; (2) Tier A platform gates (~hours of work, structural fixes for observed failures); (3) tool-pedagogy proposals that feed off the same traces Plan 4 produces. These are sequenced last because they depend on stable surface (Plan 2), recall/persistence (Plan 3), and trace infrastructure (Plans 4/7) to be worth running.

**Current state.** Sleep-time: infra skeleton only (broadcast/archive). Evolution-check: shipped for thoughts; generalization deferred. Tier A: actionable checklist, not verified deployed. Tool pedagogy: research-only.

**Phased scope.** Tier A gates (cheap, do anytime) → automate evolution-check on thought insert via sleep-time worker (human-reviewed, no auto-apply) → trace-driven tool-pedagogy proposal issues once tracing volume exists. Keep DGM/MAP-Elites/paragon as research, gated behind their own HDD ADRs.

**Dependencies.** Supabase edge + Vault; `thoughtbox://prompts/evolution-check`; LangSmith traces (Plan 4/7).

**Risks.** Medium–high (classifier false-positive drift; never auto-apply destructive updates; cost/backlog at scale).

**Acceptance.** Closing a session triggers a reviewed evolution-check that proposes (not applies) updates to prior thoughts/skills, and at least one platform gate provably blocks a real failure class (e.g., unverified repo claim).

---

## Proposed sequencing

The ordering optimizes for *unblocking* and *risk-gating*, not just raw rank.

1. **Surface hygiene first (Plan 2).** Cheap, removes live failure modes, and makes a clean home for new verbs.
2. **Flagship plumbing in parallel (Plan 1, starting with 1a auth gate).** Highest value; 1a is also a security gate that must precede any deployed Hub.
3. **Thought-tool ergonomics + recall (Plan 3), parallel to Plan 1.** Independent, cheap, foundational; different files, low conflict risk.
4. **Make it visible + demoable (Plans 5 and 7 together).** Web graph + `runs` work-period UI reinforce each other.
5. **Prove it (Plan 4).** Once the surface is stable and traces are trustworthy.
6. **Differentiate (Plan 6).** Advance notebooks/peer/merge-evidence incrementally on the now-real Hub.
7. **Frontier slices (Plan 8).** Sleep-time + Tier A + tool pedagogy, once traces and persistence exist.

Each plan should enter the repo's HDD lifecycle as its own staging ADR + spec pair, in its own `cursor/` feature branch and PR, with the acceptance bar above turned into tests. Code and spec land in the same commit per repo rules.

## What I deliberately deprioritized, and why

Honest ranking means naming what does *not* make the cut, with reasoning:

- **Legacy gateway model** (`gateway-api-explicit-schema.md`, `old-specs/gateway-tool.md`, `old-specs/gateway-api-consistency.md`, `SPEC-WRK-001`, much of `SPEC-GW-011`). These optimize the init/cipher/gateway path the product has *deliberately moved away from*. Their one durable goal — discoverable schemas/guidance without token bloat — is absorbed into Plan 2's search index. Building the standalone tools would re-introduce dual discovery paths.
- **Standalone `rlm_repl` tool** (`SPEC-RLM-001`). Superseded by notebook-as-REPL (`SPEC-NOTEBOOK-RLM`, folded into Plan 6); a second execution substrate is exactly the fragmentation intent warns against.
- **Srcbook Observatory app channel / preview lifecycle** (`SPEC-SRC-001/002/003`). Useful for local notebook previews, but they target `src/observatory/` while the settled deployed surface is the Next.js web app; ADR-014 marks Observatory out of scope. Revisit only if local preview becomes a priority.
- **MCP sidecar / Prometheus / Grafana** (`SPEC-OBS-001`). Real ops value, but it is infra telemetry, not the reasoning-graph thesis, and the product already has OTLP→Supabase ingestion. Lower leverage than surfacing the data agents and inspectors actually need (Plan 5).
- **Full DGM loop and MAP-Elites population** (`letta-specific/*`, `unified-autonomy-loop/03–04`). High-risk autonomous self-modification, targeting an external `letta-code-thoughtbox/` not in this repo, and explicitly peripheral to the mandatory MCP control plane. Kept as research behind Plan 8's thin slices.
- **Project model / blast-radius / connections table for v1** (`SPEC-PROJECT-MODEL`, `SPEC-BLAST-RADIUS`, `SPEC-CONNECTION-TRACKING`). The `USABILITY-CUTLINE` already defers these in favor of `runs` correlation; I agree — they are enrichment on a timeline that must exist first.
- **Automated changelog enhancement** (`SPEC-CHG-001`). Phase 1 already shipped; the agent-enhancement phase is release hygiene, not reasoning value.

## Open questions to resolve before/while building

These come straight from `PRODUCT-INTENT-AND-DIVERGENCE.md` and gate the flagship plans:

- **Merge semantics:** what evidence must "collapse to certainty" require (tests, citations, reviewer approval, confidence, dissent)? Blocks the payoff phase of Plan 6.
- **Branch lifecycle:** pressure every branch toward merge/abandon, or allow long-lived competing branches? Shapes Plan 1's Hub verbs.
- **Naming:** `Hub` vs `thought graph` vs `knowledge graph` for the unified object — settle before `tb.hub` verbs and the web graph route harden (Plans 1, 5).
- **Old direct tools:** remove, keep internal, or keep as compatibility surface? Affects Plan 2's scope.

---

## Appendix: evidence base

- Settled intent: `.specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md`
- Production reality + divergence register: `.specs/production-overview/PRODUCTION-SYSTEM-MAP.md`, `.specs/monorepo-merge/INTEGRATION-MAP.md`
- Verified in source this pass: `src/code-mode/execute-tool.ts` (no `tb.hub`), `src/code-mode/__tests__/server-surface.test.ts` (3 public tools incl. `thoughtbox_peer_notebook`), `src/hub/*` (FS-only storage, profiles, consensus), `src/branch/*` + `supabase/functions/tb-branch/`, `src/evaluation/*`, `src/peer-notebook/*`, `src/notebook/*`, `src/audit/manifest-generator.ts`.
