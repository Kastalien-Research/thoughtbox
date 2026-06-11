# Layer 2 Scope: SupabaseHubStorage + Migration

Status: IMPLEMENTED (SPEC-V1-INITIATIVE Phase 4.3, claim c11)
Date: 2026-04-07 (scoped) / 2026-06-11 (implemented)

## Implemented Amendments (Phase 4.3 — supersede the design below where they differ)

Migration: `supabase/migrations/20260611000000_add_hub_coordination_tables.sql`.
Implementation: `src/hub/supabase-hub-storage.ts`.

1. **Concurrency safety (c11).** Append-heavy children are normalized into
   rows, not JSONB arrays: channel messages (`hub_channel_messages`, as
   scoped below), plus proposal reviews (`hub_proposal_reviews`) and
   consensus endorsements (`hub_consensus_endorsements`). The `HubStorage`
   interface gained `appendMessage`/`appendReview`/`appendEndorsement`;
   `channels.ts`, `proposals.ts`, and `consensus.ts` append through them, so
   concurrent writers on different server instances never lose appends.
   Remaining read-modify-write aggregates (`hub_workspaces.agents`,
   `hub_problems.comments`, proposal status/merge fields) carry a `version`
   column; `SupabaseHubStorage.save*` does a compare-and-swap on `version`
   and throws on conflict instead of silently overwriting. `appendReview`
   also transitions proposal status open→reviewing (guarded so it cannot
   revert a merge).
2. **Multi-tenant readiness.** `tenant_workspace_id uuid NOT NULL REFERENCES
   public.workspaces(id)` on all tenant-scoped tables, indexed; `hub_agents`
   stays global (per this scope) with a nullable `user_id` referencing
   `auth.users` for future web/auth binding. Every query in
   `SupabaseHubStorage` is scoped by `tenant_workspace_id`.
3. **Real RLS.** RLS enabled on all 9 hub tables. `service_role` full-access
   policies plus workspace-membership SELECT policies for `authenticated`
   (`tenant_workspace_id IN (SELECT workspace_id FROM workspace_memberships
   WHERE user_id = auth.uid())`); `hub_agents` allows authenticated reads of
   rows where `user_id = auth.uid()`. The server uses the service role and
   bypasses RLS; the policies exist for Phase 4.4/4.6 Realtime/web access.
4. **Dropped `hub_events`, `hub_tasks`, `hub_workers`** in the same
   migration — worker-queue tables from a deferred design, never written
   (0 rows on prod and staging, 2026-06-10 drift report; nothing in `src/`
   referenced them).
5. **Wiring.** `THOUGHTBOX_STORAGE=supabase` gives each tenant session a
   cached per-tenant `SupabaseHubStorage`
   (`createSupabaseHubStorageProvider` in `src/index.ts`), replacing the
   interim per-tenant filesystem scoping (`createTenantHubStorageProvider`,
   removed). Local mode keeps the shared `FileSystemHubStorage`
   (documented single-writer).
6. **Evidence.** `src/hub/__tests__/supabase-hub-storage.test.ts` runs the
   HubStorage contract against both backends, the c11 concurrent-writer
   tests (two instances, no lost messages/reviews/endorsements), the
   optimistic-concurrency conflict test, and tenant isolation.

## Context

Hub coordination (27 operations across workspaces, problems, proposals, consensus, channels) currently uses FileSystemHubStorage only. Cloud Run containers are stateless — hub state vanishes on restart. This layer implements Supabase-backed hub storage so the hub works deployed.

## Prior Decisions

- Cloud Run is the execution plane (non-negotiable)
- Supabase is the persistence/intelligence plane (non-negotiable)
- Edge Functions are background processing only, NOT a second MCP surface
- `broadcast_changes()` triggers handle event fan-out (Layer 3, separate scope)
- Hub identity stored in Supabase, not in-memory Maps
- `SupabaseKnowledgeStorage` does NOT exist yet — only template is `SupabaseStorage` in `src/persistence/supabase-storage.ts`

## HubStorage Interface (source of truth: `src/hub/hub-types.ts:222-251`)

```typescript
interface HubStorage {
  // Agent registry (workspace-agnostic)
  getAgents(): Promise<AgentIdentity[]>;
  saveAgent(agent: AgentIdentity): Promise<void>;
  getAgent(agentId: string): Promise<AgentIdentity | null>;

  // Workspace operations
  getWorkspace(workspaceId: string): Promise<Workspace | null>;
  saveWorkspace(workspace: Workspace): Promise<void>;
  listWorkspaces(): Promise<Workspace[]>;

  // Problem operations
  getProblem(workspaceId: string, problemId: string): Promise<Problem | null>;
  saveProblem(problem: Problem): Promise<void>;
  listProblems(workspaceId: string): Promise<Problem[]>;

  // Proposal operations
  getProposal(workspaceId: string, proposalId: string): Promise<Proposal | null>;
  saveProposal(proposal: Proposal): Promise<void>;
  listProposals(workspaceId: string): Promise<Proposal[]>;

  // Consensus operations
  getConsensusMarker(workspaceId: string, markerId: string): Promise<ConsensusMarker | null>;
  saveConsensusMarker(marker: ConsensusMarker): Promise<void>;
  listConsensusMarkers(workspaceId: string): Promise<ConsensusMarker[]>;

  // Channel operations
  getChannel(workspaceId: string, problemId: string): Promise<Channel | null>;
  saveChannel(channel: Channel): Promise<void>;
}
```

**17 methods** across 6 domains. All async. All workspace-scoped except agent registry.

## Domain Types (source of truth: `src/hub/hub-types.ts`)

### AgentIdentity (lines 12-19)
```typescript
{ agentId: string; name: string; role: 'coordinator' | 'contributor';
  profile?: string; clientInfo?: string; registeredAt: string; }
```

### Workspace (lines 25-44)
```typescript
{ id: string; name: string; description: string; createdBy: string;
  mainSessionId: string; agents: WorkspaceAgent[]; createdAt: string; updatedAt: string; }

// WorkspaceAgent (nested)
{ agentId: string; role: 'coordinator' | 'contributor'; joinedAt: string;
  status: 'online' | 'offline'; lastSeenAt: string; currentWork?: string; }
```

### Problem (lines 49-74)
```typescript
{ id: string; workspaceId: string; title: string; description: string;
  createdBy: string; assignedTo?: string; status: ProblemStatus;
  branchId?: string; branchFromThought?: number; resolution?: string;
  dependsOn?: string[]; parentId?: string; comments: Comment[];
  createdAt: string; updatedAt: string; }

// Comment (nested)
{ id: string; agentId: string; content: string; createdAt: string; }
```

### Proposal (lines 80-111)
```typescript
{ id: string; workspaceId: string; title: string; description: string;
  createdBy: string; sourceBranch: string; problemId?: string;
  status: ProposalStatus; reviews: Review[]; mergeThoughtNumber?: number;
  createdAt: string; updatedAt: string; }

// Review (nested)
{ id: string; proposalId: string; reviewerId: string; verdict: ReviewVerdict;
  reasoning: string; thoughtRefs?: number[]; createdAt: string; }
```

### ConsensusMarker (lines 117-126)
```typescript
{ id: string; workspaceId: string; name: string; description: string;
  thoughtRef: number; branchId?: string; agreedBy: string[]; createdAt: string; }
```

### Channel (lines 132-149)
```typescript
{ id: string; workspaceId: string; problemId: string; messages: ChannelMessage[]; }

// ChannelMessage (nested)
{ id: string; agentId: string; content: string; timestamp: string;
  ref?: { sessionId?: string; thoughtNumber?: number; branchId?: string; }; }
```

## Deliverables

### 1. Supabase Migration

File: `supabase/migrations/YYYYMMDDHHMMSS_add_hub_tables.sql`

**Design decision: nested arrays vs normalized tables.**

The filesystem storage stores `comments`, `reviews`, `messages`, `agents` (on workspace), `agreedBy`, and `dependsOn` as JSON arrays inside the parent object. Two options:

| Approach | Pros | Cons |
|----------|------|------|
| **JSONB columns** for nested arrays | Matches domain types 1:1, simpler mapping code, fewer tables | No FK constraints on nested items, harder to query individually |
| **Normalized tables** for nested items | FK integrity, queryable, indexable | More tables (4-5 extra), more complex mapping, more joins |

**Recommendation: JSONB for comments, reviews, agreed_by, depends_on. Normalized table for channel_messages only** (messages grow unboundedly and need pagination; the others are bounded small arrays).

#### Tables

```sql
-- 1. Hub agents (workspace-agnostic, global registry)
CREATE TABLE public.hub_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'contributor',
  profile text,
  client_info text,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Hub workspaces (distinct from SaaS workspaces table)
CREATE TABLE public.hub_workspaces (
  id text PRIMARY KEY,  -- matches domain type (string ID, not uuid)
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by text NOT NULL REFERENCES public.hub_agents(agent_id),
  main_session_id text,
  agents jsonb NOT NULL DEFAULT '[]',  -- WorkspaceAgent[]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Hub problems
CREATE TABLE public.hub_problems (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id),
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by text NOT NULL,
  assigned_to text,
  status text NOT NULL DEFAULT 'open',
  branch_id text,
  branch_from_thought integer,
  resolution text,
  depends_on jsonb DEFAULT '[]',  -- string[]
  parent_id text REFERENCES public.hub_problems(id),
  comments jsonb NOT NULL DEFAULT '[]',  -- Comment[]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Hub proposals
CREATE TABLE public.hub_proposals (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id),
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by text NOT NULL,
  source_branch text NOT NULL DEFAULT '',
  problem_id text REFERENCES public.hub_problems(id),
  status text NOT NULL DEFAULT 'open',
  reviews jsonb NOT NULL DEFAULT '[]',  -- Review[]
  merge_thought_number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Hub consensus markers
CREATE TABLE public.hub_consensus_markers (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id),
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  thought_ref integer NOT NULL,
  branch_id text,
  agreed_by jsonb NOT NULL DEFAULT '[]',  -- string[]
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Hub channels
CREATE TABLE public.hub_channels (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id),
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  problem_id text NOT NULL REFERENCES public.hub_problems(id)
);

-- 7. Hub channel messages (normalized — grows unboundedly)
CREATE TABLE public.hub_channel_messages (
  id text NOT NULL,
  channel_id text NOT NULL REFERENCES public.hub_channels(id),
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  agent_id text NOT NULL,
  content text NOT NULL,
  ref jsonb,  -- { sessionId?, thoughtNumber?, branchId? }
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, id)
);
```

#### Indexes

```sql
CREATE INDEX idx_hub_problems_workspace ON public.hub_problems(workspace_id);
CREATE INDEX idx_hub_problems_tenant ON public.hub_problems(tenant_workspace_id);
CREATE INDEX idx_hub_proposals_workspace ON public.hub_proposals(workspace_id);
CREATE INDEX idx_hub_consensus_workspace ON public.hub_consensus_markers(workspace_id);
CREATE INDEX idx_hub_channels_workspace ON public.hub_channels(workspace_id);
CREATE INDEX idx_hub_channel_messages_channel ON public.hub_channel_messages(channel_id, created_at);
CREATE INDEX idx_hub_channel_messages_tenant ON public.hub_channel_messages(tenant_workspace_id);
```

#### RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.hub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_consensus_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_channel_messages ENABLE ROW LEVEL SECURITY;

-- Service role: full access (MCP server uses service_role key)
-- Pattern: one policy per table, matches existing convention
CREATE POLICY "service_role_full_access" ON public.hub_agents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
-- (repeat for each table)

-- Authenticated users: read within their tenant workspace
CREATE POLICY "tenant_member_read" ON public.hub_problems
  FOR SELECT TO authenticated
  USING (tenant_workspace_id IN (
    SELECT workspace_id FROM public.workspace_memberships
    WHERE user_id = auth.uid()
  ));
-- (repeat pattern for each table with tenant_workspace_id)
```

### 2. SupabaseHubStorage Implementation

File: `src/hub/supabase-hub-storage.ts` (~350-450 LOC estimated)

```typescript
interface SupabaseHubStorageConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  tenantWorkspaceId: string;  // SaaS workspace for tenant isolation
}
```

**Method mapping (17 methods):**

| Method | Supabase Query |
|--------|---------------|
| `getAgents()` | `from('hub_agents').select()` |
| `saveAgent(agent)` | `from('hub_agents').upsert(row, { onConflict: 'agent_id' })` |
| `getAgent(agentId)` | `from('hub_agents').select().eq('agent_id', agentId).maybeSingle()` |
| `getWorkspace(id)` | `from('hub_workspaces').select().eq('id', id).eq('tenant_workspace_id', this.tenantId).maybeSingle()` |
| `saveWorkspace(ws)` | `from('hub_workspaces').upsert(row)` |
| `listWorkspaces()` | `from('hub_workspaces').select().eq('tenant_workspace_id', this.tenantId)` |
| `getProblem(wsId, id)` | `from('hub_problems').select().eq('id', id).eq('workspace_id', wsId).maybeSingle()` |
| `saveProblem(p)` | `from('hub_problems').upsert(row)` |
| `listProblems(wsId)` | `from('hub_problems').select().eq('workspace_id', wsId)` |
| `getProposal(wsId, id)` | `from('hub_proposals').select().eq('id', id).eq('workspace_id', wsId).maybeSingle()` |
| `saveProposal(p)` | `from('hub_proposals').upsert(row)` |
| `listProposals(wsId)` | `from('hub_proposals').select().eq('workspace_id', wsId)` |
| `getConsensusMarker(wsId, id)` | `from('hub_consensus_markers').select().eq('id', id).eq('workspace_id', wsId).maybeSingle()` |
| `saveConsensusMarker(m)` | `from('hub_consensus_markers').upsert(row)` |
| `listConsensusMarkers(wsId)` | `from('hub_consensus_markers').select().eq('workspace_id', wsId)` |
| `getChannel(wsId, probId)` | `from('hub_channels').select().eq('workspace_id', wsId).eq('problem_id', probId).maybeSingle()` + join messages |
| `saveChannel(ch)` | Upsert channel row + upsert messages to `hub_channel_messages` |

**Row mappers needed (private methods):**
- `rowToAgent()` / `agentToRow()`
- `rowToWorkspace()` / `workspaceToRow()`
- `rowToProblem()` / `problemToRow()`
- `rowToProposal()` / `proposalToRow()`
- `rowToConsensusMarker()` / `consensusMarkerToRow()`
- `rowToChannel()` / `channelToRow()` (includes message join)

**Channel.messages special handling:** `getChannel()` must join `hub_channel_messages` ordered by `created_at`. `saveChannel()` must diff messages and insert only new ones (or upsert by id).

### 3. Wiring in index.ts

Current (`src/index.ts:71-74,104,117,157`):
```typescript
hubStorage: createFileSystemHubStorage(baseDir),
```

Change: In the `supabase` storage branch, replace with:
```typescript
hubStorage: createSupabaseHubStorage({
  supabaseUrl: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  tenantWorkspaceId: workspaceId,
}),
```

**Note:** HubStorage is created ONCE in the StorageBundle (not per-request). The `tenantWorkspaceId` scopes all queries. Agent registry (`hub_agents`) is global across tenants.

### 4. Hub Identity: No Changes Needed

Research finding: `hub-tool-handler.ts` session-scoped Maps (`sessionDefaults`, `sessionRegistries`) track which agents are registered within a given MCP session. These are SESSION state, not persistent state. They serve a different purpose than the hub_agents table.

- `hub_agents` table: persistent registry of all agents that have ever registered
- `sessionDefaults`/`sessionRegistries`: which agent this MCP session is acting as

**No changes to hub-tool-handler.ts.** The session Maps are correct for their purpose. SupabaseHubStorage handles persistence. The tool handler handles session binding.

## What This Does NOT Include

- `broadcast_changes()` triggers (Layer 3)
- Background intelligence pipeline / embeddings (Layer 4)
- Plugin packaging (Layer 5)
- `tb.hub` Code Mode wiring (Layer 1, separate scope)
- Edge Function queue processors
- pgvector columns on hub tables (deferred to Layer 4)
- Changes to HubStorage interface (additive implementation only)
- Changes to hub-handler.ts or hub-tool-handler.ts

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDDHHMMSS_add_hub_tables.sql` | NEW — 7 tables, indexes, RLS |
| `src/hub/supabase-hub-storage.ts` | NEW — ~400 LOC |
| `src/index.ts` | MODIFY — 3 lines (storage selection in supabase branch) |
| `src/database.types.ts` | REGENERATE — `supabase gen types typescript` after migration |

## Dependencies

- Supabase CLI for migrations (`supabase db push`)
- Existing `SupabaseStorage` pattern in `src/persistence/supabase-storage.ts` as template
- No changes to HubStorage interface — new implementation only

## Risks

| Risk | Mitigation |
|------|-----------|
| Hub operations assume fast reads (filesystem was sync-like) | All hub operations already async; Supabase queries add ~5-20ms |
| JSONB columns for comments/reviews lose FK integrity | Bounded arrays (<100 items typically); integrity enforced at application layer |
| `hub_workspaces.id` is `text` not `uuid` (matches domain type) | Consistent with how hub generates IDs; PK still enforced |
| Existing `workspaces` table name collision | Hub tables prefixed `hub_*`; tenant FK via `tenant_workspace_id` |
| Channel messages grow unbounded | Normalized table with pagination; index on `(channel_id, created_at)` |

## Acceptance Criteria

1. `THOUGHTBOX_STORAGE=supabase` creates `SupabaseHubStorage` instead of filesystem
2. All 27 hub operations work through Supabase storage
3. Hub state persists across Cloud Run container restarts
4. Tenant isolation: workspace A cannot see workspace B's hub data
5. FileSystemHubStorage still works for local dev (`THOUGHTBOX_STORAGE=fs`)
6. `supabase gen types typescript` produces updated `database.types.ts`
