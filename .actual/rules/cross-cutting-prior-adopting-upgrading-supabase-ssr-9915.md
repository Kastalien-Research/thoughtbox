---
version: 2
name: cross-cutting-prior-adopting-upgrading-supabase-ssr-9915
description: "@supabase/ssr Client Adoption for Server and Browser Contexts: Prior Adopting Upgrading Supabase Ssr Engineers"
metadata:
  actual:
    adr_id: 9915a8cc-e8e2-41d9-83b4-915da8c2a347
    status: accepted
    candidate_group_id: af4b62a7-86c3-4767-bdfb-69c561be42ac
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# @supabase/ssr Client Adoption for Server and Browser Contexts: Prior Adopting Upgrading Supabase Ssr Engineers

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all data access modules, database query routines, authentication handlers, and client-side user interface components managing authentication credentials, password resets, or browser-based data operations.

### Rules

- **R-SUP-001** MUST: Prior to adopting or upgrading `@supabase/ssr`, engineers MUST inspect the repository lock artifact to verify the exact resolved version and validate that client instantiation APIs conform to that specific version documentation.

### Verify

```bash
# Discover the project test execution script from the dependency manifest and run the test suite
# Discover the project type verification script from the dependency manifest and execute it
```

**Accept when:**
- All unit and integration tests covering database queries and authentication flows pass with zero errors.
- Type verification passes cleanly across all modules importing the client library and repository database types without type assertions or suppressions.

<enforcement>
Claude Code MUST NOT skip or defer verification. All database queries and authentication handlers must consume approved client factories and pass automated type verification and test suites.
</enforcement>