-- Server-side cost aggregation for otel_events.
-- Replaces client-side GROUP BY to keep memory bounded as table grows.

CREATE OR REPLACE FUNCTION otel_session_cost(
  p_workspace_id uuid,
  p_session_id text DEFAULT NULL
)
RETURNS TABLE (
  model text,
  total_cost double precision,
  data_points bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(event_attrs->>'model', 'unknown') AS model,
    SUM(metric_value) AS total_cost,
    COUNT(*) AS data_points
  FROM otel_events
  WHERE workspace_id = p_workspace_id
    AND event_type = 'metric'
    AND event_name = 'claude_code.cost.usage'
    AND (p_session_id IS NULL OR session_id = p_session_id)
  GROUP BY model
$$;
