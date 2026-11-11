---
version: 2
name: cross-cutting-server-action-routines-requiring-databas-977a
description: "Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Action Routines Requiring Database Access"
metadata:
  actual:
    adr_id: 977aa6c6-887d-42a8-9f58-856cae4c07fa
    status: accepted
    candidate_group_id: c9ae03f8-f61b-482e-b711-b3a0ae6c3a90
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Action Routines Requiring Database Access

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all server action handlers executing server-side mutations within workspace and account settings, and server-side mutation endpoints requiring authenticated database or identity operations.

### Rules

- **R-SUP-001** MUST: Server action routines requiring database access or authentication validation MUST import and instantiate their client context using `createClient` from `@/lib/supabase/server`.

### Verify

```bash
# Find the repository package manifest and execute the designated static analysis script
# Locate the project build configuration and run the type-checking routine
# Execute the repository test suite to verify server action client instantiation
```

**Accept when:**
- Static analysis confirms zero unauthorized or direct third-party client instantiations across server action handlers.
- Type checking passes with zero diagnostics regarding client calls or exported action signatures.
- Automated server action integration tests pass with authenticated client sessions properly validated.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>