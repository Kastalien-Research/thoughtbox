---
version: 2
name: cross-cutting-browser-rendered-interface-components-no-d45f
description: "@supabase/ssr Client Adoption for Server and Browser Contexts: Browser Rendered Interface Components Not Bypass"
metadata:
  actual:
    adr_id: d45ff0a0-b4e8-4f3a-93af-19ea167a61a7
    status: accepted
    candidate_group_id: af4b62a7-86c3-4767-bdfb-69c561be42ac
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# @supabase/ssr Client Adoption for Server and Browser Contexts: Browser Rendered Interface Components Not Bypass

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST_NOT: Browser-rendered interface components MUST NOT bypass `@supabase/ssr` mechanisms to execute direct untyped backend database queries.

### Verify

```bash
# Discover and run the project test execution script from the dependency manifest
# Discover and run the project type verification script from the dependency manifest
```

**Accept when:**
- All unit and integration tests covering database queries and authentication flows pass with zero errors.
- Type verification passes cleanly across all modules importing the client library and repository database types without type assertions or suppressions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory for all code submissions involving database queries and authentication handlers.
</enforcement>