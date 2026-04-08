-- Migration: Add branches table for parallel branch exploration
-- Supports SPEC-BRANCH-WORKERS.md: edge function branch workers with spawn/merge lifecycle

-- 1. Branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  branch_id text NOT NULL,
  description text,
  branch_from_thought integer NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'merged', 'rejected', 'abandoned')),
  spawned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  merge_thought_number integer,
  created_by text,
  UNIQUE(session_id, branch_id)
);

CREATE INDEX idx_branches_session ON public.branches(session_id);
CREATE INDEX idx_branches_workspace ON public.branches(workspace_id);

-- 2. RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.branches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.branches IS
  'Branch metadata is currently service-role-only; authenticated clients read branch state through the backend API.';

-- 3. Partial unique indexes on thoughts for branch-scoped numbering
-- Main track: unique thought number per session (where no branch)
CREATE UNIQUE INDEX IF NOT EXISTS thoughts_main_track_unique
  ON public.thoughts(session_id, thought_number)
  WHERE branch_id IS NULL;

-- Per branch: unique thought number per session + branch
CREATE UNIQUE INDEX IF NOT EXISTS thoughts_branch_unique
  ON public.thoughts(session_id, branch_id, thought_number)
  WHERE branch_id IS NOT NULL;

-- 4. Auto-complete branch when final thought is written
CREATE OR REPLACE FUNCTION public.auto_complete_branch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.branch_id IS NOT NULL AND NEW.next_thought_needed = false THEN
    UPDATE public.branches
    SET status = 'completed', completed_at = now()
    WHERE session_id = NEW.session_id
      AND branch_id = NEW.branch_id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_complete_branch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_complete_branch() TO postgres, service_role;

CREATE TRIGGER trg_auto_complete_branch
  AFTER INSERT ON public.thoughts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_branch();

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;

SELECT 'Migration complete: branches table, scoped numbering indexes, auto-complete trigger.' as status;
