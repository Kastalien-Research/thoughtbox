---
version: 2
name: cross-cutting-server-client-creation-routines-supply-0f5b
description: "Adoption of @supabase/ssr for Server-Side Client Management: Server Client Creation Routines Supply Generated"
metadata:
  actual:
    adr_id: 0f5be8ca-336a-4029-b3aa-caba634205b4
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

# Adoption of @supabase/ssr for Server-Side Client Management: Server Client Creation Routines Supply Generated

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for server actions performing transactional mutations or external service orchestrations, server-side database access layers and query utilities requiring authenticated user context, and internal server utility modules managing database sessions.

### Rules

- **R-SUP-001** SHOULD: Server client creation routines SHOULD supply generated schema definitions to enforce compile-time type safety across database queries and remote procedure calls.

### Verify

```bash
# Discover and run the project static analysis and linting scripts to verify server client import conformity.
npm run lint
# Discover and execute the project automated test suite covering server actions and data access utilities.
npm test
# Discover and execute the project type-checking routine to confirm database schema binding compatibility.
npm run typecheck
```

**Accept when:**
- All server-side data access and authentication operations instantiate clients through `@supabase/ssr` request adapters.
- The project type-checking and automated test suites execute and exit without failure.
- No direct client-side SDK instantiations appear in server actions or server-side data modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>