---
version: 2
name: cross-cutting-server-actions-performing-password-based-d103
description: "Supabase Auth Password Authentication in Server Actions: Server Actions Performing Password Based Authentication"
metadata:
  actual:
    adr_id: d103c7e5-a102-4dfe-8e90-08e2da3a8ece
    status: accepted
    candidate_group_id: 2956158a-06a2-45d3-9b5b-0fe83df1dd18
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Supabase Auth Password Authentication in Server Actions: Server Actions Performing Password Based Authentication

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SBA-001** MUST: Server actions performing password-based authentication or credential re-verification MUST invoke supabase.auth.signInWithPassword through an initialized server client instance.

### Verify

```bash
# Discover the project's static analysis script in the package manifest and execute it
npm run lint
# Discover and execute the repository test suite
npm test
```

**Accept when:**
- Static analysis confirms all password verification routines invoke supabase.auth.signInWithPassword using the server client factory.
- Automated test suites validate successful authentication and structured failure handling across authentication and account settings workflows.
- Dependency audit confirms client library calls conform to the resolved version documented in the repository lock artifact.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>