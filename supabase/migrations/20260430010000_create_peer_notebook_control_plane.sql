-- ADR-022 Part 1: Durable peer notebook control-plane persistence.
-- Cloud Run/service-role writes rows; authenticated product surfaces read by
-- workspace membership.

CREATE TABLE IF NOT EXISTS public.peer_notebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  slug text NOT NULL,
  display_name text NOT NULL,
  description text NULL,
  source_notebook_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'disabled', 'archived')),
  active_manifest_id uuid NULL,
  created_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS public.peer_manifests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  peer_id uuid NOT NULL REFERENCES public.peer_notebooks(id) ON DELETE CASCADE,
  version integer NOT NULL,
  schema_version text NOT NULL,
  manifest jsonb NOT NULL,
  manifest_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'active', 'retired', 'rejected')),
  compiled_from jsonb NOT NULL,
  created_by text NULL,
  approved_by text NULL,
  approved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (peer_id, version),
  UNIQUE (peer_id, manifest_hash)
);

CREATE TABLE IF NOT EXISTS public.peer_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  peer_id uuid NOT NULL REFERENCES public.peer_notebooks(id) ON DELETE CASCADE,
  manifest_id uuid NOT NULL REFERENCES public.peer_manifests(id) ON DELETE RESTRICT,
  caller_type text NOT NULL DEFAULT 'agent'
    CHECK (caller_type IN ('agent', 'scheduler', 'peer', 'user', 'system')),
  caller_id text NULL,
  parent_invocation_id uuid NULL REFERENCES public.peer_invocations(id) ON DELETE SET NULL,
  tool_name text NOT NULL,
  args_hash text NOT NULL,
  result_hash text NULL,
  manifest_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'denied', 'timeout', 'cancelled')),
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  duration_ms integer NULL,
  runtime_provider text NOT NULL CHECK (runtime_provider IN ('mock', 'local-process', 'smolvm')),
  runtime_instance_id text NULL,
  error jsonb NULL,
  result jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.peer_trace_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invocation_id uuid NOT NULL REFERENCES public.peer_invocations(id) ON DELETE CASCADE,
  seq bigint NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('debug', 'info', 'warn', 'error')),
  timestamp_at timestamptz NOT NULL DEFAULT now(),
  body text NULL,
  attrs jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (invocation_id, seq)
);

CREATE TABLE IF NOT EXISTS public.peer_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invocation_id uuid NULL REFERENCES public.peer_invocations(id) ON DELETE CASCADE,
  peer_id uuid NULL REFERENCES public.peer_notebooks(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('notebook_export', 'json', 'text', 'log', 'dataset', 'report', 'binary')),
  name text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  sha256 text NOT NULL,
  storage_backend text NOT NULL CHECK (storage_backend IN ('supabase_storage')),
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  preview jsonb NULL,
  retention_expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peer_notebooks_workspace_status
  ON public.peer_notebooks(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_peer_manifests_workspace_peer_status
  ON public.peer_manifests(workspace_id, peer_id, status);

CREATE INDEX IF NOT EXISTS idx_peer_invocations_workspace_peer_created
  ON public.peer_invocations(workspace_id, peer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_peer_invocations_workspace_status_created
  ON public.peer_invocations(workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_peer_trace_events_workspace_invocation_seq
  ON public.peer_trace_events(workspace_id, invocation_id, seq);

CREATE INDEX IF NOT EXISTS idx_peer_artifacts_workspace_invocation
  ON public.peer_artifacts(workspace_id, invocation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_peer_artifacts_workspace_peer
  ON public.peer_artifacts(workspace_id, peer_id, created_at DESC);

ALTER TABLE public.peer_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_trace_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_peer_notebooks" ON public.peer_notebooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_peer_notebooks" ON public.peer_notebooks
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_peer_manifests" ON public.peer_manifests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_peer_manifests" ON public.peer_manifests
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_peer_invocations" ON public.peer_invocations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_peer_invocations" ON public.peer_invocations
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_peer_trace_events" ON public.peer_trace_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_peer_trace_events" ON public.peer_trace_events
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_peer_artifacts" ON public.peer_artifacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_member_read_peer_artifacts" ON public.peer_artifacts
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('peer-artifacts', 'peer-artifacts', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET public = excluded.public,
    file_size_limit = excluded.file_size_limit;

DROP POLICY IF EXISTS "service_role_full_access_peer_artifact_objects" ON storage.objects;
CREATE POLICY "service_role_full_access_peer_artifact_objects" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'peer-artifacts')
  WITH CHECK (bucket_id = 'peer-artifacts');

DROP POLICY IF EXISTS "workspace_member_read_peer_artifact_objects" ON storage.objects;
CREATE POLICY "workspace_member_read_peer_artifact_objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'peer-artifacts'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    AND split_part(name, '/', 1)::uuid IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.peer_notebooks IS
  'ADR-022 governed peer notebook identities. Active manifests are control-plane records, not runtime-owned state.';
COMMENT ON TABLE public.peer_artifacts IS
  'ADR-022 artifact metadata. Payloads live in the private peer-artifacts Supabase Storage bucket; invocation_id is nullable for seeded input artifacts.';
