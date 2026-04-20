create table if not exists public.workspace_setup_statuses (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  status text not null check (
    status = any (
      array[
        'unconfigured'::text,
        'configured'::text,
        'auth_failed'::text,
        'mcp_missing'::text,
        'hook_missing'::text,
        'otel_missing'::text,
        'ready'::text
      ]
    )
  ),
  evidence jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.run_correlation_statuses (
  run_id uuid primary key references public.runs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  status text not null check (
    status = any (
      array[
        'session_created'::text,
        'reasoning_seen'::text,
        'telemetry_seen'::text,
        'reasoning_only'::text,
        'telemetry_only'::text,
        'binding_missing'::text,
        'healthy'::text
      ]
    )
  ),
  evidence jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_run_correlation_statuses_workspace_status
  on public.run_correlation_statuses (workspace_id, status);

create index if not exists idx_run_correlation_statuses_session
  on public.run_correlation_statuses (session_id);

alter table public.workspace_setup_statuses enable row level security;
alter table public.run_correlation_statuses enable row level security;

drop policy if exists service_role_bypass on public.workspace_setup_statuses;
create policy service_role_bypass
  on public.workspace_setup_statuses
  to service_role
  using (true)
  with check (true);

drop policy if exists tenant_member_read on public.workspace_setup_statuses;
create policy tenant_member_read
  on public.workspace_setup_statuses
  for select
  to authenticated
  using (
    workspace_id in (
      select workspace_memberships.workspace_id
      from public.workspace_memberships
      where workspace_memberships.user_id = auth.uid()
    )
  );

drop policy if exists service_role_bypass on public.run_correlation_statuses;
create policy service_role_bypass
  on public.run_correlation_statuses
  to service_role
  using (true)
  with check (true);

drop policy if exists tenant_member_read on public.run_correlation_statuses;
create policy tenant_member_read
  on public.run_correlation_statuses
  for select
  to authenticated
  using (
    workspace_id in (
      select workspace_memberships.workspace_id
      from public.workspace_memberships
      where workspace_memberships.user_id = auth.uid()
    )
  );

grant all on table public.workspace_setup_statuses to anon;
grant all on table public.workspace_setup_statuses to authenticated;
grant all on table public.workspace_setup_statuses to service_role;

grant all on table public.run_correlation_statuses to anon;
grant all on table public.run_correlation_statuses to authenticated;
grant all on table public.run_correlation_statuses to service_role;
