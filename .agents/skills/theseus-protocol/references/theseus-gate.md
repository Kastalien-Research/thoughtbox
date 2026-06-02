# Theseus Protocol: Deterministic Enforcement Gates

This document defines the enforcement mechanisms necessary to make the Theseus
Protocol deterministic. While `SKILL.md` instructs the agent to follow rules,
these gates make breaking those rules physically impossible.

**Design decision**: All session state lives in Supabase. No local `.theseus/`
directory, no filesystem-dependent enforcement. This ensures the same
enforcement works whether the agent is running locally (Claude Code, Gemini
CLI) or against a deployed Thoughtbox instance on Cloud Run.

---

## Enforcement Architecture

Every gate queries Supabase to determine whether a Theseus session is active
and what constraints apply. The query path depends on the runtime:

| Runtime | Enforcement mechanism | Supabase access |
|---------|----------------------|-----------------|
| Claude Code | `pre_tool_use.sh` hook | curl to Supabase REST API |
| Gemini CLI | equivalent pre-tool hook | curl to Supabase REST API |
| Deployed MCP | Thoughtbox server logic | Supabase client (direct) |
| Any future runtime | Hook or middleware | curl to Supabase REST API |

Supabase REST calls add ~100-200ms latency. Hook timeouts (5s for
`pre_tool_use.sh`) accommodate this comfortably.

---

## Gate 1: The Test-Suite Write Lock

**Objective:** Deny write access to any test files during a Theseus session.
Refactoring cannot alter behavior, therefore test files are immutable.

**Enforcement (runtime hook):**

```bash
# Inside pre_tool_use.sh (or equivalent per-runtime hook)
# Runs on Write/Edit tool calls

is_theseus_test_lock_violation() {
    local file_path="$1"

    # Quick exit: no Supabase config, no enforcement
    [ -z "$SUPABASE_URL" ] && return 1

    # Is target a test file?
    case "$file_path" in
        */tests/*|*/test/*|*/__tests__/*|*.test.*|*.spec.*) ;;
        *) return 1 ;; # Not a test file, no enforcement needed
    esac

    # Is there an active Theseus session?
    local active
    active=$(curl -sf "${SUPABASE_URL}/rest/v1/theseus_sessions?status=eq.active&select=id&limit=1" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" | jq -r '.[0].id // empty')

    [ -n "$active" ] && return 0  # Active session + test file = blocked
    return 1
}
```

**Enforcement (deployed MCP server):**

The Thoughtbox MCP server checks the same Supabase table before allowing any
file write operation. Same logic, direct Supabase client instead of curl.

---

## Gate 2: The Epistemic Visa Lock

**Objective:** Deny write access to files outside the declared scope unless an
Epistemic Visa has been recorded in Supabase.

**Enforcement (runtime hook):**

```bash
is_theseus_scope_violation() {
    local file_path="$1"

    [ -z "$SUPABASE_URL" ] && return 1

    # Query active session + scope + visas in one RPC call
    local result
    result=$(curl -sf "${SUPABASE_URL}/rest/v1/rpc/check_theseus_scope" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"target_path\": \"${file_path}\"}")

    local allowed
    allowed=$(echo "$result" | jq -r '.allowed // "true"')

    [ "$allowed" = "false" ] && return 0  # Not in scope, no visa = blocked
    return 1
}
```

**Visa application flow:**

1. Agent calls `theseus.sh visa <file> "<reason>"`
2. `theseus.sh` inserts a row into `theseus_visas` via Supabase REST
3. Agent also records a `decision_frame` thought in Thoughtbox (audit trail)
4. Next write attempt to that file passes the scope check

---

## Gate 3: The Syntactic Tollbooth

**Objective:** Reject compound commit messages. Commits must describe exactly
one logical change.

**Enforcement:** Built into `theseus.sh checkpoint` command. The tollbooth
grep runs locally before the commit is created — no Supabase round-trip
needed. This is a text filter, not a state query.

```bash
# Already implemented in theseus.sh
if echo "$MESSAGE" | grep -iE '\b(and|also|plus)\b' > /dev/null; then
    echo "Tollbooth Rejected: Checkpoint narrative must be atomic."
    exit 1
fi
```

---

## Gate 4: The Cassandra Audit

**Objective:** Adversarial evaluation of the diff before checkpoint commit.

**Enforcement:** Agent-level. After the tollbooth passes, the agent submits
the diff as a Thoughtbox thought (`action_report` with `tool: cassandra_audit`)
and evaluates it adversarially. This is not a git hook — it is part of the
`theseus.sh checkpoint` flow, which records the audit result in Supabase
before creating the git commit.

The audit result is stored in `theseus_audits` for trend analysis by
supervisor agents.

---

## Supabase Schema

```sql
create table theseus_sessions (
    id uuid primary key default gen_random_uuid(),
    workspace_id text not null,
    status text not null default 'active'
        check (status in ('active', 'complete', 'audit_failure', 'scope_exhaustion')),
    boundary_state int not null default 0,
    test_fail_count int not null default 0,
    last_checkpoint_sha text,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create table theseus_scope (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references theseus_sessions(id) on delete cascade,
    file_path text not null,
    source text not null default 'init'
        check (source in ('init', 'visa')),
    created_at timestamptz not null default now()
);

create table theseus_visas (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references theseus_sessions(id) on delete cascade,
    file_path text not null,
    justification text not null,
    anti_pattern_acknowledged boolean not null default true,
    created_at timestamptz not null default now()
);

create table theseus_audits (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references theseus_sessions(id) on delete cascade,
    diff_hash text not null,
    commit_message text not null,
    cassandra_approved boolean not null,
    cassandra_feedback text,
    created_at timestamptz not null default now()
);

-- RPC function for scope checking (single round-trip from hooks)
create or replace function check_theseus_scope(target_path text)
returns json as $$
declare
    active_session_id uuid;
    is_in_scope boolean;
begin
    select id into active_session_id
    from theseus_sessions
    where status = 'active'
    order by created_at desc limit 1;

    if active_session_id is null then
        return json_build_object('allowed', true, 'reason', 'no active session');
    end if;

    select exists(
        select 1 from theseus_scope
        where session_id = active_session_id
        and target_path like file_path || '%'
    ) into is_in_scope;

    if is_in_scope then
        return json_build_object('allowed', true, 'reason', 'in scope');
    end if;

    return json_build_object(
        'allowed', false,
        'reason', 'VISA REQUIRED: file is outside declared scope',
        'session_id', active_session_id
    );
end;
$$ language plpgsql security definer;
```

This schema serves dual purposes: real-time enforcement (hooks query it) and
longitudinal analysis (supervisor agents mine it for behavioral tendencies).
