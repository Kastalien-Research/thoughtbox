---
version: 2
name: cross-cutting-server-side-data-access-logic-31ef
description: "Adoption of @supabase/ssr for Server-Side Client Management: Server Side Data Access Logic Not"
metadata:
  actual:
    adr_id: 31ef4d2a-56c3-478f-aed9-4b86a64f427f
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

# Adoption of @supabase/ssr for Server-Side Client Management: Server Side Data Access Logic Not

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST_NOT: Server-side data access logic MUST NOT instantiate un-adapted browser client libraries or bypass server cookie store synchronization.

### Verify

```bash
# Discover and run the project static analysis and linting scripts to verify server client import conformity
# Discover and execute the project automated test suite covering server actions and data access utilities
# Discover and execute the project type-checking routine to confirm database schema binding compatibility
```

**Accept when:**
- All server-side data access and authentication operations instantiate clients through `@supabase/ssr` request adapters.
- The project type-checking and automated test suites execute and exit without failure.
- No direct client-side SDK instantiations appear in server actions or server-side data modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks execute repository type verification and linting, and peer code review validates server actions, route handlers, and database access utilities.
</enforcement>