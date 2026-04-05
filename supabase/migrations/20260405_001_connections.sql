CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  project_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_connections_workspace ON connections(workspace_id);
CREATE INDEX idx_connections_started ON connections(started_at DESC);
CREATE INDEX idx_connections_active ON connections(workspace_id) WHERE ended_at IS NULL;

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_workspace_isolation" ON connections
  FOR ALL USING (workspace_id = current_setting('app.workspace_id', true)::uuid);
