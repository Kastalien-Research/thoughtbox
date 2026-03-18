-- Revert product table RLS from membership-based back to project_isolation.
--
-- AUTH-01 prematurely replaced project_isolation with user_project_access
-- (membership-based). Nothing populates workspace/membership rows, so
-- all authenticated data access fails. The MCP server mints project-scoped
-- JWTs for its Supabase client; project_isolation checks that claim.
--
-- Workspace/membership tables and their own RLS policies are left untouched.
-- The user_can_access_project() function is dropped since nothing uses it.
--
-- See: .specs/deployment/auth-01-review.md

-- Drop membership-based policies on product tables
DROP POLICY IF EXISTS user_project_access ON sessions;
DROP POLICY IF EXISTS user_project_access ON thoughts;
DROP POLICY IF EXISTS user_project_access ON entities;
DROP POLICY IF EXISTS user_project_access ON relations;
DROP POLICY IF EXISTS user_project_access ON observations;

-- Restore original project_isolation policies (from 20260313000000)
CREATE POLICY project_isolation ON sessions
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON thoughts
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON entities
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON relations
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON observations
  FOR ALL USING (project = (auth.jwt() ->> 'project'));

-- Drop the helper function that is no longer used
DROP FUNCTION IF EXISTS user_can_access_project(TEXT);
