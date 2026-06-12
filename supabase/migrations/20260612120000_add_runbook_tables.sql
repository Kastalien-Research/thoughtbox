-- Durable runbook tables (SPEC-AGX-SUBSTRATE unit B4b — claim c3 instance
-- half + claim c7 fitness ledger).
--
-- Copies the proven hub-table pattern (20260611000000) and the claim-graph
-- shape: tenant_workspace_id FK on every table (tenant isolation from day
-- one), service_role full-access policies (server enforces tenant scope in
-- queries), and workspace-membership SELECT policies for authenticated
-- (future Realtime/web anon-key access).
--
-- Version note: open PRs carry 20260612000000 (claim graph) and
-- 20260612090000 on other branches; this file is deliberately
-- 20260612120000 (strictly greater) so merge order cannot collide.
--
-- Append-only model (spec §5: "Re-running a cell appends; nothing mutates"):
--   * runbook_templates       — immutable (template_id, version) records;
--                               a new cell set is a new version row.
--   * runbook_instances       — pin (template_id, template_version) at
--                               creation; status is DERIVED from execution
--                               records, never stored.
--   * runbook_cell_executions — append-only rows keyed (instance_id, seq).
--   * runbook_fitness_ledger  — append-only hypothesis-vs-actual rows (§7).
-- Enforcement: UPDATE and DELETE are REVOKED from anon/authenticated/
-- service_role on all four tables (privilege checks bind even roles that
-- bypass RLS, unlike RLS policies). Workspace-cascade cleanup still works
-- because referential cascade actions run with the table owner's rights.
--
-- Idempotent: IF NOT EXISTS guards on tables and indexes; policies are
-- dropped before creation so double-apply is safe (REVOKE is idempotent).

CREATE TABLE IF NOT EXISTS public.runbook_templates (
  template_id text NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- Executable cell snapshots incl. compiled outcome contract + contractHash
  -- so contracts survive persistence and are hash re-verified on load.
  cells jsonb NOT NULL,
  cells_hash text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (template_id, version)
);

CREATE TABLE IF NOT EXISTS public.runbook_instances (
  id text PRIMARY KEY,
  template_id text NOT NULL,
  template_version integer NOT NULL,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (template_id, template_version)
    REFERENCES public.runbook_templates(template_id, version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.runbook_cell_executions (
  instance_id text NOT NULL REFERENCES public.runbook_instances(id) ON DELETE CASCADE,
  seq integer NOT NULL CHECK (seq >= 1),
  cell_id text NOT NULL,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  agent_id text NOT NULL,
  inputs_digest text NOT NULL,
  outputs_ref text,
  status text NOT NULL CHECK (status IN ('completed', 'failed', 'skipped')),
  -- Per-expectation records: (cellId, tier, expectation, result,
  -- expected, actual-or-error) — the §5.1 record model, persisted verbatim.
  expectations jsonb NOT NULL DEFAULT '[]',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_id, seq)
);

CREATE TABLE IF NOT EXISTS public.runbook_fitness_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  template_id text NOT NULL,
  template_version integer NOT NULL,
  instance_id text NOT NULL REFERENCES public.runbook_instances(id) ON DELETE CASCADE,
  cell_id text NOT NULL,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tier integer NOT NULL CHECK (tier IN (1, 2)),
  result text NOT NULL CHECK (result IN ('pass', 'fail', 'error', 'skipped')),
  -- Only an evaluated-true expectation is ever a pass (§5.1 result semantics).
  pass boolean NOT NULL,
  expected jsonb NOT NULL,
  actual jsonb,
  error text,
  agent_id text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT runbook_fitness_pass_consistent CHECK (pass = (result = 'pass'))
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_runbook_templates_tenant
  ON public.runbook_templates(tenant_workspace_id);
CREATE INDEX IF NOT EXISTS idx_runbook_instances_tenant
  ON public.runbook_instances(tenant_workspace_id);
CREATE INDEX IF NOT EXISTS idx_runbook_instances_template
  ON public.runbook_instances(template_id, template_version);
CREATE INDEX IF NOT EXISTS idx_runbook_cell_executions_tenant
  ON public.runbook_cell_executions(tenant_workspace_id);
CREATE INDEX IF NOT EXISTS idx_runbook_fitness_ledger_tenant
  ON public.runbook_fitness_ledger(tenant_workspace_id);
-- Fitness aggregates are keyed per template version (§7).
CREATE INDEX IF NOT EXISTS idx_runbook_fitness_ledger_template
  ON public.runbook_fitness_ledger(template_id, template_version);

-- ---------------------------------------------------------------------------
-- Append-only enforcement: revoke UPDATE/DELETE/TRUNCATE from every API role.
-- Grants bind even bypassrls roles; cascade cleanup from workspaces still
-- works (RI actions execute with the table owner's privileges).
-- ---------------------------------------------------------------------------

REVOKE UPDATE, DELETE, TRUNCATE ON public.runbook_templates
  FROM anon, authenticated, service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON public.runbook_instances
  FROM anon, authenticated, service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON public.runbook_cell_executions
  FROM anon, authenticated, service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON public.runbook_fitness_ledger
  FROM anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS — server uses service_role (bypasses RLS; tenant scope enforced in
-- queries); workspace-membership SELECT policies exist for future
-- Realtime/web anon-key access, matching the hub/claims pattern.
-- ---------------------------------------------------------------------------

ALTER TABLE public.runbook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runbook_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runbook_cell_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runbook_fitness_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_runbook_templates" ON public.runbook_templates;
CREATE POLICY "service_role_full_access_runbook_templates" ON public.runbook_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_member_read_runbook_templates" ON public.runbook_templates;
CREATE POLICY "workspace_member_read_runbook_templates" ON public.runbook_templates
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_full_access_runbook_instances" ON public.runbook_instances;
CREATE POLICY "service_role_full_access_runbook_instances" ON public.runbook_instances
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_member_read_runbook_instances" ON public.runbook_instances;
CREATE POLICY "workspace_member_read_runbook_instances" ON public.runbook_instances
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_full_access_runbook_cell_executions" ON public.runbook_cell_executions;
CREATE POLICY "service_role_full_access_runbook_cell_executions" ON public.runbook_cell_executions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_member_read_runbook_cell_executions" ON public.runbook_cell_executions;
CREATE POLICY "workspace_member_read_runbook_cell_executions" ON public.runbook_cell_executions
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_full_access_runbook_fitness_ledger" ON public.runbook_fitness_ledger;
CREATE POLICY "service_role_full_access_runbook_fitness_ledger" ON public.runbook_fitness_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_member_read_runbook_fitness_ledger" ON public.runbook_fitness_ledger;
CREATE POLICY "workspace_member_read_runbook_fitness_ledger" ON public.runbook_fitness_ledger
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
