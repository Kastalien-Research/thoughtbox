---
spec_id: SPEC-AGX-SUBSTRATE
title: "AgX Substrate: Claim Graph, Reactive Runbooks, and the Governed Capability Plane"
status: draft
date: 2026-06-11
branch: docs/spec-agx-substrate
claims:
  - id: c1
    statement: Claims are first-class, typed, tenant-isolated entities with dependency edges and explicit subscriptions, persisted on both storage backends and exposed via tb.claims.* in the Code Mode catalog
    type: implementation
    behavioral: false
    required_evidence: Claim/edge/subscription schema on FileSystemStorage and SupabaseStorage (migration with tenant_workspace_id + workspace-membership RLS, matching the hub-table pattern); a shared contract test suite running against both backends; tb.claims.* discoverable via thoughtbox_search and callable via thoughtbox_execute
  - id: c2
    statement: Invalidating or superseding a claim notifies every subscriber (agent sessions and awaiting runbook cells) through hub Realtime, with no agent-to-agent message required
    type: behavioral
    behavioral: true
    required_evidence: Agentic test with two live MCP clients in one workspace — client A invalidates a claim client B subscribes to; B observes the notification via Realtime; a cross-workspace negative control observes nothing
  - id: c3
    statement: Runbook templates are versioned prose+code cell documents with a typed outcome contract per executable cell (expected predicate/metric/threshold, actual filled at execution); instances are append-only execution records separate from their template
    type: implementation
    behavioral: false
    required_evidence: Template/instance data model with template version pinned on instance creation; outcome schema validated at template authoring time; tests showing instance records are append-only (cell re-execution appends a new record, never mutates a prior one)
  - id: c4
    statement: Runbook advancement is pull-based — an awaiting cell is a claim subscription plus a runnable marker; there are no suspended server-side processes, in-flight retries, or durable timers
    type: governance
    behavioral: false
    required_evidence: Advancement happens only via explicit tb.runbook.advance calls (agent- or cron-initiated); claim-satisfaction marks cells runnable but executes nothing; code review confirms no suspended-execution machinery exists
  - id: c5
    statement: An agent in a fresh session, given only a half-executed runbook instance id, completes the remaining cells correctly with no other carried context
    type: behavioral
    behavioral: true
    required_evidence: Agentic test (Experiment H2) — instance executed through cell N in session 1; session 2 with empty context resumes from the instance record alone and completes with all outcome assertions passing
  - id: c6
    statement: Runbook cell execution flows through the peer broker under the executing agent's allowlist and budget; cells carry no ambient authority
    type: governance
    behavioral: false
    required_evidence: Cell execution path dispatches through the SPEC-CONTROL-PLANE broker; tests show an allowlisted target succeeds with an outbound_call_allowed trace, a non-allowlisted target is denied, and budget exhaustion halts execution
  - id: c7
    statement: A fitness ledger records hypothesis-vs-actual per template version, and only machine-checked outcomes contribute to fitness
    type: implementation
    behavioral: false
    required_evidence: Ledger rows keyed by (template id, template version, instance id, cell id) with expected/actual/pass; prose-judged outcomes are stored as commentary and excluded from fitness aggregates; tests cover both paths
  - id: c8
    statement: Notebook-to-manifest graduation is evidence-gated — a template cannot graduate without meeting declared fitness thresholds from the ledger
    type: governance
    behavioral: false
    required_evidence: graduateNotebook (or successor) reads the fitness ledger and rejects graduation below threshold with an error naming the deficit; test covers accept and reject paths
  - id: c9
    statement: On a deliberately coupled multi-agent task, claim-graph coordination produces fewer stale-premise incidents and less rework than an orchestrator-mediated baseline
    type: performance
    behavioral: true
    required_evidence: Experiment H1 report — same coupled task run both ways, counting stale-premise incidents (an agent acting on an invalidated claim), rework commits, and wall time; results recorded in the experiment runbook instance
  - id: c10
    statement: The substrate mediates trust-boundary verbs only; the agent's local substrate (shell, filesystem, code editing) remains native and unmediated
    type: governance
    behavioral: false
    required_evidence: No tb.* surface wraps local file editing or shell execution; agent configs in this repo retain Bash; the broker's verb inventory contains only trust-boundary operations (deploy, migrate, prod-write, spend, external-publish class)
links:
  - .specs/mcp-peer-notebooks/SPEC-CONTROL-PLANE.md
  - .specs/agentic-runbooks.md
  - .specs/quality-diversity/map-elites-research.md
  - .specs/deployment/v1-initiative.md
  - .specs/agent-governance-substrate/
---

# AgX Substrate: Claim Graph, Reactive Runbooks, and the Governed Capability Plane

## 1. Motivation

This spec synthesizes the 2026-06-11 AgX design sessions. The founding observations, in order:

**The thought journal is rationally ignored by frontier engineering agents.** An agent with
native extended thinking already externalizes reasoning as serialized tokens; the marginal act
of `tb.thought` is curation, and its cost is never repaid within a single context window
because the agent re-observes its own reasoning for free — it is in context. Direct testimony
from the lead agent of the 2026-06-11 PR-triage session (11 PRs, 9 fix agents, ~30 judgment
calls): Thoughtbox was never a consideration, because every persistence need was already served
by an artifact on the critical path (GitHub comments, handoff JSON, task results).

**The value of re-observation is proportional to context discontinuity.** Within one window,
discontinuity is zero and the journal is overhead. Across compaction, sessions, and — decisively —
across *agents*, discontinuity is real. Single-agent discontinuity shrinks with every model
generation (this is why Sequential-Thinking-style evals decay). Inter-agent discontinuity is
**structural**: a sub-agent's reasoning is never in the orchestrator's context and vice versa,
and no context-window improvement changes that. The externalization thesis therefore does not
die; it *relocates* to the one place its enabling condition is permanent.

**Coordination today is rationed by partitionability.** Orchestrators spend real effort
designing tasks to be independent and simply refuse to parallelize coupled problems. The
binding constraint is the stale-premise problem: agent B builds on an assumption agent A
invalidated mid-task, and A2A messaging cannot fix it because the discovering agent does not
know who is affected. Constraint propagation (the AutoCAD model) inverts this — declare
dependencies, and relevance finds you — but it requires reasoning state structured enough to
compute "affected parties," which free-prose thought streams cannot support.

**Governed capabilities are expensive to specify by hand.** One pilot peer with one tool and a
two-target allowlist generated a full hardening backlog (#390). The remote-control vision needs
a *supply chain* for verbs, not an enumeration effort.

The substrate below addresses all four: a **claim graph** as shared declarative state with
dependency propagation, **reactive runbooks** as durable procedural state subscribed to it, and
the existing **brokered capability plane** as the governed execution layer under both — with a
fitness-gated **graduation pipeline** turning proven runbook behaviors into governed verbs.

**Posture toward prior specs:** the documents in `links` are sources of ideas, not of truth.
Where this spec adopts a prior idea it says so and argues it on merit; where a prior spec
claims something exists, that claim carries weight only with current code or test evidence
(SPEC-CONTROL-PLANE's claims are evidence-backed as of the 2026-06-11 merges; most others are
aspirational drafts).

## 2. Design Principles (binding)

1. **Instrumentation, not discipline.** Provenance and recording are side effects of work the
   agent is already obligated to do. No surface in this spec asks an agent to journal
   voluntarily.
2. **Reader before writer.** No write path ships before its consumer exists. Every artifact
   written must name who reads it and when.
3. **Critical-path placement.** New artifacts replace obligatory artifacts (checklists,
   handoffs, experiment reports) rather than adding parallel ones.
4. **Mediate the trust boundary, not the body.** Shell, filesystem, and code editing remain
   native agent capabilities. The broker governs verbs that cross a trust boundary: prod data,
   deployment, spend, external publication, shared durable state.
5. **Pull, not push.** Runbooks are reactive documents, not suspended processes. Nothing in
   this spec is a workflow engine; there are no durable timers, no in-flight retries, no
   suspended threads. (The run-records-as-durable-state-machine idea originates in
   `.specs/agentic-runbooks.md` and is adopted here on its merits.)
6. **Typed outcomes only.** Fitness derives exclusively from machine-checkable expected/actual
   comparisons. LLM-judged prose is commentary, never fitness.
7. **Don't compete with incumbents.** Native thinking does single-context reasoning; git/GitHub
   does code collaboration. This substrate does inter-agent state, durable procedure, and
   governed action — jobs with no incumbent.

## 3. Architecture

```
            ┌─────────────────────────────────────────────────────┐
            │                       HUB                           │
            │   identity · workspaces · problems · proposals      │
            │   reviews · consensus · channels   (EXISTS, 4.x)    │
            └────────────────────────┬────────────────────────────┘
                                     │ Realtime (publication EXISTS, #380)
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
┌───────▼────────┐          ┌────────▼─────────┐         ┌────────▼─────────┐
│  CLAIM GRAPH   │ notifies │ REACTIVE RUNBOOKS│ executes │ CAPABILITY PLANE │
│  (NEW)         │─────────▶│ (EVOLVES         │─────────▶│ (EXISTS,         │
│ typed claims   │          │  notebooks)      │  via     │  SPEC-CONTROL-   │
│ dependency     │ awaiting │ template/instance│  broker  │  PLANE)          │
│ edges          │ cell =   │ typed outcomes   │          │ manifests        │
│ subscriptions  │◀─────────│ pull advancement │          │ allowlists       │
│                │ subscribe│                  │          │ budgets · traces │
└────────────────┘          └────────┬─────────┘          └────────▲─────────┘
                                     │ fitness ledger              │
                                     └──────── graduation ─────────┘
                                       (evidence-gated, evolves
                                        proven behaviors into verbs)
```

Formalization spectrum: **skill** (full improvisation) → **runbook** (structured, executable,
evaluated) → **manifest/peer** (fully governed). Graduation moves behaviors rightward as
evidence accumulates; the fitness ledger is the selection signal (MAP-Elites-style archive
indexed by behavior descriptors is deferred — see Non-Goals).

## 4. Layer 1: Claim Graph (NEW)

The unit of shared agent state is the **claim**: a typed assertion with provenance, status,
dependency edges, and subscribers. Claims are what thoughts needed to become for propagation
to be computable.

**Data model (v0):**

| Entity | Fields (essence) |
|---|---|
| `claim` | id, workspace_id, tenant_workspace_id, type (`assumption` \| `decision` \| `observation` \| `requirement` \| `outcome`), statement, status (`asserted` \| `supported` \| `invalidated` \| `superseded`), evidence_refs[], created_by (agentId), superseded_by? |
| `claim_edge` | from_claim, to_claim, kind (`depends_on` \| `derives_from` \| `contradicts`) |
| `claim_subscription` | claim_id, subscriber (agentId \| runbook_cell_ref), created_by |

**Operations (`tb.claims.*`):** `assert`, `support` (attach evidence), `invalidate`,
`supersede`, `link`, `subscribe`, `unsubscribe`, `query` (by type/status/agent/text),
`affected` (transitive dependents of a claim), `verify` (cheap revalidation: current status
per claim id — the §11.1 staleness check at decision boundaries), `changed_since` (digest of
status transitions after a timestamp — the §11.1 session-start/sync-point recall).

**Propagation:** status changes publish through the existing hub Realtime publication
mechanism. Subscribers receive (claim id, old→new status, actor). Awaiting runbook cells are
marked runnable (§5). **Relevance routing v0 is explicit subscriptions only** — an agent or
cell subscribes to the claims it depends on. Semantic/inferred routing is deferred (XL,
Non-Goals); watch predicates over typed fields (e.g. "any `assumption` touching tag X") are a
v1 candidate. (B3 delivery: every status transition stamps `status_changed_at`; the `claims`
table rides the `supabase_realtime` publication in hosted mode, and local mode emits an
in-process `claim:status` event on the ThoughtEmitter — the channel B6 binds cells to.
`claim_edges` is deliberately unpublished: edge creation changes no claim's status, and no
edge-event reader exists yet.)

**Migration sources, not new burdens (Principle 3):** the assumption registry
(`.claude` skill: assumptions), spec frontmatter claims (`.schemas/spec-v1.json` — already
claims with ids and evidence), and handoff `standing_facts` are existing obligatory artifacts
that become claim-graph readers/writers. The thought journal remains for operator-class agents
and is otherwise demoted to legacy; it is not extended.

## 5. Layer 2: Reactive Runbooks (EVOLVES the notebook subsystem)

The prior Notebook Evidence Engine spec (`.specs/agentic-runbooks.md`, draft, largely
unimplemented) is treated as a source of ideas, not authority. Three of its ideas are adopted
here on their merits: run records as the durable state machine (no workflow engine),
deterministic validators as a cell concept, and the mode taxonomy as a useful map of eventual
runbook varieties. Everything else in it — including its Effect-based domain-core mandate —
is *not* inherited by this spec; what exists in `src/notebook/` and `src/peer-notebook/` today
should be verified against code before any B4 design work. This spec's additions are the
claim-graph binding and the template/instance discipline.

**Template vs instance.** A template is versioned like code (it *is* code). An instance pins a
template version at creation and is an append-only execution record: each cell execution
appends (cell id, started, inputs digest, outputs ref, outcome actual, agentId). Re-running a
cell appends; nothing mutates. This kills the Jupyter hidden-state pathology by construction.

**Cell taxonomy (v0):**

| Cell | Semantics |
|---|---|
| `prose` | Intent, hypothesis, context. Renders; never executes. |
| `exec` | Code executed **through the broker** (§6) under the advancing agent's authority. Declares a typed outcome contract: `expected` (predicate / metric+threshold / test reference) and `actual` (filled at execution). |
| `await` | A claim subscription + predicate (e.g. "claim X reaches `supported`"). Satisfaction marks the cell **runnable**; it executes nothing. |
| `assert` | Pure outcome check over prior cells' outputs; the pre-registration teeth. |

**Advancement (pull).** `tb.runbook.advance(instanceId)` executes the next runnable cell(s) in
order. Advancers: any agent holding the instance (on open, on notification), or a cron tick for
unattended instances. There is no other execution path. An `await` whose claim is never
satisfied simply leaves the instance parked — visible, resumable, costing nothing.

**Ordering.** Cells execute in document order; an `exec` cell cannot run before all prior
cells are satisfied. Out-of-order execution is rejected, not warned.

**Canonical first use (Principle 3):** the post-merge checklist. The 2026-06-11 session
executed "after each migration merge confirm prod-migration-health green → clean worktrees →
verify ledger" manually from prose JSON, leaving no durable record. As a runbook template:
`await` cells on workflow-conclusion claims, `exec` cells for cleanup via `gh`/`git` targets,
`assert` cells on ledger state. This is Experiment H2's substrate.

## 6. Layer 3: Governed Capability Plane (EXISTS — deltas only)

SPEC-CONTROL-PLANE delivered the broker (sole invocation authority; manifest, schema, budget,
allowlist checks), the manifest lifecycle (draft→active→retired, parse-only compilation), the
runtime provider contract, and parse-only notebook graduation (v1-initiative Phases 5.1–5.4,
merged 2026-06-11).

**Deltas this spec requires:**

1. **Generalize brokered execution to runbook cells.** An `exec` cell's outbound calls are
   broker calls whose authority follows the template's lifecycle status (§11.2): approved
   templates execute under their own parse-time-declared allowlist/budget (approval is the
   authority grant, reusing the manifest lifecycle); draft and ad-hoc instances execute under
   declared ∩ the advancing agent's allowlist. The cell-injection threat (agent A authors a
   cell, agent B executes it) is contained by the declared bound in both cases.
2. **Verb inventory strategy.** The broker's target set grows toward roughly a dozen
   high-blast-radius verbs (deploy, migrate, prod-write, spend, external-publish,
   message-human), not toward mediating the agent body (claim c10). New verbs arrive
   primarily via graduation (§7), not specification.
3. **Evidence-gated graduation** (claim c8): graduation reads the fitness ledger.

## 7. Selection Pipeline: Fitness Ledger and Graduation

Every executed `exec`/`assert` cell with a typed outcome writes a ledger row:
(template id, template version, instance id, cell id, expected, actual, pass, agentId, ts).
Aggregated per template version, this is the behavior's fitness: *how reliably does this
procedure's declared hypothesis match reality?*

Graduation (`graduateNotebook`, existing, parse-only) gains an evidence gate: a template
graduates to a draft peer manifest only above declared thresholds (e.g. N instances, pass-rate
≥ p, across ≥ k distinct agents/workspaces). Below threshold, graduation is rejected naming
the deficit. The MAP-Elites framing (archive of behaviors indexed by behavioral descriptors,
`.specs/quality-diversity/map-elites-research.md`) is the v2 shape of the archive; v0/v1 is
fitness history only.

This is the answer to "where do remote-control verbs come from": behaviors are prototyped as
runbooks under full observability, evaluated against pre-registered outcomes, and the proven
ones are promoted into governed, manifest-described capabilities.

## 8. Build Inventory and Relative Complexity

Scale: **S** ≤ 1 agent-day · **M** = one PR-sized unit (2–5 agent-days, a Phase-4/5-slice
equivalent) · **L** = multi-PR unit · **XL** = deferred research. Calibration: v1-initiative
Phases 4+5 (≈9 M-units) shipped in about a week of agent-team time.

| # | Unit | Builds on | Size | Risk | Notes |
|---|---|---|---|---|---|
| B1 | Claim graph schema + storage + RLS migration | hub-table pattern (#377) | **M** | Low | Contract-suite-first; Supabase implementation first (§11.5); FS backend gated on H1/H2 passing |
| B2 | `tb.claims.*` Code Mode surface | catalog/execute infra | **S** | Low | Mechanical once B1 lands |
| B3 | Subscription registry + Realtime propagation + `affected` traversal | #380 publication | **M** | Med | Delivery split by subscriber type (§11.1): push to cells, staleness-check/digest for agents; depends on #393 for web clients |
| B4 | Runbook template/instance model + typed outcome schema | notebook subsystem, agentic-runbooks spec | **M** | Med | The outcome-contract design is the load-bearing decision |
| B5 | Ordered execution + append-only instance enforcement | B4 | **S/M** | Low | Reject, don't warn |
| B6 | `await` cell ↔ claim subscription binding + runnable marking | B3+B4 | **M** | Med | The novel integration; nothing like it exists yet |
| B7 | Brokered `exec`-cell execution (generalize broker beyond peers) | SPEC-CONTROL-PLANE broker | **M/L** | Med | Authority model resolved to manifest reuse (§11.2): approved templates carry declared authority; drafts run under declared ∩ executor |
| B8 | Advancer v0 (advance-on-open + cron tick) | B4–B6 | **S** | Low | Explicitly not a workflow engine |
| B9 | Fitness ledger + aggregates | B4 | **S/M** | Low | Schema + queries |
| B10 | Evidence-gated graduation | #389 graduation, B9 | **M** | Med | Threshold policy design |
| B11 | Migration shims: assumption registry & handoff standing-facts → claims | B1–B2 | **S** | Low | Principle 3 delivery |
| — | Semantic relevance routing / watch predicates | B3 | **XL** | — | Deferred; v0 is explicit subscription |
| — | MAP-Elites descriptor archive | B9 | **XL** | — | Deferred; needs fitness history first |
| — | Durable suspended execution | — | **XL** | — | Explicitly rejected (Principle 5) |
| — | Production isolation runtime (smolvm) | SPEC-CONTROL-PLANE | **L** | — | Already tracked separately (thoughtbox-vdw) |

**v0 testbed total: B1–B11 ≈ 10 units, predominantly M** — comparable to the Phase 4+5 block
just shipped. The decision that deserves the most design attention before code is the
outcome-contract schema (B4); the cell execution authority model (B7) is resolved in
principle (§11.2) but its manifest-reuse design should be validated against the actual
compilation path before implementation.

## 9. Experiments — What We Are Trying to Test

| # | Hypothesis | Protocol | Success criterion | Needs | Cost |
|---|---|---|---|---|---|
| H1 | Claim-graph coordination beats orchestrator mediation on *coupled* tasks (claim c9) | One deliberately non-partitionable task (e.g. cross-cutting refactor with interlocking design decisions), run twice: N agents + claim graph vs orchestrator baseline. Count stale-premise incidents, rework, wall time, and notification overhead (notifications delivered and tokens consumed by them per agent) | Fewer stale-premise incidents OR materially less rework (both preferred; partial improvement is documented as partial success). Null result = neither metric moves | B1–B3 | M |
| H2 | Runbook instances survive agent death (claim c5) | Express the post-merge checklist as a template; execute half in session 1; resume in a fresh session from instance id alone | Completion with all assertions passing, zero carried context | B4–B8 | S |
| H3 | Pre-registration produces usable fitness signal (claims c3, c7) | 10+ instances of 2–3 templates across real work; inspect ledger | Hypothesis-vs-actual discriminates good templates from bad; no vibes-fitness leakage | B4, B9 | S |
| H4 | Graduation is a cheaper verb supply than specification (claim c8) | Take one proven template through evidence-gated graduation; compare effort against the hand-built pilot peer (#378–#389 actuals as baseline) | Materially less effort per governed verb | B10 | M |
| H5 | AgX adoption: agents reach for the substrate unprompted when it replaces obligatory artifacts | Instrument a working session where the checklist/handoff path is runbook-native; observe whether the lead agent uses it without instruction | Unprompted use; qualitative AgX testimony | B11 + H2 assets | S |

H1 is the thesis-bearing experiment (Part B of the externalization thesis, relocated to
inter-agent discontinuity). H2 is the cheapest decisive one and should run first. A null
result on H1 with a positive H2 would narrow the substrate's value to procedural durability +
graduation and argue against further claim-graph investment — that is an acceptable,
informative outcome.

## 10. Non-Goals

- **No removal of Bash or local-substrate mediation** (claim c10). The remote-control-only
  model was stress-tested and rejected for engineering agents: it discards trained competence,
  multiplies inner-loop latency, creates a single point of failure, and its governance claim
  is theater once a general execute verb exists.
- **No workflow engine.** No suspended processes, durable timers, or retry orchestration.
- **No semantic relevance routing in v0/v1.** Explicit subscriptions only.
- **No MAP-Elites descriptor archive yet.** Fitness history first.
- **No replacement of git/GitHub.** PRs remain the code-collaboration surface; the hub/claim
  layer covers pre-code approach formation and live coordination.
- **No new thought-journal investment.** Existing surface remains for operator-class agents.

## 11. Risks, Open Questions, and Adopted Positions

Each risk below carries an adopted position from the 2026-06-11 design review. Positions are
design decisions for v0; the residual open questions are marked.

1. **Notification economics (B3/B6).** Every notification is context spend — the scarcest
   agent resource — and an agent receiving one is forced into a context-switch decision agents
   are constitutionally bad at deferring. Over-subscription drowns agents; under-subscription
   resurrects stale premises.
   **Position: push to machines, pull for minds.** Cells have no attention to waste — Realtime
   push marks them runnable for free. Agents get (a) a cheap **staleness check at decision
   boundaries** (before acting on a premise, revalidate it — cache-revalidation semantics, not
   pub/sub, enforceable via the existing hook pattern so it is instrumentation, not
   discipline), (b) digests at natural sync points, and (c) interrupt-grade delivery reserved
   for one case: the root claim of the agent's active task was invalidated. H1 measures
   notifications delivered and tokens consumed by them per agent.
   *Open:* digest cadence and the definition of "root claim of active task."
2. **Cell execution authority (B7).** Authored-by-A/executed-by-B is a confused-deputy
   factory; "advancing = endorsing" assumes agents review cells before running them, which
   they will not. Options considered: executor's authority (A escalates through B's broader
   allowlist), author's authority (authority outlives the author; needs revocation),
   declared ∩ executor intersection, template-as-principal.
   **Position: template-as-principal for approved templates, intersection for drafts.** A
   template declares its required targets and budgets at parse time — the same parse-only
   compilation path as `peer.manifest.json` — and **approval is the authority grant**, through
   the existing draft→active lifecycle. Approved templates carry their own declared authority;
   draft/ad-hoc instances run under declared ∩ executor's allowlist. This reframes B7 from
   novel authority design to manifest-machinery reuse and makes "approved template" literally
   a proto-manifest, tightening the graduation continuum.
   *Open:* revocation semantics when an approved template's authority must be withdrawn.
3. **Fitness gaming.** Templates can declare trivial hypotheses to farm pass-rate — the same
   optimization pressure that produces weak tests, requiring no malice.
   **Position: negative controls, borrowed from test-quality practice.** A hypothesis is
   non-trivial iff it fails when it should: v1 fitness records require **negative-control
   runs** (deliberately broken precondition or perturbed environment must fail the
   assertions; a template whose assertions pass under perturbation is vacuous and cannot
   graduate). v0 relies on fitness thresholds plus human review of assertion quality at the
   existing manifest-approval gate. Diversity requirements (≥ k agents/workspaces) remain as
   the accidental-gaming dampener. (The negative-control idea is mined from the prior
   agentic-runbooks spec's `skill_certification` mode.)
4. **Claim granularity.** Too-fine claims make subscription unmanageable; too-coarse claims
   make invalidation uninformative ("something about auth changed").
   **Position: granularity is discovered, not designed.** Starting heuristic — **atomic
   falsifiability**: one observation should suffice to invalidate a claim, and one decision
   should be able to depend on it. Calibration corpus: existing spec frontmatter claims and
   assumption-registry entries, both roughly this grain and use-tested. Instrument from day
   one: high subscriber count + frequent *partial* invalidation = split signal; zero
   subscribers ever = archive signal. H1's task deliberately mixes granularities.
5. **Dual-backend cost.** Every layer doubles its storage work (FS + Supabase).
   **Position: contract-suite-first, Supabase-first, FS gated on evidence.** The hub work
   demonstrated that with a contract suite leading, the second backend is closer to mechanical
   than to 2x — the real cost is interface design, paid once. The experiments need Supabase
   (H1 requires multi-client Realtime; local mode is single-process where propagation is just
   the in-process emitter). The FS implementation is a product requirement, delivered after
   H1/H2 pass, not before. This honors the standing dual-backend architecture decision as a
   product gate rather than an experiment tax.
6. **Adoption is the meta-risk.** Principles 1–3 exist because the thought journal failed
   them; better architecture alone does not change agent behavior.
   **Position: adoption is centralized, not per-agent — engineer it at three chokepoints.**
   (a) Session-start recall-on-load: claims relevant to the task surface automatically, making
   prior writes visibly pay off. (b) Spawn-prompt templates: sub-agents do not choose their
   tools, their spawn prompts do, and the full template set was rewritten in a day (#379) —
   that is the entire sub-agent adoption surface. (c) Obligatory-artifact replacement: when
   the post-merge checklist *is* a runbook instance, no parallel non-substrate path exists.
   **Kill criterion:** H5 failure with all three chokepoints wired is a verdict on the
   substrate, not an awareness problem — believe the result.
