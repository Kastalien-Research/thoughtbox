-- Claim status propagation (SPEC-AGX-SUBSTRATE unit B3, claim c2).
--
-- Two changes:
--
-- 1. claims.status_changed_at — the column behind the agent-facing pull
--    primitives tb.claims.verify and tb.claims.changed_since (spec §11.1:
--    push to machines, pull for minds — agents get staleness checks and
--    digests, not pub/sub). updated_at is not sufficient: an evidence
--    append on an already-supported claim moves updated_at without a
--    status transition. The column is maintained set-on-write by the
--    claims domain handler (every status transition stamps it; assert
--    stamps it at creation); DEFAULT now() covers direct inserts.
--
-- 2. Adds `claims` to the supabase_realtime publication so subscribers
--    (web clients, the future B6 runbook-cell binding) receive
--    postgres_changes events for claim status transitions, mirroring the
--    hub realtime migration (20260611110000). Authorization rides the B1
--    RLS policies (20260612000000): claims has a workspace-membership
--    SELECT policy for `authenticated`, so Realtime delivers only rows
--    the subscriber can read.
--
-- Deliberately NOT published:
--   claim_edges          — edges are append-only structure; creating an
--                          edge changes no claim's status. The affected
--                          traversal is a pull-time query
--                          (tb.claims.affected) and v0 relevance routing
--                          is explicit subscriptions only (spec §4), so
--                          no subscriber consumes edge events today
--                          (Principle 2: reader before writer). Revisit
--                          when watch predicates land.
--   claim_subscriptions  — the subscription registry is read server-side
--                          when computing fan-out; subscribers do not
--                          watch the registry itself.
--
-- No REPLICA IDENTITY FULL: claims have no hard deletes by design —
-- invalidate and supersede are status UPDATEs that preserve the row
-- (spec §4 append-history transitions), so DELETE payloads never carry
-- signal, and INSERT/UPDATE events already include the full new row.
-- Subscribers needing the old status compare against their last-seen
-- value or call tb.claims.verify.
--
-- Idempotent: the column add is guarded by information_schema (the
-- backfill runs only when the column is first created); the publication
-- add is guarded by pg_publication_tables. Double-apply is safe.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'claims'
      AND column_name = 'status_changed_at'
  ) THEN
    ALTER TABLE public.claims
      ADD COLUMN status_changed_at timestamptz NOT NULL DEFAULT now();
    -- Backfill pre-existing rows: the last write time is the best
    -- available approximation of the last status transition.
    UPDATE public.claims SET status_changed_at = updated_at;
  END IF;
END
$$;

-- changed_since filters by tenant (plus an optional hub workspace) and
-- orders by status_changed_at.
CREATE INDEX IF NOT EXISTS idx_claims_tenant_status_changed
  ON public.claims(tenant_workspace_id, status_changed_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'claims'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
  END IF;
END
$$;
