---
version: 2
name: cross-cutting-project-adopt-supabase-ssr-standard-547f
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Project Adopt Supabase Ssr Standard Library"
metadata:
  actual:
    adr_id: 547fcc96-e5bc-4e8a-9d44-e78d080b3042
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

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Project Adopt Supabase Ssr Standard Library

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: The project MUST adopt @supabase/ssr as the standard library for instantiating database clients and synchronizing session cookies across server, client, and middleware contexts.

### Verify

```bash
# Discover and execute project static analysis, linting, and module boundary checks
# Discover and execute project test runner for database client adapters
```

**Accept when:**
- Static analysis confirms all database client creation and authentication session reads in server, client, and middleware boundaries utilize the designated SSR library adapter.
- Project verification and type-checking routines pass without unresolved imports or type mismatches against database definitions.
- No unauthorized client instantiation or direct token manipulation bypassing the cookie adapter exists in the codebase.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, linting, and continuous integration gates verify compliance, and violations will result in automatic pull request rejection.
</enforcement>