---
version: 2
name: cross-cutting-client-instantiation-across-both-server-c149
description: "@supabase/ssr Client Adoption for Server and Browser Contexts: Client Instantiation Across Both Server Runtimes"
metadata:
  actual:
    adr_id: c149c96e-5506-4db8-b67f-12cba9189c47
    status: accepted
    candidate_group_id: af4b62a7-86c3-4767-bdfb-69c561be42ac
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# @supabase/ssr Client Adoption for Server and Browser Contexts: Client Instantiation Across Both Server Runtimes

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: Client instantiation across both server runtimes and browser environments MUST bind to shared project schema types rather than unconstrained or dynamic record structures.

### Verify

```bash
# Discover and run test execution script from dependency manifest
# Discover and run type verification script from dependency manifest
```

**Accept when:**
- All unit and integration tests covering database queries and authentication flows pass with zero errors.
- Type verification passes cleanly across all modules importing the client library and repository database types without type assertions or suppressions.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>