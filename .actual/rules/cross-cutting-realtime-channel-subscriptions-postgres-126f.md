---
version: 2
name: cross-cutting-realtime-channel-subscriptions-postgres-126f
description: "Supabase Realtime Client Integration for Postgres Change Data Capture: Realtime Channel Subscriptions Postgres Changes Define"
metadata:
  actual:
    adr_id: 126f7aa4-a990-4236-a5e6-2be75188cd28
    status: accepted
    candidate_group_id: 1a2171d0-fa85-4901-a709-04f62c62ed41
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/lib/session/**
---

# Supabase Realtime Client Integration for Postgres Change Data Capture: Realtime Channel Subscriptions Postgres Changes Define

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for client-side modules and hooks requiring live synchronization with database table updates.

### Rules

- **R-SUPA-001** MUST: Realtime channel subscriptions for postgres_changes MUST define explicit event filtering by schema, table, and tenant identifier to prevent cross-tenant data leakage.

### Verify

```bash
# Discover and execute the project test runner to verify that realtime event subscription and channel teardown tests pass.
# Discover and execute the project static analysis and type checking scripts to ensure that channel event payloads conform to domain view-model contracts.
```

**Accept when:**
- Realtime subscriptions establish connections and receive change events matching the specified table and filter criteria.
- Channel teardown cleanly unsubscribes without memory leaks or dangling event listeners upon component unmount.
- All discovered test suites and type verification scripts pass without errors.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>