-- AUDIT-003: Durably persist the session audit manifest on the Supabase backend.
-- The manifest (thought counts, decisions, actions, gaps, assumption flips,
-- critiques) is generated at session close and was previously dropped after
-- the closing tb.thought response. Filesystem backend stores it as
-- audit-manifest.json in the session directory; Supabase stores it here.
alter table public.sessions
  add column if not exists audit_manifest jsonb;

comment on column public.sessions.audit_manifest is
  'AUDIT-003 session audit manifest generated at session close (thought counts, decisions, actions, gaps, assumption flips, critiques).';
