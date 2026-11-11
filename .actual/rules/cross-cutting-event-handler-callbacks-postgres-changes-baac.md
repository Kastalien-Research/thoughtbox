---
version: 2
name: cross-cutting-event-handler-callbacks-postgres-changes-baac
description: "Supabase Realtime Client Integration for Postgres Change Data Capture: Event Handler Callbacks Postgres Changes Validate"
metadata:
  actual:
    adr_id: baacdd9b-3c88-4895-93a7-30b59585a077
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

# Supabase Realtime Client Integration for Postgres Change Data Capture: Event Handler Callbacks Postgres Changes Validate

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for client-side modules and hooks requiring live synchronization with database table updates.

### Rules

- **R-SUPA-001** MUST: Event handler callbacks for postgres_changes MUST validate incoming record payloads against domain view-model mappers before merging updates into local component state.

### Verify

```bash
# Discover and execute the project test runner to verify realtime event subscription and channel teardown tests pass
# Discover and execute the project static analysis and type checking scripts to ensure channel event payloads conform to domain view-model contracts
```

**Accept when:**
- Realtime subscriptions establish connections and receive change events matching the specified table and filter criteria.
- Channel teardown cleanly unsubscribes without memory leaks or dangling event listeners upon component unmount.
- All discovered test suites and type verification scripts pass without errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests containing untracked or non-filtered realtime subscriptions are blocked during review, and missing channel unsubscribe routines must be corrected prior to merging.
</enforcement>