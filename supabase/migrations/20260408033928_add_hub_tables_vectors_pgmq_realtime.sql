-- Migration: Add pgmq-based intelligence pipeline foundations for branch release
-- Ship scope: keep processing queues and worker invocation helpers; defer hub and embeddings.

-- 1. Enable extensions required for queue processing and scheduled worker invocation.
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. pgmq queues for intelligence pipeline.
SELECT FROM pgmq.create('thought_processing');
SELECT FROM pgmq.create('entity_processing');
SELECT FROM pgmq.create('session_closing');

-- 3. RPC wrappers: expose pgmq.read / pgmq.archive to PostgREST for Edge Function queue workers.
-- service_role only — Edge Functions use the service role key.
CREATE OR REPLACE FUNCTION public.pgmq_read_queue(
  queue_name text,
  vt integer DEFAULT 30,
  qty integer DEFAULT 5
)
RETURNS SETOF pgmq.message_record
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
  SELECT * FROM pgmq.read(queue_name, vt, qty);
$$;

REVOKE ALL ON FUNCTION public.pgmq_read_queue(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pgmq_read_queue(text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.pgmq_archive_queue_message(
  queue_name text,
  msg_id bigint
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
  SELECT pgmq.archive(queue_name, msg_id);
$$;

REVOKE ALL ON FUNCTION public.pgmq_archive_queue_message(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pgmq_archive_queue_message(text, bigint) TO service_role;

-- 4. Triggers to enqueue work after writes.
CREATE OR REPLACE FUNCTION public.enqueue_thought_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  PERFORM pgmq.send('thought_processing', jsonb_build_object('thought_id', NEW.id, 'action', 'process'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_thought_insert_enqueue ON public.thoughts;
CREATE TRIGGER trg_thought_insert_enqueue
  AFTER INSERT ON public.thoughts
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_thought_processing();

CREATE OR REPLACE FUNCTION public.enqueue_entity_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  PERFORM pgmq.send('entity_processing', jsonb_build_object('entity_id', NEW.id, 'action', 'process'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_entity_insert_enqueue ON public.entities;
CREATE TRIGGER trg_entity_insert_enqueue
  AFTER INSERT ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_entity_processing();

REVOKE ALL ON FUNCTION public.enqueue_thought_processing() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_thought_processing() TO postgres, service_role;

REVOKE ALL ON FUNCTION public.enqueue_entity_processing() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_entity_processing() TO postgres, service_role;

-- 5. Queue worker invocation helpers.
-- Configure Vault secrets separately, for example:
--   SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   SELECT vault.create_secret('<anon-or-publishable-key>', 'anon_key');
-- Then schedule with:
--   SELECT public.schedule_process_thought_queue();
--
-- IMPORTANT: if CRON_SECRET is set on the process-thought-queue function,
-- store that secret in Vault under a separate name and pass it here:
--   SELECT public.schedule_process_thought_queue(
--     function_bearer_secret_name := 'cron_secret'
--   );
-- The default 'anon_key' only satisfies Supabase gateway auth, not CRON_SECRET.
CREATE OR REPLACE FUNCTION public.invoke_process_thought_queue_from_vault(
  project_url_secret_name text DEFAULT 'project_url',
  function_bearer_secret_name text DEFAULT 'anon_key',
  body jsonb DEFAULT '{"source":"pg_cron"}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $$
DECLARE
  project_url text;
  function_bearer text;
BEGIN
  SELECT decrypted_secret
  INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = project_url_secret_name
  LIMIT 1;

  SELECT decrypted_secret
  INTO function_bearer
  FROM vault.decrypted_secrets
  WHERE name = function_bearer_secret_name
  LIMIT 1;

  IF project_url IS NULL THEN
    RAISE EXCEPTION 'Missing Vault secret for project URL: %', project_url_secret_name;
  END IF;

  IF function_bearer IS NULL THEN
    RAISE EXCEPTION 'Missing Vault secret for function bearer token: %', function_bearer_secret_name;
  END IF;

  RETURN net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process-thought-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || function_bearer
    ),
    body := body
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_process_thought_queue_from_vault(text, text, jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.invoke_process_thought_queue_from_vault(text, text, jsonb) TO postgres;

CREATE OR REPLACE FUNCTION public.schedule_process_thought_queue(
  job_name text DEFAULT 'process-thought-queue-every-minute',
  cron_expr text DEFAULT '* * * * *',
  project_url_secret_name text DEFAULT 'project_url',
  function_bearer_secret_name text DEFAULT 'anon_key'
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  schedule_sql text;
BEGIN
  schedule_sql := format(
    'SELECT public.invoke_process_thought_queue_from_vault(%L, %L, %L::jsonb);',
    project_url_secret_name,
    function_bearer_secret_name,
    '{"source":"pg_cron"}'
  );

  RETURN cron.schedule(job_name, cron_expr, schedule_sql);
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_process_thought_queue(text, text, text, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.schedule_process_thought_queue(text, text, text, text) TO postgres;

SELECT 'Migration complete: pgmq queues, enqueue triggers, and queue worker invocation helpers added.' as status;
