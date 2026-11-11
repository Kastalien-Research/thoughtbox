---
version: 2
name: cross-cutting-before-implementing-updating-authenticat-93aa
description: "Supabase Auth Password Authentication in Server Actions: Before Implementing Updating Authentication Calls Against"
metadata:
  actual:
    adr_id: 93aa0a37-1de3-41f3-bc42-0793ef6bdb4c
    status: accepted
    candidate_group_id: 2956158a-06a2-45d3-9b5b-0fe83df1dd18
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Supabase Auth Password Authentication in Server Actions: Before Implementing Updating Authentication Calls Against

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for server action routines handling user sign-in, credential verification, and account management actions requiring current password confirmation prior to mutation.

### Rules

- **R-SBA-001** MUST: Before implementing or updating authentication calls against the provider client library, the consumer MUST inspect the dependency manifest and authoritative resolution lock artifact to verify the exact resolved version and consult its version-specific documentation.
- **R-SBA-002** MUST: Initialize the provider client inside the server action scope using the internal server client factory to ensure request and response cookie contexts are appropriately wired.
- **R-SBA-003** MUST: Sanitize all error messages returned from failed authentication calls before exposing feedback to caller forms or application state.

### Verify

```bash
# Discover the project's static analysis script in the package manifest and execute it
# to verify that password authentication conforms to the designated provider client interface.
npm run lint || pnpm lint || yarn lint

# Discover and execute the repository test suite to verify authentication and account settings server action behavior.
npm test || pnpm test || yarn test
```

**Accept when:**
- Static analysis confirms all password verification routines invoke supabase.auth.signInWithPassword using the server client factory.
- Automated test suites validate successful authentication and structured failure handling across authentication and account settings workflows.
- Dependency audit confirms client library calls conform to the resolved version documented in the repository lock artifact.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>