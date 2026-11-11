---
version: 2
name: cross-cutting-provider-client-instance-instantiated-vi-d3f2
description: "Supabase Auth Password Authentication in Server Actions: Provider Client Instance Instantiated Via Server"
metadata:
  actual:
    adr_id: d3f2a8fa-7522-4af2-83a8-2ef3d645243f
    status: accepted
    candidate_group_id: 2956158a-06a2-45d3-9b5b-0fe83df1dd18
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Supabase Auth Password Authentication in Server Actions: Provider Client Instance Instantiated Via Server

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for server actions handling user sign-in, credential verification, and account management actions requiring current password confirmation prior to mutation.

### Rules

- **R-SUPA-001** MUST: The provider client instance MUST be instantiated via the server client factory module to ensure session cookies and headers are handled within the server execution context.

### Verify

```bash
# Discover and execute the project's static analysis script to verify password authentication conforms to the designated provider client interface
npm run lint || pnpm lint || yarn lint

# Discover and execute the repository test suite to verify authentication and account settings server action behavior
npm test || pnpm test || yarn test
```

**Accept when:**
- Static analysis confirms all password verification routines invoke supabase.auth.signInWithPassword using the server client factory.
- Automated test suites validate successful authentication and structured failure handling across authentication and account settings workflows.
- Dependency audit confirms client library calls conform to the resolved version documented in the repository lock artifact.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated static analysis checks scanning server actions for unauthorized direct credential checks or unapproved authentication provider client calls, and mandatory peer code review.
</enforcement>