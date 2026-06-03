# Production Reality Evidence Log

Status date: 2026-06-02

This log records the evidence used to produce
`PRODUCTION-SYSTEM-MAP.md`. Secrets and API keys are redacted by design.

## Method

Research characterization:

| Dimension | Score | Reason |
| --- | --- | --- |
| Scope | 4 | Multiple production surfaces: MCP, web, Supabase, observability, infra. |
| Domain structure | 2 | Single repo with known runtime/deployment domains. |
| Evidence type | 1 | Source/config/workflow/live endpoint evidence. |
| Time horizon | 1 | Current production state only. |
| Fidelity | 4 | Operationally useful, but no dashboard credentials or mutating probes. |

Strategy:

- Confirmatory fact-checking for runtime and route claims.
- Analytical compare/contrast for docs-vs-source deployment drift.
- Applied operational mapping for 2AM runbook and risk ledger.

## Source Of Truth Preflight

Unit:

- Produce a production reality map under `.specs/production-overview/`.

Non-goals:

- No code refactor.
- No production mutation.
- No secret discovery.
- No schema migration.
- No deployment.

Canonical sources:

- Runtime source: `src/index.ts`, `src/server-factory.ts`, `src/observatory/*`,
  `src/otel/*`, `apps/web/src/app`, `apps/web/middleware.ts`.
- Deployment/config source: `Dockerfile`, `cloud-run-service.yaml`,
  `infra/gcp/*.tf`, `.github/workflows/*.yml`, `package.json`,
  `apps/web/package.json`, `apps/web/next.config.ts`.
- Database source: `supabase/migrations/**`, `supabase/functions/**`,
  `supabase/.temp/project-ref`, `supabase/.branches/_current_branch`.
- Prior evidence only: `temps/scratch/codebase-maps/*`.

Legacy/competing claims:

- `apps/web/README.md` claims Cloud Run/Docker deployment for the web app.
- Root README and docs still contain local observability stack and older public
  tool claims.
- Some web docs mention older route concepts such as `/runs` and `/projects`.

Illegal states and operational risks:

- Exposed container running default filesystem storage instead of Supabase.
- Operator using staging Supabase ref when intending production, or production
  when intending staging.
- Incident runbook treating web and MCP as one deployment target.
- Agents calling undocumented or stale public MCP APIs.

Proceed:

- Proceeded with documentation artifacts only.

## Branch and Workspace Evidence

Command:

```bash
git branch --show-current
git status --short
```

Result:

- Started on `fix/protocol-history-validator-constraint`.
- Working tree was clean.

Command:

```bash
git switch main && git switch -c docs/production-reality-map
git pull --ff-only origin main
```

Result:

- Created `docs/production-reality-map`.
- Fast-forwarded the branch to `origin/main` because local `main` was four
  commits behind.

## Runtime and Route Evidence

Command:

```bash
rg -n "app\.(get|all|use)|mountOtlpRoutes|THOUGHTBOX_STORAGE|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|BASE_URL|/health|/info|/mcp|THOUGHTBOX_OBSERVATORY|DISABLE_THOUGHT_LOGGING" \
  src/index.ts src/observatory/config.ts src/observatory/server.ts src/server-factory.ts src/otel src/auth \
  apps/web/src/app apps/web/middleware.ts Dockerfile cloud-run-service.yaml infra/gcp .github/workflows \
  package.json apps/web/package.json apps/web/next.config.ts
```

Key findings:

- `src/index.ts` imports `mountOtlpRoutes`.
- `src/index.ts` selects storage from `THOUGHTBOX_STORAGE`, defaulting to `fs`.
- `THOUGHTBOX_STORAGE=supabase` requires `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`.
- `src/index.ts` mounts auth router, `ALL /mcp`, `GET /health`, and `GET /info`.
- `src/index.ts` mounts OTLP routes only in multi-tenant Supabase mode.
- `cloud-run-service.yaml` sets `THOUGHTBOX_STORAGE=supabase` and declares
  `/health` startup/liveness probes.
- `apps/web/middleware.ts` uses `NEXT_PUBLIC_SUPABASE_URL`.
- `apps/web/src/app/health/route.ts` declares web `GET /health`.
- `src/observatory/config.ts` gates the Observatory server on
  `THOUGHTBOX_OBSERVATORY_ENABLED=true`.
- `src/observatory/server.ts` exposes `/api/health` when that server is enabled.

Command:

```bash
find apps/web/src/app -maxdepth 5 \( -name 'page.tsx' -o -name 'route.ts' -o -name 'layout.tsx' \) -print
```

Key findings:

- Public routes exist under `apps/web/src/app/(public)`.
- Auth routes exist under `apps/web/src/app/(auth)`.
- Workspace routes exist under `apps/web/src/app/w/[workspaceSlug]`.
- API routes include `apps/web/src/app/api/auth/callback/route.ts` and
  `apps/web/src/app/api/stripe/webhook/route.ts`.
- Health route exists at `apps/web/src/app/health/route.ts`.

Command:

```bash
rg -n "server\.tool|registerTool|thoughtbox_search|thoughtbox_execute|thoughtbox_peer_notebook|thoughtbox_operations|tb\.hub|createHubApiSurface|eventStream\.mount|protocolHttpSurface\.mount|app\.get|app\.post|router\.(get|post)" \
  src/server-factory.ts src/index.ts src/http src/hub src/code-mode src/peer-notebook
```

Key findings:

- `src/server-factory.ts` registers `thoughtbox_search`,
  `thoughtbox_execute`, and `thoughtbox_peer_notebook`.
- `src/code-mode/search-tool.ts` describes those three public tools.
- Tests assert `tb.hub` is not available.
- Local-only HTTP surfaces include `/events`, `/hub/api`, and
  `/protocol/enforcement`, mounted only outside multi-tenant mode.

Note:

- A first version of this command included `src/operations-tool`, which does
  not exist on current `origin/main`; the useful results above still returned.

## Deployment and Workflow Evidence

Command:

```bash
rg -n "name:|on:|branches:|paths:|run:|uses:|supabase|Cloud Run|cloud run|docker|vercel|pnpm build|pnpm lint|vitest|db diff|db push|mcp-publisher|registry|Artifact|gcloud|cloud-run|deploy|validate" \
  .github/workflows/ci.yml .github/workflows/web-ci.yml .github/workflows/staging-deploy.yml \
  .github/workflows/publish-mcp.yml .github/workflows/db-parity.yml .github/workflows/db-invariants.yml \
  .github/workflows/mcp-diff.yml .github/workflows/validate-pr.yml infra/gcp/*.tf \
  cloud-run-service.yaml Dockerfile package.json apps/web/package.json
```

Key findings:

- Root CI runs lint, typecheck, test suite, and schema drift checks.
- Web CI builds, lints, and runs Vitest for `apps/web`.
- Staging deploy workflow links to staging and runs `supabase db push`.
- DB parity workflow compares staging against migrations.
- DB invariants workflow checks protocol event-type parity.
- MCP publish workflow publishes tagged versions to MCP Registry.
- `cloud-run-service.yaml` defines `thoughtbox-mcp` service shape and Supabase
  env wiring.
- Terraform defines GCP agent-runner job and Artifact Registry resources.
- No checked-in workflow evidence was found for deploying the MCP Cloud Run
  service image itself.
- `apps/web/package.json` includes `@vercel/analytics` and `vercel`.

Command:

```bash
find apps/web -maxdepth 2 \( -name 'Dockerfile' -o -name 'vercel.json' \) -print
find . -maxdepth 2 -name 'docker-compose*.yml' -o -name 'docker-compose*.yaml' -print
```

Result:

- No `apps/web/Dockerfile` found.
- No `apps/web/vercel.json` found.
- No root `docker-compose*.yml` or `docker-compose*.yaml` found at max depth 2
  in this pass.

## Docs and Claim Drift Evidence

Command:

```bash
rg -n "Vercel|vercel|Cloud Run|Dockerfile|docker|auth.*not implemented|not implemented|routes|projects|runs|sessions|Stripe|billing|API keys|Supabase" \
  README.md apps/web/README.md docs .specs apps/web/src/app -g '*.md' -g '*.tsx' -g '*.ts'
```

Key findings:

- `apps/web/README.md` says the web app is deployed to Google Cloud Run via
  Docker.
- `apps/web/README.md` lists `/w/[workspaceSlug]/projects` and
  `/w/[workspaceSlug]/runs`.
- Current source routes use `/w/[workspaceSlug]/sessions`.
- `.specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md` already records that
  `apps/web` implements real auth/API key/billing/session surfaces while its
  README says otherwise.
- Launch runbook material references Vercel production deployment and Vercel
  environment variables.

Command:

```bash
rg -n "https?://[A-Za-z0-9./:_?=&%-]+" README.md apps/web docs .specs .github infra src apps \
  -g '*.md' -g '*.ts' -g '*.tsx' -g '*.yml' -g '*.yaml' -g '*.tf'
```

Key findings:

- Public MCP docs reference `https://mcp.kastalienresearch.ai/mcp`.
- Some web docs reference `https://app.kastalienresearch.ai`.
- Some user docs reference direct Cloud Run URL
  `https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp`.
- Web code/config references `https://api.thoughtbox.dev/mcp` as a default.

## Supabase Evidence

Command:

```bash
find supabase -maxdepth 3 -type f -print
```

Key findings:

- Root Supabase migrations exist under `supabase/migrations`.
- Supabase functions include `process-thought-queue` and `tb-branch`.
- Local Supabase metadata files exist under `supabase/.temp`.

Command:

```bash
printf 'timestamp: '; date -u +%Y-%m-%dT%H:%M:%SZ
if [ -f supabase/.temp/project-ref ]; then printf 'linked-project-ref: '; cat supabase/.temp/project-ref; fi
if [ -f supabase/.branches/_current_branch ]; then printf '\ncurrent-branch: '; cat supabase/.branches/_current_branch; fi
```

Result:

```text
timestamp: 2026-06-02T21:57:39Z
linked-project-ref: akjccuoncxlvrrtkvtno
current-branch: main
```

Command:

```bash
node -e 'const fs=require("fs"); const path=".mcp.json"; if (!fs.existsSync(path)) { console.log(".mcp.json missing"); process.exit(0); } const json=JSON.parse(fs.readFileSync(path,"utf8")); for (const [name,cfg] of Object.entries(json.mcpServers||{})) { const url=String(cfg.url||"").replace(/key=tbx_[A-Za-z0-9_-]+/g,"key=tbx_REDACTED"); console.log(`${name}: ${cfg.type||cfg.transport||"unknown"} ${url}`); }'
```

Result:

```text
timestamp: 2026-06-02T21:57:39Z
thoughtbox-cloud-run: http https://mcp.kastalienresearch.ai/mcp?key=tbx_REDACTED
supabase-staging: http https://mcp.supabase.com/mcp?project_ref=pyyabzaitqvdbaneanip
```

Other local MCP servers were present but not relevant to this map.

## Live Read-Only Probe Evidence

Initial sandbox attempt:

```bash
curl -sS -i --max-time 10 https://mcp.kastalienresearch.ai/health
```

Result:

- Failed with `Could not resolve host`, consistent with restricted network/DNS
  in the sandbox.
- Probes were rerun with network escalation.

Command:

```bash
printf 'timestamp: '; date -u +%Y-%m-%dT%H:%M:%SZ
for url in \
  https://mcp.kastalienresearch.ai/health \
  https://mcp.kastalienresearch.ai/info \
  https://mcp.kastalienresearch.ai/mcp \
  https://thoughtbox-mcp-272720136470.us-central1.run.app/health \
  https://thoughtbox-mcp-272720136470.us-central1.run.app/info \
  https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp
do
  curl -sS -i --max-time 10 "$url" | sed -n '1,12p'
done
```

Timestamp:

```text
2026-06-02T21:57:11Z
```

Results:

| URL | Status | Server evidence | Body evidence |
| --- | --- | --- | --- |
| `https://mcp.kastalienresearch.ai/health` | HTTP 200 | `server: Google Frontend`, `x-powered-by: Express` | JSON body confirmed separately. |
| `https://mcp.kastalienresearch.ai/info` | HTTP 200 | `server: Google Frontend`, `x-powered-by: Express` | JSON body confirmed separately. |
| `https://mcp.kastalienresearch.ai/mcp` | HTTP 401 | `server: Google Frontend`, `x-powered-by: Express` | `Missing API key or OAuth token`. |
| `https://thoughtbox-mcp-272720136470.us-central1.run.app/health` | HTTP 200 | `server: Google Frontend`, `x-powered-by: Express` | Same health shape. |
| `https://thoughtbox-mcp-272720136470.us-central1.run.app/info` | HTTP 200 | `server: Google Frontend`, `x-powered-by: Express` | Same info shape. |
| `https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp` | HTTP 401 | `server: Google Frontend`, `x-powered-by: Express` | `Missing API key or OAuth token`. |

Command:

```bash
printf 'timestamp: '; date -u +%Y-%m-%dT%H:%M:%SZ
for url in \
  https://mcp.kastalienresearch.ai/health \
  https://mcp.kastalienresearch.ai/info \
  https://thoughtbox.kastalienresearch.ai/health \
  https://app.kastalienresearch.ai/health \
  https://api.thoughtbox.dev/mcp
do
  curl -sS --max-time 10 "$url"
done
```

Timestamp:

```text
2026-06-02T21:57:42Z
```

Results:

```json
{"status":"ok","transport":"streamable-http","server":"thoughtbox","version":"1.2.2"}
{"status":"ok","server":{"name":"thoughtbox-server","version":"1.2.2"}}
{"status":"ok","timestamp":"2026-06-02T21:57:42.580Z"}
```

Additional results:

- `https://app.kastalienresearch.ai/health` failed DNS resolution.
- `https://api.thoughtbox.dev/mcp` timed out after 10 seconds.

Command:

```bash
printf 'timestamp: '; date -u +%Y-%m-%dT%H:%M:%SZ
for url in \
  https://thoughtbox.kastalienresearch.ai/health \
  https://www.thoughtbox.dev/health \
  https://thoughtbox-webpage.vercel.app/health
do
  curl -sS -i --max-time 10 "$url" | sed -n '1,12p'
done
```

Timestamp:

```text
2026-06-02T21:57:13Z
```

Results:

| URL | Status | Server evidence | Body/status evidence |
| --- | --- | --- | --- |
| `https://thoughtbox.kastalienresearch.ai/health` | HTTP 200 | `server: Vercel`, `x-matched-path: /health` | Body confirmed separately. |
| `https://www.thoughtbox.dev/health` | timeout | none | Connection timed out after 10 seconds. |
| `https://thoughtbox-webpage.vercel.app/health` | HTTP 404 | `server: Vercel`, `x-vercel-error: DEPLOYMENT_NOT_FOUND` | Deployment not found. |

## Quality Assessment

| Dimension | Score | Note |
| --- | --- | --- |
| Coherence | 0.86 | MCP and web split is clear; some deployment ownership remains unknown. |
| Grounding | 0.90 | Claims are tied to source/config/workflow/live probes. |
| Compression | 0.78 | Production has enough drift that the map is necessarily dense. |
| Surprise | 0.74 | Live web health proved Vercel despite web README Cloud Run claim. |
| Actionability | 0.88 | 2AM runbook and risk ledger identify concrete next evidence. |

## Acceptance Criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Route validation | Pass with named unknowns | Source route inventory and live probes. |
| Deployment mapping | Partial pass | MCP and web runtime identified; MCP deploy owner and Vercel project config remain unknown. |
| Config validation | Pass for discovered critical vars | Env var grep across source, Cloud Run spec, workflows, web routes. |
| Dependency sanity | Pass | Dependency ledger in system map. |
| Reproducibility | Pass | Commands, timestamps, targets, and redacted outputs recorded here. |
