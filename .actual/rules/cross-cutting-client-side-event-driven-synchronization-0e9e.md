---
version: 2
name: cross-cutting-client-side-event-driven-synchronization-0e9e
description: "Supabase Realtime Client Integration for Postgres Change Data Capture: Client Side Event Driven Synchronization Database"
metadata:
  actual:
    adr_id: 0e9ec419-b047-48ae-86d6-85ccdd768580
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

# Supabase Realtime Client Integration for Postgres Change Data Capture: Client Side Event Driven Synchronization Database

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CDC-001** MUST: Client-side event-driven synchronization with database tables MUST use Supabase client realtime channels configured with the postgres_changes event listener rather than HTTP polling.

### Verify

```bash
# Discover and execute the project test runner to verify realtime event subscription and channel teardown tests
# Discover and execute static analysis and type checking scripts
```

**Accept when:**
- Realtime subscriptions establish connections and receive change events matching the specified table and filter criteria.
- Channel teardown cleanly unsubscribes without memory leaks or dangling event listeners upon component unmount.
- All discovered test suites and type verification scripts pass without errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>