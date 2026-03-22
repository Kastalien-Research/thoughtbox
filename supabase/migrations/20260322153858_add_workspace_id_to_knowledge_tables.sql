-- Add workspace_id to knowledge graph tables (entities, relations, observations).
-- Code (supabase-storage.ts) already inserts workspace_id on every write,
-- but the column was never created. The old 'project' column was dropped in
-- migration 20260320200448 without a replacement.
--
-- Also re-incorporates two dashboard-applied SQL changes that were remote-only:
--   20260321084708: Drop redundant api_keys_workspace_member RLS policy
--   20260321084709: Update handle_new_user() display_name derivation

-- ============================================================================
-- 1. Add workspace_id columns
-- ============================================================================

ALTER TABLE entities ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE relations ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- ============================================================================
-- 2. Backfill existing rows with the default workspace
-- ============================================================================

UPDATE entities SET workspace_id = (SELECT id FROM workspaces LIMIT 1) WHERE workspace_id IS NULL;
UPDATE relations SET workspace_id = (SELECT id FROM workspaces LIMIT 1) WHERE workspace_id IS NULL;
UPDATE observations SET workspace_id = (SELECT id FROM workspaces LIMIT 1) WHERE workspace_id IS NULL;

-- ============================================================================
-- 3. Add NOT NULL constraint (safe now that all rows are backfilled)
-- ============================================================================

ALTER TABLE entities ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE relations ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE observations ALTER COLUMN workspace_id SET NOT NULL;

-- ============================================================================
-- 4. Foreign key to workspaces table
-- ============================================================================

ALTER TABLE entities ADD CONSTRAINT entities_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE relations ADD CONSTRAINT relations_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE observations ADD CONSTRAINT observations_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ============================================================================
-- 5. Indexes for workspace-scoped queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_entities_workspace ON entities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_relations_workspace ON relations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_observations_workspace ON observations(workspace_id);

-- ============================================================================
-- 6. Update UNIQUE constraint: (name, type) → (workspace_id, name, type)
-- ============================================================================

ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_name_type_key;
ALTER TABLE entities ADD CONSTRAINT entities_workspace_name_type_key
  UNIQUE (workspace_id, name, type);

-- ============================================================================
-- 7. Workspace-scoped RLS policies for knowledge tables
-- ============================================================================

CREATE POLICY workspace_member_access ON entities
  FOR ALL USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY workspace_member_access ON relations
  FOR ALL USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY workspace_member_access ON observations
  FOR ALL USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_memberships wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. Re-incorporate remote-only dashboard changes (20260321084708)
-- ============================================================================

DROP POLICY IF EXISTS "api_keys_workspace_member" ON "public"."api_keys";

-- ============================================================================
-- 9. Re-incorporate remote-only dashboard changes (20260321084709)
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
  RETURNS TRIGGER
  LANGUAGE "plpgsql" SECURITY DEFINER
  AS $$
DECLARE
  workspace_id UUID := gen_random_uuid();
  workspace_name TEXT;
  workspace_slug TEXT;
  computed_display_name TEXT;
BEGIN
  computed_display_name := NULLIF(
    trim(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ),
    ''
  );
  computed_display_name := COALESCE(computed_display_name, split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, computed_display_name);

  workspace_name := split_part(NEW.email, '@', 1) || '''s Workspace';
  workspace_slug := lower(split_part(NEW.email, '@', 1)) || '-' || lower(substring(replace(workspace_id::text, '-', ''), 1, 4));

  INSERT INTO public.workspaces (id, name, slug, owner_user_id, status, plan_id)
  VALUES (workspace_id, workspace_name, workspace_slug, NEW.id, 'active', 'free');

  INSERT INTO public.workspace_memberships (workspace_id, user_id, role)
  VALUES (workspace_id, NEW.id, 'owner');

  UPDATE public.profiles
  SET default_workspace_id = workspace_id
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;
