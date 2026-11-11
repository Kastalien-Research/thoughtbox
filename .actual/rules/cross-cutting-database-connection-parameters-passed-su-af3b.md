---
version: 2
name: cross-cutting-database-connection-parameters-passed-su-af3b
description: "Adoption of @supabase/ssr for Server-Side Client Management: Database Connection Parameters Passed Supabase Ssr"
metadata:
  actual:
    adr_id: af3bfff8-61dc-423e-83e9-45e0d5943871
    status: accepted
    candidate_group_id: 8adcaf56-94ec-4091-b175-379275ff43d5
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/lib/**
---

# Adoption of @supabase/ssr for Server-Side Client Management: Database Connection Parameters Passed Supabase Ssr

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all server actions, server-side database access layers, query utilities, and internal server utility modules managing database sessions.

### Rules

- **R-SUP-001** MUST: Database connection parameters passed to `@supabase/ssr` client factories MUST be sourced from validated server environment configuration variables.

### Verify

```bash
# Discover and run the project static analysis and linting scripts to verify server client import conformity.
# Discover and execute the project automated test suite covering server actions and data access utilities.
# Discover and execute the project type-checking routine to confirm database schema binding compatibility.
```

**Accept when:**
- All server-side data access and authentication operations instantiate clients through `@supabase/ssr` request adapters.
- The project type-checking and automated test suites execute and exit without failure.
- No direct client-side SDK instantiations appear in server actions or server-side data modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks execute repository type verification and linting, and violations block merging.
</enforcement>