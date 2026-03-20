-- Protocol enforcement tables for Theseus and Ulysses protocols
-- Backing store for session state, scope tracking, visa applications,
-- audit results, and step history.

create table protocol_sessions (
    id uuid primary key default gen_random_uuid(),
    protocol text not null check (protocol in ('theseus', 'ulysses')),
    workspace_id text,
    status text not null default 'active',
    check (
        (protocol = 'theseus' AND status IN (
            'active', 'superseded',
            'complete', 'audit_failure', 'scope_exhaustion'
        ))
        OR
        (protocol = 'ulysses' AND status IN (
            'active', 'superseded',
            'resolved', 'insufficient_information', 'environment_compromised'
        ))
    ),
    state_json jsonb not null default '{}',
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create index idx_protocol_sessions_active
    on protocol_sessions (protocol, status)
    where status = 'active';

create table protocol_scope (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    file_path text not null,
    source text not null default 'init'
        check (source in ('init', 'visa')),
    created_at timestamptz not null default now(),
    unique (session_id, file_path)
);

create table protocol_visas (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    file_path text not null,
    justification text not null,
    anti_pattern_acknowledged boolean not null default true,
    created_at timestamptz not null default now()
);

create table protocol_audits (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    diff_hash text not null,
    commit_message text not null,
    approved boolean not null,
    feedback text,
    created_at timestamptz not null default now()
);

create table protocol_history (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    event_type text not null
        check (event_type in ('plan', 'outcome', 'reflect', 'checkpoint')),
    event_json jsonb not null,
    created_at timestamptz not null default now()
);

-- Single-roundtrip RPC for hook enforcement
create or replace function check_protocol_enforcement(target_path text)
returns json as $$
declare
    session record;
    is_test_file boolean;
    is_in_scope boolean;
begin
    select * into session
    from protocol_sessions
    where status = 'active'
    order by created_at desc limit 1;

    if session is null then
        return json_build_object('enforce', false);
    end if;

    if session.protocol = 'theseus' then
        is_test_file := target_path ~ '(/tests/|/test/|/__tests__/|\.test\.|\.spec\.)';
        if is_test_file then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'TEST LOCK: Cannot modify test files during refactoring',
                'session_id', session.id
            );
        end if;

        select exists(
            select 1 from protocol_scope
            where session_id = session.id
            and target_path like file_path || '%'
        ) into is_in_scope;

        if not is_in_scope then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'VISA REQUIRED: File outside declared scope',
                'session_id', session.id
            );
        end if;
    end if;

    return json_build_object(
        'enforce', true,
        'blocked', false,
        'session_id', session.id,
        'protocol', session.protocol
    );
end;
$$ language plpgsql security definer set search_path = public;

-- RLS: enabled but permissive for service_role
alter table protocol_sessions enable row level security;
alter table protocol_scope enable row level security;
alter table protocol_visas enable row level security;
alter table protocol_audits enable row level security;
alter table protocol_history enable row level security;

-- Service role bypass policies
create policy "service_role_all" on protocol_sessions for all using (true) with check (true);
create policy "service_role_all" on protocol_scope for all using (true) with check (true);
create policy "service_role_all" on protocol_visas for all using (true) with check (true);
create policy "service_role_all" on protocol_audits for all using (true) with check (true);
create policy "service_role_all" on protocol_history for all using (true) with check (true);
