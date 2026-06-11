-- Hub coordination tables (SPEC-V1-INITIATIVE Phase 4.3, claim c11).
-- Implements SCOPE-LAYER-2 with the decided amendments:
--   (a) append-heavy children are rows (channel messages, proposal reviews,
--       consensus endorsements) so concurrent writers on different server
--       instances never lose appends; remaining read-modify-write aggregates
--       carry a `version` column for optimistic concurrency.
--   (b) tenant_workspace_id FK on all tenant-scoped tables; nullable user_id
--       on hub_agents for future web/auth binding.
--   (c) real RLS: workspace-membership SELECT policies for authenticated
--       (server uses service_role and bypasses RLS; policies exist for
--       Phase 4.4/4.6 Realtime and web anon-key access).
-- Also drops the never-written worker-queue tables from a deferred design
-- (hub_events, hub_tasks, hub_workers — verified 0 rows on prod and staging,
-- 2026-06-10 drift report; nothing in src/ references them).

DROP TABLE IF EXISTS public.hub_events;
DROP TABLE IF EXISTS public.hub_tasks;
DROP TABLE IF EXISTS public.hub_workers;

-- ---------------------------------------------------------------------------
-- 1. Hub agent registry (global across tenants per SCOPE-LAYER-2)
-- ---------------------------------------------------------------------------

CREATE TABLE public.hub_agents (
  agent_id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'contributor',
  profile text,
  client_info text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Hub workspaces (coordination spaces; distinct from SaaS workspaces)
-- ---------------------------------------------------------------------------

CREATE TABLE public.hub_workspaces (
  id text PRIMARY KEY,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by text NOT NULL REFERENCES public.hub_agents(agent_id),
  main_session_id text NOT NULL DEFAULT '',
  agents jsonb NOT NULL DEFAULT '[]',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Hub problems
-- ---------------------------------------------------------------------------

CREATE TABLE public.hub_problems (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by text NOT NULL,
  assigned_to text,
  status text NOT NULL DEFAULT 'open',
  branch_id text,
  branch_from_thought integer,
  resolution text,
  depends_on jsonb NOT NULL DEFAULT '[]',
  parent_id text REFERENCES public.hub_problems(id) ON DELETE SET NULL,
  comments jsonb NOT NULL DEFAULT '[]',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. Hub proposals (reviews normalized into hub_proposal_reviews)
-- ---------------------------------------------------------------------------

CREATE TABLE public.hub_proposals (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by text NOT NULL,
  source_branch text NOT NULL DEFAULT '',
  problem_id text REFERENCES public.hub_problems(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',
  merge_thought_number integer,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hub_proposal_reviews (
  id text PRIMARY KEY,
  proposal_id text NOT NULL REFERENCES public.hub_proposals(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  reviewer_id text NOT NULL,
  verdict text NOT NULL,
  reasoning text NOT NULL DEFAULT '',
  thought_refs jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. Hub consensus markers (endorsements normalized)
-- ---------------------------------------------------------------------------

CREATE TABLE public.hub_consensus_markers (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  thought_ref integer NOT NULL,
  branch_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hub_consensus_endorsements (
  marker_id text NOT NULL REFERENCES public.hub_consensus_markers(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (marker_id, agent_id)
);

-- ---------------------------------------------------------------------------
-- 6. Hub channels + messages (messages normalized per SCOPE-LAYER-2)
-- ---------------------------------------------------------------------------

CREATE TABLE public.hub_channels (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  problem_id text NOT NULL REFERENCES public.hub_problems(id) ON DELETE CASCADE,
  UNIQUE (workspace_id, problem_id)
);

CREATE TABLE public.hub_channel_messages (
  id text NOT NULL,
  channel_id text NOT NULL REFERENCES public.hub_channels(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  content text NOT NULL,
  ref jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_hub_agents_user ON public.hub_agents(user_id);
CREATE INDEX idx_hub_workspaces_tenant ON public.hub_workspaces(tenant_workspace_id);
CREATE INDEX idx_hub_problems_workspace ON public.hub_problems(workspace_id);
CREATE INDEX idx_hub_problems_tenant ON public.hub_problems(tenant_workspace_id);
CREATE INDEX idx_hub_problems_parent ON public.hub_problems(parent_id);
CREATE INDEX idx_hub_proposals_workspace ON public.hub_proposals(workspace_id);
CREATE INDEX idx_hub_proposals_tenant ON public.hub_proposals(tenant_workspace_id);
CREATE INDEX idx_hub_proposals_problem ON public.hub_proposals(problem_id);
CREATE INDEX idx_hub_proposal_reviews_proposal ON public.hub_proposal_reviews(proposal_id, created_at);
CREATE INDEX idx_hub_proposal_reviews_tenant ON public.hub_proposal_reviews(tenant_workspace_id);
CREATE INDEX idx_hub_consensus_markers_workspace ON public.hub_consensus_markers(workspace_id);
CREATE INDEX idx_hub_consensus_markers_tenant ON public.hub_consensus_markers(tenant_workspace_id);
CREATE INDEX idx_hub_consensus_endorsements_tenant ON public.hub_consensus_endorsements(tenant_workspace_id);
CREATE INDEX idx_hub_channels_workspace ON public.hub_channels(workspace_id);
CREATE INDEX idx_hub_channels_tenant ON public.hub_channels(tenant_workspace_id);
CREATE INDEX idx_hub_channel_messages_channel ON public.hub_channel_messages(channel_id, created_at);
CREATE INDEX idx_hub_channel_messages_tenant ON public.hub_channel_messages(tenant_workspace_id);

-- ---------------------------------------------------------------------------
-- RLS — server uses service_role (bypasses RLS); workspace-membership SELECT
-- policies exist for future Realtime/web anon-key access (Phase 4.4/4.6).
-- ---------------------------------------------------------------------------

ALTER TABLE public.hub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_proposal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_consensus_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_consensus_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_channel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_hub_agents" ON public.hub_agents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "own_user_read_hub_agents" ON public.hub_agents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "service_role_full_access_hub_workspaces" ON public.hub_workspaces
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_workspaces" ON public.hub_workspaces
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_hub_problems" ON public.hub_problems
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_problems" ON public.hub_problems
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_hub_proposals" ON public.hub_proposals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_proposals" ON public.hub_proposals
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_hub_proposal_reviews" ON public.hub_proposal_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_proposal_reviews" ON public.hub_proposal_reviews
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_hub_consensus_markers" ON public.hub_consensus_markers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_consensus_markers" ON public.hub_consensus_markers
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_hub_consensus_endorsements" ON public.hub_consensus_endorsements
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_consensus_endorsements" ON public.hub_consensus_endorsements
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_hub_channels" ON public.hub_channels
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_channels" ON public.hub_channels
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_hub_channel_messages" ON public.hub_channel_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_hub_channel_messages" ON public.hub_channel_messages
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
