-- Tenant-scope the runbook_templates key and the instance→template FK
-- (Greptile review of PR #401, P1: template keys not tenant-scoped).
--
-- runbook_templates' PRIMARY KEY is (template_id, version) — global. The
-- runtime sets template_id to the notebook id, so two tenants using the same
-- notebook id collide: the second tenant's saveTemplate hits the global PK
-- (surfaced as a spurious TemplateVersionConflictError) even though its own
-- tenant-scoped view holds no such template. Worse, runbook_instances'
-- template FK is (template_id, template_version) → templates(template_id,
-- version), omitting tenant — so a tenant's instance can satisfy its FK from
-- ANOTHER tenant's immutable template row and pin to a workspace it cannot
-- read.
--
-- Fix: put tenant_workspace_id into the template key and the referencing FK,
-- so templates and the instances that pin them are isolated per tenant.
-- Same family as the child-FK scoping in 20260613020000.
--
-- This is a NEW migration (not an edit of the already-applied 20260612120000),
-- following the 20260612130000 / 20260613020000 convention. Version note:
-- strictly greater than 20260613020000.
--
-- Idempotent: the PK swap is gated on the old (template_id, version) shape and
-- the FK swap on constraint-name lookups, so double-apply is safe. DDL runs as
-- the table owner, so the revoked UPDATE/DELETE grants on the runbook tables
-- do not interfere, and FK cascade actions keep executing with owner rights.

DO $$
BEGIN
  -- Drop the instance→template FK first: it depends on the (template_id,
  -- version) PK as its unique target, so the PK cannot be dropped while it
  -- exists.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_instances_template_id_template_version_fkey'
      AND conrelid = 'public.runbook_instances'::regclass
  ) THEN
    ALTER TABLE public.runbook_instances
      DROP CONSTRAINT runbook_instances_template_id_template_version_fkey;
  END IF;

  -- Swap the template PK to include tenant_workspace_id. Gated on the old
  -- two-column shape so a re-run (PK already tenant-scoped) is a no-op.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.runbook_templates'::regclass
      AND contype = 'p'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (template_id, version)'
  ) THEN
    ALTER TABLE public.runbook_templates DROP CONSTRAINT runbook_templates_pkey;
    ALTER TABLE public.runbook_templates
      ADD CONSTRAINT runbook_templates_pkey
      PRIMARY KEY (tenant_workspace_id, template_id, version);
  END IF;

  -- Re-add the instance→template FK, now tenant-composite.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_instances_template_tenant_fkey'
      AND conrelid = 'public.runbook_instances'::regclass
  ) THEN
    ALTER TABLE public.runbook_instances
      ADD CONSTRAINT runbook_instances_template_tenant_fkey
      FOREIGN KEY (tenant_workspace_id, template_id, template_version)
      REFERENCES public.runbook_templates(tenant_workspace_id, template_id, version)
      ON DELETE CASCADE;
  END IF;
END
$$;
