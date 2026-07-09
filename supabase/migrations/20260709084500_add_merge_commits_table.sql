-- Merge commits (SPEC-MERGE-CORE c8) — the "collapse to certainty"
-- primitive: immutable records binding parent branch heads to an
-- auto-generated evidence notebook, its hash, and a structured verdict.
--
-- Copies the proven claim-table pattern (20260612000000):
--   (a) tenant_workspace_id FK scoping all rows to a SaaS workspace
--       (public.workspaces) for tenant isolation from day one;
--   (b) workspace_id FK to hub_workspaces — merges live in hub
--       coordination spaces, like claims and problems;
--   (c) RLS: service_role full access (the MCP server enforces tenant
--       scope in queries); workspace-membership SELECT for the web app;
--       workspace-OWNER UPDATE for the human-only approval route
--       (apps/web POST /api/merge/[id]/approve — the only surface that
--       may set status 'approved', spec c4).
--
-- Immutability (spec c1/c5/c6): merge commits are append-only history.
-- Status moves only along pending_evidence -> pending_approval|blocked,
-- pending_approval -> approved, approved -> superseded; every writer uses
-- status-guarded CAS updates (UPDATE ... WHERE status = <expected>), so
-- terminal records are never rewritten. No hard deletes beyond
-- workspace-cascade cleanup.
--
-- Idempotent: IF NOT EXISTS guards on table and indexes; policies are
-- dropped before creation so double-apply is safe.

CREATE TABLE IF NOT EXISTS public.merge_commits (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_branch_ids jsonb NOT NULL DEFAULT '[]' CHECK (
    jsonb_typeof(parent_branch_ids) = 'array'
  ),
  base_ref text,
  evidence_notebook_id text,
  evidence_hash text,
  verdict jsonb,
  status text NOT NULL DEFAULT 'pending_evidence' CHECK (
    status IN ('pending_evidence', 'blocked', 'pending_approval', 'approved', 'superseded')
  ),
  requested_by text NOT NULL,
  -- Human approver (auth.users id). Set ONLY by the apps/web approval
  -- route; no FK to auth.users so tenant exports/restores stay portable.
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  superseded_by text REFERENCES public.merge_commits(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_merge_commits_tenant
  ON public.merge_commits(tenant_workspace_id);
CREATE INDEX IF NOT EXISTS idx_merge_commits_workspace
  ON public.merge_commits(workspace_id);
-- The web review inbox filters by tenant + status.
CREATE INDEX IF NOT EXISTS idx_merge_commits_tenant_status
  ON public.merge_commits(tenant_workspace_id, status);

-- ---------------------------------------------------------------------------
-- RLS — the MCP server uses service_role (bypasses RLS, tenant-scoped in
-- queries); the web app uses the authenticated anon-key client, so it needs
-- member SELECT and owner UPDATE (the approval CAS) policies.
-- ---------------------------------------------------------------------------

ALTER TABLE public.merge_commits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_merge_commits" ON public.merge_commits;
CREATE POLICY "service_role_full_access_merge_commits" ON public.merge_commits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workspace_member_read_merge_commits" ON public.merge_commits;
CREATE POLICY "workspace_member_read_merge_commits" ON public.merge_commits
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_owner_update_merge_commits" ON public.merge_commits;
CREATE POLICY "workspace_owner_update_merge_commits" ON public.merge_commits
  FOR UPDATE TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
