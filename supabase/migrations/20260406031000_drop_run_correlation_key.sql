DROP INDEX IF EXISTS public.idx_sessions_workspace_run_correlation;

DROP INDEX IF EXISTS public.idx_otel_events_workspace_run_correlation;

ALTER TABLE public.sessions
DROP COLUMN IF EXISTS run_correlation_key;

ALTER TABLE public.otel_events
DROP COLUMN IF EXISTS run_correlation_key;
