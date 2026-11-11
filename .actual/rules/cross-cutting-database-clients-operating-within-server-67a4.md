---
version: 2
name: cross-cutting-database-clients-operating-within-server-67a4
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Database Clients Operating Within Server Environments"
metadata:
  actual:
    adr_id: 67a459c3-f47d-44b7-84e3-439083e51f9c
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

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Database Clients Operating Within Server Environments

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all modules instantiating database clients, managing authentication sessions, or interacting with authenticated backend services across client, server, or middleware execution environments.

### Rules

- **R-SSRP-001** MUST: Database clients operating within server environments or request middleware MUST configure cookie store adapters that read and write authentication tokens via HTTP request and response cookies.

### Verify

```bash
# Discover and execute the project verification script responsible for static code analysis, linting, and module boundary checks
# Discover and execute the project test runner to validate that server, client, and middleware database client adapters execute without runtime exceptions
```

**Accept when:**
- Static analysis confirms all database client creation and authentication session reads in server, client, and middleware boundaries utilize the designated SSR library adapter.
- Project verification and type-checking routines pass without unresolved imports or type mismatches against database definitions.
- No unauthorized client instantiation or direct token manipulation bypassing the cookie adapter exists in the codebase.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests containing non-compliant client initialization or unmanaged session cookies will be rejected automatically by continuous integration gates.
</enforcement>