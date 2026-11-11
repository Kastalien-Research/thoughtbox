---
version: 2
name: cross-cutting-application-secrets-client-connection-cr-d6a5
description: "@supabase/ssr Client Adoption for Server and Browser Contexts: Application Secrets Client Connection Credentials Read"
metadata:
  actual:
    adr_id: d6a5d498-bab6-4341-b8d8-3ae08801dadd
    status: accepted
    candidate_group_id: af4b62a7-86c3-4767-bdfb-69c561be42ac
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# @supabase/ssr Client Adoption for Server and Browser Contexts: Application Secrets Client Connection Credentials Read

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST: Application secrets and client connection credentials MUST be read strictly through runtime environment configuration providers rather than hardcoded string literals.

### Verify

```bash
# Discover and run the project test execution script from the dependency manifest
# Discover and run the project type verification script from the dependency manifest
```

**Accept when:**
- All unit and integration tests covering database queries and authentication flows pass with zero errors.
- Type verification passes cleanly across all modules importing the client library and repository database types without type assertions or suppressions.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>