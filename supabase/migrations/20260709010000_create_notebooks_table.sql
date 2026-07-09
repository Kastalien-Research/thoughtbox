-- Durable notebook-document persistence (.specs/agentic-runbooks.md H4 —
-- the deployed backend of the notebook_persist contract, implemented by
-- SupabaseNotebookDocumentStorage).
--
-- GATED MIGRATION: this commit ships separately, pending the DB-parity
-- ruling. If it is dropped, the Supabase backend fails loudly on the
-- missing relation and notebook_persist keeps its honest in_memory label.
--
-- Shape: notebooks are LIVING DOCUMENTS — unlike the append-only runbook
-- tables (20260612120000), rows are upserted by (tenant_workspace_id, id);
-- the latest persisted document wins. The persisted unit is the notebook's
-- canonical .src.md encoding (contract/validator bindings survive via
-- thoughtbox:cell comments) plus identifying metadata.
--
-- Tenancy copies the proven hub/runbook pattern: tenant_workspace_id FK on
-- every row, service_role full-access policy (server enforces tenant scope
-- in queries), workspace-membership SELECT policy for authenticated.
--
-- Idempotent: IF NOT EXISTS guards; policies dropped before creation.

CREATE TABLE IF NOT EXISTS public.notebooks (
  id text NOT NULL,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  language text NOT NULL CHECK (language IN ('javascript', 'typescript')),
  -- Canonical .src.md encoding of the notebook document.
  content text NOT NULL,
  persisted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_notebooks_tenant
  ON public.notebooks(tenant_workspace_id);
-- Cross-session recall lists a tenant's notebooks newest-first.
CREATE INDEX IF NOT EXISTS idx_notebooks_tenant_persisted
  ON public.notebooks(tenant_workspace_id, persisted_at DESC);

ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_notebooks" ON public.notebooks;
CREATE POLICY "service_role_full_access_notebooks" ON public.notebooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workspace_member_read_notebooks" ON public.notebooks;
CREATE POLICY "workspace_member_read_notebooks" ON public.notebooks
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
