---
version: 2
name: cross-cutting-server-action-handlers-performing-state-472c
description: "Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Action Handlers Performing State Mutations"
metadata:
  actual:
    adr_id: 472c2c8a-aa16-4a9f-b74a-1a6293da6eaa
    status: accepted
    candidate_group_id: c9ae03f8-f61b-482e-b711-b3a0ae6c3a90
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Action Handlers Performing State Mutations

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for server action handlers executing server-side mutations within workspace and account settings, and server-side mutation endpoints requiring authenticated database or identity operations.

### Rules

- **R-SUP-001** SHOULD: Server action handlers performing state mutations SHOULD coordinate client operations with cache invalidation functions from `next/cache` to purge stale server-rendered data.
- **R-SUP-002** MANDATORY: Import `createClient` from `@/lib/supabase/server` within server action scopes and await its client handle before dispatching authentication or data modification calls.
- **R-SUP-003** MANDATORY: Extract request input parameters from incoming form payloads and sanitize values prior to delegating data mutations to the initialized client.

### Verify

```bash
# Find the repository package manifest and execute the designated static analysis script
# Locate the project build configuration and run the type-checking routine
# Execute the repository test suite to verify server actions
```

**Accept when:**
- Static analysis confirms zero unauthorized or direct third-party client instantiations across server action handlers.
- Type checking passes with zero diagnostics regarding client calls or exported action signatures.
- Automated server action integration tests pass with authenticated client sessions properly validated.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated pull request linting, peer code review, and continuous integration test passes.
</enforcement>