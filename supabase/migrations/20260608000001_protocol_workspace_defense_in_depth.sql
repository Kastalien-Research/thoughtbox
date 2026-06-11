-- Defense-in-depth tenant isolation for protocol-enforcement tables.
--
-- Background: protocol_sessions.workspace_id was text and mixed three eras of
-- data: real tenant UUIDs (from 2026-04-23 on), pre-multi-tenancy NULLs, and
-- dev project-name strings ("thoughtbox-staging", "thoughtbox-webpage-2026").
-- The child tables (audits/history/scope/visas) had no workspace_id at all and
-- relied solely on the session_id FK chain for isolation.
--
-- This migration removes the legacy/dev rows, normalizes workspace_id to uuid
-- with a workspaces FK, and gives the child tables their own NOT NULL
-- workspace_id (backfilled from the parent, kept in sync by a trigger).

-- 1. Delete legacy/dev sessions (NULL, non-uuid, or not a real workspace).
--    Children cascade via existing ON DELETE CASCADE FKs.
DELETE FROM public.protocol_sessions ps
WHERE ps.workspace_id IS NULL
   OR ps.workspace_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR NOT EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id::text = ps.workspace_id);

-- 2. Drop the workspace-scoped policy before altering the column type
--    (a policy referencing the column blocks ALTER COLUMN TYPE).
DROP POLICY IF EXISTS tenant_member_read ON public.protocol_sessions;

-- 3. Normalize workspace_id to uuid + NOT NULL, and add the workspaces FK.
ALTER TABLE public.protocol_sessions
  ALTER COLUMN workspace_id TYPE uuid USING workspace_id::uuid,
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.protocol_sessions
  ADD CONSTRAINT protocol_sessions_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 4. Recreate the policy without the text cast (now uuid = uuid).
CREATE POLICY tenant_member_read ON public.protocol_sessions
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- 5. Add workspace_id to the child tables (nullable for backfill).
ALTER TABLE public.protocol_audits  ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE public.protocol_history ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE public.protocol_scope   ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE public.protocol_visas   ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- 6. Backfill from the parent session.
UPDATE public.protocol_audits  c SET workspace_id = s.workspace_id FROM public.protocol_sessions s WHERE s.id = c.session_id;
UPDATE public.protocol_history c SET workspace_id = s.workspace_id FROM public.protocol_sessions s WHERE s.id = c.session_id;
UPDATE public.protocol_scope   c SET workspace_id = s.workspace_id FROM public.protocol_sessions s WHERE s.id = c.session_id;
UPDATE public.protocol_visas   c SET workspace_id = s.workspace_id FROM public.protocol_sessions s WHERE s.id = c.session_id;

-- 7. Enforce NOT NULL + workspaces FK + index on each child table.
ALTER TABLE public.protocol_audits  ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.protocol_audits  ADD CONSTRAINT protocol_audits_workspace_id_fkey  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_protocol_audits_workspace  ON public.protocol_audits(workspace_id);

ALTER TABLE public.protocol_history ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.protocol_history ADD CONSTRAINT protocol_history_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_protocol_history_workspace ON public.protocol_history(workspace_id);

ALTER TABLE public.protocol_scope   ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.protocol_scope   ADD CONSTRAINT protocol_scope_workspace_id_fkey   FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_protocol_scope_workspace   ON public.protocol_scope(workspace_id);

ALTER TABLE public.protocol_visas   ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.protocol_visas   ADD CONSTRAINT protocol_visas_workspace_id_fkey   FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_protocol_visas_workspace   ON public.protocol_visas(workspace_id);

-- 8. Keep child workspace_id in sync with the parent session automatically,
--    so app inserts cannot omit or mis-set it. Explicit values are respected.
CREATE OR REPLACE FUNCTION public.set_protocol_child_workspace_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM public.protocol_sessions WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_workspace_id BEFORE INSERT ON public.protocol_audits  FOR EACH ROW EXECUTE FUNCTION public.set_protocol_child_workspace_id();
CREATE TRIGGER trg_set_workspace_id BEFORE INSERT ON public.protocol_history FOR EACH ROW EXECUTE FUNCTION public.set_protocol_child_workspace_id();
CREATE TRIGGER trg_set_workspace_id BEFORE INSERT ON public.protocol_scope   FOR EACH ROW EXECUTE FUNCTION public.set_protocol_child_workspace_id();
CREATE TRIGGER trg_set_workspace_id BEFORE INSERT ON public.protocol_visas   FOR EACH ROW EXECUTE FUNCTION public.set_protocol_child_workspace_id();
