-- Enforce that runbook_fitness_ledger's denormalized (template_id,
-- template_version) columns match the owning instance's template pinning
-- (Greptile review of PR #401, P1: the aggregate key §7 had no DB-level
-- enforcement — a buggy write path or direct insert could store mismatched
-- values and silently poison getFitnessAggregate results).
--
-- A direct composite FK to runbook_templates(template_id, version) would
-- only prove the referenced template version EXISTS; it would not prevent a
-- ledger row from carrying a different (existing) version than its instance
-- pins. The stronger constraint references the instance row itself on
-- (id, template_id, template_version): the match is enforced directly, and
-- template existence follows transitively through runbook_instances' own
-- composite FK to runbook_templates.
--
-- This is a NEW migration (not an edit of 20260612120000, which may already
-- be applied). Version note: strictly greater than 20260612120000 and the
-- open-PR versions 20260612000000 / 20260612090000 on the claims branches.
--
-- Idempotent: both constraint additions are guarded by pg_constraint
-- lookups, so double-apply is safe. DDL runs as the table owner, so the
-- revoked UPDATE/DELETE grants on the runbook tables do not interfere, and
-- FK cascade actions keep executing with owner rights.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_instances_id_template_version_key'
      AND conrelid = 'public.runbook_instances'::regclass
  ) THEN
    -- Superkey of the primary key (id); exists only as the FK target below.
    ALTER TABLE public.runbook_instances
      ADD CONSTRAINT runbook_instances_id_template_version_key
      UNIQUE (id, template_id, template_version);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'runbook_fitness_ledger_instance_pinning_fkey'
      AND conrelid = 'public.runbook_fitness_ledger'::regclass
  ) THEN
    ALTER TABLE public.runbook_fitness_ledger
      ADD CONSTRAINT runbook_fitness_ledger_instance_pinning_fkey
      FOREIGN KEY (instance_id, template_id, template_version)
      REFERENCES public.runbook_instances(id, template_id, template_version)
      ON DELETE CASCADE;
  END IF;
END
$$;
