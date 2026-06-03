# Highest-Value Implementation Proposal

> **Status**: Proposal (for review → HDD/ADR staging)
> **Created**: 2026-06-03
> **Author**: Cloud agent review of `.specs/`
> **Scope**: Synthesizes the 171-file `.specs/` corpus into a prioritized, reasoned implementation plan.

## Purpose

This document reviews the entire `.specs/` folder, grounds each idea against the
**current codebase reality** (not just spec claims), and proposes the
**highest-value designs to implement next**. Each plan states *why it was chosen*
over the alternatives.

It is a proposal, not an accepted ADR. The selected plans should each enter the
HDD lifecycle (`.adr/staging/`) before implementation, per `AGENTS.md`.

---

## How "highest value" was decided

Every spec was scored on four axes:

| Axis | Question |
| --- | --- |
| **Intent fit** | Does it advance the *settled product intent* (`product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md`)? |
| **Readiness** | How much already exists in `src/`, ADRs, or migrations? |
| **Leverage ÷ invasiveness** | How much agent friction removed or product unlocked per unit of change? |
| **Regret** | What is the cost of *not* doing it (broken core value, data loss, drift)? |

The settled intent is the anchor. Per the intent doc, Thoughtbox is **a reasoning
workstation for agents** whose flagship is a **durable, versioned thought graph +
Git-like Hub**, with **Code Mode as the public surface**, **peer notebooks as the
governed evidence/control plane**, and **control-plane learning as the north
star**.

### Codebase reality used to ground this proposal

Verified directly against `src/` and `.adr/` on 2026-06-03:

- **Code Mode is already the live public surface.** `server-factory.ts` registers
  exactly three tools: `thoughtbox_search`, `thoughtbox_execute`,
  `thoughtbox_peer_notebook`. `src/tool-registry.ts`, `src/tool-descriptions.ts`,
  and `src/gateway/` **no longer exist**.
- **Peer notebooks Part 1 is merged.** `src/peer-notebook/` (13 files) plus
  migration `20260430010000_create_peer_notebook_control_plane.sql` exist;
  ADR-022 is staged.
- **Auditability foundation is accepted.** `ADR-010-observatory-structured-rendering`
  and `ADR-009-merge-auditability-experiments` are in `.adr/accepted/`.
- **The only declared ship goal is open.** `thoughtbox-v1-finalstretch/SHIP-CHECKLIST.md`
  (one coherent run bound to a session with linked telemetry) has most
  Definition-of-Done items unchecked.

This reality **changes the spec rankings**. Several specs that read as "high
value" are in fact already done or now obsolete (see
[Explicitly deprioritized](#explicitly-deprioritized-and-why)).

---

## The proposal at a glance

Five plans, ordered by recommended execution. The ordering puts **fixing the
broken core** before **finishing the only declared ship path** before
**advancing the flagship and the north star**.

| # | Plan | Why it ranks here | Readiness | Invasiveness |
| --- | --- | --- | --- | --- |
| **P1** | Repair the reasoning-persistence core | The product's whole reason to exist is broken/leaky today | High (fixes to existing code) | Low–Medium |
| **P2** | Land the one coherent run→session demo | Only explicitly declared shipping goal; converts the stack into a demoable product | Medium (binding row exists) | Medium |
| **P3** | Peer notebook manifest lifecycle (ADR-022 Part 2) | The control-plane north star, made concrete; Part 1 already merged | High (next unit defined) | Medium |
| **P4** | Make the thought graph auditable & visible | Serves "web app shows reasoning structure"; builds on accepted ADR-010 | High (ADR accepted) | Low–Medium |
| **P5** | Async governance substrate (sleep-time + Tier A) | The "environment learns between sessions" intent; infra already shipped | Medium (migration exists) | Low–Medium |

Everything else is intentionally deferred, and the reasoning is given.

---

## P1 — Repair the reasoning-persistence core

**Compose from:** `SPEC-SRC-006` (session recovery via MCP root),
`cognitive-harness-improvements/03` (mid-session recall),
`cognitive-harness-improvements/02` (terse shorthand), and the verified bugs in
`agent-user-feedback/claude-code-001.md` and `claude-chrome-001.md`
(broken `extractLearnings`, SDK coercion, default-friction).

### Why this is #1

The entire product thesis is *durable prior reasoning that stays accessible over
long, complex work*. Two independent pieces of evidence say that core is leaking:

1. **Data loss is real.** `SPEC-SRC-006` documents 67 thoughts orphaned when an
   MCP client session timed out mid-reasoning. A reasoning workstation that
   silently loses reasoning fails its one job.
2. **The persistence value-prop is reported broken.** `claude-code-001.md`
   (a verified 146-thought session) flags `extractLearnings` as non-functional
   and calls it "the whole reasoning-persistence value prop." Defaults and SDK
   coercion bugs tax every single call.

No downstream feature — Hub, notebooks, control plane, web visualization —
matters if the substrate they all read from is lossy. This is the **lowest-regret,
highest-leverage** work in the corpus, and it is mostly *fixing existing code*
rather than building new systems.

### What to build

- **Session recovery (`SPEC-SRC-006`)**: when `load_context`/resume is called
  without a `sessionId`, auto-select the most recent session for the MCP root.
  ~4 files (`src/persistence/`, `src/init/`). Backward compatible.
- **Fix `extractLearnings` + SDK coercion** (agent feedback A7 / Tier A): make
  session-close learning extraction actually persist structured output; fix the
  prose→JSON coercion footgun. Touches `src/thought/`, `src/code-mode/`,
  `src/sessions/`.
- **Mid-session recall (`CHX-03`)**: `getThought(N)`, `recentThoughts(n)`,
  `searchWithin(query)` over the session store (FTS/GIN index). Lets agents recall
  conclusions without reloading whole-session blobs.
- **Terse shorthand (`CHX-02`)**: `tb.t()` / `tb.end()` + chain helpers to cut the
  ~120 tokens/thought ceremony measured in the provenance session.

### Why these specs and not the neighbors

- Chosen `CHX-02` + `CHX-03` because they are **additive, parallelizable, and
  attack the two highest-frequency frictions** with no multi-agent contract
  changes.
- **Deferred `CHX-04`/`CHX-11`** (subagent attach + structured returns): highest
  single multi-agent friction reducer, but they cross-cut the Agent runtime and
  are the largest CHX items. They belong *after* the core is stable.

### Acceptance

- A client timeout no longer orphans thoughts; resume re-attaches to the latest
  session for the root.
- `extractLearnings` produces durable, structured learnings at session close,
  verified by readback.
- Recall primitives return correct thoughts by number/recency/query.

---

## P2 — Land the one coherent run→session demo

**Compose from:** `thoughtbox-v1-finalstretch/SHIP-CHECKLIST.md`,
`SPEC-USABILITY-CUTLINE.md`, and the simplified `SPEC-CLI-INIT.md`
(OTLP + MCP config only).

### Why this is #2

This is **the only thing the team has explicitly declared as the thing to ship**:
"the smallest demoable Thoughtbox path: one coherent `run` within a `session`…
with linked telemetry and linked internal session data." The canonical run-binding
row already exists (Critical-Path steps 1–2 are checked); what remains is
*verification on a fresh real run* and the **error/empty states + web run view**.

`SPEC-USABILITY-CUTLINE` is the right arbiter here: it ruthlessly cuts notebooks,
project-model upload, and blast-radius graphs out of v1 and elevates
`thoughtbox init` + OTEL↔reasoning correlation + a work-period view. Finishing P2
turns the entire confirmed-live production stack (`mcp.kastalienresearch.ai` +
Vercel web app, per `production-overview/PRODUCTION-SYSTEM-MAP.md`) into something
a user can actually be shown.

### What to build

- **Verify + harden the run binding** on a fresh real Claude Code run
  (SHIP-CHECKLIST §3–4): OTEL resolved via `otel_session_id`, internal session
  data via the same binding row, no inferred joins.
- **Error/empty states** (SHIP-CHECKLIST §5): explicit states for run-without-OTEL,
  run-without-session-data, and no-runs — removing the ambiguous blank states.
- **One run view** in `apps/web` keyed by the binding row within its session.
- **`thoughtbox init` (simplified `SPEC-CLI-INIT`)**: `npx thoughtbox init --key …`
  writes OTLP + MCP config and validates the key. This is the prerequisite for
  *anyone* to produce a run at all; the cutline keeps it minimal (no full project
  model).

### Why this over the richer specs nearby

`SPEC-PROJECT-MODEL`, `SPEC-BLAST-RADIUS`, and `SPEC-NOTEBOOK-RLM` are all
**explicitly deferred by the usability cutline**. They are valuable later, but
adding them now would prevent the demo from ever closing. The cutline's discipline
*is* the value here.

### Critical dependency to validate first

The cutline flags one assumption that must be proven before building on it:
**OTEL `session.id` ↔ MCP session ID correlation**. P2 should validate this with a
real probe before wiring the web run view, exactly as the SHIP-CHECKLIST kill
switch demands ("if any step still requires inference instead of a direct lookup,
stop and change the model").

### Acceptance

The SHIP-CHECKLIST "End-To-End Demo Proof" passes: fresh API key → real task →
one binding row → OTEL rows + internal session data resolve through it → web app
renders the run coherently.

---

## P3 — Peer notebook manifest lifecycle (ADR-022 Part 2)

**Compose from:** `mcp-peer-notebooks/SPEC-CONTROL-PLANE.md`,
`mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md`,
`mcp-peer-notebooks/PROMPT-PART-2-MANIFEST-LIFECYCLE.md` (tracker `thoughtbox-g5t`).

### Why this is #3

Peer notebooks are the **most intent-aligned net-new system** in the corpus. The
intent doc names notebooks "an underutilized primitive" and frames the **single
mandatory control plane** — agents acting on permissioned domains through a
brokered, governed surface — as Thoughtbox's *long-term north star*. Peer
notebooks are that north star in concrete form: manifest-governed runtimes that
expose typed MCP tools and call approved tools through a broker.

Crucially, **Part 1 (durable control plane) is already merged** and Part 2 is a
**decision-complete, scoped unit with explicit acceptance gates**. The biggest
risk in this area — building governance theater on a static bootstrap manifest —
is exactly what Part 2 closes: it compiles the manifest *from notebook source* and
enforces the active hash, so a notebook edit can no longer silently change
capabilities.

This is high strategic value at *medium* invasiveness precisely because the hard
foundational slice is done.

### What to build (per the Part 2 prompt)

- Compile `peer.manifest.json` from notebook sources **without executing notebook
  code**.
- Manifest lifecycle: draft → approve → activate; enforce the active manifest hash
  in the broker.
- Reject capability expansion in drafts and malformed/duplicate manifest sources.
- No web UI, no runtime-provider work (those are later ADR-022 parts).

### Why now and not the whole ADR-022 program

The remaining ADR-022 parts (web inspection, local-process/smolvm isolation) are
larger and partly blocked on the execution plane. Part 2 is the **one unit that
turns the pilot from "mock-governed" into "source-governed"** — the single most
valuable increment, and the delivery-guard skill (`peer-notebook-delivery-guard`)
exists specifically to keep it honest.

### Acceptance

A notebook source edit that adds a capability is rejected unless re-approved;
broker enforces the active compiled manifest hash; pilot (`claim-extractor`) runs
under a source-derived manifest.

---

## P4 — Make the thought graph auditable and visible

**Compose from:** `auditability/SPEC-AUD-010` (Observatory structured rendering,
ADR-010 accepted), then `auditability/SPEC-AUD-004` (action manifest / blast
radius) as fast-follow; with `monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI` as the
web-visualization extension.

### Why this is #4

The intent doc is explicit: *"The web app should show the multi-agent reasoning
structure as a graph growing in the UI."* Today the durable thought graph and
knowledge graph exist but are **largely invisible** (`INTEGRATION-MAP` calls the
knowledge graph the "largest under-claimed capability"). Auditability is also how
a human ever trusts an autonomous agent's reasoning.

`SPEC-AUD-010` is the **best leverage-to-invasiveness ratio in the auditability
suite**: three files (`observatory.html`, `storage-adapter.ts`,
`schemas/thought.ts`), no new APIs, and it **builds on already-accepted ADR-010**.
It renders structured `thoughtType` cards from native fields (not brittle text
parsing) and fixes the storage pass-through so **historical** sessions — not just
live ones — become auditable.

### What to build

- **AUD-010 first**: structured rendering from native fields; storage-adapter
  pass-through fix; `progress` type + timestamp-gap indicators.
- **AUD-004 fast-follow**: action manifest on session close + `thoughtType`
  filtering — the suite's self-described "biggest gap" (decisions → real-world
  actions + reversibility).
- **KNOWLEDGE-GRAPH-UI** (after monorepo merge): Cytoscape page at
  `/w/[slug]/knowledge` to surface the under-claimed graph.

### Why AUD-010 over AUD-001/003

`SPEC-AUD-001` and `-003` MVP on **parsing structured data out of free text**,
which is brittle. `AUD-010` uses the **native structured fields** that the accepted
ADRs already added — same user-facing payoff, far less long-term fragility. Pick
the structured path.

### Acceptance

A stored historical session renders as structured decision/action/belief cards in
the Observatory; an action manifest lists external actions at session close.

---

## P5 — Async governance substrate (sleep-time + Tier A)

**Compose from:** `agent-governance-substrate/SPEC-THOUGHTBOX-SLEEP-TIME`
(Deltas 1–2), `SPEC-EVOLUTION-CHECK-GENERALIZED`, and
`agent-governance-substrate/STARTER-TIER-A` (A1 + B5).

### Why this is #5 (and still in the top five)

This is the **"stateless ML / control-plane learning"** intent: model weights do
not change, but *the environment should learn how to shape itself for future
agents* — good surprises more likely, bad ones less likely. It is the compounding
mechanism behind the whole project.

It ranks fifth, not higher, because it pays off over time rather than fixing an
acute break — but it earns a top-five slot for two reasons:

1. **The infrastructure already shipped.** Migration `20260408033928` provides
   pgmq + pg_cron; `process-thought-queue` exists as a skeleton; the
   `evolution-check` prompt is a working primitive. Deltas 1–2 are bounded
   edge-function work (~250–400 LOC + one migration), not a greenfield platform.
2. **Tier A addresses *observed* failures cheaply and outside agent reach.**
   `STARTER-TIER-A` (branch protection, CODEOWNERS, outbound-claim verification)
   directly counters the documented "strip-during-refactor" and "false completion
   claim" failure modes — at the platform layer, where agents can't edit the guard
   away. MVP is ~2 hours of repo/platform config.

### What to build

- **Sleep-time Deltas 1–2**: async memory evolution + session-closing digest via
  the existing queue/cron, reusing `evolution-check`.
- **Evolution-check generalization**: extend the working thought-evolution
  primitive to skills/rules/specs with a cheap classifier + human/orchestrator
  apply.
- **Tier A A1 + B5**: branch protection / CODEOWNERS + an outbound-claim
  verification check.

### Why this over the bigger autonomy specs

The `unified-autonomy-loop`, `codebase-control` paragon (`src/control/`), and the
Letta `DGM-006` loop are **aspirational/research** — blocked on workflow libraries,
evaluation-harness maturity, and (for DGM) an external repo. The highest-ROI path
is the **substrate that already has infrastructure**, not the closed-loop
controller rebuild. Build the substrate; revisit the loop once P1–P4 give it
real signals to learn from.

### Acceptance

Session close enqueues an async digest that produces durable learnings without
blocking the agent; branch protection + a claim-verification check are live in CI.

---

## Explicitly deprioritized (and why)

Being clear about what *not* to do is part of the value of this proposal.

| Spec / cluster | Decision | Reason |
| --- | --- | --- |
| `gateway-api-explicit-schema`, `SPEC-GW-011`, gateway progressive disclosure in `protocol-mcp-tools` | **Obsolete** | `src/gateway/`, `tool-registry.ts`, `tool-descriptions.ts` are deleted; Code Mode (3 tools) already shipped. These describe a surface that no longer exists. |
| `code-mode/target-state` (hosted alignment) | **Largely done** | The live surface is already the three Code Mode tools; remaining work is doc cleanup (`cleanup-review-notes`), not a build. |
| `SPEC-CORE-002` full Canonical IR + TBX-C1 + V8 isolate | **Long-horizon** | Large 5-phase rewrite with sandbox-security risk; not needed to advance intent now. Revisit as API v2. |
| `codebase-control/*` paragon (`src/control/`), `gpt-5-4-pro` | **Aspirational** | Greenfield closed-loop control layer; multi-year; duplicates existing hooks/protocol/hub primitives. |
| Letta `DGM-001/002/006` suite | **External + research** | Targets a separate `letta-code-thoughtbox/` repo; P0-complexity self-modifying loop with an incomplete dependency chain. |
| `unified-autonomy-loop` phases 3–7, `quality-diversity/map-elites` | **Blocked** | Need a seeded workflow library (~50 executed workflows), Distbook sandbox, and a real eval harness first. |
| `SPEC-SRC-003` (AI cell ops), `SPEC-NOTEBOOK-RLM`, `SPEC-RLM-001` | **Deferred by cutline** | `SPEC-USABILITY-CUTLINE` explicitly defers notebook authoring/RLM for v1. |
| `SPEC-OBS-001` sidecar + `observability_gateway` | **Heavy / mis-scoped** | Full Prometheus/Grafana stack; agent feedback flags operator tooling living in the agent namespace. |
| `SPEC-CHG-001` automated changelog | **Low product impact** | Useful hygiene, but not on the intent critical path. |
| `SPEC-EVAL-001` unified evaluation | **Right idea, wrong time** | Closes the all-zeros fitness loop, but depends on LangSmith and is most useful *after* P1–P4 produce signal. Sequence its Phase 1 after the core is stable. |

---

## Recommended sequencing

```text
P1  Repair reasoning-persistence core      ┐ (do first — unblocks trust in everything below)
P2  Land the run→session demo              │  (P1 strengthens the data P2 renders)
P3  Peer notebook manifest lifecycle       │  (independent; can parallel P2 web work)
P4  Auditable + visible thought graph      │  (AUD-010 builds on accepted ADR-010)
P5  Async governance substrate             ┘  (compounding; benefits from P1–P4 signal)
```

- **P1 and P3 can run in parallel** (different subsystems: thought/persistence vs
  peer-notebook).
- **P2's web run view and P4's Observatory rendering** share `apps/web` /
  Observatory surfaces; coordinate to avoid conflicts.
- Each plan should be staged as its own ADR in `.adr/staging/` and its own
  short-lived `feat/` branch per `AGENTS.md` GitHub-Flow rules.

## Open questions for the human

1. **Is v1 the demo path (P2) or the flagship (P3)?** Both are top-tier; if compute
   is constrained, which proves more to the intended audience first?
2. **Does the run→session correlation assumption hold** on a fresh real run? P2's
   kill switch depends on it.
3. **Should P5 Tier A guardrails apply to this repo immediately**, independent of
   the rest (they are cheap and outside agent reach)?

---

## Provenance

- Intent anchor: `.specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md`
- Reality anchors: `.specs/production-overview/PRODUCTION-SYSTEM-MAP.md`,
  `src/server-factory.ts` (3-tool surface), `.adr/accepted/`, `.adr/staging/`,
  `src/peer-notebook/`, `supabase/migrations/`
- Ship anchor: `.specs/thoughtbox-v1-finalstretch/SHIP-CHECKLIST.md`,
  `.specs/thoughtbox-v1-finalstretch/SPEC-USABILITY-CUTLINE.md`
- Full per-spec survey covered all clusters under `.specs/` (auditability,
  cognitive-harness, code-mode, peer-notebooks, governance-substrate,
  unified-autonomy, srcbook, letta-dgm, observability, evaluation, monorepo-merge,
  hub-deployed, harness-optimization, final-stretch).
