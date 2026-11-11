---
version: 2
name: cross-cutting-components-utilities-not-store-manage-d872
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Components Utilities Not Store Manage Authentication"
metadata:
  actual:
    adr_id: d87292d5-0234-44b0-b59d-2feb86b9e500
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

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Components Utilities Not Store Manage Authentication

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ADR-001** MUST_NOT: Components and utilities MUST NOT store or manage authentication session tokens in browser local storage or proprietary client-side caches when operating within server-rendered workflows.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>