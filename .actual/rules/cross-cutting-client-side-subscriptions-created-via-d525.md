---
version: 2
name: cross-cutting-client-side-subscriptions-created-via-d525
description: "Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Client Side Subscriptions Created Via Channel"
metadata:
  actual:
    adr_id: d5258f25-67a8-4878-90dd-880adc467892
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

# Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Client Side Subscriptions Created Via Channel

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: Client-side subscriptions created via channel MUST register status listeners and release resources when enclosing components or hooks unmount.

### Verify

```bash
# Discover and execute the repository static analysis script
# Discover and execute the repository test runner
```

**Accept when:**
- Static analysis passes with zero import violations across all client-rendered modules.
- Automated test suites pass, confirming proper channel subscription initialization and cleanup on component unmount.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>