# High-Value Implementation Proposal

> **Status**: Proposal for review
> **Created**: 2026-06-03
> **Author**: Cloud agent review of `.specs/`
> **Method**: Full read of the `.specs/` corpus (171 files, 33 directories) digested
> by six parallel exploration passes, with every "highest value" claim
> cross-checked against current source under `src/`, `apps/web/`,
> `supabase/migrations/`, `infra/`, and `.github/workflows/`.

## Purpose

This document reviews everything in `.specs/` and proposes a prioritized plan for
the ideas I judge to be highest value. It is a **selection and sequencing
artifact**, not a new architectural decision. Where a chosen item requires an
architectural decision, that decision still goes through the HDD lifecycle
(`.adr/staging/` → accepted/rejected) at implementation time.

For each proposed initiative I state **what it is, the reasoning for choosing it,
the verified current state, scope/invasiveness, dependencies, acceptance, and
risk** — so the "why" is auditable, not asserted.

---

## How I ranked (selection criteria)

I scored every candidate against four factors, in this order:

1. **User/product value** — does it move the product from "claimed" to "usable"
   or unlock a capability a user can actually see and trust?
2. **Readiness / leverage** — how much of the substrate already exists? Surfacing
   built-but-invisible capability beats greenfield platform work.
3. **Dependency position** — does it unblock other work, or is it blocked itself?
4. **Risk / blast radius** — read-only and additive changes rank above invasive
   rewrites; security/correctness gaps are weighted up.

I explicitly **deprioritized** three categories regardless of conceptual appeal:
specs **superseded** by the Code Mode migration, specs targeting a **codebase
that does not exist in this monorepo**, and **multi-quarter platform rewrites**
whose value is diffuse. These are listed at the end with reasoning.

---

## Landscape in one paragraph

Thoughtbox today is two live production surfaces: an MCP reasoning server
(`mcp.kastalienresearch.ai`, Cloud Run + Supabase) and a Next.js web app
(`thoughtbox.kastalienresearch.ai`, Vercel + Supabase), plus a Claude Code plugin
(`plugins/thoughtbox-claude-code/`, shipped at 0.1.5). The public MCP surface is
**Code Mode** (`thoughtbox_search`, `thoughtbox_execute`, `thoughtbox_peer_notebook`).
The substrate is consistently **ahead of the user-facing product**: knowledge
graph tables, audit-manifest generation, OTEL↔reasoning correlation (`runs`),
protocol enforcement, and peer-notebook persistence all exist in code but are
**partly invisible or unverified end-to-end**. The single biggest pattern across
the corpus is *capability that exists but cannot yet be seen or trusted by a
user*. The highest-value work follows directly from that pattern.

---

## The plan (ranked)

### P0 — Close the v1 "one coherent run" loop

**What.** Finish the explicit v1 ship gate described in
`thoughtbox-v1-finalstretch/SHIP-CHECKLIST.md` and `SPEC-USABILITY-CUTLINE.md`:
a fresh Claude Code work period produces exactly one canonical `runs` binding row,
its OTEL telemetry and internal reasoning data both resolve through that row, the
web app renders that run coherently, and **every failure mode is an explicit
state instead of a blank screen**. Concretely this is:
`SPEC-CORRELATION-CONTRACT.md` (finish + verify) + `SPEC-FAILURE-STATE-MACHINE.md`
(build) + the end-to-end demo proof in `SHIP-CHECKLIST.md` §6.

**Reasoning — why this is #1.** This is the product's declared north star and
the gate everything else sits behind: there is no point making any other surface
nicer if a user cannot see one trustworthy run. The leverage is exceptional
because the hard parts are already built — the binding table, reconciliation, and
the web query fix all exist (see "current state"). What remains is the *legibility
layer*: proving the binding lands in a real deployment and showing the user
*what failed* when it doesn't. That is a small amount of work guarding a large
amount of already-invested substrate.

**Current state (verified).**
- `supabase/migrations/20260406030000_add_runs_binding_table.sql` exists.
- `src/thought-handler.ts` creates a `runs` row on session start; closes it on
  session end.
- `src/otel/otel-storage.ts` implements `reconcileRunBindings()` keyed on
  `thoughtbox.session_id` from event attributes.
- Plugin `session_tracker.sh` emits `thoughtbox.run_binding`.
- `WEB-APP-OTEL-QUERY-FIX.md` is **done**: the session detail page resolves OTEL
  through `runs.otel_session_id`
  (`apps/web/src/app/w/[workspaceSlug]/sessions/[sessionId]/page.tsx`).
- **Gap (verified):** no `binding_missing` / `workspace_setup_status` /
  `run_correlation_status` strings exist anywhere except the spec files — the
  failure state machine is genuinely unbuilt. End-to-end binding in a live
  deployment is unverified (`SHIP-CHECKLIST.md` §3, §6 unchecked).

**Scope / invasiveness.** Medium. Supabase migration for status fields, server
reconciliation timeout (`binding_missing` after ~15s per `SPEC-CORRELATION-CONTRACT.md`),
web rendering of typed states, and a real deployed verification run. No greenfield
subsystems.

**Dependencies.** Deployed service + migrations applied to the live OTLP-backed
DB. `DEPENDENCY-LEDGER.md` is explicit that this needs a real environment
(staging recommended) — production-only verification is the current risk.

**Acceptance.** `SHIP-CHECKLIST.md` "Definition of Done" — one fresh run, one
binding row, telemetry + reasoning both resolved through it, coherent web render,
explicit empty/error states.

**Risk.** The honest binary in `DEPENDENCY-LEDGER.md`: without staging, the only
real proof is production. Recommend standing up the staging path
(`staging-deploy.yml` already exists) before claiming the gate is met. Honor the
kill conditions — do not let any audit query bypass `runs`.

---

### P1 — Make built-but-invisible capabilities visible

Two surfacing initiatives that convert existing, populated backends into
user-visible product. Both are **read-mostly and low risk**, which is why they
rank immediately after the ship gate.

#### P1a — Knowledge Graph UI

**What.** `monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI.md`: a read-only Cytoscape.js
view at `/w/[workspaceSlug]/knowledge` over the existing `entities` / `relations`
/ `observations` tables, with filters, a detail panel, and orphan detection
(~600–900 LOC, web + Supabase read paths only).

**Reasoning.** `monorepo-merge/INTEGRATION-MAP.md` names this "the largest
under-claimed capability": the knowledge graph backend is real and populated, but
the UI is zero. This is the single best value-per-effort item in the corpus — it
makes an existing differentiator (cross-session reasoning memory, the "Git-like
reasoning repo" story) *visible* without building any new backend, and it is
read-only so the blast radius is small.

**Current state (verified).** KG tables exist
(`supabase/migrations/20260320191032_remote_schema.sql` defines
entities/relations/observations); **no `/knowledge` route and no Cytoscape
dependency exist in `apps/web/`** — genuinely unbuilt, well-specified.

**Scope.** Medium, web app + Supabase read queries with RLS. Does not block the
monorepo merge (spec §11).

**Dependencies.** None blocking; web app already lives at `apps/web/`.

**Risk.** Low (read-only). Main care: RLS scoping so the graph is workspace-bound.

#### P1b — Surface the audit manifest + structured-thought queries

**What.** Finish the auditability loop by exposing what the backend already
computes: wire the session-close audit manifest and `thoughtType`/`confidence`
filters into the **web** session views, per `auditability/SPEC-AUD-004` (action
log / blast-radius, called the "biggest gap") and the query operations from
`old-specs/agent-auditability/SPEC-AUDIT-002`.

**Reasoning.** `src/audit/manifest-generator.ts` already detects
decision-without-action gaps and generates a session manifest at close, but that
intelligence is invisible — there is no query API or UI for it. Completing the
loop turns "agents can record structured decisions/actions" into "a human can see
blast radius and unreported actions in under a minute," which is the entire
premise of the auditability suite. Prefer the **web trace explorer** (which
already renders structured `thought_type` cards in `thought-card.tsx`) over more
local Observatory HTML, so the value lands for hosted users.

**Current state (verified).** `src/audit/manifest-generator.ts` exists with gap
detection and aggregation; manifest is emitted on session close. Missing: query
API exposure (`audit_summary`, `read_thoughts` filters) and the web Actions /
blast-radius view. `SPEC-AUD-010` and much of `SPEC-AUD-001` are already ~90% done
in Observatory — those should be closed out, not re-implemented.

**Scope.** Medium. MCP query handlers + web rendering. No new data model.

**Dependencies.** None blocking; structured `thoughtType` fields already exist in
persistence.

**Risk.** Low–medium. Mostly additive read/query surface.

---

### P1 — Reliability: session recovery via MCP root

**What.** `SPEC-SRC-006-session-recovery-via-mcp-root.md`: store `mcpRootUri` on
sessions; let `load_context` without a `sessionId` resume the most recent session
for the current project root.

**Reasoning.** This is rated P0 Critical in its own spec and fixes a **verified
production incident** (a documented 67-thought loss when an MCP client timed out
and the agent could not recover the session ID). It is small, has **no dependency
chain**, and directly protects the trust relationship between agents and the
server. Reliability fixes that prevent silent data loss punch far above their
size.

**Current state (verified).** No `mcpRootUri` field exists on `Session` or
`SessionFilter` in `apps/web/` or persistence — genuinely unbuilt.

**Scope.** Low–medium. Persistence schema + init/`load_context` handler. No UI
required for the core fix.

**Dependencies.** MCP roots capability (already used elsewhere).

**Risk.** Low.

---

### P2 — Security hardening: finish the identity-binding audit

**What.** Close the deferred items in `security/identity-binding-audit.md` and run
the recommended MCP service-role "sister C6" audit:
- **A1** OAuth open redirect — `apps/web/.../callback/route.ts` redirects
  `${origin}${next}` with no allow-list.
- **Latent C2** — `updateProfileAction` calls `updateUser` without explicit
  principal verification (`apps/web/.../account/actions.ts`).
- Audit the MCP server's service-role handlers for the same cross-workspace class
  that was fixed in `src/branch/handlers.ts`; consider the proposed
  `WorkspaceScopedClient` primitive.

**Reasoning.** These are **concrete production auth bugs**, not research. The
audit methodology is already complete and the critical/high items (password-reset
C1/C2/C4, branch-spawn C6) are verified fixed in code — what remains is a short,
well-scoped tail. Multi-tenant correctness is non-negotiable before scaling user
load, and the marginal cost here is days, not quarters.

**Current state (verified).** C6 branch isolation fixed
(`src/branch/handlers.ts` filters on `workspace_id`); reset-password chain fixed
with tests. A1 open redirect and latent C2 remain open; `WorkspaceScopedClient`
not implemented.

**Scope.** Small–medium, targeted. Web auth routes + MCP handler audit.

**Dependencies.** None.

**Risk.** Low to apply; high cost if left unaddressed.

---

### P2 — Harness efficiency bundle (Code Mode ergonomics)

**What.** A small, additive, server-side bundle from the cognitive-harness specs:
- `SPEC-CHX-001` #1 — align types/docs with the already-shipped server
  auto-numbering (SIL-102) so clients stop sending `thoughtNumber`.
- `SPEC-CHX-001` #2 / Harness `SPEC-HARNESS-T2` — terse `tb.t()` shorthand and
  optional defaults for `thoughtType` / `nextThoughtNeeded`.
- `SPEC-CHX-001` #3 — mid-session recall (`getThought`, `recentThoughts`,
  `searchWithin`).
- `SPEC-CHX-001` #7/#8 — `decisionState: deliberating` and per-`sessionType`
  audit rules to stop verified false-positive audit gaps in research sessions.

**Reasoning.** These attack the daily cost of the core interaction model: the
specs document ~17.5k tokens of avoidable boilerplate in a single research
session, plus false audit alarms that train agents to ignore the audit signal.
The changes are additive and mostly server-side (verifiable without agent-runtime
work) and build on the already-shipped SIL-102 auto-numbering. This improves every
session at low risk.

**Current state (verified).** SIL-102 server auto-numbering works
(`src/thought-handler.ts`); client schema still allows manual `thoughtNumber`
(`src/thought/tool.ts`, `src/code-mode/sdk-types.ts`). No `tb.t`, recall
operations, or `decisionState`; the handler currently *requires* exactly one
selected option and applies a hardcoded 5-thought decision→action gap rule
(`src/audit/manifest-generator.ts`).

**Scope.** Medium, incremental. SDK types, `execute-tool.ts`, session handlers,
one or two Postgres indexes for recall.

**Dependencies.** Internal only.

**Risk.** Low–medium. Keep changes additive/back-compatible; deliberation must be
ignored by the audit gap detector.

---

### P3 — Evaluation flywheel + control-plane honesty gate

**What.** Two complementary meta-investments:
- `evaluation/thoughtbox-eval-strategy.md` + `SPEC-EVAL-001` Phases 2–4: complete
  the LangSmith-backed eval datasets, wire the `EvaluationGatekeeper`, and stand
  up regression detection (measure causal lift of model+Thoughtbox vs baseline).
- `unified-autonomy-control-plane/` + ADR-017: wire the existing
  `check:control-plane` script into CI so spec/test "truth" cannot drift.

**Reasoning.** The autonomy/evaluation corpus' central failure mode is
"improvements without proof." Until there is a causal scoreboard, every later
autonomy claim (MAP-Elites, DGM, prompt refinement) is unfalsifiable. The eval
code partially exists (`src/evaluation/` is wired via `initEvaluation()`), and the
control-plane generator/check scripts already exist — so this is mostly
completion + CI wiring, not greenfield. It is ranked P3 (not higher) because it is
infrastructure rather than direct user value, but it is the investment that makes
all *future* work measurable and honest.

**Current state (verified).** `src/evaluation/` exists (trace-listener,
evaluators, experiment-runner, online-monitor);
`src/observatory/evaluation-gatekeeper.ts` exists but is not fully closed-loop.
Control-plane specs are auto-generated and flag real gaps (no E2E chain, orphaned
unit tests excluded from CI).

**Scope.** Medium. MCP server + CI + `.eval/` baselines; optional LangSmith.

**Dependencies.** Optional LangSmith; otherwise internal.

**Risk.** Low user-facing risk.

---

### P3 — Peer notebook manifest lifecycle (ADR-022 Part 2)

**What.** `mcp-peer-notebooks/PROMPT-PART-2-MANIFEST-LIFECYCLE.md` (unit
`thoughtbox-g5t`): parse `peer.manifest.json` from notebook sources without
executing code, with a draft → approve/activate → enforce-active-hash lifecycle,
replacing today's static bootstrap manifest.

**Reasoning.** This is the explicit next gated unit on a coherent strategic
roadmap (notebooks-as-governed-peers → merge-evidence notebooks → control-plane
authority), and Part 1 (durable Supabase control plane) is already merged. It
closes a real governance hole: today notebook edits cannot expand peer
capabilities because the manifest is a static `claimExtractor` bootstrap. It is
ranked P3 because it is further from immediate user-visible value than P0–P2 —
prioritize it higher only if the notebook/evidence product thesis becomes the
near-term focus.

**Current state (verified).** Part 1 merged (`src/peer-notebook/`, migration
`20260430010000_create_peer_notebook_control_plane.sql`, `thoughtbox_peer_notebook`
tool). Manifest types/statuses exist but the handler still bootstraps a static
manifest — Part 2 is specified, not accepted.

**Scope.** Medium–high. Repository APIs, broker guards, manifest compiler wiring,
tests. Follow `peer-notebook-delivery-guard` (mocks are fixtures, not final
substitutes).

**Dependencies.** Part 1 (done); canonical notebook domain
(`src/notebook/engine/domain.ts`).

**Risk.** Medium. Scope drift; enforce the delivery guard's acceptance gates.

---

## Suggested sequencing

```
P0  Ship gate (correlation + failure states + live proof)   ← unblocks everything
        │
        ├─ P1a Knowledge Graph UI            (parallel, web-only, read-only)
        ├─ P1b Audit manifest surfacing      (parallel, web + query API)
        └─ P1  Session recovery (SRC-006)    (parallel, small, independent)
        │
P2  Security tail (identity-binding) + Harness efficiency bundle
        │
P3  Evaluation flywheel + control-plane CI gate
P3  Peer notebook manifest lifecycle (if notebook thesis is the focus)
```

P0 is the only strict prerequisite. The three P1 items are independent of each
other and can run in parallel once the ship gate is stable. P2/P3 are
quality/leverage investments that compound after the product is demoable.

---

## Deliberately deprioritized (with reasoning)

| Item(s) | Verdict | Reasoning |
| --- | --- | --- |
| `SPEC-GW-011`, `gateway-api-explicit-schema.md`, `old-specs/gateway-*`, `SPEC-WRK-001` | **Superseded** | The project moved from a gateway / progressive-disclosure model to Code Mode (`thoughtbox_search` + `thoughtbox_execute`). No `src/gateway/`, `thoughtbox_gateway`, or `thoughtbox_operations` exist. Implementing these as written would rebuild a removed architecture. |
| `letta-specific/SPEC-DGM-001…009` | **Wrong target** | All target `letta-code-thoughtbox/`, which does not exist in this monorepo; `.dgm/` is orphaned. Not actionable without reopening Letta integration. |
| `SPEC-OBS-001` sidecar (Prometheus/Grafana) | **Defer** | Ops monitoring stack, not reasoning value; heavy infra; unstarted; partly superseded by the shipped OTEL/session-focused `tb.observability`. |
| `SPEC-SRC-001…005` (Srcbook port) | **Defer** | Entire notebook-preview/AI-cell port is unstarted; lower priority unless notebook execution becomes the roadmap. (SRC-006 is the exception — see P1.) |
| `SPEC-CORE-002` Canonical IR / TBX-C1, `codebase-as-api.md` | **Long-horizon** | Pragmatic Code Mode already shipped via a different, simpler path (`target-state.md`). Canonical IR is a large rewrite explicitly deferred. `codebase-as-api` is a strong strategic brief but zero code. |
| `codebase-control/*` (`src/control/` meta-controller) | **Research** | Valuable gap analysis (2026-03-22) but a multi-quarter platform; use to rank smaller slices, not as a single project. |
| `agent-governance-substrate/*` (full program), `SPEC-HUB-002` behavioral integration, `SPEC-BLAST-RADIUS`, `SPEC-PROJECT-MODEL`, `SPEC-NOTEBOOK-RLM`, `SPEC-DRIFT-PREVENTION-HOOKS`, `theseus-improvements.md` v0.2, `workflow-features/*` | **Defer / research** | Either marked "research, not accepted," explicitly cut from v1 by `SPEC-USABILITY-CUTLINE.md`, or diffuse-value future direction. `STARTER-TIER-A` A1/A5 (branch protection + PR claim-check) and `SPEC-THOUGHTBOX-SLEEP-TIME` Delta 1 are the cheapest items here and are reasonable fast-follows if governance becomes a priority. |
| `SCOPE-LAYER-2-SUPABASE-HUB-STORAGE.md` | **Conditional** | Real correctness risk (stateless Cloud Run + filesystem hub = data loss) **but** the hub HTTP surface is not exposed in multi-tenant production today (`src/index.ts` mounts hub routes only when `!isMultiTenant`). Promote to P1 the moment hub-over-HTTP ships in multi-tenant mode. |

---

## Spec hygiene (cheap, high-signal)

Several specs are stale relative to code and actively mislead future agents.
Closing them out is near-zero effort and prevents wasted re-investigation:

- **Mark done / accepted:** `knowledge-storage-project-scoping.md` (ADR-013 path
  done for Supabase), `SPEC-AUD-010` (~90% done), `thoughtbox-probe-harness/design.md`
  ("pending implementation" — actually implemented under `scripts/probes/`),
  `SPEC-CHG-001` footer ("not yet implemented" — Phase 1 shipped).
- **Re-target or archive:** all gateway specs and `SPEC-WRK-001` reference removed
  architecture; `src/resources/server-architecture-content.ts` still mentions
  `thoughtbox_operations` and should be corrected.
- **Reconcile docs vs reality:** `apps/web/README.md` claims Cloud Run/Docker and
  `/projects`,`/runs` routes; live web is Vercel with `/sessions`
  (`production-overview/PRODUCTION-SYSTEM-MAP.md`).

---

## What I would do first

If only one thing ships from this proposal: **P0, the v1 coherent-run loop**,
because it is the declared gate, the substrate is already ~80% built, and it
converts the product from "claimed" to "demoable." Immediately after, **P1a
(Knowledge Graph UI)** and **P1b (audit surfacing)** because they are the highest
value-per-effort in the corpus — they make capabilities that *already exist*
finally visible to a user, at read-only risk.
