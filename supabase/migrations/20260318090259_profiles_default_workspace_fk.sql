ALTER TABLE profiles
  ADD CONSTRAINT profiles_default_workspace_id_fkey
  FOREIGN KEY (default_workspace_id)
  REFERENCES workspaces(id)
  ON DELETE SET NULL;
