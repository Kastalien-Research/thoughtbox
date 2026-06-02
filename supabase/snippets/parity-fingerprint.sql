-- Deterministic schema fingerprint for parity verification.
--
-- Returns one row of md5 hashes covering the surfaces we control via
-- migrations. Run on two projects and compare row-for-row; matching hashes
-- prove byte-identical schema for that surface.
--
-- Surfaces deliberately omitted:
--   - extensions and pg_proc entries that Supabase manages at the platform
--     level (e.g. pg_net, wrappers, rls_auto_enable). These vary by project
--     creation date and are outside our control plane.
--
-- Re-runnable from the Supabase SQL editor or any psql session.

WITH
tables AS (
  SELECT json_agg(
    json_build_object('schema', table_schema, 'table', table_name)
    ORDER BY table_schema, table_name
  ) AS j
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
),
columns AS (
  SELECT json_agg(
    json_build_object(
      'table', table_name,
      'column', column_name,
      'type', data_type,
      'nullable', is_nullable,
      'default', column_default
    )
    ORDER BY table_name, ordinal_position
  ) AS j
  FROM information_schema.columns
  WHERE table_schema = 'public'
),
constraints AS (
  SELECT json_agg(
    json_build_object(
      'table', conrelid::regclass::text,
      'name', conname,
      'def', pg_get_constraintdef(oid)
    )
    ORDER BY conrelid::regclass::text, conname
  ) AS j
  FROM pg_constraint
  WHERE connamespace = 'public'::regnamespace
),
indexes AS (
  SELECT json_agg(
    json_build_object('table', tablename, 'name', indexname, 'def', indexdef)
    ORDER BY tablename, indexname
  ) AS j
  FROM pg_indexes
  WHERE schemaname = 'public'
),
policies AS (
  SELECT json_agg(
    json_build_object(
      'table', tablename,
      'name', policyname,
      'cmd', cmd,
      'roles', roles,
      'qual', qual,
      'with_check', with_check,
      'permissive', permissive
    )
    ORDER BY tablename, policyname
  ) AS j
  FROM pg_policies
  WHERE schemaname = 'public'
),
app_functions AS (
  -- Filter out platform-managed helpers Supabase injects on newer projects.
  SELECT json_agg(
    json_build_object(
      'schema', n.nspname,
      'name', p.proname,
      'sig', pg_get_function_identity_arguments(p.oid)
    )
    ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
  ) AS j
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname IN ('public', 'pgmq_public')
    AND p.proname NOT IN ('rls_auto_enable')
),
rls AS (
  SELECT json_agg(
    json_build_object('table', c.relname, 'rls_enabled', c.relrowsecurity)
    ORDER BY c.relname
  ) AS j
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relkind = 'r'
)
SELECT
  md5(coalesce(tables.j::text, ''))      AS tables_md5,
  md5(coalesce(columns.j::text, ''))     AS columns_md5,
  md5(coalesce(constraints.j::text, '')) AS constraints_md5,
  md5(coalesce(indexes.j::text, ''))     AS indexes_md5,
  md5(coalesce(policies.j::text, ''))    AS policies_md5,
  md5(coalesce(app_functions.j::text, '')) AS functions_md5,
  md5(coalesce(rls.j::text, ''))         AS rls_md5
FROM tables, columns, constraints, indexes, policies, app_functions, rls;
