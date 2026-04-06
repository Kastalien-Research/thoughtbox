CREATE TABLE public.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  mcp_session_id text NULL,
  otel_session_id text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL
);

CREATE INDEX idx_runs_workspace_session
  ON public.runs(workspace_id, session_id, started_at);

CREATE INDEX idx_runs_workspace_mcp_session
  ON public.runs(workspace_id, mcp_session_id, started_at DESC);

CREATE INDEX idx_runs_workspace_otel_session
  ON public.runs(workspace_id, otel_session_id, started_at DESC);

CREATE UNIQUE INDEX idx_runs_workspace_mcp_session_unique
  ON public.runs(workspace_id, mcp_session_id)
  WHERE mcp_session_id IS NOT NULL;

CREATE UNIQUE INDEX idx_runs_workspace_otel_session_unique
  ON public.runs(workspace_id, otel_session_id)
  WHERE otel_session_id IS NOT NULL;

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_runs" ON public.runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "workspace_member_read_runs" ON public.runs
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
