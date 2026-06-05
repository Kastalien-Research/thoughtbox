# Aspirational Systems Audit

**Date:** 2026-06-02  
**Method:** Read-only cross-check of claims (docs/specs/ADRs/skills/tests) against wiring boundaries (registration, routes, CI, deploy config). Prior audits and scratch maps were treated as hypotheses, not authority.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `unwired` | Code or docs exist; no runtime/deploy/CI registration |
| `aspirational` | Described as live/product-ready without matching implementation |
| `mock-only` | Surface exists; production path uses mock/pilot only |
| `local-only` | Wired only outside `THOUGHTBOX_STORAGE=supabase` / multi-tenant |
| `stale-doc` | Documentation contradicts verified source |
| `needs-probe` | Repo evidence suggests behavior; live/dashboard check required |
| `unknown` | Insufficient repo evidence |

## Executive summary

The live product boundary is narrower than marketing/README text implies:

- **Public MCP:** three tools (`thoughtbox_search`, `thoughtbox_execute`, `thoughtbox_peer_notebook`) — verified in [`src/server-factory.ts`](../src/server-factory.ts) and [`src/code-mode/__tests__/server-surface.test.ts`](../src/code-mode/__tests__/server-surface.test.ts).
- **Code Mode `tb`:** session, thought, knowledge, notebook, theseus, ulysses, observability, branch — **not** hub or init — verified in [`src/code-mode/execute-tool.ts`](../src/code-mode/execute-tool.ts) and [`src/code-mode/__tests__/execute-tool.test.ts`](../src/code-mode/__tests__/execute-tool.test.ts).
- **Deployed MCP (Supabase mode):** no `/hub/api`, no `/protocol/enforcement`, no SSE event stream — verified in [`src/index.ts`](../src/index.ts) (`if (!isMultiTenant)` guard).
- **Web app:** real auth, sessions, API keys, billing routes exist; **README is stale**; **Vercel** is the wired deploy story in [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md), not Cloud Run per [`apps/web/README.md`](../apps/web/README.md).

Highest-risk gaps: agents/operators following root README or skills that call removed tools (`thoughtbox_gateway`, `thoughtbox_hub`, `thoughtbox_operations`); missing canonical `.specs/deployment/v1-initiative.md`; Redis/Memorystore documented but not integrated.

---

## Priority: High

### 1. Root README — two tools + Hub via Code Mode

| Field | Detail |
| --- | --- |
| **Status** | `stale-doc` |
| **Confidence** | High |
| **Claim** | [`README.md`](../README.md) L12–15: "exactly **two MCP tools**"; L23: Hub "all via `thoughtbox_execute`". |
| **Wiring** | Three tools registered L581–583 [`src/server-factory.ts`](../src/server-factory.ts). Catalog modules omit hub: [`src/code-mode/search-index.ts`](../src/code-mode/search-index.ts) L234–242. Test: `tb.hub is not available` — [`src/code-mode/__tests__/execute-tool.test.ts`](../src/code-mode/__tests__/execute-tool.test.ts). |
| **Why it matters** | Agents configure clients from README and call nonexistent `tb.hub`. |
| **Verification gap** | None for repo; optional live MCP `tools/list`. |
| **Cleanup slice** | Reconcile README, [`docs/guides/index.md`](../docs/guides/index.md), GTM copy with three-tool surface + hub deferral. |

### 2. Agentic test runner — `thoughtbox_gateway`

| Field | Detail |
| --- | --- |
| **Status** | `unwired` / `stale-doc` |
| **Confidence** | High |
| **Claim** | [`scripts/agentic-test.ts`](../scripts/agentic-test.ts) L36–48: "single gateway tool called `thoughtbox_gateway`". |
| **Wiring** | No gateway registration in `server-factory.ts`. Script still in [`package.json`](../package.json) as `test:agentic`. |
| **Why it matters** | `pnpm test:agentic` validates removed API. |
| **Cleanup slice** | Rewrite agentic tests for Code Mode or remove script from default release gates. |

### 3. Hub MCP + deployed HTTP API

| Field | Detail |
| --- | --- |
| **Status** | `unwired` (MCP); `local-only` (HTTP) |
| **Confidence** | High |
| **Claim** | README Hub workflow; skills ([`.claude/skills/hub-audit/SKILL.md`](../.claude/skills/hub-audit/SKILL.md), hub team prompts) use `thoughtbox_hub`. |
| **Wiring** | Handler exists ([`src/hub/hub-tool-handler.ts`](../src/hub/hub-tool-handler.ts)) — unit tests only. No `registerTool` for hub. HTTP: [`src/index.ts`](../src/index.ts) L536–539 mounts hub only when `!isMultiTenant`. Hub storage always filesystem: [`createFileSystemHubStorage`](../src/hub/hub-storage-fs.ts) in `index.ts` — no Supabase hub storage. |
| **Why it matters** | Multi-agent collaboration docs describe a path unavailable on production MCP. |
| **Verification gap** | `needs-probe`: whether any operator enables local FS mode in production (should not). |
| **Cleanup slice** | Either expose `tb.hub` + durable hub storage (ADR scope) or demote Hub to local-dev-only in all agent prompts. |

### 4. Missing `.specs/deployment/v1-initiative.md`

| Field | Detail |
| --- | --- |
| **Status** | `aspirational` (referenced authority) |
| **Confidence** | High |
| **Claim** | [`CLAUDE.md`](../CLAUDE.md) L113; multiple ADRs (e.g. [`ADR-GCP-01`](../.adr/accepted/ADR-GCP-01-cloud-run-service-config.md) L6). |
| **Wiring** | Glob: **0** files named `v1-initiative.md`. Closest: [`apps/web/.specs/deployment/thoughtbox_v1_alignment_plan.md`](../apps/web/.specs/deployment/thoughtbox_v1_alignment_plan.md). |
| **Why it matters** | Non-negotiable initiative pointers are broken; sub-agent prompts cite missing spec. |
| **Cleanup slice** | Restore file or retarget all references to existing alignment plan. |

### 5. Web README — deploy target + “not implemented”

| Field | Detail |
| --- | --- |
| **Status** | `stale-doc` |
| **Confidence** | High |
| **Claim** | [`apps/web/README.md`](../apps/web/README.md): Cloud Run/Docker/standalone; L109–119 auth/API keys/billing "not implemented"; routes `/projects`, `/runs`. |
| **Wiring** | [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md): Vercel. No `apps/web/Dockerfile`. [`apps/web/next.config.ts`](../apps/web/next.config.ts): no `output: 'standalone'`. Routes: `sessions/*` under [`apps/web/src/app/w/`](../apps/web/src/app/w/). Auth/billing: `(auth)/actions.ts`, `billing/`, `api/stripe/webhook/route.ts`. |
| **Why it matters** | Operators deploy/debug wrong platform; support docs deny shipped features. |
| **Verification gap** | `needs-probe`: live host headers (prior map used Vercel on `/health` — not re-run this pass). |
| **Cleanup slice** | Rewrite `apps/web/README.md` to match `CLAUDE.md` + route tree. |

### 6. Redis / Memorystore session routing

| Field | Detail |
| --- | --- |
| **Status** | `aspirational` |
| **Confidence** | High |
| **Claim** | [`CLAUDE.md`](../CLAUDE.md) L110; ADR-GCP-01 L37; [`apps/web/.specs/deployment/cloud-run-service-config.md`](../apps/web/.specs/deployment/cloud-run-service-config.md) § Session Routing. |
| **Wiring** | [`cloud-run-service.yaml`](../cloud-run-service.yaml): no `REDIS_URL`; `maxScale: "1"` + `sessionAffinity` (workaround). ADR Hypothesis 6 **DEFERRED** — no Redis integration code. No Memorystore in `infra/gcp/`. MCP sessions: in-memory `Map` in `index.ts`. |
| **Why it matters** | Architecture docs promise cross-instance session metadata; deploy uses single-instance pinning instead. |
| **Cleanup slice** | Update ADR/deployment docs to reflect deferred Redis + current maxScale=1, or implement ADR-GCP-02 + routing code. |

### 7. MCP Cloud Run deploy automation

| Field | Detail |
| --- | --- |
| **Status** | `unwired` (CI) |
| **Confidence** | High |
| **Claim** | [`docs/architecture/infrastructure.md`](../docs/architecture/infrastructure.md) (manual deploy narrative). |
| **Wiring** | [`Dockerfile`](../Dockerfile) + [`cloud-run-service.yaml`](../cloud-run-service.yaml) exist. **No** `gcloud run` in [`.github/workflows/`](../.github/workflows/). |
| **Why it matters** | Release/rollback process is undocumented in repo automation. |
| **Verification gap** | `needs-probe`: GCP console / external pipeline owner. |
| **Cleanup slice** | Document owner in ops runbook or add workflow. |

---

## Priority: Medium

### 8. `thoughtbox_operations` / removed operations-tool

| Field | Detail |
| --- | --- |
| **Status** | `unwired` |
| **Confidence** | High |
| **Claim** | [`src/resources/server-architecture-content.ts`](../src/resources/server-architecture-content.ts) L24; [`.specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md`](../.specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md). |
| **Wiring** | Glob `src/operations-tool/**`: **0** files. |
| **Cleanup slice** | Remove resource text. |

### 9. `thoughtbox://gateway/operations` resource catalog

| Field | Detail |
| --- | --- |
| **Status** | `unwired` |
| **Confidence** | High |
| **Claim** | List entries [`src/server-factory.ts`](../src/server-factory.ts) L1717, L1867. |
| **Wiring** | `registerResource(` grep: **no** gateway read handler (unlike init/hub/session resources). |
| **Cleanup slice** | Add handler or remove from list/templates. |

### 10. Legacy `thoughtbox_gateway` in skills and hub agents

| Field | Detail |
| --- | --- |
| **Status** | `stale-doc` |
| **Confidence** | High |
| **Claim** | e.g. [`.claude/agents/hub-architect.md`](../.claude/agents/hub-architect.md) L38–42 `thoughtbox_gateway`. |
| **Wiring** | No gateway tool in server. |
| **Cleanup slice** | Bulk update team prompts to Code Mode patterns. |

### 11. Peer notebooks — mock runtime, no web inspection

| Field | Detail |
| --- | --- |
| **Status** | `mock-only` + `aspirational` (product UI) |
| **Confidence** | High |
| **Claim** | MCP tool wired; specs describe production runtime + web inspection. |
| **Wiring** | Tool registered. [`PeerNotebookHandler.getRuntimeProviderNames()`](../src/peer-notebook/handler.ts) returns `["mock"]` only. **No** `peer` routes in `apps/web/src/`. |
| **Cleanup slice** | Label pilot in public docs; track Part 2 per [`.specs/mcp-peer-notebooks/`](../.specs/mcp-peer-notebooks/). |

### 12. Protocol HTTP enforcement in production

| Field | Detail |
| --- | --- |
| **Status** | `local-only` |
| **Confidence** | High |
| **Claim** | Theseus/Ulysses available via `tb` in Code Mode. |
| **Wiring** | Multi-tenant sessions set `protocolHandler: null` — [`src/index.ts`](../src/index.ts) L382. `protocolHttpSurface.mount` only when `!isMultiTenant`. Protocol **tools** still wired inside `ExecuteTool`. |
| **Why it matters** | Plugin/hook docs referencing `POST /protocol/enforcement` fail on Cloud Run. |
| **Cleanup slice** | Document MCP-only protocol path for deployed mode. |

### 13. Observatory as default product UI

| Field | Detail |
| --- | --- |
| **Status** | `local-only` / `needs-probe` (prod) |
| **Confidence** | High |
| **Claim** | README L58–66: built-in UI at `localhost:1729`. |
| **Wiring** | [`src/observatory/config.ts`](../src/observatory/config.ts): `enabled` default **false**. Started from `index.ts` when env set. Web observability is separate route. |
| **Verification gap** | `needs-probe`: `THOUGHTBOX_OBSERVATORY_ENABLED` on Cloud Run. |
| **Cleanup slice** | Scope README Observatory to local/dev; point prod users to web `/observability`. |

### 14. OODA loops MCP system

| Field | Detail |
| --- | --- |
| **Status** | `aspirational` |
| **Confidence** | High |
| **Claim** | [`.specs/IMPLEMENTATION-READY.md`](../.specs/IMPLEMENTATION-READY.md): "APPROVED FOR IMPLEMENTATION"; [`.specs/README.md`](../.specs/README.md) § OODA loops. |
| **Wiring** | No `loops-mcp` implementation under `src/`; only OODA mentions in prompt content. |
| **Cleanup slice** | Move spec to parked/rejected or implement; stop "implementation-ready" labeling without code. |

### 15. Unified autonomy — "governance-plane implemented"

| Field | Detail |
| --- | --- |
| **Status** | `aspirational` (partial) |
| **Confidence** | Medium |
| **Claim** | Historical governance-plane implementation claim remained after the supporting artifacts were removed. |
| **Wiring** | SIL scheduler **paused** — [`infra/gcp/automation.tf`](../infra/gcp/automation.tf) L9. `improvement-loop` script exists; not wired to MCP server loop. |
| **Cleanup slice** | Remove stale governance-plane implementation claims. |

### 16. Release quality gates not in CI

| Field | Detail |
| --- | --- |
| **Status** | `unwired` |
| **Confidence** | High |
| **Scripts** | `test:behavioral`, `test:agentic` — [`package.json`](../package.json). |
| **CI** | Root [`ci.yml`](../.github/workflows/ci.yml) runs lint, types, test, cycles; **ignores** `apps/web/**`. [`web-ci.yml`](../.github/workflows/web-ci.yml) runs vitest for web only. |
| **Cleanup slice** | Add gates to CI or document as manual pre-release. |

### 17. Assumption registry verification

| Field | Detail |
| --- | --- |
| **Status** | `unwired` |
| **Confidence** | High |
| **Claim** | Assumption skill describes verification workflow. |
| **Wiring** | Removed during repo cleanup after remaining hard-disabled with `if: false`. |
| **Cleanup slice** | Update the assumption skill or create a new executable verification workflow in a dedicated unit if this capability is still desired. |

### 18. Supabase thought-queue edge function scheduling

| Field | Detail |
| --- | --- |
| **Status** | `needs-probe` |
| **Confidence** | Medium |
| **Claim** | Function enabled in config. |
| **Wiring** | [`supabase/config.toml`](../supabase/config.toml) L273–278: `process-thought-queue` enabled; comment says prototype / cron not user-facing. **No** cron definition verified in repo for hosted schedule. |
| **Verification gap** | Supabase dashboard: pg_cron / function invocations. |

### 19. `mental_models` tool

| Field | Detail |
| --- | --- |
| **Status** | `aspirational` |
| **Confidence** | High |
| **Claim** | [`src/resources/behavioral-tests-content.ts`](../src/resources/behavioral-tests-content.ts), test-mental-models prompt in server-factory. |
| **Wiring** | No `src/mental*` module; no tool registration. |
| **Cleanup slice** | Remove from behavioral tests resource or re-implement. |

### 20. Branch operations without Supabase in local mode

| Field | Detail |
| --- | --- |
| **Status** | `needs-probe` |
| **Confidence** | Medium |
| **Claim** | `branch` in Code Mode catalog. |
| **Wiring** | `BranchHandler` constructed with `SUPABASE_URL` in server-factory; default local storage is `fs`. |
| **Verification gap** | Execute `tb.branch.*` on fs-only dev server. |

---

## Priority: Low

### 21. Init flow — resources only

| Field | Detail |
| --- | --- |
| **Status** | `unwired` (execute) — likely intentional |
| **Confidence** | High |
| **Wiring** | Init resources registered; `tb.init` undefined per execute-tool test. Absent from search catalog operations. |

### 22. Hub MCP resources (discover-only)

| Field | Detail |
| --- | --- |
| **Status** | `unwired` (callable) |
| **Confidence** | High |
| **Wiring** | `thoughtbox://hub/operations` resources exist; no hub tool. |

### 23. Prototypes and plugins (separate products)

| Field | Detail |
| --- | --- |
| **Status** | `unwired` (main server) |
| **Confidence** | High |
| **Paths** | [`prototypes/thought-processing-worker/`](../prototypes/thought-processing-worker/); [`plugins/thoughtbox-claude-code/`](../plugins/thoughtbox-claude-code/) — not imported by `src/index.ts`. |

### 24. Scratch maps and production map

| Field | Detail |
| --- | --- |
| **Status** | Hypothesis registry (mostly confirmed) |
| **Confidence** | Medium |
| **Note** | [`temps/scratch/codebase-maps/`](../temps/scratch/codebase-maps/) and [`.specs/production-overview/PRODUCTION-SYSTEM-MAP.md`](../.specs/production-overview/PRODUCTION-SYSTEM-MAP.md) align with this audit; live probes in production map were **not** re-executed here. |

### 25. Web `REDIS_URL` for ISR

| Field | Detail |
| --- | --- |
| **Status** | `unwired` in app code |
| **Confidence** | High |
| **Claim** | `apps/web/CLAUDE.md` optional Redis for ISR. |
| **Wiring** | No `ioredis` / cache handler in `apps/web` source (only skill examples). Vercel spec says Redis not needed. |

---

## Wiring inventory (ground truth)

### MCP public tools (production boundary)

| Tool | Registration | Test |
| --- | --- | --- |
| `thoughtbox_search` | `server-factory.ts` | `server-surface.test.ts` |
| `thoughtbox_execute` | `server-factory.ts` | `server-surface.test.ts`, `execute-tool.test.ts` |
| `thoughtbox_peer_notebook` | `server-factory.ts` | `server-surface.test.ts` |

### Code Mode `tb` modules

`session`, `thought`, `knowledge`, `notebook`, `theseus`, `ulysses`, `observability`, `branch` — [`search-index.ts`](../src/code-mode/search-index.ts), [`execute-tool.ts`](../src/code-mode/execute-tool.ts).

**Not exposed:** `hub`, `init` (execute); **intentionally omitted** from catalog per search-tool comments.

### HTTP mounts by storage mode

| Surface | `THOUGHTBOX_STORAGE != supabase` | `supabase` (deployed) |
| --- | --- | --- |
| SSE `/events` | Yes | No |
| `/hub/api` | Yes | No |
| `/protocol/enforcement` | Yes | No |
| OTLP routes | No | Yes |

### Web routes (verified under `apps/web/src/app/w/`)

`sessions`, `dashboard`, `api-keys`, `billing`, `usage`, `observability`, `connect`, `settings/*`, `docs/quickstart` — **not** `projects` or `runs` as top-level workspace routes.

### CI / deploy

| Artifact | In repo | In GitHub Actions |
| --- | --- | --- |
| MCP Docker + Cloud Run YAML | Yes | No deploy step |
| Web build/test | Yes | `web-ci.yml` (path-filtered) |
| Root MCP tests | Yes | `ci.yml` (excludes `apps/web/**`) |
| Staging Supabase migrations | Yes | `staging-deploy.yml` |
| MCP registry publish | Yes | `publish-mcp.yml` (tags) |
| Behavioral/agentic/control-plane checks | Scripts only | No |

---

## Suggested cleanup order

1. **Public MCP truth** — README, guides, resources, agentic script, hub skills (one PR).
2. **Canonical initiative path** — restore or retarget `v1-initiative.md` references.
3. **Web README** — align with Vercel + implemented routes/features.
4. **Ghost MCP assets** — gateway operations list, operations-tool codegen drift.
5. **Deploy/redis docs** — ADR vs `cloud-run-service.yaml` vs deferred hypotheses.
6. **Peer notebook / Hub product boundaries** — mock/local-only labeling.
7. **CI gates** — wire or explicitly defer behavioral/agentic/control-plane checks.

---

## Explicit unknowns (not settled from repo)

- Which process deploys MCP to Cloud Run and Vercel project ownership.
- Whether Observatory or OTLP endpoints are enabled in production env.
- Whether `process-thought-queue` runs on a schedule in hosted Supabase.
- Whether generated DB types match linked production schema today.
- Live behavior of Stripe webhooks and full auth flows (source exists; E2E not run this pass).

---

## Acceptance mapping (plan)

| Plan step | Evidence |
| --- | --- |
| Claim inventory | Sections above + grep/file reads cited |
| Wiring inventory | "Wiring inventory (ground truth)" + registration/route tables |
| Cross-check | Status per finding with two-source rule where possible |
| Prioritized report | Priority High/Medium/Low + cleanup order |
