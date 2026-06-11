-- Hub Realtime delivery (SPEC-V1-INITIATIVE Phase 4.4, claim c12).
-- Adds the hub coordination tables that carry events to the
-- supabase_realtime publication so clients can subscribe via
-- postgres_changes. Authorization rides the RLS policies from the Phase 4.3
-- migration (20260611000000): every published table has a
-- workspace-membership SELECT policy for `authenticated`, and Realtime
-- delivers only rows the subscriber can read.
--
-- Published (what a coordinating subscriber needs without polling):
--   hub_channel_messages        — channel message appends (the c12 core)
--   hub_workspaces              — agent roster / workspace state changes
--   hub_problems                — created / claimed / status transitions
--   hub_proposals               — opened / reviewing / merged transitions
--   hub_proposal_reviews        — review appends (proposal author reacts)
--   hub_consensus_markers       — consensus proposed
--   hub_consensus_endorsements  — endorsement appends (consensus formation)
--
-- Deliberately NOT published:
--   hub_agents   — global registry, not tenant-scoped; its RLS policy only
--                  exposes rows where user_id = auth.uid() (NULL for most
--                  agents), so Realtime would deliver nothing useful.
--   hub_channels — 1:1 with problems (UNIQUE(workspace_id, problem_id));
--                  channel creation is implied by problem events, and
--                  messages already carry channel_id.
--
-- No REPLICA IDENTITY FULL: INSERT/UPDATE events are the coordination
-- signal; full-row DELETE payloads are not needed and would bloat WAL on
-- the message-heavy tables.
--
-- Idempotent: each table is added only if not already in the publication,
-- so double-apply is safe.

DO $$
DECLARE
  hub_table text;
BEGIN
  FOREACH hub_table IN ARRAY ARRAY[
    'hub_channel_messages',
    'hub_workspaces',
    'hub_problems',
    'hub_proposals',
    'hub_proposal_reviews',
    'hub_consensus_markers',
    'hub_consensus_endorsements'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = hub_table
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        hub_table
      );
    END IF;
  END LOOP;
END
$$;
