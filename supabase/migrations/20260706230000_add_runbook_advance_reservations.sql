-- Runbook advance reservations (SPEC-AGX-SUBSTRATE B8 — GH #403
-- double-execute guard).
--
-- tb.runbook.advance must run an exec cell's side effects EXACTLY ONCE
-- across concurrent advancers. The runbook tables are append-only (no
-- UPDATE path — 20260612120000 revokes it even from service_role), so the
-- textbook "reserve a running row, then finalize it" is impossible.
-- Instead, an advancer performs a compare-and-swap by INSERTING a
-- reservation row keyed (instance_id, seq) BEFORE executing anything: the
-- primary key guarantees exactly one concurrent insert commits, every
-- loser observes 23505 and backs off having run no side effect, and the
-- winner appends the execution record at the reserved seq.
--
-- Reservations are themselves append-only (UPDATE/DELETE revoked below):
-- a reservation can never be stolen or erased. A reservation whose seq has
-- no matching execution record marks an in-flight — or crashed — advance;
-- tb.runbook.advance surfaces it as `in_flight`, and only an explicit
-- `force` (documented double-execute acceptance) skips past it.
--
-- Pattern notes: tenant_workspace_id on every row + tenant-composite
-- instance FK (structural isolation per 20260613020000), service_role
-- full-access policy + workspace-membership SELECT policy (hub/claims
-- pattern), idempotent DDL.

CREATE TABLE IF NOT EXISTS public.runbook_advance_reservations (
  instance_id text NOT NULL,
  seq integer NOT NULL CHECK (seq >= 1),
  cell_id text NOT NULL,
  tenant_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_id, seq),
  CONSTRAINT runbook_advance_reservations_instance_tenant_fkey
    FOREIGN KEY (instance_id, tenant_workspace_id)
    REFERENCES public.runbook_instances(id, tenant_workspace_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_runbook_advance_reservations_tenant
  ON public.runbook_advance_reservations(tenant_workspace_id);

-- Append-only enforcement: reservations are CAS claims — they must never be
-- rewritable, or the exactly-once guarantee dies. Grants bind even
-- bypassrls roles; workspace-cascade cleanup still works (RI actions run
-- with the table owner's privileges).
REVOKE UPDATE, DELETE, TRUNCATE ON public.runbook_advance_reservations
  FROM anon, authenticated, service_role;

ALTER TABLE public.runbook_advance_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_runbook_advance_reservations"
  ON public.runbook_advance_reservations;
CREATE POLICY "service_role_full_access_runbook_advance_reservations"
  ON public.runbook_advance_reservations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workspace_member_read_runbook_advance_reservations"
  ON public.runbook_advance_reservations;
CREATE POLICY "workspace_member_read_runbook_advance_reservations"
  ON public.runbook_advance_reservations
  FOR SELECT TO authenticated
  USING (
    tenant_workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
