---
spec_id: SPEC-V1-INITIATIVE
title: Thoughtbox v1 Deployed System — Full Implementation Plan
status: draft
date: "2026-06-10"
claims:
  - id: c1
    statement: The tb-branch Edge Function on production accepts signed-token requests (edge gateway JWT verification disabled), and tb.branch.spawn produces a worker that responds.
    type: behavioral
    behavioral: true
    required_evidence: Live tb.branch.spawn against production followed by a successful authenticated request to the returned workerUrl; 401 for a request without a token.
  - id: c2
    statement: The production Supabase migration ledger and supabase/migrations/ agree — no false drift from re-stamped versions, no remote-only migrations from unmerged branches, no local migrations missing from prod — and the prod branch is not in MIGRATIONS_FAILED.
    type: governance
    behavioral: true
    required_evidence: supabase migration list against production showing clean correspondence; Supabase dashboard branch status healthy.
  - id: c3
    statement: The thoughtbox-mcp Cloud Run service (env vars, secrets, scaling, probes, ingress, domain mapping) is fully managed by Terraform in infra/gcp, and cloud-run-service.yaml is removed from the repo.
    type: implementation
    behavioral: false
    required_evidence: terraform plan shows no diff against live service; cloud-run-service.yaml deleted; PR documents the import.
  - id: c4
    statement: Cloud Run maxScale is pinned to 1; transport sessions are in-process by design (owner decision 2026-07-06, superseding the Memorystore/externalization direction).
    type: governance
    behavioral: false
    required_evidence: Terraform sets max_instance_count = 1.
  - id: c5
    statement: A staging-to-prod Supabase migration pipeline exists — PRs apply migrations to staging; merging to main (the gate is PR review) applies them to production via the Supabase branching integration; CI monitors prod branch health and ledger-vs-files drift and fails loudly; no migrations reach prod outside this path.
    type: governance
    behavioral: true
    required_evidence: A migration merged via PR appears in the prod ledger via a green branching-integration run, and the prod-migration-health workflow passes (and demonstrably fails on injected drift or an unhealthy branch).
  - id: c6
    statement: Observability operations return isError on missing configuration instead of soft success, and the health operation reports per-component status from real probes.
    type: behavioral
    behavioral: true
    required_evidence: tb.observability session_timeline without Supabase returns an MCP error; health output changes when a probed dependency is down.
  - id: c7
    statement: No live surface (search catalog, init renderer, behavioral tests, prompts) references the mental_models tool or any other unregistered tool name.
    type: implementation
    behavioral: false
    required_evidence: rg for mental_models, thoughtbox_knowledge, thoughtbox_hub tool-call syntax across src/ returns no live-surface hits.
  - id: c8
    statement: If knowledge storage initialization fails, tb.knowledge.* calls return a clean unavailable error including the init failure reason, rather than crashing.
    type: behavioral
    behavioral: true
    required_evidence: Test that forces knowledge init failure and asserts the error response on a subsequent tb.knowledge call.
  - id: c9
    statement: Notebook Evidence Engine verdicts are derived from real notebook execution; no code path returns a canned pass/score, and no run is queued to a dispatcher that does not exist.
    type: behavioral
    behavioral: true
    required_evidence: A runbook designed to fail yields pass:false with evidence from actual cell outputs; the void async queue branch is removed.
  - id: c10
    statement: All hub operations are invokable as tb.hub.* through thoughtbox_execute, discoverable in the search catalog, in both local and hosted modes.
    type: behavioral
    behavioral: true
    required_evidence: Agentic test joining a workspace, posting to a channel, and merging a proposal via tb.hub against the deployed server.
  - id: c11
    statement: Hub state is durable in Supabase in hosted mode, and concurrent writers on different instances do not lose appends (messages, reviews, endorsements).
    type: behavioral
    behavioral: true
    required_evidence: Concurrent-writer test (two clients, same channel/proposal) showing no lost writes; state survives a Cloud Run revision replacement.
  - id: c12
    statement: Hub channel and workspace events are deliverable via Supabase Realtime subscriptions scoped by RLS.
    type: behavioral
    behavioral: true
    required_evidence: A subscribed client receives a message posted by another client without polling; a client from another workspace receives nothing.
  - id: c13
    statement: Peer manifests follow a draft-to-active lifecycle; invoking a draft manifest is rejected by the broker.
    type: behavioral
    behavioral: true
    required_evidence: Test creating a draft manifest, asserting invoke rejection, approving, then asserting successful invoke.
  - id: c14
    statement: A real (local-process) runtime provider executes peer invocations behind the RuntimeProvider contract; the mock provider is test-only.
    type: behavioral
    behavioral: true
    required_evidence: Contract test suite passing against both providers; production wiring registers the real provider; mock absent from production provider list.
  - id: c15
    statement: The web app renders a peer-notebook inspection surface (registry, invocation detail, trace timeline incl. denied calls, artifact preview) from live peer_* tables.
    type: behavioral
    behavioral: true
    required_evidence: Deployed page screenshot/walkthrough backed by rows created through a real peer invocation.
links:
  - .specs/production-overview/PRODUCTION-SYSTEM-MAP.md
  - .specs/hub-deployed/SCOPE-LAYER-2-SUPABASE-HUB-STORAGE.md
  - .specs/mcp-peer-notebooks/README.md
  - .specs/mcp-peer-notebooks/SPEC-CONTROL-PLANE.md
  - apps/web/.specs/deployment/cloud-run-service-config.md
---

# Thoughtbox v1 Deployed System — Full Implementation Plan

This is the initiative spec referenced by CLAUDE.md ("Decided Architecture (v1 deployment)"). It encodes the architecture decisions, the verified current state (discovery pass of 2026-06-10), and the phased implementation plan for the full deployed system: Supabase (control plane / persistence), Cloud Run (execution plane), and Vercel (web app).

## 1. Decided architecture (non-negotiable unless superseded here)

- **Execution plane**: Google Cloud Run (`thoughtbox-mcp`, project `thoughtbox-480620`, us-central1, domain `mcp.kastalienresearch.ai`).
- **Control plane / persistence**: Supabase — Postgres, Auth, Storage. Production project `akjccuoncxlvrrtkvtno`; staging project `pyyabzaitqvdbaneanip`.
- **Web app**: Next.js 15 on **Vercel** (team Thoughtbox, project Thoughtbox). Stripe/billing lives in `apps/web/` permanently.
- **Dual backend**: FileSystemStorage (local/self-hosted) + SupabaseStorage (deployed). Both implement the same interfaces. This now extends to the Hub (FileSystemHubStorage + SupabaseHubStorage).
- **No Cloud Storage FUSE** — containers stateless.
- **Decisions made 2026-06-10**:
  - The Cloud Run service surface is managed by **Terraform** in `infra/gcp/` (not `cloud-run-service.yaml`, not console). Image deploys remain trigger-driven from GitHub merges.
  - Hub event delivery uses **Supabase Realtime** (Pro plan; cost tolerance high).
  - Hosted hub access is **`tb.hub.*` via `thoughtbox_execute` only**; `/hub/api` remains a local-mode surface.
  - **Single-operator v1**; schema and identity design must be multi-tenant-ready (tenant scoping + nullable user identity columns from day one) because multi-tenant SaaS follows soon.
  - **maxScale pinned to 1**; transport sessions stay in-process. (Decision revised 2026-07-06: the Cloud Memorystore/Redis externalization direction is dropped — single-instance Cloud Run is the v1 session-routing answer.)
  - Production data is real and must be preserved. Staging is the destructive-testing surface. All schema changes flow branch → PR → staging → gated prod promotion. No direct `db push` to prod from local checkouts.

## 2. Verified current state (discovery 2026-06-10)

Ground truth established by direct inspection of live systems; corrects several manifest-derived beliefs.

**Cloud Run (live)**: revision current with `origin/main` tip; deployed by a Cloud Build trigger on push to main running `gcloud run services update --image` (image only — config is console-state). Live config diverges from `cloud-run-service.yaml`: maxScale **3** (yaml says 1), `BASE_URL` **set** to `https://mcp.kastalienresearch.ai`, `ANTHROPIC_API_KEY` **absent**, `LANGSMITH_API_KEY` **present** (secret), health probes lost (default TCP startup probe only, no liveness). `infra/gcp` Terraform does not manage this service (only the agent-runner Job). Public ingress; auth at app layer.

**Supabase (live)**: prod has 28 tables, real data (16 workspaces, 258 sessions, 7,554 thoughts, 95k+ otel_events, 542 runs). Peer-notebook control plane **applied and live** (small row counts). `hub_events`/`hub_tasks`/`hub_workers` exist with **0 rows** (droppable). Hub coordination tables do not exist. Knowledge `embedding` column **was never migrated** (vector extension installed, no column). Migration ledger is inconsistent: two RLS migrations applied under re-stamped versions; one remote-only migration from an unmerged branch; one local migration missing from prod; prod Supabase branch reports MIGRATIONS_FAILED. Edge Functions: `process-thought-queue` (v46) and `tb-branch` (v1, **verify_jwt still true** — commit e6c0a77's fix never redeployed; branch workers likely broken in prod). Staging: identical schema, empty, **zero** Edge Functions deployed. The repo checkout links to staging.

**Auth/tenancy (as implemented)**: `/mcp` accepts OAuth JWT (HS256, `workspace_id` claim) or `tbx_` API keys (bcrypt lookup in `api_keys`). The only identity fact reaching handlers is **`workspaceId`**. Per-workspace storage instances are constructed per session. OAuth consent = proof of possession of the workspace API key. Multi-tenant sessions set `protocolHandler: null`.

**Transport sessions**: in-process `Map` (`src/index.ts:180`). Not Supabase, not Redis. Session affinity (best-effort) is the only thing making maxScale 3 work.

**Web app (live on Vercel)**: real. `@supabase/ssr` + anon key + RLS; service role only in Stripe webhook and post-checkout claim flow. Full Stripe loop (checkout → webhook → `workspaces` subscription state) works; single Founding Beta plan. Reads sessions/thoughts/otel_events/runs; no `peer_*`/`hub_*` references; never calls the MCP server. An unused Realtime hook exists (`src/lib/session/use-session-realtime.ts`).

**Code honesty findings** (from the source audit; full inventory in session record): canned Evidence Engine verdicts; `mental_models` ghost tool; unreadable `gateway/operations` resource; OTEL soft errors; hub thought-store stub; latent knowledge-tool crash; peer-notebook mock runtime as sole provider; hub complete but unexposed (no `tb.hub`, `/hub/api` local-only).

## 3. Phases

Each numbered item is one unit of work: one branch, one PR, conventional commits, spec claims referenced in the PR. Phases 0–2 are infrastructure ground truth; 3 is honesty; 4–5 are the feature tracks; 6 is scale-out. Phases 3, 4, and 5 can proceed in parallel once 0–2 land.

### Phase 0 — Live defects (do first; independent of everything)

- **0.1 Redeploy `tb-branch` to prod with JWT verification disabled** (per e6c0a77), and deploy both Edge Functions to staging (currently zero). Verify with a live `tb.branch.spawn` → worker round-trip. → **c1**
- **0.2 Repair the prod migration ledger.** Investigate MIGRATIONS_FAILED on the prod Supabase branch. Use `supabase migration repair` to reconcile the re-stamped RLS versions (`20260608045925`/`20260608050836` ↔ repo `20260607000001`/`20260608000001`); merge the ulysses validator migration file into main (it is applied on prod but its file lives only on `fix/ulysses-fixes`); apply `20260602214044` to prod via the new pipeline once Phase 2 exists (or as a documented one-off if 0.2 precedes it). → **c2**
- **0.3 Pin maxScale to 1.** Immediate console/gcloud change, then codified in Terraform (1.1). Single-operator load does not need 3 instances, and in-memory transport sessions make >1 unsafe. → **c4**
- **0.4 Verify LangSmith pipeline status in prod.** `LANGSMITH_API_KEY` is live (contrary to the manifest-derived audit). Check logs for listener attachment and evaluator activity; decide keep-and-own or remove key + delete the dormant `src/evaluation` stack. Output: a decision recorded in this spec's links.

### Phase 1 — Terraform the deployed surface

- **1.1 Import `thoughtbox-mcp` into `infra/gcp`** as `google_cloud_run_v2_service`: encode live env vars and Secret Manager refs (including `BASE_URL`, dropping the dead `ANTHROPIC_API_KEY`), scaling (min 1 / max 1 per c4), restore HTTP `/health` startup + liveness probes, `NODE_ENV=production`, session affinity, domain mapping, IAM (`allUsers` invoker). Codify the Cloud Build trigger as `google_cloudbuild_trigger` so image-on-merge deploys are also in code. **Delete `cloud-run-service.yaml`** (replace, don't deprecate). `terraform plan` must be clean against live before merge. → **c3, c4**

### Phase 2 — Supabase staging → prod pipeline

> Amended 2026-06-10 after Phase 0.2: discovery showed the Supabase branching
> GitHub integration already applies migrations and deploys Edge Functions to
> prod on every push to main (confirmed by a green run once the ledger was
> repaired). A second applier (`prod-deploy.yml`) would double-apply, so the
> pipeline is documented rather than rebuilt, and the missing piece — loud
> failure detection — is added instead.

- **2.1 The pipeline (existing, now documented).** PR touching `supabase/migrations/**` → `staging-deploy.yml` applies to staging (`db push --include-all`) → PR review/merge is the gate → on push to main, the Supabase branching integration applies pending migrations to prod and deploys Edge Functions from the repo. Local checkouts stay linked to staging by design; nothing applies to prod from a laptop. → **c5**
- **2.2 Prod migration health workflow.** `.github/workflows/prod-migration-health.yml` (daily schedule + post-merge + manual): fails loudly when the prod default branch is not healthy (the silent-MIGRATIONS_FAILED failure mode of Phase 0.2) or when prod's applied versions drift from the migration files on main (the re-stamping failure mode). Uses the Management API with the existing `SUPABASE_ACCESS_TOKEN` secret. → **c5**

### Phase 3 — Honesty fixes (small independent PRs)

- **3.1** OTEL soft errors → `isError: true`; real health probes (`src/observability/gateway-handler.ts`, `operations/health.ts`). → **c6**
- **3.2** Knowledge init failure → clean unavailable error, not `knowledgeHandler!` crash (`src/server-factory.ts:413`). → **c8**
- **3.3** Register a read handler for `thoughtbox://gateway/operations` (content exists; it is a missing wire).
- **3.4** Purge `mental_models` and all stale tool names from search catalog, init renderer, behavioral tests, prompts. → **c7**
- **3.5** `runRegressionCheck` returns explicit skipped + non-passing (`RegressionCheckResult` with `passed: false, skipped: true`) when LangSmith is unconfigured or the experiment yields no result. The LangSmith stack stays per the 0.4 decision (2026-06-10; live in production). Done.
- **3.6 Evidence Engine** (`src/notebook/engine/runtime.ts`): sync runs execute referenced notebook cells through the real notebook runtime and derive verdicts from actual outputs, or return an explicit unsupported error. Delete the async branch that queues to a nonexistent dispatcher. Rewrite tests to assert real verdict derivation (a failing runbook must yield `pass: false`). → **c9**

### Phase 4 — Hub: expose, persist, deliver

- **4.1 `tb.hub` Code Mode namespace.** Add `hubHandler` to `ExecuteToolDeps`; map all 27 operations in `buildTbObject()`; extend `TB_SDK_TYPES` and the search catalog; remove the "intentionally absent" carve-out (`search-tool.ts:50`). Hub identity binds to the session's authenticated `workspaceId`; agent names remain self-asserted within a workspace (single trust domain in v1). → **c10**
- **4.2 Real shared thought store.** Replace the stub (`src/index.ts:451–475`) with a facade over the real thought/session handlers so `merge_proposal` persists and branch reads work. Verify the delegated handlers exist in multi-tenant session context.
- **4.3 Hub coordination migration + `SupabaseHubStorage`.** Implement SCOPE-LAYER-2 with two amendments: (a) **concurrency safety** — normalize append-heavy children (channel messages per spec, plus reviews and consensus endorsements as rows, not JSONB arrays) and add a `version` column with optimistic concurrency on remaining aggregates; (b) **multi-tenant readiness** — `tenant_workspace_id` FK on all tables, nullable `user_id` on `hub_agents`. Enable RLS for real (workspace-membership policies) so Realtime and the web app can subscribe with the anon key. **Drop `hub_events`/`hub_tasks`/`hub_workers` in the same migration** (verified 0 rows). Select SupabaseHubStorage when `THOUGHTBOX_STORAGE=supabase`; FileSystemHubStorage stays for local (documented single-writer). Regenerate `database.types.ts` (also picking up the missing `oauth_*`, `branches`, `peer_*` types). → **c11**
- **4.4 Realtime delivery.** Enable Realtime on hub message/event tables; document the subscription pattern for agents and the web app. `/hub/api` and `/events` SSE stay local-only. → **c12**
- **4.5 Skills/prompts migration.** Rewrite `.claude/skills/hub-collab`, `deploy-team-hub`, team-prompts, `hub-manager` agent, and CLAUDE.md quick-join to `tb.hub.*` syntax. Run the hub test-suite section against the deployed server.
- **4.6 (optional v1) Web hub view.** Workspace/problem/channel read-only views following the sessions-page patterns; Realtime via the existing unused hook.

### Phase 5 — Peer notebooks: instantiate for real

Sequenced per `.specs/mcp-peer-notebooks/` units and gated by `peer-notebook-delivery-guard`.

- **5.1 Manifest lifecycle** (unit `thoughtbox-g5t`, claim SPEC-CONTROL-PLANE:c2): bootstrap and new manifests created as `draft`; approval/activation/retirement operations; broker's existing non-active block becomes reachable. → **c13**
- **5.2 Broker proxy targets**: populate `createPeerBroker()` targets — `thoughtbox.knowledge.queryGraph` → knowledge handler, `thoughtbox.session.get` → session handler. Allowlist/trace machinery unchanged.
- **5.3 Local-process runtime provider** (unit `thoughtbox-s7f`): child-process execution behind the RuntimeProvider contract; existing tool tests become contract tests run against both providers; mock becomes test-only. → **c14**
- **5.4 Notebook graduation**: parse `peer.manifest.json` from notebook metadata without executing code; new peers enter via 5.1's draft flow, retiring the hardcoded claim-extractor as the only peer.
- **5.5 Web inspection surface** (unit `thoughtbox-2ot`): peer registry, invocation detail, trace timeline (including denied calls), artifact preview — server components over `peer_*` tables, `SessionTraceExplorer` as the timeline pattern. → **c15**
- **Deferred**: smolvm/isolated provider (`thoughtbox-vdw`) — explicitly out of v1.

### Phase 6 — Scale-out (post-v1, pre-multi-tenant)

- **6.1 (STRUCK 2026-07-06.)** Transport-session externalization (Cloud Memorystore vs Supabase routing table, former claim c16) is dropped: session routing is single-instance Cloud Run (maxScale=1) with in-process transport sessions.
- **6.2 Multi-tenant identity enrichment.** Extend OAuth token claims with user identity; populate `hub_agents.user_id`; per-user consent in the OAuth authorize flow. Prerequisite for SaaS, not for v1.

### Cross-cutting: docs and stale-claims cleanup (rolling)

Fold into whichever PR touches the area: `apps/web/README.md` (claims Cloud Run; reality Vercel), root README (`tb.hub` advertised before 4.1 lands — correct now, true later), AGENTS.md references to removed `src/cli/`/`cli-routes.ts`, PRODUCTION-SYSTEM-MAP refresh after Phases 1–2, and correction of the two false audit claims now disproven (embedding column "migrated", LangSmith "dormant in prod").

## 4. Dependencies

```
0.1, 0.3, 0.4 ──────────────► independent, immediate
0.2 ◄─── partially depends on 2.1 (pipeline) for the missing-migration apply
1.1 ◄─── 0.3 (encodes the pin)
2.1 ──► gates all schema work: 4.3, 5.x migrations
3.x ──► independent of everything (except 3.5 ◄─ 0.4 decision)
4.1, 4.2 ──► independent of 4.3 (work over FS storage locally)
4.3 ◄─ 2.1 ──► 4.4 ◄──► 4.6
4.5 ◄─ 4.1
5.1 ──► 5.2 ──► 5.3 ──► 5.4 ──► 5.5 (5.5 also ◄─ 2.1 for any schema tweaks)
6.x ◄─ everything v1 stable
```

## 5. Acceptance

v1 is done when claims c1–c15 hold with their required evidence. The standing definition of honest behavior: **every operation either does the real thing or returns an explicit error — no canned outputs, no advertised-but-absent capabilities, no gates that pass when disabled.**
