# Thoughtbox Production System Map

Status date: 2026-06-02

This map separates production reality from documentation claims. It is an
operations artifact, not a design proposal.

## Status Vocabulary

| Status | Meaning |
| --- | --- |
| `confirmed-current` | Directly proven by current source, config, workflow, or read-only live probe. |
| `claimed-only` | Claimed in docs/specs, but not proven by current source/config/live probe. |
| `contradictory` | Current evidence sources disagree. |
| `unknown` | Needs credentials, dashboard access, or another follow-up source. |

## Executive Summary

Thoughtbox currently has at least two production runtime surfaces:

- MCP server: confirmed live at `https://mcp.kastalienresearch.ai`, backed by
  Google Frontend/Cloud Run semantics, running the Express streamable HTTP MCP
  server with Supabase storage mode.
- Web app: confirmed live at `https://thoughtbox.kastalienresearch.ai/health`,
  served by Vercel, running the Next.js app under `apps/web/src/app`.

The highest operational risk is not an obvious outage. It is ownership and
documentation drift: the MCP server has Docker and Cloud Run artifacts, the web
app has Vercel live evidence and Vercel dependencies, but `apps/web/README.md`
claims Cloud Run/Docker deployment for the web app. Cloud Run deployment
ownership for the MCP service is also not proven by a checked-in GitHub workflow.

## Production Matrix

| Component | Runtime | Entrypoint | Deploy artifact | Deployment owner | Env/secrets | Data stores | Public/read-only probes | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MCP server | Node 22, Express, MCP streamable HTTP | `src/index.ts`, `node dist/index.js` | Root `Dockerfile`, `cloud-run-service.yaml` | Runtime artifact exists; deploy workflow not found in checked-in workflows | `PORT`, `BASE_URL`, `THOUGHTBOX_STORAGE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DISABLE_THOUGHT_LOGGING`, `ANTHROPIC_API_KEY` | Supabase in deployed mode; filesystem default for local mode | `/health`, `/info`, unauthenticated `/mcp` | `src/index.ts`, `Dockerfile`, `cloud-run-service.yaml`, live probes | `confirmed-current` with deployment-owner gap |
| Public MCP custom domain | Google Frontend to MCP server | `https://mcp.kastalienresearch.ai` | DNS/domain config not in repo | Unknown | API key or OAuth for `/mcp` | Same as MCP server | `/health`, `/info`, `/mcp` auth error | live probe, `.mcp.json` redacted entry | `confirmed-current` |
| Direct Cloud Run MCP URL | Google Cloud Run | `https://thoughtbox-mcp-272720136470.us-central1.run.app` | `cloud-run-service.yaml` references service shape, not exact live URL | Unknown | Same as MCP server | Same as MCP server | `/health`, `/info`, `/mcp` auth error | live probe, web quickstart docs | `confirmed-current` |
| Web app | Next.js 15, React 19 | `apps/web/src/app` | Vercel live deployment; no `apps/web/Dockerfile` or `apps/web/vercel.json` found | Vercel inferred from live headers and launch docs; repo workflow only proves CI | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe env vars, site URL vars | Supabase tables including `workspaces`, `sessions`, `thoughts`, `runs`, `otel_events`, `api_keys`; Stripe | `/health` | `apps/web/src/app/health/route.ts`, live probe | `confirmed-current` with deploy-config gap |
| Web public/auth/workspace routes | Next.js App Router | `apps/web/src/app` route tree | Same as web app | Same as web app | Supabase SSR env vars and cookies | Supabase auth, workspace data, sessions, telemetry, billing | Source route inventory; protected routes via middleware | `apps/web/src/app`, `apps/web/middleware.ts` | `confirmed-current` |
| Web Stripe webhook | Next.js route handler | `apps/web/src/app/api/stripe/webhook/route.ts` | Same as web app | Same as web app | `STRIPE_WEBHOOK_SECRET`, Stripe server config, Supabase service role | Stripe, Supabase `workspaces` | Source only; no live webhook probe performed | source route inventory and env grep | `confirmed-current` source, live behavior `unknown` |
| Observatory server | Optional Node HTTP/WebSocket server | `src/observatory/*`, started by `src/index.ts` only when `THOUGHTBOX_OBSERVATORY_ENABLED=true` | Built into MCP server package | Same as MCP server if enabled | `THOUGHTBOX_OBSERVATORY_ENABLED`, `THOUGHTBOX_OBSERVATORY_PORT`, `THOUGHTBOX_OBSERVATORY_PATH`, CORS/max connection vars | Hub storage and optional persistent storage | `/api/health` when enabled | `src/observatory/config.ts`, `src/observatory/server.ts` | `confirmed-current` optional/local; production exposure `unknown` |
| In-process local Hub/SSE/protocol HTTP surfaces | Express routes mounted only outside Supabase multi-tenant mode | `/events`, `/hub/api`, `/protocol/enforcement` | MCP server package | Local mode only | Local filesystem mode | Filesystem hub storage | Source only | `src/index.ts`, `src/http/*` | `confirmed-current` local-only |
| OTLP ingestion | Express routes mounted only in Supabase multi-tenant mode | `src/otel/routes.ts`, mounted by `src/index.ts` | MCP server package | Same as MCP server | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase `otel_events` and related telemetry tables | Not live-probed; endpoint contract needs exact route inventory | `src/index.ts`, `src/otel/*`, web observability docs | `confirmed-current` source, live behavior `unknown` |
| Supabase production project | Linked Supabase project | `supabase/.temp/project-ref` | Hosted Supabase | Hosted/operator managed | Supabase access token/password for CI; service role for runtime | Root migrations, functions, generated types | Linked ref check only | `supabase/.temp/project-ref` shows `akjccuoncxlvrrtkvtno` | `confirmed-current` local link |
| Supabase staging project | Hosted Supabase staging | GitHub Actions staging deploy | `.github/workflows/staging-deploy.yml`, DB parity workflow | GitHub Actions for staging migration push | `SUPABASE_ACCESS_TOKEN`, `STAGING_PROJECT_ID`, `STAGING_DB_PASSWORD` | Staging Supabase project | Workflow source only | staging workflow and redacted `.mcp.json` entry show `pyyabzaitqvdbaneanip` | `confirmed-current` workflow/config |
| GCP agent runner job | Cloud Run v2 Job | Terraform `google_cloud_run_v2_job.agent_runner` | `infra/gcp/execution.tf`, Artifact Registry Terraform | Terraform plus external CI/CD image updater claimed in comments | GitHub app secrets, Anthropic, Supabase URL/anon/JWT | GCP Secret Manager, Artifact Registry | No live probe | Terraform | `confirmed-current` IaC, runtime live status `unknown` |
| MCP Registry package publish | GitHub Actions tag workflow | `publish-mcp.yml` | MCP registry publisher | GitHub Actions on `v*` tags | GitHub OIDC, registry publisher | MCP registry, GitHub release | Workflow source only | `.github/workflows/publish-mcp.yml` | `confirmed-current` |

## Topology

```text
Users / MCP clients
  -> https://mcp.kastalienresearch.ai
  -> Google Frontend / Cloud Run
  -> Node Express MCP server
  -> /health, /info, /mcp
  -> Supabase storage, auth, OTLP tables

Users / browser
  -> https://thoughtbox.kastalienresearch.ai
  -> Vercel
  -> Next.js app under apps/web/src/app
  -> Supabase auth, workspace/session/thought/run/otel/api-key data
  -> Stripe checkout and webhook flows

Operators / CI
  -> GitHub Actions
  -> root CI, web CI, staging Supabase migrations, DB parity checks,
     MCP registry publish
  -> Terraform for GCP agent-runner infrastructure
```

## Route and Runtime Inventory

### MCP Server

Confirmed public HTTP routes:

- `GET /health`: returns `{ status, transport, server, version }`.
- `GET /info`: returns `{ status, server: { name, version } }`.
- `ALL /mcp`: MCP streamable HTTP endpoint. In Supabase multi-tenant mode,
  missing API key/OAuth returns JSON-RPC error code `-32001`.

Confirmed production behavior:

- Live `https://mcp.kastalienresearch.ai/health` returned HTTP 200 on
  2026-06-02.
- Live `https://mcp.kastalienresearch.ai/info` returned HTTP 200 on
  2026-06-02.
- Live unauthenticated `https://mcp.kastalienresearch.ai/mcp` returned HTTP 401
  with `Missing API key or OAuth token` on 2026-06-02.
- Direct Cloud Run URL returned the same shapes.

Storage modes:

- Default source behavior is filesystem storage.
- `THOUGHTBOX_STORAGE=supabase` requires `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`.
- `cloud-run-service.yaml` sets `THOUGHTBOX_STORAGE=supabase`.

Public MCP tool surface:

- `thoughtbox_search`
- `thoughtbox_execute`
- `thoughtbox_peer_notebook`

Important drift:

- README text says `thoughtbox_execute` exposes hub through `tb`, but current
  test/source evidence says `tb.hub` is not available.
- Older direct tool surfaces and `thoughtbox_operations` should not be treated
  as production-public without fresh registration evidence.

### Web App

Confirmed source routes include:

- Public: `/`, `/pricing`, `/support`, `/terms`, `/privacy`, `/explore`,
  `/explore/[sessionSlug]`, `/docs/*`.
- Auth: `/sign-in`, `/sign-up`, `/sign-up/claim`, `/forgot-password`,
  `/reset-password`, `/api/auth/callback`.
- Workspace: `/app`, `/w/[workspaceSlug]/dashboard`,
  `/w/[workspaceSlug]/sessions`, `/w/[workspaceSlug]/sessions/[sessionId]`,
  `/w/[workspaceSlug]/sessions/[sessionId]/explore`,
  `/w/[workspaceSlug]/observability`, `/w/[workspaceSlug]/api-keys`,
  `/w/[workspaceSlug]/connect`, `/w/[workspaceSlug]/billing`,
  `/w/[workspaceSlug]/usage`, workspace/account settings, workspace quickstart.
- API: `/api/stripe/webhook`.
- Health: `/health`.

Confirmed production behavior:

- `https://thoughtbox.kastalienresearch.ai/health` returned HTTP 200 from
  Vercel on 2026-06-02 with body `{ "status": "ok", "timestamp": ... }`.

Auth and data boundaries:

- Middleware protects `/w/*` and `/app`.
- Web server code reads Supabase workspace/session/thought/run/otel/api-key data.
- Stripe billing and signup flows exist in source and use Supabase service-role
  operations.

Important drift:

- `apps/web/README.md` claims Cloud Run/Docker deployment and route names such
  as `/projects` and `/runs`.
- Current route inventory uses `/sessions`, and no `apps/web/Dockerfile` or
  `apps/web/vercel.json` was found.
- Live `/health` shows Vercel headers.

### Observatory and Observability

There are two observability strata:

- Optional local Observatory HTTP/WebSocket server, controlled by
  `THOUGHTBOX_OBSERVATORY_ENABLED`.
- Production OTLP ingestion mounted into the MCP Express app only in
  Supabase/multi-tenant mode.

Do not assume the optional Observatory UI is publicly exposed in production.
The live evidence in this pass only proves the MCP `/health`, `/info`, `/mcp`
surface and the web `/health` surface.

### Supabase

Confirmed local link:

- `supabase/.temp/project-ref` is `akjccuoncxlvrrtkvtno`.
- `supabase/.branches/_current_branch` is `main`.

Confirmed staging references:

- Redacted local `.mcp.json` includes `supabase-staging` with project ref
  `pyyabzaitqvdbaneanip`.
- `.github/workflows/staging-deploy.yml` pushes migrations to staging for PRs
  that touch `supabase/migrations/**`.
- `.github/workflows/db-parity.yml` compares staging against migrations.
- `.github/workflows/ci.yml` includes a production schema drift check using
  `supabase db diff --linked`.

Risk:

- Production project, staging project, and local MCP connector target different
  Supabase refs by design, but that split is operationally easy to confuse.

## Dependency Ledger

| Dependency | Classification | Evidence | Operational note |
| --- | --- | --- | --- |
| Supabase Postgres/Auth | `hard required` for deployed MCP and web | MCP Cloud Run env, web middleware, Supabase storage, web data reads | Missing or wrong service-role env breaks deployed MCP and privileged web flows. |
| Supabase Realtime | `feature dependent` | Web session/realtime code paths and Supabase package usage | Needed for realtime UX, not proven by live probe. |
| Stripe | `feature dependent` | Pricing, billing, signup claim, webhook source | Billing/signup can degrade independently from MCP. |
| Google Cloud Run | `hard required` for live MCP | live Google Frontend headers, Cloud Run URL, service YAML | Deployment pipeline ownership is not proven in current workflows. |
| Vercel | `hard required` for live web app | live web `/health` Vercel headers, web dependencies/runbook | Repo has web CI but no checked-in Vercel project config. |
| MCP Registry | `feature dependent` | tag publish workflow | Package publishing is separate from live Cloud Run service health. |
| GCP Secret Manager | `hard required` for Terraform-managed agent-runner job; likely required for MCP Cloud Run secrets | Terraform and Cloud Run service spec | Live secret values intentionally not inspected. |
| LangSmith | `feature dependent` | OTLP/evaluation defaults | Not required for baseline `/health`. |
| Filesystem storage | `local/default`, risky if exposed in containers | source default, Docker `THOUGHTBOX_DATA_DIR`, Cloud Run stateless comment | Safe for local mode; state-loss risk if deployed without Supabase mode. |
| Optional Observatory WebSocket server | `feature dependent` | source config | Public production status unknown. |

## Risk Ledger

| Risk | Status | Evidence | Operational impact | Follow-up evidence needed |
| --- | --- | --- | --- | --- |
| Web deployment target conflict | `contradictory` | Web README claims Cloud Run/Docker; live web health is Vercel; no web Dockerfile found | Operators may deploy or debug the wrong platform | Vercel project settings or deployment workflow owner |
| MCP Cloud Run deployment owner gap | `unknown` | Root Dockerfile and service YAML exist; workflows do not show a Cloud Run deploy step | Release process unclear during incident or rollback | Cloud Run deployment workflow, manual runbook, or GCP deploy history |
| Production/staging Supabase confusion | `confirmed-current` risk | linked project is `akjccuoncxlvrrtkvtno`; staging connector/workflows use `pyyabzaitqvdbaneanip` | Schema checks or manual queries can target the wrong database | Dashboard labels and documented operator workflow |
| Filesystem default vs stateless containers | `confirmed-current` risk | source defaults to `fs`; Cloud Run service sets `supabase`; Docker notes Cloud Run statelessness | Wrong env can silently create volatile/local state | Startup guard or deployment check that rejects `fs` in exposed mode |
| Public MCP surface drift | `confirmed-current` risk | current source registers three tools; docs mention hub access through `tb` | Agents may call unavailable APIs | Update README/resources or restore intended registration |
| Web README route drift | `confirmed-current` risk | README mentions `/projects` and `/runs`; current routes use `/sessions` | Support/runbooks send users to wrong pages | Update web README after production map is accepted |
| Observatory public status | `unknown` | source has optional server; no live public observatory probe confirmed | Incident responders may expect nonexistent live UI | Runtime env or deployed service inventory |
| OTLP ingestion live contract | `unknown` | source mounts OTLP routes in Supabase mode; no live endpoint contract probe performed | Telemetry debugging may require source spelunking | Exact route inventory and safe read-only probe strategy |
| `api.thoughtbox.dev/mcp` stale default | `contradictory` | web config default/docs mention API domain; probe timed out | Generated config can point at dead/stale endpoint | Replace default or document domain routing |

## 2AM Runbook

Use these in order. Do not use production credentials unless the incident
requires authenticated MCP behavior.

1. Check MCP custom domain:

   ```bash
   curl -i --max-time 10 https://mcp.kastalienresearch.ai/health
   curl -i --max-time 10 https://mcp.kastalienresearch.ai/info
   curl -i --max-time 10 https://mcp.kastalienresearch.ai/mcp
   ```

   Expected:

   - `/health`: HTTP 200, JSON with `status: "ok"`, `server: "thoughtbox"`,
     `transport: "streamable-http"`.
   - `/info`: HTTP 200, JSON with `thoughtbox-server` and version.
   - unauthenticated `/mcp`: HTTP 401, JSON-RPC error `Missing API key or OAuth
     token`.

   Interpretation:

   - `/health` down: Cloud Run, DNS, container startup, or GCP frontend issue.
   - `/health` up but `/mcp` not returning auth error: MCP route/auth/runtime
     issue.
   - custom domain down but direct Cloud Run URL up: DNS/domain mapping issue.

2. Check direct Cloud Run URL:

   ```bash
   curl -i --max-time 10 https://thoughtbox-mcp-272720136470.us-central1.run.app/health
   curl -i --max-time 10 https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp
   ```

   Expected:

   - Same shape as custom domain.

3. Check web app health:

   ```bash
   curl -i --max-time 10 https://thoughtbox.kastalienresearch.ai/health
   ```

   Expected:

   - HTTP 200 from Vercel.
   - JSON body with `status: "ok"` and timestamp.

   Interpretation:

   - Web health down while MCP health is up: Vercel/web/Supabase-web env issue,
     not MCP container outage.
   - MCP health down while web health is up: Cloud Run/MCP issue, not marketing
     app outage.

4. Confirm local operator target before any database action:

   ```bash
   cat supabase/.temp/project-ref
   cat supabase/.branches/_current_branch
   ```

   Expected in this pass:

   - Project ref `akjccuoncxlvrrtkvtno`.
   - Branch `main`.

5. If auth-specific user reports occur:

   - Confirm web middleware env has `NEXT_PUBLIC_SUPABASE_URL` and
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Confirm privileged flows have `SUPABASE_SERVICE_ROLE_KEY`.
   - Confirm Stripe webhook env has `STRIPE_WEBHOOK_SECRET`.

6. If telemetry/observability is missing:

   - Do not assume the optional Observatory WebSocket UI is production-exposed.
   - Start with Supabase `otel_events` and web `/observability` source paths.
   - Verify OTLP route contract from source before probing non-health endpoints.

## Acceptance Mapping

| Acceptance item | Enforcing evidence |
| --- | --- |
| Route validation | Source route inventory plus live `/health`, `/info`, `/mcp`, and web `/health` probes. |
| Deployment mapping | Dockerfile, Cloud Run service YAML, Vercel live headers, workflow inventory, Terraform inventory. |
| Config validation | Env var grep across runtime entrypoints, web middleware/routes, Cloud Run service, workflows. |
| Dependency sanity | Dependency ledger above, grounded in source and runtime evidence. |
| Reproducibility | `.specs/production-overview/evidence-log.md` records commands, timestamps, targets, and redacted outputs. |

## Explicit Unknowns

- Which workflow or manual process deploys the MCP Cloud Run service.
- Which Vercel project owns `thoughtbox.kastalienresearch.ai`.
- Whether the optional Observatory server is enabled anywhere in production.
- Exact live OTLP endpoint behavior.
- Whether generated Supabase types are current against the linked production
  schema today.
- Whether all docs that mention `api.thoughtbox.dev`, `/runs`, `/projects`,
  `tb.hub`, or Cloud Run web deployment are still intended or stale.
