-- Drop the unique constraint on (workspace_id, otel_session_id).
-- One Claude Code session can produce multiple Thoughtbox sessions
-- (reconnects, MCP server restarts), all sharing the same OTEL
-- session ID. The non-unique lookup index remains.

DROP INDEX IF EXISTS public.idx_runs_workspace_otel_session_unique;
