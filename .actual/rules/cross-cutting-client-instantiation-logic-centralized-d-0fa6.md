---
version: 2
name: cross-cutting-client-instantiation-logic-centralized-d-0fa6
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Client Instantiation Logic Centralized Dedicated Factory"
metadata:
  actual:
    adr_id: 0fa690dc-18f9-4e7c-9c2c-7c42d53744b4
    status: accepted
    candidate_group_id: 78b9c376-a306-46aa-9a41-98f276cda264
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/**
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Client Instantiation Logic Centralized Dedicated Factory

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all modules instantiating database clients or managing authentication sessions within client, server, or middleware execution environments, as well as all routes, components, and data access utilities interacting with authenticated backend services.

### Rules

- **R-SUPA-001** SHOULD: Client instantiation logic SHOULD be centralized into dedicated factory utilities separated strictly by runtime execution boundary.

### Verify

```bash
# Discover and execute the project verification script responsible for static code analysis, linting, and module boundary checks across all application tiers.
# Discover and execute the project test runner to validate that server, client, and middleware database client adapters execute without runtime exceptions.
```

**Accept when:**
- Static analysis confirms all database client creation and authentication session reads in server, client, and middleware boundaries utilize the designated SSR library adapter.
- Project verification and type-checking routines pass without unresolved imports or type mismatches against database definitions.
- No unauthorized client instantiation or direct token manipulation bypassing the cookie adapter exists in the codebase.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated static analysis, linting rules, peer code reviews, and continuous integration gates.
</enforcement>