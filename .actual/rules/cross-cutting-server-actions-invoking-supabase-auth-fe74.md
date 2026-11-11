---
version: 2
name: cross-cutting-server-actions-invoking-supabase-auth-fe74
description: "Supabase Auth Password Authentication in Server Actions: Server Actions Invoking Supabase Auth Signinwithpassword"
metadata:
  actual:
    adr_id: fe74586d-b59a-4a31-8a53-aa5ba2631cbc
    status: accepted
    candidate_group_id: 2956158a-06a2-45d3-9b5b-0fe83df1dd18
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Supabase Auth Password Authentication in Server Actions: Server Actions Invoking Supabase Auth Signinwithpassword

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SB-001** SHOULD: Server actions invoking supabase.auth.signInWithPassword SHOULD extract and validate the presence of credential parameters from incoming form data prior to dispatching authentication requests.

### Verify

```bash
# Discover the project's static analysis script in the package manifest and execute it
# Discover and execute the repository test suite
```

**Accept when:**
- Static analysis confirms all password verification routines invoke supabase.auth.signInWithPassword using the server client factory.
- Automated test suites validate successful authentication and structured failure handling across authentication and account settings workflows.
- Dependency audit confirms client library calls conform to the resolved version documented in the repository lock artifact.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>