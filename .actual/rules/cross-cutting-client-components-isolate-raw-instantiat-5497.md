---
version: 2
name: cross-cutting-client-components-isolate-raw-instantiat-5497
description: "Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Client Components Isolate Raw Instantiation Event"
metadata:
  actual:
    adr_id: 549766ee-7444-45f7-9ea8-85d18896743a
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

# Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Client Components Isolate Raw Instantiation Event

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for client-rendered modules and hooks that interact with persistent database records or realtime change streams, executing within browser runtime boundaries requiring direct data synchronization.

### Rules

- **R-CLIENT-001** SHOULD: Client components SHOULD isolate raw client instantiation and event streaming within dedicated custom hooks rather than embedding subscription logic directly inside presentational UI layers.
- **R-CLIENT-002** MANDATORY: The consumer MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-CLIENT-003** MANDATORY: Before writing code that uses a versioned library, execute in order: (1) Find dependency manifest, (2) Identify build tool, (3) Inspect repository lock/resolution artifact for exact version, (4) Look up official docs for that exact version, (5) Confirm every API exists in that version, (6) Re-run steps 3-5 per dependency at point of use.
- **R-CLIENT-004** MANDATORY: Encapsulate realtime channel subscriptions inside custom hooks that manage subscription lifecycle, status tracking, and teardown, and normalize incoming change payloads using view-model conversion functions before committing updates into React component state.

### Verify

```bash
# Discover and execute repository static analysis script
# Discover and execute repository test runner
```

**Accept when:**
- Static analysis passes with zero import violations across all client-rendered modules.
- Automated test suites pass, confirming proper channel subscription initialization and cleanup on component unmount.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis checks and peer code reviews verify realtime channel lifecycle handling and module import paths.
</enforcement>