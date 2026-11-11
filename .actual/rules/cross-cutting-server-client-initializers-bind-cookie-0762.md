---
version: 2
name: cross-cutting-server-client-initializers-bind-cookie-0762
description: "Adoption of @supabase/ssr for Server-Side Client Management: Server Client Initializers Bind Cookie Management"
metadata:
  actual:
    adr_id: 0762d6af-3676-4496-ab83-15ed8ab6b608
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

# Adoption of @supabase/ssr for Server-Side Client Management: Server Client Initializers Bind Cookie Management

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for server actions, server-side database access layers, query utilities, and internal server utility modules managing database sessions.

### Rules

- **R-SUPA-001** MUST: Server client initializers MUST bind cookie management methods to the server request cookie store for retrieving, setting, and removing session tokens.

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