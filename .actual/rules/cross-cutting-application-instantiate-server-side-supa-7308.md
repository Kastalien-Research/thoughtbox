---
version: 2
name: cross-cutting-application-instantiate-server-side-supa-7308
description: "Adoption of @supabase/ssr for Server-Side Client Management: Application Instantiate Server Side Supabase Database"
metadata:
  actual:
    adr_id: 7308ee3e-05ae-4d27-adb5-791425c547b6
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

# Adoption of @supabase/ssr for Server-Side Client Management: Application Instantiate Server Side Supabase Database

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for server actions performing transactional mutations, server-side database access layers, query utilities, and internal server utility modules managing database sessions.

### Rules

- **R-SUPA-001** MUST: The application MUST instantiate server-side Supabase database and authentication clients exclusively through the `@supabase/ssr` module configured with request cookie store adapters.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>