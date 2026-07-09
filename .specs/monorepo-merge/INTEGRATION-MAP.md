# Thoughtbox Server ↔ Web App Integration Map

**Purpose**: complete functional mapping between the Thoughtbox MCP server (this repo) and the web app (`thoughtbox-web-two/` clone in worktree), using Supabase as the data layer they share.

**Generated**: 2026-04-20, from three parallel subagent exploration passes on `main`.

**Status**: reference document for the monorepo merge and the launch readiness review. Read-only research output, not implementation guidance.

---

## 1. Executive Summary

The Thoughtbox system is a three-surface product sharing one data layer:

| Surface | Role | Runtime | Stack |
|---|---|---|---|
| **Thoughtbox MCP server** | Agent reasoning substrate (`thoughtbox_execute` + `thoughtbox_search` over MCP) | Cloud Run | TypeScript, Hono, `@modelcontextprotocol/sdk` |
| **Supabase** | Persistent state + async intelligence + auth | Hosted Supabase project `akjccuoncxlvrrtkvtno` | Postgres + pgmq + pg_cron + Edge Functions |
| **Web app** (`thoughtbox-web-two`) | Landing, docs, dashboard, observability, billing | Vercel | Next.js 15 app router, React 19, `@supabase/ssr` |

**Shared state — 23 Postgres tables, 3 pgmq queues, 3 Realtime publications, 2 Edge Functions.**

Architectural split, not coincidence:

- **Server WRITES most tables** via `SupabaseStorage` and related persistence adapters, then emits OTEL events through the same connection.
- **Web app READS most tables** in Server Components or via RLS-enforced browser clients; also MUTATES only `workspaces` (via Stripe webhook) and `api_keys` (via server actions).
- **Edge functions operate on the data plane independently** of both; currently `tb-branch` only (`process-thought-queue` was undeployed and removed in the 2026-07 demolition pass).
- **Realtime bridges live state** back to the web app — `thoughts`, `sessions`, `branches` publications feed the trace explorer and run views.

The design goal — and the one the integration map makes visible — is that the data plane is the API between server and web. Both sides write to Supabase; both sides read from Supabase; neither calls the other directly. This is desirable for stewardship (one schema is the contract) but produces the drift risk the research document flagged: when server and web expectations about a column or RLS policy diverge, nothing catches it until a user sees wrong data.

---

## 2. Data Layer — Supabase Schema

### 2.1 Extensions + Publications

**Enabled extensions** (verified live 2026-04-20):

| Extension | Purpose | Used for |
|---|---|---|
| `pgmq` | Message queue | thought/entity/session queues |
| `pg_cron` | Scheduled jobs | queue-drain scheduler (helper exists, not yet active) |
| `pg_net` | HTTP requests from SQL | edge-function invocation from cron |
| `pg_graphql` | GraphQL API | unused by web app or server, installed by default |
| `pg_stat_statements` | Query analytics | DBA diagnostics |
| `pgcrypto`, `uuid-ossp` | Crypto + UUIDs | default Supabase stack |
| `supabase_vault` | Secrets storage | cron invocation auth tokens |
| `vector` | pgvector | migration header deferred; columns not yet added |

**Realtime publication `supabase_realtime` contains**: `thoughts`, `sessions`, `branches`.

### 2.2 Tables (23 total)

Legend: ✓ = used, ✗ = not used, ⚠ = partial / legacy.

#### Core reasoning substrate

| Table | Writers | Readers | Realtime | RLS |
|---|---|---|---|---|
| **`workspaces`** | server (trigger `handle_new_user`), web app (Stripe webhook, settings), edge fn (indirectly) | web app (dashboard, settings, billing), server (scoped queries) | ✗ | `workspaces_select_member`, `_insert_authenticated`, `_update_admin`, `_delete_owner` |
| **`sessions`** | server (`SupabaseStorage.createSession`) | web app (dashboard, sessions index, observability), server, otel-storage (cost/timeline) | ✓ (`trg_sessions_broadcast`, identity-scoped topic) | `sessions_member_access` + `service_role_bypass_sessions` |
| **`thoughts`** | server (`SupabaseStorage.addThought`), edge fn `tb-branch`, primary agents via MCP | web app (session detail + trace explorer), server (full), process-thought-queue worker | ✓ (postgres_changes; client subscribes on channel `thoughts:{workspaceId}`) | `thoughts_member_access` + `service_role_bypass_thoughts` |
| **`branches`** | edge fn `tb-branch` (implicit on first branch thought), auto-complete trigger | web app (explorer UI, future), server, `tb-branch` | ✓ | Service-role only |
| **`runs`** | server (`SupabaseStorage.createRun`), OTEL reconciliation | web app (usage, sessions index, observability), otel-storage | ✗ | `service_role_full_access_runs`, `workspace_member_read_runs` |

#### Knowledge graph

| Table | Writers | Readers | Realtime | RLS |
|---|---|---|---|---|
| **`entities`** | server (`knowledge.createEntity` via MCP) | server (graph queries), entity_processing worker (when consumer ships) | ✗ | `project_isolation` (legacy), `workspace_member_access`, `service_role_bypass` |
| **`observations`** | server (`knowledge.addObservation`) | server (graph queries), full-text via `content_tsv` GIN index | ✗ | same as entities |
| **`relations`** | server (`knowledge.createRelation`) | server (graph traversal) | ✗ | same as entities |

**Gap**: web app does NOT read or surface `entities` / `observations` / `relations` anywhere. The knowledge graph is entirely invisible in the web UI despite being one of the product's central capabilities.

#### Telemetry

| Table | Writers | Readers | Realtime | RLS |
|---|---|---|---|---|
| **`otel_events`** | OTEL ingestion endpoint (server), reconciliation (updates `runs.otel_session_id`) | web app (observability, usage), server, RPC `otel_session_cost` | ✗ | `service_role_full_access`, `workspace_member_read` |

#### Auth / identity / access

| Table | Writers | Readers | Realtime | RLS |
|---|---|---|---|---|
| **`profiles`** | server (`handle_new_user` trigger on `auth.users`), web app (account settings) | web app (profile display), middleware auth callback | ✗ | `profiles_own` |
| **`workspace_memberships`** | server (`handle_new_user`), web app (invite/manage) | RLS function `is_workspace_member()`, settings page | ✗ | `memberships_select_own` |
| **`api_keys`** | web app (api-keys page, server actions), server | server (key validation, anon SELECT for prefix lookup), web app (management) | ✗ | `api_keys_anon_validate` + `api_keys_member_access` + `service_role_bypass` |
| **`oauth_clients`** | server (DCR endpoint) | server (token validation) | ✗ | service-role only |
| **`oauth_authorization_codes`** | server (auth code endpoint) | server (token endpoint) | ✗ | service-role only |
| **`oauth_refresh_tokens`** | server (token endpoint) | server (refresh/revoke) | ✗ | service-role only |

#### Protocol state (server-only)

| Table | Writers | Readers | Realtime | RLS | UI surface |
|---|---|---|---|---|---|
| **`protocol_sessions`** | server (Theseus/Ulysses/Delphi handlers) | server | ✗ | service-role only | ✗ |
| **`protocol_scope`** | server | server | ✗ | service-role only | ✗ |
| **`protocol_visas`** | server | server | ✗ | service-role only | ✗ |
| **`protocol_audits`** | server | server | ✗ | service-role only | ✗ |
| **`protocol_history`** | server | server | ✗ | service-role only | ✗ |

**Gap**: protocol state is entirely server-internal. No user-facing surface to inspect active Ulysses sessions, Theseus scope, or Delphi inquiries.

#### Deferred / reserved

| Table | Status | Planned role |
|---|---|---|
| **`hub_events`** | ⚠ present in `20260409232440_remote_schema.sql`, no active writers/readers | Hub coordination (deferred per `SUPABASE-INTELLIGENCE.md`) |
| **`hub_tasks`** | ⚠ same | Hub task queue |
| **`hub_workers`** | ⚠ same | Hub worker registry |

### 2.3 pgmq queues

From migration `20260408033928_add_hub_tables_vectors_pgmq_realtime.sql`:

| Queue | Trigger | Consumer | Status |
|---|---|---|---|
| `thought_processing` | `trg_thought_insert_enqueue` → `enqueue_thought_processing()` | NONE — `process-thought-queue` undeployed (2026-07 demolition) | ⚠ enqueue happens, messages pile up |
| `entity_processing` | `trg_entity_insert_enqueue` → `enqueue_entity_processing()` | NONE — no edge function deployed | ⚠ enqueue happens, messages pile up |
| `session_closing` | NO TRIGGER — queue exists, nothing enqueues | NONE | ⚠ empty; `trg_session_close_enqueue` needs to be added |

### 2.4 RPC functions

| Function | Purpose | Callers |
|---|---|---|
| `pgmq_read_queue(name, vt, qty)` | Read with visibility timeout | edge functions |
| `pgmq_archive_queue_message(name, msg_id)` | Archive after processing | edge functions |
| `invoke_process_thought_queue_from_vault(url_secret, bearer_secret, body)` | HTTP POST to edge function from cron, auth via Vault | pg_cron |
| `schedule_process_thought_queue(job, expr, url_secret, bearer_secret)` | Register cron job | operator (not yet called) |
| `otel_session_cost(workspace_id, session_id=NULL)` | Aggregate model cost from `otel_events` | web app (observability page), server |
| `is_workspace_member(ws_id)` | RLS workspace membership check | RLS policies |
| `check_protocol_enforcement(target_path)` | Protocol scope check | server via HTTP `/protocol/enforcement` |
| `handle_new_user()` | Profile + workspace + membership setup on auth signup | Supabase Auth trigger |

### 2.5 Cron jobs

**None active.** `schedule_process_thought_queue()` helper exists but has not been invoked — no automatic queue draining yet. This is the nearest-term async-governance gap.

---

## 3. Server Capabilities

### 3.1 MCP operations (via `tb.*` SDK in `thoughtbox_execute`)

| Module.Operation | Server file | Touches | UI surface | Public docs |
|---|---|---|---|---|
| `tb.thought({...})` | `src/thought/tool.ts` | `sessions`, `thoughts`, `runs` | ✓ dashboard session list, session detail | ✓ `docs/sessions-and-thoughts` |
| `tb.session.list` | `src/sessions/tool.ts` | `sessions` | ✓ dashboard, usage | ✓ `docs/session-lifecycle` |
| `tb.session.get` | `src/sessions/tool.ts` | `sessions`, `thoughts` | ✓ session detail page | ✓ `docs/session-lifecycle` |
| `tb.session.search` | `src/sessions/tool.ts` | `sessions` | partial (no full search UI yet) | ✓ |
| `tb.session.resume` | `src/sessions/tool.ts` | `sessions` | ✗ | ✓ |
| `tb.session.export` | `src/sessions/tool.ts` | `sessions`, `thoughts` | ✗ | ✗ |
| `tb.session.analyze` | `src/sessions/tool.ts` | `sessions`, `thoughts` | ✗ | ✗ |
| `tb.session.extractLearnings` | `src/sessions/tool.ts` | `sessions`, `thoughts` | ✗ | ✗ |
| `tb.knowledge.createEntity` | `src/knowledge/tool.ts` | `entities` | ✗ | ✓ `docs/knowledge-graph` |
| `tb.knowledge.getEntity` | `src/knowledge/tool.ts` | `entities` | ✗ | ✓ |
| `tb.knowledge.listEntities` | `src/knowledge/tool.ts` | `entities` | ✗ | ✓ |
| `tb.knowledge.addObservation` | `src/knowledge/tool.ts` | `observations` | ✗ | ✓ |
| `tb.knowledge.createRelation` | `src/knowledge/tool.ts` | `relations` | ✗ | ✓ |
| `tb.knowledge.queryGraph` | `src/knowledge/tool.ts` | `entities` + `relations` | ✗ | ✓ |
| `tb.knowledge.stats` | `src/knowledge/tool.ts` | all KG tables | ✗ | ✗ |
| `tb.notebook.*` (create/list/load/addCell/runCell/export) | `src/notebook/tool.ts` | filesystem only (no Supabase) | ✗ | ✓ `docs/code-mode` |
| `tb.theseus(...)` | `src/protocol/theseus-tool.ts` | `protocol_sessions`, `protocol_scope`, `protocol_visas` | ✗ | ✗ |
| `tb.ulysses(...)` | `src/protocol/ulysses-tool.ts` | `protocol_sessions`, `protocol_history` | ✗ | ✓ `docs/ulysses-protocol` |
| `tb.observability.sessions` | `src/observability/gateway-handler.ts` | `sessions`, `otel_events` | ✓ observability page | ✗ |
| `tb.observability.session_info` | `src/observability/gateway-handler.ts` | `sessions`, `otel_events` | ✓ | ✗ |
| `tb.observability.session_timeline` | `src/observability/gateway-handler.ts` | `otel_events` | ✗ | ✗ |
| `tb.observability.session_cost` | `src/observability/gateway-handler.ts` | `otel_events` via RPC `otel_session_cost` | ✓ observability cost chart | ✗ |
| `tb.observability.health` | `src/observability/gateway-handler.ts` | runtime health | ✗ | ✗ |
| `tb.branch.spawn/merge/list/get` | `src/branch/index.ts` | `branches`, `thoughts` | ✗ | ✗ |

### 3.2 MCP prompts + resources (served at `thoughtbox://...`)

| URI / prompt name | Content | Public docs? |
|---|---|---|
| `thoughtbox://patterns-cookbook` | Reference: thoughtbox patterns | ✗ |
| `thoughtbox://architecture` | Reference: server architecture | ✗ |
| `thoughtbox://cipher` | Reference: agent-to-agent communication cipher | ✗ |
| `thoughtbox://session-analysis-guide` | Guide | ✗ |
| `thoughtbox://prompts/subagent-summarize` | Pattern | ✓ `docs/subagent-patterns` |
| `thoughtbox://prompts/evolution-check` | Pattern (A-Mem) | ✗ |
| `thoughtbox://prompts/parallel-verification` | Pattern | ✗ |
| `thoughtbox://tests/*` | Behavioral test suites (5) | ✗ |
| `thoughtbox://knowledge/stats`, `thoughtbox://*/operations` | Catalogs | ✗ |
| prompt `list_mcp_assets` | MCP asset overview | ✗ |
| prompt `interleaved-thinking` | Workflow | ✓ `docs/interleaved-thinking` |
| prompts `spec-designer` / `spec-validator` / `spec-orchestrator` / `specification-suite` | Spec workflow suite | ✗ |

### 3.3 HTTP endpoints

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/mcp` | POST (streamable) | MCP-over-HTTP transport | API key via query `?key=...` or Bearer |
| `/health` | GET | Uptime | none |
| `/events` | GET (SSE) | Real-time thought / protocol event stream | Bearer |
| `/protocol/enforcement` | POST | Pre-mutation scope gate (used by `protocol_gate.sh` hook) | Bearer |
| `/.well-known/oauth-authorization-server` | GET | OAuth 2.1 discovery | none |
| `/oauth/authorize` | GET | Authorization code flow | none (browser) |
| `/oauth/token` | POST | Token exchange / refresh | client credentials |
| `/oauth/revoke` | POST | Token revocation | Bearer |
| `/cli/validate` | — | **REMOVED** in PR #265 — was a 404 stub that broke `thoughtbox init` in plugin 0.1.3 | — |

### 3.4 Supabase Edge Functions

| Function | File | Trigger / invocation | Role |
|---|---|---|---|
| `process-thought-queue` | **REMOVED** (2026-07 demolition pass, owner-approved sleep-time kill) | Was: pgmq queue `thought_processing` via pg_net cron (never scheduled) | Undeployed from prod and deleted from the repo; the applied pgmq/pg_cron migrations remain in place. |
| `tb-branch` | `supabase/functions/tb-branch/index.ts` | HTTP POST with signed token (HMAC-SHA-256); routes under `/functions/v1/tb-branch/tb-branch/mcp` | MCP-lite JSON-RPC server inside Supabase Edge; tools `branch_thought`, `branch_status`, `branch_read`. Writes directly to `thoughts`. |

### 3.5 OTEL signals (into `otel_events`)

| Signal | Emission source | `event_type` / `event_name` | Attributes | UI surface |
|---|---|---|---|---|
| Tool usage | Claude Code plugin hooks (`otlp_tool_capture.sh`) | `log` / `tool_result` | `tool.name`, `tool.result`, `execution_ms`, `session_id` | ✓ Observability tool performance chart |
| API request | server instrumentation | `log` / `api_request` | `endpoint`, `method`, `status_code`, `latency_ms` | ✗ |
| API error | server instrumentation | `log` / `api_error` | `error.type`, `error.message` | ✗ |
| Token consumption | OTEL parser (server) | `metric` / `tokens_consumed` | `model`, `input_tokens`, `output_tokens` | ✗ |
| Cost | OTEL parser (server) | `metric` / `claude_code.cost.usage` | `model`, `cost_cents` | ✓ cost-by-model chart (observability) |
| Session bind | plugin session_tracker hook | `log` / `session_binding` | `claude_session_id`, `thoughtbox_session_id` | ✗ (consumed by `runs` table reconciliation) |

---

## 4. Web App Surfaces (`thoughtbox-web-two/`)

### 4.1 Middleware + auth

**File**: `middleware.ts`

Runs on `/w/:path*`, `/app`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`. Calls `getUser()` via server Supabase client; redirects unauthenticated to `/sign-in`, authenticated-but-on-auth-pages to `/app`.

### 4.2 Public (marketing + docs) routes

| Route | Data sources | Notes |
|---|---|---|
| `/` (`(public)/page.tsx`) | static | landing |
| `/pricing` | static | `PLAN_CONFIG` hardcoded (free / pro / team) — does NOT match webhook logic below |
| `/privacy`, `/terms`, `/support` | static | |
| `/docs` (and subpages) | static MDX | 10 pages: `quickstart`, `authentication`, `sessions-and-thoughts`, `session-lifecycle`, `knowledge-graph`, `code-mode`, `observability`, `interleaved-thinking`, `ulysses-protocol`, `subagent-patterns` |
| `/explore` | static JSON in `src/data/sessions/*.json` | does NOT read from Supabase — curated showcase sessions |
| `/explore/[sessionSlug]` | static JSON | same |

### 4.3 Auth routes

| Route | Tables / auth action |
|---|---|
| `/sign-in` (actions) | `auth.users` + `profiles` (redirects via `default_workspace_id → workspaces.slug`) |
| `/sign-up` (actions) | `auth.users` (triggers email confirmation) |
| `/forgot-password` | `auth.users.resetPasswordForEmail()` → callback |
| `/reset-password` | `auth.users.updateUser({ password })` + `profiles` lookup |
| `/api/auth/callback` | PKCE code exchange → `profiles` → workspace redirect |

### 4.4 Authenticated workspace routes `/w/[workspaceSlug]/`

| Route | Primary tables | Key operations | Realtime? |
|---|---|---|---|
| `/dashboard` | `workspaces`, `sessions`, `thoughts`, `api_keys` | recent 5 sessions, counts (thoughts, runs, active keys) | ✗ |
| `/sessions` (if present) | `workspaces`, `sessions`, `runs`, `otel_events`, `thoughts` | full session records, OTEL event presence per session, reasoning-signal breakdown (decisions / assumptions / beliefs / actions / revisions from `thought_type`) | ✗ |
| `/sessions/[sessionId]` | `sessions`, `runs`, `thoughts`, `otel_events` | trace explorer, up to 10K OTEL events, ordered `thoughts` | ✓ — channel `thoughts:{workspaceId}` on postgres_changes, INSERT/UPDATE, filter `workspace_id=eq.{workspaceId}` |
| `/observability` | `workspaces`, `sessions`, `thoughts`, `otel_events`, RPC `otel_session_cost` | 30-day session stats, cost-by-model, tool performance (top 500 tool events), token usage | ✗ |
| `/usage` | `workspaces`, `thoughts`, `sessions`, `api_keys` | all-time + 30d counts, distinct tags, hardcoded "Founding Beta" plan + unlimited entitlements | ✗ |
| `/api-keys` | `workspaces`, `api_keys` | list / create (bcrypt-hashed) / revoke | ✗ |
| `/billing` (if present) | `workspaces` (`plan_id`, `subscription_status`, `stripe_customer_id`) | plan display against hardcoded `PLAN_CONFIG` | ✗ |
| `/settings/workspace` | `workspaces`, `workspace_memberships`, `auth.users` (current user) | metadata + member list | ✗ |
| `/settings/account` | `profiles` (not deeply inspected) | profile updates | ✗ |
| `/docs/quickstart` | static | workspace-scoped quickstart mirror | ✗ |
| `/connect` (if present) | not inspected | onboarding likely | ✗ |

### 4.5 API routes

| Route | Tables | Notes |
|---|---|---|
| `/health` | none | `{ status: "ok" }` |
| `/api/auth/callback` | `profiles` | OAuth code exchange |
| `/api/stripe/webhook` | `workspaces` (service-role) | see §5 |

### 4.6 Realtime subscriptions

**Single subscription: `thoughts:{workspaceId}`** on `thoughts` table postgres_changes, subscribed by `useSessionRealtime` in the trace explorer. Handler filters payloads by `session_id` client-side.

**Not subscribed** (despite being in the publication): `sessions`, `branches`. The web app reads them but does not listen for live updates.

### 4.7 Stripe webhook (`/api/stripe/webhook`)

| Event | `workspaces` columns updated |
|---|---|
| `checkout.session.completed` | `stripe_customer_id`, `stripe_subscription_id`, `plan_id`, `subscription_status='active'` |
| `customer.subscription.updated` | `subscription_status` |
| `customer.subscription.deleted` | `plan_id='free'`, `subscription_status='canceled'`, `stripe_subscription_id=NULL` |
| `invoice.payment_failed` | `subscription_status='past_due'` |

**Only service-role caller in the entire web app.** Lookup is by `stripe_customer_id` (reverse-mapped from Stripe payloads).

---

## 5. Documentation Inventory

**Public docs pages (10)** — all under `src/app/(public)/docs/`, all MDX, all static:

| Page | Subject | Related server capability |
|---|---|---|
| `quickstart` | Install + first API key + connect agent | api_keys, `/mcp`, plugin install |
| `authentication` | OAuth 2.1 + API key | OAuth endpoints, Bearer auth |
| `sessions-and-thoughts` | Session model, thought types | `tb.thought`, `tb.session.*` |
| `session-lifecycle` | Open → run → close | `tb.session.list/get/resume/search` |
| `knowledge-graph` | Entities + observations + relations | `tb.knowledge.*` (7 ops) |
| `code-mode` | Notebook + `tb` SDK | `tb.notebook.*`, overall Code Mode idea |
| `observability` | OTEL + metrics | `tb.observability.*`, cost surface |
| `interleaved-thinking` | Reasoning pattern | prompt `interleaved-thinking` |
| `ulysses-protocol` | Surprise-gated debugging | `tb.ulysses(...)`, `protocol_*` tables |
| `subagent-patterns` | Sub-agent communication | resource `subagent-summarize`, cipher |

**Also under the web app repo** (not live-routed, just in-repo docs): `guides/`, `user-docs/`, and several `*.md` files at the top level (`GTM-PLAN.md`, `GTM-MEATSPACE-TASKS.md`, `DAY-1-ACTION-CARD.md`, `thoughtbox-product-vision.md`). These look like internal planning documents; they are not surfaced via routes.

---

## 6. Integration Gaps — the money section

### 6.1 Server capabilities with NO UI surface AND no public docs

These are implemented, usable via MCP, but invisible to anyone who doesn't know to call them:

| Capability | Impact |
|---|---|
| `tb.session.export/analyze/extractLearnings` | Session digest / learnings workflow — directly tied to sleep-time compute product story in `SPEC-THOUGHTBOX-SLEEP-TIME.md` |
| `tb.knowledge.stats` | Graph size + coverage signal |
| `tb.branch.spawn/merge/list/get` | Branching is visible only through `tb-branch` edge function; no UI, no docs |
| `tb.observability.session_timeline` | Detailed per-session OTEL timeline |
| `tb.observability.health` | No status page at all |
| `tb.theseus(...)` | Scope-locked refactor protocol — implemented, not documented |
| prompts `spec-designer`, `spec-validator`, `spec-orchestrator`, `specification-suite` | Full spec workflow — silent |
| prompt `parallel-verification` | Silent |
| resource `thoughtbox://prompts/evolution-check` | A-Mem primitive — **core to the sleep-time architecture**, silent |
| resource `thoughtbox://cipher` | Agent-to-agent notation — silent |
| resources `thoughtbox://tests/*` | Behavioral test suites — internal only |

### 6.2 UI surfaces referencing missing / incomplete capabilities

Reverse direction — docs / UI promising things that aren't fully wired:

| Location | Reference | Reality |
|---|---|---|
| `docs/observability` | Full OTEL timeline | UI surfaces cost only; timeline exists server-side but no UI |
| `/pricing` + `/billing` + `/usage` | free / pro / team plans | `/usage` hardcodes "Founding Beta" + unlimited entitlements; Stripe webhook updates a `plan_id` column the UI doesn't use for gating. Three sources of pricing truth. |
| `docs/session-lifecycle` | Export functionality | `tb.session.export` exists via MCP, no UI button |
| `docs/knowledge-graph` | Knowledge graph features | Zero web-app surface for viewing entities / relations / observations |
| `docs/ulysses-protocol` | Surprise-gated debugging | No UI to see active Ulysses sessions, their S counter, or reflect history |

### 6.3 Schema drift / coherence concerns

1. **`entities.project` (legacy) vs `workspace_id`** — `project_isolation` RLS policy still present, overlaps with `workspace_member_access`. Rule for which wins under query is not obvious; could leak cross-workspace reads if the membership policy doesn't properly narrow first.

2. **`hub_*` tables (events, tasks, workers)** — introduced in `20260409232440` but **zero writers**, **zero readers**. Schema drift from intent: intelligence spec calls for Hub tables; migration added them; nothing uses them. Either ship a consumer soon or move them back to `.specs/`.

3. **`entity_processing` pgmq queue** — trigger fires, worker doesn't exist. Messages accumulate. Either ship consumer or remove the trigger.

4. **`session_closing` pgmq queue** — queue exists, no trigger enqueues to it, no worker consumes. Dead infrastructure.

5. **No active cron jobs** — `schedule_process_thought_queue()` helper is a button nobody pressed. The whole async pipeline depends on it. In the current state, triggers enqueue but nothing drains.

6. **Web app reads `thought_type` enum values** (`decision_frame`, `assumption_update`, `action_report`, etc.) hardcoded in `/sessions` signal-extraction logic. If the server adds a new thought type, the web app silently drops it.

7. **Protocol state tables are server-only** — `protocol_sessions` / `protocol_scope` / `protocol_visas` have no UI. `tb-branch`-like pattern: if the server changes this schema, no web-app code cares. That's actually safe drift but worth naming.

8. **Plugin-side MCP server identity** — web app's `thoughts` Realtime subscription uses `thoughts:{workspaceId}` channel, but the plugin opens an MCP session keyed by (client-generated session ID, API key). The `runs` table reconciles OTEL `session_id` with MCP `session_id`, but the web app's trace view filters by `session_id` alone. If a user opens two Claude Code sessions simultaneously with the same workspace, the trace view mixes them until the session filter is tighter.

### 6.4 Over-claimed capabilities

These are stated (in docs, landing copy, or `PLAN_CONFIG`) but NOT actually implemented end-to-end:

| Claim | Missing piece |
|---|---|
| "Free / Pro / Team" plan distinction | `/usage` ignores plan, entitlements hardcoded |
| "Observability" (comprehensive) | Only 2 charts + counts; full timeline not surfaced |
| "Self-healing memory" / "evolution" | `evolution-check` prompt exists; no end-to-end product flow |
| "Skill learning / sleep-time" | Research only; no code path yet |

### 6.5 Under-claimed capabilities (real wins that aren't marketed)

These ARE implemented and work, but aren't named in the web app's public-facing surface:

- The `tb.knowledge.*` graph is real and usable, just invisible.
- The Ulysses protocol ships with full audit/history tables — could be a differentiator.
- The OTEL cost-by-model chart actually works on real data.
- The `tb-branch` edge function is deployed and provides branch-scoped MCP — a novel capability.

---

## 7. Sources

- Server repo (this repo): `src/`, `supabase/migrations/`, `supabase/functions/`, `.mcp.json`, `.specs/`
- Web app repo (clone): `thoughtbox-web-two/src/`, `thoughtbox-web-two/middleware.ts`, `thoughtbox-web-two/src/app/**`
- Migrations analyzed: all 17 applied on hosted project `akjccuoncxlvrrtkvtno` plus one local-only (`20260410163000_add_health_state_tables.sql`, parked per session 316ec05c)
- Knowledge graph entity: `thoughtbox-repo-governance-attempts-history` (`fda71b97-a1f1-4860-9d12-b7b0364cab71`) for prior ADRs / protocols touched by this map
- Related research: `.specs/agent-governance-substrate/SPEC-THOUGHTBOX-SLEEP-TIME.md` (async governance design that extends the existing edge functions)
- Generated: 2026-04-20 from three parallel subagent exploration passes. Any item marked ✗ should be re-verified before acting on it; drift is expected.
