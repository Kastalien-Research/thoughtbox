---
version: 2
name: cross-cutting-instantiated-client-modules-bind-generat-2fa3
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Instantiated Client Modules Bind Generated Database"
metadata:
  actual:
    adr_id: 2fa3282c-fe5f-430b-95ae-7f6e7b146dac
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

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Instantiated Client Modules Bind Generated Database

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all modules instantiating database clients or managing authentication sessions within client, server, or middleware execution environments, and all routes, components, and data access utilities interacting with authenticated backend services.

### Rules

- **R-SUPA-001** MUST: All instantiated client modules MUST bind generated database type interfaces to ensure end-to-end type safety for database operations across the application.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>