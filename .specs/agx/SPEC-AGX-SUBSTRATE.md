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

**B11 delivery notes (2026-07-09 — as built):** the standing-facts shim
(`src/claims/standing-facts.ts`) is the migration surface for the first two consumers. A
standing fact is a keyed, workspace-scoped claim: `write` → `tb.claims.assert` with the key
encoded as a queryable statement prefix (`[fact:<key>] <statement>`); `read`/`list` →
`tb.claims.query` returning only LIVE facts (asserted/supported); revision is an explicit
`supersede` → `tb.claims.supersede` (old claim flips to `superseded` pointing at its
replacement, atomically — never a silent overwrite). Consumer mapping: assumption-registry
entries write as type `assumption` (the default); session-handoff `standing_facts` write as
`observation`/`decision`. The shim routes through the ClaimsHandler, so facts inherit
tb.claims validation, the supersede CAS, and Realtime status emission verbatim. Round-trip
and supersede semantics are vitest-evidenced (`src/claims/__tests__/standing-facts.test.ts`).
Skill/handoff integrations are deliberately NOT built here — the shim is the reader/writer
those artifacts adopt.

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

**B6+B8 delivery notes (2026-07-06 — as built):**

1. **Await semantics are pull-only.** An `await` cell carries `{ claimId, until: ClaimStatus[] }`
   and is satisfied when the claim's CURRENT status ∈ `until`. Satisfaction appends a normal
   append-only execution record (status `completed`, one pass expectation documenting the
   observed status), so the B5 ordering/derivation rules apply unchanged; an unsatisfied await
   appends NOTHING — the instance derives `in_progress` (parked), never `failed`. A batch run
   (`notebook_start_run`) reaching an unsatisfied await halts there with the trailing cells
   skipped and the verdict not passing (reason names the awaited claim).
2. **Subscription registration (the B6 binding).** When an instance parks at an await, the
   cell's claim subscription is written durably (`claim_subscriptions.subscriber =
   "runbook:<instanceId>/<cellId>"`, idempotent) — the hook Realtime/notification delivery
   attaches to. A claim that does not exist yet parks without a subscription; the next
   advance retries the read. Await evaluations are excluded from the fitness ledger
   (coordination state, not a hypothesis — §7 scopes fitness to exec/assert cells).
3. **Double-execute guard (GH #403, resolved with B8).** Advance runs an exec cell's side
   effects behind a compare-and-swap: it must first INSERT a reservation keyed
   `(instance_id, seq)` into the append-only `runbook_advance_reservations` table (InMemory:
   synchronous check-and-set; Supabase: primary-key conditional insert). Exactly one
   concurrent advancer wins; losers return `in_flight` having executed nothing. A reservation
   with no matching execution record (crashed advancer) also reports `in_flight`; only an
   explicit `force` skips past it (documented double-execute acceptance). Satisfied-await
   records need no reservation — they are side-effect-free, and the `(instance_id, seq)`
   unique key dedupes concurrent appends benignly.
4. **Advancer v0 scope.** Manual pull only: `tb.runbook.advance` / `tb.runbook.status` (plus
   `tb.runbook.addAwaitCell` authoring). The cron tick for unattended instances is NOT built
   yet — deliberately deferred; nothing suspends, times out, or retries server-side (claim c4).
   Exec cells require the notebook (template id = notebook id) loaded in the advancing
   session; awaits advance without it, so a fresh session can un-park an instance before
   reloading the notebook.

**Canonical first use (Principle 3):** the post-merge checklist. The 2026-06-11 session
executed "after each migration merge confirm prod-migration-health green → clean worktrees →
verify ledger" manually from prose JSON, leaving no durable record. As a runbook template:
`await` cells on workflow-conclusion claims, `exec` cells for cleanup via `gh`/`git` targets,
`assert` cells on ledger state. This is Experiment H2's substrate.

### 5.1 Outcome contract (adopted design, 2026-06-12 — implemented by B4a)

1. **Per-cell contracts, document verdict derived.** An exec/code cell may declare an outcome
   contract. The document verdict passes iff every declared expectation was evaluated and
   passed (an uncontracted procedurally failed cell still fails the run). Expected-failure
   rule (adopted 2026-06-12, B5): a cell that exits nonzero but whose every declared
   expectation passes is *expectation-satisfied* — a predicted failure that neither fails
   nor halts the run; uncontracted failures and failed/errored expectations still halt
   it. A runbook with zero declared
   contracts keeps its procedural verdict but carries `contractCoverage: 0` and a reason
   stating "procedural completion only — no outcome contracts declared", so fitness (B9)
   excludes contract-less runs from pass-rates.
2. **Two tiers.** Tier 1 is pure data — `{ source, op, value }` with source ∈ { exitCode,
   output (RFC 6901 JSON pointer into the cell's structured output), artifact ref,
   claim-status } and op ∈ { eq, ne, lt, lte, gt, gte, matches, schema (minimal JSON Schema
   subset) } — validated with zod on the compile path (authored data, not Effect Schema).
   Claim-status resolution sits behind a narrow injected resolver interface; unwired it yields
   an `error` result ("claim resolver not wired") until the claims layer merges. Tier 2 is the
   existing validator-cell machinery (validatorFor, snapshot+hash), mechanics unchanged, with
   verdicts mapped into the same per-expectation record model tagged `tier: 2` so future
   fitness gating (negative controls) can discriminate.
3. **Binding at authoring, hash-checked at run** (Ulysses pattern): contracts compile
   parse-only (extract → zod → canonicalize → sha256, mirroring `peer.manifest.json`); the
   hash is re-verified before any cell executes; mismatch = tampering = run rejected with a
   distinct error.
4. **Result semantics:** per-expectation result ∈ { pass, fail, error, skipped }. error =
   could not evaluate; fail = evaluated false; skipped = cell never reached. skipped and error
   are never pass. Verdict evidence carries per-expectation records
   (cellId, expectation, tier, result, expected, actual-or-error).
5. **Actuals from declared channels only:** exit code, JSON pointer into the structured output
   the cell writes to its `TB_OUTPUT_PATH` sidecar (the validator env-var-to-sidecar pattern),
   or artifact ref. Free-text stdout is never scraped.
6. **Bindings survive the .src.md encoding.** `encode` persists each bound cell's id,
   contract (with hash), `validatorFor`, and validator snapshot hash in a
   `<!-- thoughtbox:cell {...} -->` comment between the filename heading and the code fence;
   `decode` restores them, re-verifies the contract hash (tampered exports are rejected
   loudly, same gate as run time), and refuses dangling or duplicate bindings. Notebooks
   without bindings encode byte-identically to the legacy format.

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
   (Delivered 2026-07-09 — B10, §7 delivery notes; shadow-mode default, enforce opt-in.)

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

**B10 delivery notes (2026-07-09 — as built):**

1. **The gate reads the real ledger.** `graduateNotebook` evaluates the graduating notebook's
   fitness via the notebook source's runbook storage (`templateId` = notebook id, latest
   template version's `getFitnessAggregate`). No storage wired, or no template version ever
   persisted, counts as ABSENT evidence, never as a pass. Policy lives in
   `src/notebook/runbook/graduation-gate.ts`; the graduation wiring in
   `src/peer-notebook/handler.ts`.
2. **Threshold policy is the ELG tier ladder** (SPEC-ENVIRONMENTAL-LEARNING-GATES, folded in
   here): `advisory` (evaluate + log only) → `shadow` (warn + record `wouldHaveBlocked`,
   never block — the validator tier and the gate's probation state) → `enforce` (reject with
   an error naming each missing piece of evidence, code `graduation_below_threshold`).
   **Default is `shadow`**, per the ELG keystone: gates are information-destroying, so
   promotion to a live block is a deliberate act backed by shadow-window data — switch via
   the `graduationGate` handler option or `THOUGHTBOX_GRADUATION_GATE=enforce`. Every
   graduation result carries the full `gateDecision` record (mode, aggregate, thresholds,
   deficits), so shadow mode leaves an auditable would-have-blocked trail with zero behavior
   change.
3. **Thresholds (v0 defaults):** ≥3 evidenced instances, machine-checked pass rate ≥0.9,
   ≥1 distinct agent (`DEFAULT_GRADUATION_THRESHOLDS`; per-deployment override via handler
   option). A never-run notebook under `enforce` is rejected with the explanation naming the
   empty ledger. Accept/reject/shadow paths are vitest-evidenced
   (`src/peer-notebook/__tests__/graduation-gate.test.ts`,
   `src/notebook/__tests__/graduation-gate.test.ts`).

## 8. Build Inventory and Relative Complexity

Scale: **S** ≤ 1 agent-day · **M** = one PR-sized unit (2–5 agent-days, a Phase-4/5-slice
equivalent) · **L** = multi-PR unit · **XL** = deferred research. Calibration: v1-initiative
Phases 4+5 (≈9 M-units) shipped in about a week of agent-team time.

| # | Unit | Builds on | Size | Risk | Notes |
|---|---|---|---|---|---|
| B1 | Claim graph schema + storage + RLS migration | hub-table pattern (#377) | **M** | Low | Contract-suite-first; Supabase implementation first (§11.5); FS backend gated on H1/H2 passing |
| B2 | `tb.claims.*` Code Mode surface | catalog/execute infra | **S** | Low | Mechanical once B1 lands |
| B3 | Subscription registry + Realtime propagation + `affected` traversal | #380 publication | **M** | Med | Delivery split by subscriber type (§11.1): push to cells, staleness-check/digest for agents; depends on #393 for web clients |
| B4a | Typed outcome-contract schema + honest verdict derivation | notebook subsystem, agentic-runbooks spec | **M** | Med | The load-bearing decision; adopted design recorded in §5.1 |
| B4b | Durable run/instance persistence + fitness ledger rows | B4a | **M** | Med | Discovered gap: NotebookRun is in-memory only; instances must become append-only durable records |
| B5 | Ordered execution + append-only instance enforcement | B4 | **S/M** | Low | Reject, don't warn |
| B6 | `await` cell ↔ claim subscription binding + runnable marking | B3+B4 | **M** | Med | The novel integration; nothing like it exists yet |
| B7 | Brokered `exec`-cell execution (generalize broker beyond peers) | SPEC-CONTROL-PLANE broker | **M/L** | Med | Authority model resolved to manifest reuse (§11.2): approved templates carry declared authority; drafts run under declared ∩ executor |
| B8 | Advancer v0 (advance-on-open + cron tick) | B4–B6 | **S** | Low | Explicitly not a workflow engine |
| B9 | Fitness ledger + aggregates | B4 | **S/M** | Low | Schema + queries |
| B10 | Evidence-gated graduation | #389 graduation, B9 | **M** | Med | Delivered 2026-07-09 — ELG tier ladder, shadow default (§7 delivery notes) |
| B11 | Migration shims: assumption registry & handoff standing-facts → claims | B1–B2 | **S** | Low | Delivered 2026-07-09 — standing-facts shim (§4 delivery notes); consumer rewiring tracked in §12 |
| — | Semantic relevance routing / watch predicates | B3 | **XL** | — | Deferred; v0 is explicit subscription |
| — | MAP-Elites descriptor archive | B9 | **XL** | — | Deferred; needs fitness history first |
| — | Durable suspended execution | — | **XL** | — | Explicitly rejected (Principle 5) |
| — | Production isolation runtime (smolvm) | SPEC-CONTROL-PLANE | **L** | — | Already tracked separately (thoughtbox-vdw) |

**v0 testbed total: B1–B11 ≈ 11 units, predominantly M** — comparable to the Phase 4+5 block
just shipped. The decision that deserves the most design attention before code is the
outcome-contract schema (B4a, adopted in §5.1); the cell execution authority model (B7) is
resolved in principle (§11.2) but its manifest-reuse design should be validated against the
actual compilation path before implementation.

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

## 12. Capability Status (point-in-time)

What an agent can and cannot yet do through `thoughtbox_execute`, as of **2026-07-09**
(units B1–B5 merged via PRs #398–#402; B6+B8 via #418; B10+B11 built on
feat/agx-b10-graduation-b11-shims). This is
derived status, not authority — the claims block and §9 are the pre-registration. Update the
table as units land.

**Available now:**

| Capability (via `thoughtbox_execute`) | Surface | Claim / PR |
|---|---|---|
| Maintain a shared, typed premise-set across agents and sessions — assert/support/invalidate/supersede claims, link `depends_on` edges, query, and walk transitive dependents | `tb.claims.assert/support/invalidate/supersede/link/subscribe/unsubscribe/query/affected` | c1 / #398 |
| Detect stale premises without any agent-to-agent message — batch revalidation and a status-change digest | `tb.claims.verify`, `tb.claims.changed_since` | c2 §11.1 / #400 |
| Claim status transitions propagate over Supabase Realtime to subscribers (web clients and awaiting runbook cells' subscription rows) | `supabase_realtime` publication on `claims` | c2 / #400 (full two-client agentic test deploy-gated) |
| Author durable, versioned runbook templates; every run is an append-only instance, resumable by instance id | `tb.notebook.*` over `RunbookStorage` | c3 / #399 + #401 |
| Contract-governed, ordered cell execution — document order enforced, predicted failures pass, real failures halt; tier-1 declarative + tier-2 validator outcome contracts, hash-verified | notebook engine (B5) | c3 / #399 + #402 |
| Accrue a fitness ledger — hypothesis-vs-actual per template version, only machine-checked outcomes contribute | `runbook_fitness_ledger` aggregates | c7 / #401 |
| Read the fitness ledger back — per-version aggregates (instances, pass rate, error rate, distinct agents) and raw rows via the public tool surface | `tb.notebook.fitness` (`notebook_fitness`) | c7 read path (2026-07-06) |
| Instantiate a runbook from a persisted template version in a FRESH session, or resume a half-executed instance from its instanceId alone (derived status + next unsatisfied cell; ordered execution continues via `notebook_run_cell`) | `tb.notebook.instantiate` (`notebook_instantiate`) | c5 substrate (2026-07-06); Experiment H2 remains the agentic verification |
| Run scored executable evals through the same durable path as runbooks — EvalScorecard = passed/evaluated over declared expectations; zero expectations scores 0, never a synthetic pass; graders accrue fitness ledger rows identically (the six verdict-less stub modes were removed 2026-07-06; their templates remain plain scaffolds) | `notebook_start_run { mode: "eval" }` | c7-adjacent (typed outcomes only, Principle 6) |
| A runbook cell that **blocks on a claim** — a run parks at an unsatisfied `await` cell (skipped tail, durable claim subscription, instance stays `in_progress`), and the next pull past a satisfying claim status records the satisfaction and executes the cells behind it | `await` cell (`tb.runbook.addAwaitCell`) + `tb.runbook.advance` (B6) | c4 / §5 delivery notes |
| Pull advancement of an instance by any agent, with concurrent advancers executing side effects **exactly once** — CAS reservation on `(instance_id, seq)` before any exec-cell side effect; losers observe `in_flight` (GH #403 resolved) | `tb.runbook.advance`, `tb.runbook.status`, `runbook_advance_reservations` | c4 (B8) |
| Keep shell, filesystem, and code editing native and unmediated — the substrate wraps only trust-boundary verbs | (invariant; §10) | c10 |
| Evidence-gated notebook→manifest **graduation** — `graduateNotebook` reads the fitness ledger and evaluates the ELG tier ladder (advisory → shadow → enforce; shadow default records would-have-blocked without blocking, `THOUGHTBOX_GRADUATION_GATE=enforce` rejects below threshold naming the missing evidence) | `peer_graduate_notebook` gate (B10, §7 delivery notes) | c8 (2026-07-09) |
| Round-trip standing facts through the claim graph — keyed, workspace-scoped write/read/list/supersede over tb.claims semantics, for the assumption registry and handoff `standing_facts` | standing-facts shim (B11, §4 delivery notes) | Principle 3 (2026-07-09) |

**Not yet — the unbuilt joins:**

| Capability | Unlocked by | Claim |
|---|---|---|
| Cron tick advancing unattended instances (advance is agent-pull only today) | **B8 follow-up** | c4 |
| Cells executing under the agent's **brokered allowlist and budget** (no ambient authority) | **B7** | c6 |
| Graduation gate ENFORCED by default (today: shadow default; enforce is a config switch — ELG shadow-window promotion is deliberate, not ambient) | operator decision after a shadow window | c8 |
| Assumptions skill / session-handoff actually writing through the B11 shim (the shim is built; the consumers still write their legacy artifacts) | skill + handoff rewiring (H5) | Principle 3 |
| Local durable claims (FileSystem `ClaimStorage`) | deferred §11.5 (gated on H1/H2) | c1 |

**Verified vs claimed:** c3, c7, c10 are met and evidenced; c8 is met — the gate reads the ledger and vitest covers the accept, reject-naming-the-deficit, and shadow would-have-blocked paths (`src/peer-notebook/__tests__/graduation-gate.test.ts`), with enforcement itself an opt-in switch per the ELG shadow-first policy; c4 is met for the manual-pull path — vitest evidence covers (a) parking at an unsatisfied await on both the advance and real batch-run paths, (b) claim satisfaction un-parking the next advance end-to-end through the real execution path, (c) concurrent advance executing side effects exactly once, (d) the reservation CAS on both backends (`src/notebook/__tests__/await-advance.test.ts`), and code review confirms no suspended-execution machinery exists (the advancer is a loop inside one explicit call; the cron tick remains unbuilt); c1 is met for Supabase + InMemory (FS deferred by design); c2's mechanism is proven but its full two-live-client agentic test is deploy-gated; c5 (fresh-session instance resumption) has its substrate in #401 + `tb.runbook.status` but is unverified pending **Experiment H2**; c6 is unbuilt. The two thesis experiments (**H1** coordination-beats-orchestrator, **H2** runbook resumption) are unrun.

**Bottom line:** the selection pipeline now closes end-to-end: behaviors accrue ledger fitness (B9) and graduation reads it (B10), with the ELG shadow tier keeping the evidence stream alive until an operator promotes the gate to enforce. B11 gives the first two obligatory artifacts (assumption registry, handoff standing facts) their claims-native reader/writer. The remaining unbuilt joins are the B8 cron tick and brokered cell authority (**B7** / c6); **H2** is unblocked and should run next (§9), and **H4** (graduation cheaper than specification) now has its mechanism.
