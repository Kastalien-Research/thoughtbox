---
version: 2
name: cross-cutting-components-not-bypass-centralized-client-8f6e
description: "Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Components Not Bypass Centralized Client Factory"
metadata:
  actual:
    adr_id: 8f6ec002-561e-4199-896b-816f269a239b
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

# Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Components Not Bypass Centralized Client Factory

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST_NOT: Components MUST NOT bypass the centralized client factory by instantiating third-party client drivers directly in presentation modules.

### Verify

```bash
# Discover and execute the repository static analysis script to verify module import constraints
# and ensure client factories are imported exclusively from the centralized client module.
# Discover and execute the repository test runner to validate that realtime subscription
# lifecycle and event handler behaviors execute without unhandled subscription rejections.
```

**Accept when:**
- Static analysis passes with zero import violations across all client-rendered modules.
- Automated test suites pass, confirming proper channel subscription initialization and cleanup on component unmount.

<enforcement>
Claude Code MUST NOT skip or defer verification. All code modifications governed by this policy must be validated against the specified static analysis and automated test suites.
</enforcement>