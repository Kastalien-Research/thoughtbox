-- Protocol event log (SPEC-REASONING-CHANNEL-HOSTED, claim c2).
-- Append-only persistence of the protocol lifecycle event stream
-- (ulysses_*/theseus_*) the handler emits via onProtocolEvent. In local mode
-- that stream is broadcast in-process over /events SSE; in hosted
-- (multi-tenant) Cloud Run it must be durable and cross-replica so the
-- reasoning channel can pull it (changed_since) scoped to its workspace.
--
-- Distinct from protocol_history: that table is the session-keyed audit log
-- with operation-level event_type (plan/outcome/reflect/checkpoint/...). This
-- table mirrors the richer ThoughtboxEvent taxonomy (nine lifecycle types,
-- including init/visa/complete) the channel consumes, identical to local SSE.
--
-- Copies the proven tenant-scoping pattern (claims, 20260612000000):
-- tenant_workspace_id FK to public.workspaces; RLS with service_role full
-- access (the server scopes every query) plus a workspace-membership SELECT
-- policy for future authenticated/anon-key reads. The bigint identity id is
-- the monotonic pull cursor used by changed_since.
--
-- Idempotent: IF NOT EXISTS guards on table/index; policies are dropped
-- before creation so a double-apply is safe.

CREATE TABLE IF NOT EXISTS public.protocol_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'protocol' CHECK (source IN ('hub', 'protocol')),
  type text NOT NULL,
  session_id text,
  event_timestamp timestamptz NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- changed_since query: WHERE tenant_workspace_id = $1 AND id > $cursor ORDER BY id
CREATE INDEX IF NOT EXISTS idx_protocol_events_tenant_id
  ON public.protocol_events(tenant_workspace_id, id);

-- ---------------------------------------------------------------------------
-- RLS — the server uses service_role (bypasses RLS) and scopes every query by
-- tenant_workspace_id; the workspace-membership SELECT policy exists for
-- future authenticated/anon-key access, matching the claims/hub pattern.
-- ---------------------------------------------------------------------------

ALTER TABLE public.protocol_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_protocol_events" ON public.protocol_events;
CREATE POLICY "service_role_full_access_protocol_events" ON public.protocol_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workspace_member_read_protocol_events" ON public.protocol_events;
CREATE POLICY "workspace_member_read_protocol_events" ON public.protocol_events
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
