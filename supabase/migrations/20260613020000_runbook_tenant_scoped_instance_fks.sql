-- Tenant-scope the runbook child→instance foreign keys (Greptile review of
-- PR #401, P1: cross-tenant FK attachment).
--
-- runbook_cell_executions and runbook_fitness_ledger reference their owning
-- instance on instance_id alone, while tenant_workspace_id is accepted
-- independently. A service-role write (or a buggy write path) can therefore
-- attach a child row carrying workspace B's tenant_workspace_id to an
-- instance owned by workspace A: the single-column FK only proves the
-- instance exists globally, so the row is readable under B's RLS yet points
-- at A's instance. Tenant isolation must be enforced structurally, not left
-- to the write path.
--
-- Fix: make tenant_workspace_id part of the referenced instance key and each
-- child instance FK, so a child row can only attach to an instance in the
-- same tenant. Mirrors the (id, template_id, template_version) pinning FK
-- added in 20260612130000; that template-pinning FK is left intact (it
-- enforces a different invariant).
--
-- This is a NEW migration (not an edit of 20260612120000, which may already
-- be applied), following the same convention as 20260612130000. Version
-- note: strictly greater than 20260612130000 and the merged claims-branch
-- versions (…612090000 / …613000000 / …613010000).
--
-- Idempotent: the unique-key add and each FK swap are guarded by
-- pg_constraint lookups, so double-apply is safe. DDL runs as the table
-- owner, so the revoked UPDATE/DELETE grants on the runbook tables do not
-- interfere, and FK cascade actions keep executing with owner rights.

DO $$
BEGIN
  -- Referenceable superkey of the primary key (id), scoped by tenant; exists
  -- only as the FK target for the tenant-composite child FKs below.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_instances_id_tenant_key'
      AND conrelid = 'public.runbook_instances'::regclass
  ) THEN
    ALTER TABLE public.runbook_instances
      ADD CONSTRAINT runbook_instances_id_tenant_key
      UNIQUE (id, tenant_workspace_id);
  END IF;

  -- runbook_cell_executions: replace the instance-only FK with a
  -- tenant-composite one.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_cell_executions_instance_id_fkey'
      AND conrelid = 'public.runbook_cell_executions'::regclass
  ) THEN
    ALTER TABLE public.runbook_cell_executions
      DROP CONSTRAINT runbook_cell_executions_instance_id_fkey;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_cell_executions_instance_tenant_fkey'
      AND conrelid = 'public.runbook_cell_executions'::regclass
  ) THEN
    ALTER TABLE public.runbook_cell_executions
      ADD CONSTRAINT runbook_cell_executions_instance_tenant_fkey
      FOREIGN KEY (instance_id, tenant_workspace_id)
      REFERENCES public.runbook_instances(id, tenant_workspace_id)
      ON DELETE CASCADE;
  END IF;

  -- runbook_fitness_ledger: replace the instance-only FK with a
  -- tenant-composite one. The (id, template_id, template_version) pinning FK
  -- from 20260612130000 stays.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_fitness_ledger_instance_id_fkey'
      AND conrelid = 'public.runbook_fitness_ledger'::regclass
  ) THEN
    ALTER TABLE public.runbook_fitness_ledger
      DROP CONSTRAINT runbook_fitness_ledger_instance_id_fkey;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_fitness_ledger_instance_tenant_fkey'
      AND conrelid = 'public.runbook_fitness_ledger'::regclass
  ) THEN
    ALTER TABLE public.runbook_fitness_ledger
      ADD CONSTRAINT runbook_fitness_ledger_instance_tenant_fkey
      FOREIGN KEY (instance_id, tenant_workspace_id)
      REFERENCES public.runbook_instances(id, tenant_workspace_id)
      ON DELETE CASCADE;
  END IF;
END
$$;
