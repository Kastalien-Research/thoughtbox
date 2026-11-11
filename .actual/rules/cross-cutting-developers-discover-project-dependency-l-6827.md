---
version: 2
name: cross-cutting-developers-discover-project-dependency-l-6827
description: "Supabase Realtime Client Integration for Postgres Change Data Capture: Developers Discover Project Dependency Lock Artifact"
metadata:
  actual:
    adr_id: 68270d2e-9ac0-4d67-9762-19613dad3a41
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

# Supabase Realtime Client Integration for Postgres Change Data Capture: Developers Discover Project Dependency Lock Artifact

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for client-side modules and hooks requiring live synchronization with database table updates.

### Rules

- **R-CDC-001** MUST: Developers MUST discover the project dependency lock artifact and verify the exact resolved version of the client library before implementing or updating realtime channel subscriptions.

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
Claude Code MUST NOT skip or defer verification. Automated code review verifies channel subscription teardown in client hook lifecycles, and integration tests validate realtime channel event payload handling and idempotency.
</enforcement>