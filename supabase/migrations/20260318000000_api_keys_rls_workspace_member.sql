-- Fix api_keys RLS: allow workspace members to manage their workspace's API keys.
-- Reads use service role (bypasses RLS). This policy covers UI create/list/revoke.

CREATE POLICY api_keys_workspace_member ON api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = api_keys.workspace_id
        AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = api_keys.workspace_id
        AND wm.user_id = auth.uid()
    )
  );
