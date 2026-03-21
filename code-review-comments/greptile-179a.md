This is a comment left during a code review. Path: src/protocol/handler.ts Line:
1526

Comment: **S-register state machine bug: S=2 after only one surprise**

After `plan` sets `S=1`, the first severity-1 `outcome(unexpected)` call
computes `Math.min((state.S ?? 0) + 1, 2)` = `Math.min(1 + 1, 2)` = `2`,
immediately sending the session to S=2 (REFLECT phase). This contradicts the
spec and ADR-015's stated state machine:

> `S=0 → plan → S=1 → outcome(unexpected) → S=1 → outcome(unexpected) → S=2 → reflect → S=0`

The first unexpected outcome should **keep S=1**, and only a second consecutive
unexpected outcome should advance to S=2. The implementation is also
inconsistent with Hypothesis 3: "Calling plan (S=1) then outcome { assessment:
"unexpected-unfavorable" } stays at S=1."

A separate consecutive-surprise counter (rather than incrementing `state.S`) is
needed here, since `state.S` is always `1` after `plan`:

```typescript
// Keep S=1 on first severity-1 surprise; accumulate using a separate counter
const surpriseCount = (state.surprise_register?.length ?? 0) + 1;
if (severity === 2 || surpriseCount >= 2) {
    newState.S = 2;
    resultMsg = surpriseCount >= 2
        ? "Two consecutive surprises. S=2. REFLECT required."
        : "Flagrant-2 surprise. S=2. REFLECT required.";
} else {
    newState.S = 1;
    resultMsg = `Surprise (severity ${severity}). S=1. Continue with caution.`;
}
```

How can I resolve this? If you propose a fix, please make it concise.

---

This is a comment left during a code review. Path: src/protocol/handler.ts Line:
1161-1163

Comment: **State data loss: partial `state_json` update overwrites all fields**

This update replaces the entire `state_json` JSONB column with only
`{ B: 0, test_fail_count: 0 }`, silently dropping other fields stored during
`theseusInit` — in particular the `description` field in
`{ B: 0, test_fail_count: 0, description: ... }`.

The same issue exists in the same method on the unapproved path (line ~1255,
where `{ B: 1, test_fail_count: newCount }` is written), and in `theseusOutcome`
at the "tests passed" path (line ~1216) and "red_green_expired" path (line
~1236).

Supabase does not merge JSONB objects on `.update()` — the column is replaced
entirely. Use a spread merge or a Postgres
`jsonb_strip_nulls(state_json || ...)` expression to preserve existing fields:

```typescript
// Instead of:
.update({ state_json: { B: 0, test_fail_count: 0 } })

// Use a spread that preserves existing state:
.update({ state_json: { ...(session.state_json as object), B: 0, test_fail_count: 0 } })
```

This applies to all four `state_json` update sites in `theseusCheckpoint` and
`theseusOutcome`.

How can I resolve this? If you propose a fix, please make it concise.

---

This is a comment left during a code review. Path:
supabase/migrations/20260319100319_protocol_enforcement.sql Line: 2313-2316

Comment: **Missing `workspace_id` filter breaks multi-tenant isolation in
enforcement RPC**

The `check_protocol_enforcement` function selects the most recent active session
without filtering by `workspace_id`:

```sql
select * into session
from protocol_sessions
where status = 'active'
order by created_at desc limit 1;
```

On a multi-workspace Supabase instance, this will return an active session from
**any workspace**, not just the caller's. A Theseus session in workspace A will
block file writes for workspace B's agent, and vice versa. This directly
contradicts the workspace isolation guarantee from ADR-013 that all other
queries in `ProtocolHandler` enforce.

Since `check_protocol_enforcement` is called as a hook (without a handler
instance), the workspace context must be passed as a parameter:

```sql
create or replace function check_protocol_enforcement(
    target_path text,
    p_workspace_id text default null
)
returns json as $$
...
    select * into session
    from protocol_sessions
    where status = 'active'
      and (p_workspace_id is null or workspace_id = p_workspace_id)
    order by created_at desc limit 1;
```

How can I resolve this? If you propose a fix, please make it concise.

---

This is a comment left during a code review. Path: src/protocol/handler.ts Line:
1551-1580

Comment: **`ulyssesReflect` missing S=2 guard**

`ulyssesReflect` unconditionally resets S to 0 regardless of the current
S-register value. There is no check that `state.S === 2` before allowing the
operation. An agent could call `reflect` at S=0 or S=1, resetting the state
machine prematurely and bypassing the surprise-gating mechanism entirely.

Add an S=2 guard consistent with the PLAN guard in `ulyssesPlan`:

```typescript
const state = session.state_json as { S: number; hypotheses: unknown[] };

if (state.S !== 2) {
    throw new Error(
        `REFLECT only valid at S=2 (current S=${state.S}). ` +
            "Two consecutive surprises required before reflecting.",
    );
}
```

How can I resolve this? If you propose a fix, please make it concise.

---

This is a comment left during a code review. Path: src/protocol/handler.ts Line:
1277-1285

Comment: **Unused `sessionId` parameter in `theseusStatus` and `ulyssesStatus`**

Both `theseusStatus(sessionId)` and `ulyssesStatus(sessionId)` accept a
`sessionId` parameter but never use it — the implementation always fetches the
active session via `getActiveSession()`. The parameter is vestigial (leftover
from the session-ID-based design) and its presence is misleading: callers might
expect it to look up a specific historical session by ID, but it is silently
ignored.

Either remove the parameter from both methods, or add a comment noting that it
is intentionally ignored in favour of the active-session lookup.

How can I resolve this? If you propose a fix, please make it concise.
