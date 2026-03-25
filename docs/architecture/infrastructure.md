# Infrastructure

## GCP (Google Cloud Platform)

Project: `thoughtbox-480620`
Region: `us-central1`

### Cloud Run Service: `thoughtbox-mcp`

The MCP server runs as a single Cloud Run service.

Configuration (from `cloud-run-service.yaml`):

| Setting | Value | Why |
|---------|-------|-----|
| Image | `us-central1-docker.pkg.dev/PROJECT_ID/thoughtbox/thoughtbox-mcp:latest` | Artifact Registry |
| CPU | 1 vCPU | |
| Memory | 1 GiB | |
| Min instances | 1 | Avoid cold starts |
| Max instances | 1 | In-memory sessions require single instance |
| Concurrency | 10 requests/instance | |
| Timeout | 300s | SSE streams need time |
| Session affinity | true | In-memory MCP sessions must hit the same instance |
| Execution environment | gen2 | Full Linux sandbox |
| Startup CPU boost | true | Faster cold starts |

The MCP server is deployed manually (not managed by Terraform). Deploy with:

```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/thoughtbox-480620/thoughtbox-repo/thoughtbox-mcp:latest
gcloud run services replace cloud-run-service.yaml --project=thoughtbox-480620 --region=us-central1
```

### Secrets (Secret Manager)

Secrets used by the MCP service (mounted via `secretKeyRef` in the YAML):

| Secret name | Used for |
|-------------|----------|
| `thoughtbox-api-key` | Static API key (legacy/admin auth) |
| `anthropic-api-key` | Anthropic API access |
| `supabase-url` | Supabase project URL |
| `supabase-service-role-key` | Supabase admin access |

Secrets managed by Terraform (`infra/gcp/execution.tf`) for the agent runner:

| Secret name | Used for |
|-------------|----------|
| `github-app-private-key` | GitHub App auth |
| `github-app-installation-id` | GitHub App auth |
| `github-app-id` | GitHub App auth |
| `anthropic-api-key` | Shared with MCP service |
| `supabase-url` | Shared with MCP service |
| `supabase-anon-key` | Client-side Supabase access |
| `supabase-jwt-secret` | JWT verification (legacy — see bd memory) |

### Artifact Registry

Two repositories:

| Repository | Managed by | Used for |
|------------|-----------|----------|
| `us-central1-docker.pkg.dev/thoughtbox-480620/thoughtbox-repo` | Manual | MCP server images |
| `us-central1-docker.pkg.dev/thoughtbox-480620/agent-runner` | Terraform | Agent runner images |

### Health Checks

| Type | Path | Interval | Threshold |
|------|------|----------|-----------|
| Startup probe | `/health` | Every 10s, starts after 5s | 3 failures |
| Liveness probe | `/health` | Every 30s | 3 failures |

### Docker Build

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Node 22 slim, pnpm, install all deps, `pnpm build:local`
2. **Production stage**: Node 22 slim, pnpm, production deps only, copy `dist/` from builder

## Terraform (`infra/gcp/`)

Terraform manages the agent runner infrastructure, not the MCP server. State is stored in `gs://thoughtbox-terraform-state/gcp-stabilization`.

### What Terraform manages

| Resource | File | Purpose |
|----------|------|---------|
| `agent-runner-job` (Cloud Run Job) | `execution.tf` | Async agent execution |
| `agent-runner-sa` (Service Account) | `iam.tf` | Identity for agent jobs |
| `build-system-sa` (Service Account) | `iam.tf` | Identity for CI/CD |
| `agent-runner` (Artifact Registry) | `storage.tf` | Docker images for agent runner |
| `thoughtbox-run-artifacts` (GCS bucket) | `storage.tf` | Job output storage |
| 7 secrets (Secret Manager) | `execution.tf` | Agent runner config |
| `sil-runner` (Cloud Scheduler) | `automation.tf` | Weekly agent trigger (currently paused) |
| `main` branch protection | `github.tf` | PR reviews, status checks |

### Kill switch

The agent runner has an `AGENTS_DISABLED` env var (default: `false`). Set to `true` in `terraform.tfvars` to disable all agent executions.

### What Terraform does NOT manage

- The `thoughtbox-mcp` Cloud Run Service (deployed via `cloud-run-service.yaml`)
- The `thoughtbox-repo` Artifact Registry (created manually)
- The MCP service's secrets (`thoughtbox-api-key`, `supabase-service-role-key`)

## Supabase

### Hosted instance

The production Supabase project hosts:
- **Postgres**: All application data (see [Data Model](./data-model.md))
- **Auth**: User signup/login, JWT tokens
- **Row Level Security**: Tenant isolation at the database level
- **Realtime**: Broadcast triggers on sessions and thoughts tables

The MCP server connects using the `service_role` key, which bypasses RLS. This is intentional — the server handles auth at the API key layer and scopes all queries by `workspace_id` in application code.

### Local development

```bash
npx supabase start    # Start local Postgres, Auth, etc.
npx supabase stop     # Stop
npx supabase db reset  # Reset to migrations
```

Migrations are in `supabase/migrations/` and applied in order.

### Migration history

| Migration | What it does |
|-----------|-------------|
| `20260320191032_remote_schema.sql` | Initial schema pulled from hosted Supabase — all tables, functions, RLS, triggers |
| `20260320200448_drop_project_columns.sql` | Remove old `project` text column from all tables |
| `20260320202228_fix_protocol_enforcement_and_knowledge_rls.sql` | Fix RLS policies for protocol and knowledge tables |
| `20260322153858_add_workspace_id_to_knowledge_tables.sql` | Add `workspace_id` FK to entities, relations, observations (replacing dropped `project` column) |
| `20260323020000_add_action_receipt_thoughttype.sql` | Add `action_receipt` to thought_type enum |

## Service URL

Production: `https://thoughtbox-mcp-272720136470.us-central1.run.app`

Endpoint: `POST /mcp`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `THOUGHTBOX_STORAGE` | No | `fs` (default), `supabase`, or `memory` |
| `THOUGHTBOX_DATA_DIR` | No | Data directory for FS storage (default: `~/.thoughtbox`) |
| `SUPABASE_URL` | If supabase | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | If supabase | Service role key (bypasses RLS) |
| `THOUGHTBOX_API_KEY` | No | Static API key for legacy/admin auth |
| `THOUGHTBOX_API_KEY_LOCAL` | No | Local dev bypass key |
| `PORT` | No | HTTP port (default: 1731 locally, 8080 on Cloud Run) |
| `HOST` | No | Bind address (default: 0.0.0.0) |
| `NODE_ENV` | No | `production` on Cloud Run |
| `LANGSMITH_API_KEY` | No | LangSmith tracing (optional) |
| `ANTHROPIC_API_KEY` | No | For agent features |
| `DISABLE_THOUGHT_LOGGING` | No | Skip console logging of thoughts |
