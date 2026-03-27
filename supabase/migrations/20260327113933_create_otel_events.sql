-- OTLP event storage for Claude Code telemetry ingestion
-- Stores flattened log records and metric data points from OTLP/HTTP JSON

CREATE TABLE otel_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  session_id text,
  event_type text NOT NULL CHECK (event_type IN ('log', 'metric')),
  event_name text NOT NULL,
  severity text,
  timestamp_ns bigint NOT NULL,
  timestamp_at timestamptz NOT NULL,
  resource_attrs jsonb DEFAULT '{}',
  event_attrs jsonb DEFAULT '{}',
  body text,
  metric_value double precision,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_otel_events_workspace_session
  ON otel_events(workspace_id, session_id, timestamp_at);

CREATE INDEX idx_otel_events_workspace_type
  ON otel_events(workspace_id, event_type, event_name);

ALTER TABLE otel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON otel_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "workspace_member_read" ON otel_events
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
