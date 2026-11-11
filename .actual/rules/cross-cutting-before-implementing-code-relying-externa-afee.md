---
version: 2
name: cross-cutting-before-implementing-code-relying-externa-afee
description: "Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Before Implementing Code Relying External Internal"
metadata:
  actual:
    adr_id: afee6916-7737-48fe-9161-5093696ff74b
    status: accepted
    candidate_group_id: c9ae03f8-f61b-482e-b711-b3a0ae6c3a90
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Before Implementing Code Relying External Internal

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for server action handlers executing server-side mutations within workspace and account settings, and server-side mutation endpoints requiring authenticated database or identity operations.

### Rules

- **R-SUP-001** MUST: Before implementing code relying on external or internal dependencies, the consumer MUST inspect the repository dependency manifest and lock resolution artifact to identify exact resolved versions and confirm API availability in official documentation.
- **R-SUP-002** MUST: Import `createClient` from `@/lib/supabase/server` within server action scopes and await its client handle before dispatching authentication or data modification calls.
- **R-SUP-003** MUST: Extract request input parameters from incoming form payloads and sanitize values prior to delegating data mutations to the initialized client.

### Verify

```bash
# Find the repository package manifest and execute the designated static analysis script
# to verify that server actions import client factories exclusively from the internal server library.
# Locate the project build configuration and run the type-checking routine to validate client method signatures.
# Execute the repository test suite to verify server action client instantiation and database mutations.
```

**Accept when:**
- Static analysis confirms zero unauthorized or direct third-party client instantiations across server action handlers.
- Type checking passes with zero diagnostics regarding client calls or exported action signatures.
- Automated server action integration tests pass with authenticated client sessions properly validated.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Pull requests containing unapproved client creation patterns or direct client-side imports in server actions are blocked from merging.
</enforcement>