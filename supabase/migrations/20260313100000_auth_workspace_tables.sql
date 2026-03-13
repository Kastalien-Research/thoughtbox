-- ADR-AUTH-01: Auth Workspace Tables and RLS Policy Migration
--
-- Creates profiles, workspaces, workspace_memberships, projects tables.
-- Rewrites RLS policies on 5 product tables from project-claim to
-- user-membership via auth.uid() + workspace_memberships.
--
-- Prerequisite: 20260313000000_create_product_schema.sql must have run first.

-- =============================================================================
-- profiles
-- =============================================================================

CREATE TABLE profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_workspace_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_own ON profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- workspaces
-- =============================================================================

CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- workspace_member policy deferred until workspace_memberships table exists

CREATE TRIGGER trigger_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- workspace_memberships
-- =============================================================================

CREATE TABLE workspace_memberships (
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role               TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  invited_by_user_id UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY memberships_own ON workspace_memberships
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY memberships_workspace_admin ON workspace_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspace_memberships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Now safe to create workspace policy referencing workspace_memberships
CREATE POLICY workspaces_member ON workspaces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- projects
-- =============================================================================

CREATE TABLE projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL,
  description        TEXT,
  status             TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_member ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = projects.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- Helper function for product table RLS
-- =============================================================================

CREATE OR REPLACE FUNCTION user_can_access_project(project_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    JOIN workspace_memberships wm ON wm.workspace_id = p.workspace_id
    WHERE p.name = project_name
      AND wm.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- Rewrite RLS policies on 5 product tables
-- =============================================================================

-- sessions
DROP POLICY IF EXISTS project_isolation ON sessions;
CREATE POLICY user_project_access ON sessions
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

-- thoughts
DROP POLICY IF EXISTS project_isolation ON thoughts;
CREATE POLICY user_project_access ON thoughts
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

-- entities
DROP POLICY IF EXISTS project_isolation ON entities;
CREATE POLICY user_project_access ON entities
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

-- relations
DROP POLICY IF EXISTS project_isolation ON relations;
CREATE POLICY user_project_access ON relations
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

-- observations
DROP POLICY IF EXISTS project_isolation ON observations;
CREATE POLICY user_project_access ON observations
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));
