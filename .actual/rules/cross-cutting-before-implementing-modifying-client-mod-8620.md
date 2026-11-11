---
version: 2
name: cross-cutting-before-implementing-modifying-client-mod-8620
description: "Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Before Implementing Modifying Client Module Integrations"
metadata:
  actual:
    adr_id: 8620e5ae-4e80-423d-ad37-028c9f862071
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

# Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Before Implementing Modifying Client Module Integrations

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all client-rendered modules and hooks that interact with persistent database records or realtime change streams, and components executing within browser runtime boundaries requiring direct data synchronization.

### Rules

- **R-SUPA-001** MUST: Before implementing or modifying client module integrations, the consumer MUST inspect the repository lock artifact to resolve the exact dependency versions and confirm that invoked methods adhere to the documented interface.
- **R-SUPA-002** MANDATORY: Discover the dependency manifest in the repo, identify the build tool, inspect the repository lock or resolution artifact to determine the exact resolved version, look up official documentation for that exact version, and confirm every API, class, or function called exists before using it.
- **R-SUPA-003** MANDATORY: Encapsulate realtime channel subscriptions inside custom hooks that manage subscription lifecycle, status tracking, and teardown.
- **R-SUPA-004** MANDATORY: Normalize incoming change payloads using view-model conversion functions before committing updates into React component state.

### Verify

```bash
# Discover and execute the repository static analysis script to verify module import constraints
# and ensure client factories are imported exclusively from the centralized client module.
# (Run the project's static analysis or lint tool, e.g., npm run lint / npx tsc)

# Discover and execute the repository test runner to validate that realtime subscription
# lifecycle and event handler behaviors execute without unhandled subscription rejections.
# (Run the project's test suite, e.g., npm test)
```

**Accept when:**
- Static analysis passes with zero import violations across all client-rendered modules.
- Automated test suites pass, confirming proper channel subscription initialization and cleanup on component unmount.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated static analysis and test suites checking client module import paths, channel subscription lifecycle handling, and idempotent state updates.
</enforcement>