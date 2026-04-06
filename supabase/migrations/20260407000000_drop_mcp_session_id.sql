-- Kill the redundant mcp_session_id columns.
-- sessions.id IS the MCP session ID now. No separate column needed.

-- Runs: drop mcp_session_id and its indexes
DROP INDEX IF EXISTS public.idx_runs_workspace_mcp_session;
DROP INDEX IF EXISTS public.idx_runs_workspace_mcp_session_unique;
ALTER TABLE public.runs DROP COLUMN IF EXISTS mcp_session_id;

-- Sessions: drop mcp_session_id
ALTER TABLE public.sessions DROP COLUMN IF EXISTS mcp_session_id;
