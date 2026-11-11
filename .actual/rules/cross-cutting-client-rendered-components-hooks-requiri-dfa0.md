---
version: 2
name: cross-cutting-client-rendered-components-hooks-requiri-dfa0
description: "Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Client Rendered Components Hooks Requiring Direct"
metadata:
  actual:
    adr_id: dfa06fca-aaeb-44f4-bb01-4593a30251e8
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

# Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Client Rendered Components Hooks Requiring Direct

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CLIENT-001** MUST: Client-rendered components and hooks requiring direct database operations or realtime change subscriptions MUST instantiate the client interface via createClient imported from @/lib/supabase/client.

### Verify

```bash
# Discover and execute repository static analysis script for module import constraints
# Discover and execute repository test runner to validate realtime subscription lifecycles
```

**Accept when:**
- Static analysis passes with zero import violations across all client-rendered modules.
- Automated test suites pass, confirming proper channel subscription initialization and cleanup on component unmount.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>