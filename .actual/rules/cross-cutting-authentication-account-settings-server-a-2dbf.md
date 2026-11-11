---
version: 2
name: cross-cutting-authentication-account-settings-server-a-2dbf
description: "Supabase Auth Password Authentication in Server Actions: Authentication Account Settings Server Actions Not"
metadata:
  actual:
    adr_id: 2dbf7cb8-bff8-4425-8f49-4e75ff82a8a1
    status: accepted
    candidate_group_id: 2956158a-06a2-45d3-9b5b-0fe83df1dd18
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Supabase Auth Password Authentication in Server Actions: Authentication Account Settings Server Actions Not

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AUTH-001** MUST_NOT: Authentication and account settings server actions MUST NOT implement custom database password hash matching or bypass the designated provider client authentication interface.

### Verify

```bash
# Discover and execute the project's static analysis script in the package manifest
# Discover and execute the repository test suite
```

**Accept when:**
- Static analysis confirms all password verification routines invoke the provider client sign-in method using the server client factory.
- Automated test suites validate successful authentication and structured failure handling across authentication and account settings workflows.
- Dependency audit confirms client library calls conform to the resolved version documented in the repository lock artifact.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated static analysis checks and mandatory peer code review.
</enforcement>