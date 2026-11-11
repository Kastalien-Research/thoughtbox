---
version: 2
name: cross-cutting-server-actions-not-instantiate-unencapsu-8145
description: "Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Actions Not Instantiate Unencapsulated Client"
metadata:
  actual:
    adr_id: 81456d89-57e6-4c21-be11-e3e716289171
    status: accepted
    candidate_group_id: c9ae03f8-f61b-482e-b711-b3a0ae6c3a90
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Actions Not Instantiate Unencapsulated Client

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ACT-001** MUST_NOT: Server actions MUST NOT instantiate unencapsulated client instances or reference client-side environment configurations within server execution contexts.

### Verify

```bash
# Find the repository package manifest and execute the designated static analysis script to verify that server actions import client factories exclusively from the internal server library.
# Locate the project build configuration and run the type-checking routine to validate client method signatures across all server action modules.
# Execute the repository test suite to verify that server actions correctly instantiate server clients and execute database mutations without authentication context errors.
```

**Accept when:**
- Static analysis confirms zero unauthorized or direct third-party client instantiations across server action handlers.
- Type checking passes with zero diagnostics regarding client calls or exported action signatures.
- Automated server action integration tests pass with authenticated client sessions properly validated.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>