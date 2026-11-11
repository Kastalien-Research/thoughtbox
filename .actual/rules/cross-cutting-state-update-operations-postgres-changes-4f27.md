---
version: 2
name: cross-cutting-state-update-operations-postgres-changes-4f27
description: "Supabase Realtime Client Integration for Postgres Change Data Capture: State Update Operations Postgres Changes Event"
metadata:
  actual:
    adr_id: 4f2717c4-9287-4b17-8abc-898cecc3d4fd
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

# Supabase Realtime Client Integration for Postgres Change Data Capture: State Update Operations Postgres Changes Event

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CDC-001** SHOULD: State update operations in postgres_changes event handlers SHOULD deduplicate incoming record insertions using unique record identifiers to maintain idempotent local state.

### Verify

```bash
# Discover and execute the project test runner to verify realtime event subscription and channel teardown tests pass
# Discover and execute the project static analysis and type checking scripts
```

**Accept when:**
- Realtime subscriptions establish connections and receive change events matching the specified table and filter criteria.
- Channel teardown cleanly unsubscribes without memory leaks or dangling event listeners upon component unmount.
- All discovered test suites and type verification scripts pass without errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated code review and integration tests verify channel subscription teardown, event payload handling, and idempotency.
</enforcement>