---
version: 2
name: cross-cutting-realtime-subscriptions-initiated-within-7618
description: "Supabase Realtime Client Integration for Postgres Change Data Capture: Realtime Subscriptions Initiated Within Component Lifecycles"
metadata:
  actual:
    adr_id: 7618aea7-0391-4618-a382-ef64f412fe74
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

# Supabase Realtime Client Integration for Postgres Change Data Capture: Realtime Subscriptions Initiated Within Component Lifecycles

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for client-side modules and hooks requiring live synchronization with database table updates.

### Rules

- **R-SUPA-001** MUST: Realtime subscriptions initiated within component lifecycles MUST handle channel status updates and explicitly unsubscribe or remove the channel during lifecycle teardown.

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
Claude Code MUST NOT skip or defer verification. Verified by automated code review and integration tests.
</enforcement>