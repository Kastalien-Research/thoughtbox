-- Fix overpermissive RLS policies from ADR-AUTH-01
--
-- 1. memberships_own: FOR ALL with no WITH CHECK allows self-enrollment
-- 2. workspaces_member: FOR ALL lets any member DELETE/UPDATE workspaces
-- 3. user_can_access_project: document known project name collision limitation

-- =============================================================================
-- Fix 1: workspace_memberships — split into granular CRUD
-- =============================================================================

DROP POLICY IF EXISTS memberships_own ON workspace_memberships;

-- Members can see their own memberships
CREATE POLICY memberships_select_own ON workspace_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Only workspace owner or admin can add members
CREATE POLICY memberships_insert_admin ON workspace_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspace_memberships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_memberships.workspace_id
        AND w.owner_user_id = auth.uid()
    )
  );

-- Only workspace owner or admin can update memberships
CREATE POLICY memberships_update_admin ON workspace_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspace_memberships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Only workspace owner or admin can remove members
CREATE POLICY memberships_delete_admin ON workspace_memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspace_memberships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- Fix 2: workspaces — split into granular CRUD
-- =============================================================================

DROP POLICY IF EXISTS workspaces_member ON workspaces;

-- Any workspace member can view the workspace
CREATE POLICY workspaces_select_member ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
    )
  );

-- Only owner or admin can update workspace settings
CREATE POLICY workspaces_update_admin ON workspaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Only owner can delete a workspace
CREATE POLICY workspaces_delete_owner ON workspaces
  FOR DELETE USING (owner_user_id = auth.uid());

-- Users can create workspaces they own
CREATE POLICY workspaces_insert_authenticated ON workspaces
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- =============================================================================
-- Fix 3: Document known limitation in user_can_access_project()
-- =============================================================================

-- KNOWN LIMITATION: user_can_access_project() matches by project name, not
-- workspace-scoped ID. Two workspaces with identically-named projects would
-- grant cross-workspace access. Fix requires adding workspace_id to product
-- tables (sessions, thoughts, entities, relations, observations) and updating
-- this function to scope by workspace. Tracked as a follow-up issue.
COMMENT ON FUNCTION user_can_access_project(TEXT) IS
  'Known limitation: matches by project name across all workspaces. '
  'Two workspaces with identically-named projects grant cross-workspace access. '
  'Fix requires workspace_id on product tables.';
