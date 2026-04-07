-- Enable Postgres Changes for thoughts table.
-- Allows clients to subscribe via supabase-js postgres_changes instead of
-- relying on server-side ThoughtEmitter broadcast calls.
ALTER PUBLICATION supabase_realtime ADD TABLE thoughts;

-- Drop dead per-record broadcast trigger.
-- This trigger fired on every thought write and broadcast to
-- public:thoughts:{id} channels that nothing subscribes to.
DROP TRIGGER IF EXISTS trg_thoughts_broadcast ON public.thoughts;
