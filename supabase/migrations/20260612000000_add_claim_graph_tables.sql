-- Claim graph tables (SPEC-AGX-SUBSTRATE units B1/B2, claim c1).
-- Claims are first-class typed assertions with provenance, status,
-- dependency edges, and explicit subscriptions (spec §4 data model v0).
--
-- Copies the proven hub-table pattern (20260611000000):
--   (a) tenant_workspace_id FK on every table, scoping all rows to a SaaS
--       workspace (public.workspaces) for tenant isolation from day one;
--   (b) workspace_id FK to hub_workspaces — claims live in hub
--       coordination spaces, like problems and proposals;
--   (c) RLS: service_role full access (server enforces tenant scope in
--       queries); workspace-membership SELECT policies for authenticated
--       (future Realtime/web anon-key access, B3);
--   (d) the claim aggregate carries a `version` column for optimistic
--       concurrency; edges and subscriptions are append-style rows keyed
--       by natural PKs so concurrent writers never lose appends.
--
-- Status transitions are append-history-style: invalidate/supersede update
-- status (+ superseded_by pointer) but never delete the row. No hard
-- deletes in v0 beyond workspace-cascade cleanup.
--
-- Idempotent: IF NOT EXISTS guards on tables and indexes; policies are
-- dropped before creation so double-apply is safe.

CREATE TABLE IF NOT EXISTS public.claims (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES public.hub_workspaces(id) ON DELETE CASCADE,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (
    type IN ('assumption', 'decision', 'observation', 'requirement', 'outcome')
  ),
  statement text NOT NULL,
  status text NOT NULL DEFAULT 'asserted' CHECK (
    status IN ('asserted', 'supported', 'invalidated', 'superseded')
  ),
  evidence_refs jsonb NOT NULL DEFAULT '[]',
  created_by text NOT NULL,
  superseded_by text REFERENCES public.claims(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.claim_edges (
  from_claim text NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  to_claim text NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (
    kind IN ('depends_on', 'derives_from', 'contradicts')
  ),
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_claim, to_claim, kind)
);

CREATE TABLE IF NOT EXISTS public.claim_subscriptions (
  claim_id text NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  subscriber text NOT NULL,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (claim_id, subscriber)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_claims_tenant ON public.claims(tenant_workspace_id);
CREATE INDEX IF NOT EXISTS idx_claims_workspace ON public.claims(workspace_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
-- from_claim lookups ride the PK prefix; to_claim needs its own index for
-- the reverse depends_on traversal in tb.claims.affected.
CREATE INDEX IF NOT EXISTS idx_claim_edges_to ON public.claim_edges(to_claim, kind);
CREATE INDEX IF NOT EXISTS idx_claim_edges_tenant ON public.claim_edges(tenant_workspace_id);
CREATE INDEX IF NOT EXISTS idx_claim_subscriptions_subscriber
  ON public.claim_subscriptions(subscriber);
CREATE INDEX IF NOT EXISTS idx_claim_subscriptions_tenant
  ON public.claim_subscriptions(tenant_workspace_id);

-- ---------------------------------------------------------------------------
-- RLS — server uses service_role (bypasses RLS); workspace-membership SELECT
-- policies exist for future Realtime/web anon-key access (B3).
-- ---------------------------------------------------------------------------

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_claims" ON public.claims;
CREATE POLICY "service_role_full_access_claims" ON public.claims
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_member_read_claims" ON public.claims;
CREATE POLICY "workspace_member_read_claims" ON public.claims
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_full_access_claim_edges" ON public.claim_edges;
CREATE POLICY "service_role_full_access_claim_edges" ON public.claim_edges
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_member_read_claim_edges" ON public.claim_edges;
CREATE POLICY "workspace_member_read_claim_edges" ON public.claim_edges
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_full_access_claim_subscriptions" ON public.claim_subscriptions;
CREATE POLICY "service_role_full_access_claim_subscriptions" ON public.claim_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "workspace_member_read_claim_subscriptions" ON public.claim_subscriptions;
CREATE POLICY "workspace_member_read_claim_subscriptions" ON public.claim_subscriptions
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
