---
version: 2
name: cross-cutting-before-writing-code-that-imports-0cc1
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Before Writing Code That Imports Configures"
metadata:
  actual:
    adr_id: 0cc1b517-5552-435c-a05a-f0bf7fafcc4f
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

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Before Writing Code That Imports Configures

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all modules instantiating database clients, managing authentication sessions, or interacting with authenticated backend services across client, server, or middleware execution environments.

### Rules

- **R-SUP-001** MUST: Before writing code that imports or configures the adopted library, the consumer MUST inspect the repository lock artifact to determine the exact resolved dependency version and verify API compatibility against that exact version documentation.

### Verify

```bash
# Discover and execute the project verification script for static analysis, linting, and module boundary checks
# Discover and execute the project test runner to validate database client adapters
```

**Accept when:**
- Static analysis confirms all database client creation and authentication session reads in server, client, and middleware boundaries utilize the designated SSR library adapter.
- Project verification and type-checking routines pass without unresolved imports or type mismatches against database definitions.
- No unauthorized client instantiation or direct token manipulation bypassing the cookie adapter exists in the codebase.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, linting, and CI gates will reject pull requests containing non-compliant client initialization or unmanaged session cookies.
</enforcement>