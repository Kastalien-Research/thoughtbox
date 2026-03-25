# Data Model

All data lives in Supabase Postgres. Every data table is scoped to a workspace via `workspace_id` foreign key and protected by Row Level Security.

## Entity Relationship

```
workspaces
  |-- workspace_memberships (user_id, role)
  |-- api_keys
  |-- sessions
  |     |-- thoughts
  |-- entities (knowledge graph nodes)
  |     |-- observations
  |-- relations (knowledge graph edges)
  |-- protocol_sessions
        |-- protocol_scope
        |-- protocol_visas
        |-- protocol_audits
        |-- protocol_history
```

## Tables

### workspaces

The tenant boundary. Everything belongs to a workspace.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| name | text | Display name (e.g., "ben's Workspace") |
| slug | text | URL-safe identifier, unique |
| owner_user_id | uuid | FK -> auth.users |
| status | text | `active` / `suspended` / `archived` |
| plan_id | text | `free` / `pro` / `enterprise` |
| subscription_status | text | `active` / `inactive` / `past_due` / `canceled` |
| stripe_customer_id | text | Nullable, set when Stripe customer created |
| stripe_subscription_id | text | Nullable, set when subscription starts |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-set by trigger |

Created automatically when a user signs up (via `handle_new_user()` trigger on `auth.users`).

### workspace_memberships

| Column | Type | Notes |
|--------|------|-------|
| workspace_id | uuid | PK (composite), FK -> workspaces |
| user_id | uuid | PK (composite), FK -> auth.users |
| role | text | `owner` / `admin` / `member` |
| invited_by_user_id | uuid | Nullable, FK -> auth.users |
| created_at | timestamptz | |

A user can belong to multiple workspaces. The signup trigger creates the first membership with `role: 'owner'`.

### profiles

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | PK, FK -> auth.users (CASCADE) |
| display_name | text | Derived from email on signup |
| default_workspace_id | uuid | FK -> workspaces (SET NULL on delete) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### api_keys

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK -> workspaces (CASCADE) |
| name | text | Human label (e.g., "Production key") |
| prefix | text | First segment after `tbx_`, used for lookup |
| key_hash | text | bcrypt hash of the full key |
| status | text | `active` / `revoked` |
| last_used_at | timestamptz | |
| expires_at | timestamptz | Nullable |
| created_by_user_id | uuid | FK -> auth.users |
| revoked_at | timestamptz | |
| created_at | timestamptz | |

Keys are formatted as `tbx_<prefix>_<secret>`. The prefix enables fast lookup; the full key is verified against the bcrypt hash. See [Auth and Billing](./auth-and-billing.md) for the full flow.

### sessions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK -> workspaces (CASCADE) |
| title | text | |
| description | text | Nullable |
| tags | text[] | GIN-indexed |
| thought_count | integer | Auto-maintained by trigger |
| branch_count | integer | Auto-maintained by trigger |
| status | text | `active` / `completed` / `abandoned` |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-set by trigger |
| completed_at | timestamptz | |
| last_accessed_at | timestamptz | |

### thoughts

Append-only. Thoughts are never updated after creation.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| session_id | uuid | FK -> sessions (CASCADE) |
| workspace_id | uuid | FK -> workspaces (CASCADE) |
| thought | text | The content |
| thought_number | integer | Sequential within session |
| total_thoughts | integer | Estimated total |
| next_thought_needed | boolean | Whether the chain continues |
| thought_type | text | `reasoning` / `decision_frame` / `action_report` / `belief_snapshot` / `assumption_update` / `context_snapshot` / `progress` |
| confidence | text | `high` / `medium` / `low` (nullable) |
| is_revision | boolean | |
| revises_thought | integer | Nullable |
| branch_from_thought | integer | Nullable |
| branch_id | text | Nullable |
| needs_more_thoughts | boolean | |
| options | jsonb | For decision_frame type |
| action_result | jsonb | For action_report type |
| beliefs | jsonb | For belief_snapshot type |
| assumption_change | jsonb | For assumption_update type |
| context_data | jsonb | For context_snapshot type |
| progress_data | jsonb | For progress type |
| agent_id | text | Multi-agent attribution |
| agent_name | text | |
| content_hash | text | Integrity verification |
| parent_hash | text | Chain verification |
| critique | jsonb | Self-critique metadata |
| timestamp | timestamptz | |

Unique constraint: `(session_id, thought_number, branch_id)` — ensures thought ordering within a session/branch.

### entities (knowledge graph)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK -> workspaces (CASCADE) |
| name | text | |
| type | text | `Insight` / `Concept` / `Workflow` / `Decision` / `Agent` |
| label | text | Display label |
| properties | jsonb | |
| visibility | text | `public` / `agent-private` / `user-private` / `team-private` |
| importance_score | real | Default 0.5, indexed DESC |
| access_count | integer | |
| last_accessed_at | timestamptz | |
| valid_from | timestamptz | Temporal validity |
| valid_to | timestamptz | Nullable (null = still valid) |
| superseded_by | uuid | Self-FK for entity versioning |
| created_by | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Unique constraint: `(workspace_id, name, type)`.

### relations (knowledge graph)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK -> workspaces (CASCADE) |
| from_id | uuid | FK -> entities (CASCADE) |
| to_id | uuid | FK -> entities (CASCADE) |
| type | text | `RELATES_TO` / `BUILDS_ON` / `CONTRADICTS` / `EXTRACTED_FROM` / `APPLIED_IN` / `LEARNED_BY` / `DEPENDS_ON` / `SUPERSEDES` / `MERGED_FROM` |
| properties | jsonb | |
| created_by | text | |
| created_at | timestamptz | |

### observations (knowledge graph)

Evidence or notes attached to an entity.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK -> workspaces (CASCADE) |
| entity_id | uuid | FK -> entities (CASCADE) |
| content | text | |
| content_tsv | tsvector | Auto-generated, GIN-indexed for full-text search |
| source_session | uuid | FK -> sessions (nullable) |
| added_by | text | |
| added_at | timestamptz | |
| valid_from | timestamptz | |
| valid_to | timestamptz | |
| superseded_by | uuid | Self-FK for observation versioning |

### Protocol tables

These support the Theseus (refactoring) and Ulysses (debugging) protocols. Server-side only — accessed via `service_role`.

**protocol_sessions**: Active protocol sessions (`theseus` or `ulysses`) with status tracking and state JSON.

**protocol_scope**: File paths in scope for a Theseus session. Source is `init` (declared upfront) or `visa` (granted during session).

**protocol_visas**: Scope expansion grants with justification and anti-pattern acknowledgment.

**protocol_audits**: Cassandra audit results — diff hash, commit message, approved/rejected, feedback.

**protocol_history**: Event log with types: `plan`, `outcome`, `reflect`, `checkpoint`.

## Triggers

| Trigger | Table | Does |
|---------|-------|------|
| `trigger_*_updated_at` | workspaces, sessions, entities, profiles | Sets `updated_at = now()` on UPDATE |
| `trigger_update_session_counts` | thoughts | Maintains `thought_count` and `branch_count` on sessions |
| `trg_sessions_broadcast` | sessions | Realtime broadcast on change |
| `trg_thoughts_broadcast` | thoughts | Realtime broadcast on change |

## Row Level Security

Every table has RLS enabled. The pattern:

- **Workspace-scoped data** (sessions, thoughts, entities, relations, observations, api_keys): users can only access rows where they're a member of the workspace, via `is_workspace_member(workspace_id)`
- **Profiles**: users read/write only their own row
- **Workspace memberships**: users see only their own memberships
- **Workspaces**: SELECT if member, INSERT if owner, UPDATE if owner/admin, DELETE if owner
- **Protocol tables**: `service_role` only (no authenticated user access)
- **service_role** bypasses RLS on all tables (used by the MCP server)

## Known issues

- `protocol_sessions.workspace_id` is `text` instead of `uuid` with no FK constraint — inconsistent with the rest of the schema
