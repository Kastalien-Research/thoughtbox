---
version: 2
name: cross-cutting-realtime-change-listeners-initialized-th-6020
description: "Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Realtime Change Listeners Initialized Through Channel"
metadata:
  actual:
    adr_id: 6020a60a-cafa-47c1-b023-efe43b3a2121
    status: accepted
    candidate_group_id: 37c95853-700a-4de9-af16-f7ebc39a4e5e
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/lib/session/**
---

# Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Realtime Change Listeners Initialized Through Channel

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-RT-001** MUST: Realtime change listeners initialized through channel instances MUST filter events by workspace identifier and handle state synchronization idempotently to prevent duplicate records.

### Verify

```bash
# Discover and execute the repository static analysis script to verify module import constraints
# Discover and execute the repository test runner to validate realtime subscription lifecycle and event handler behaviors
```

**Accept when:**
- Static analysis passes with zero import violations across all client-rendered modules.
- Automated test suites pass, confirming proper channel subscription initialization and cleanup on component unmount.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification of static analysis and test suites is mandatory.
</enforcement>