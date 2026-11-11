---
version: 2
name: cross-cutting-developers-inspect-project-lock-resoluti-f646
description: "Adoption of @supabase/ssr for Server-Side Client Management: Developers Inspect Project Lock Resolution Artifact"
metadata:
  actual:
    adr_id: f6465fd8-098a-498a-8ee4-4d38209a7293
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

# Adoption of @supabase/ssr for Server-Side Client Management: Developers Inspect Project Lock Resolution Artifact

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for server actions performing transactional mutations, server-side database access layers, and internal server utility modules managing database sessions.

### Rules

- **R-SUP-001** MUST: Developers MUST inspect the project lock and resolution artifact to resolve the exact dependency version for `@supabase/ssr` and verify API compatibility before implementing server client logic.

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
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks and peer code reviews verify adherence to server-side client construction patterns.
</enforcement>