---
version: 2
name: cross-cutting-database-queries-that-execute-within-3087
description: "@supabase/ssr Client Adoption for Server and Browser Contexts: Database Queries That Execute Within Server"
metadata:
  actual:
    adr_id: 3087ff83-c9c3-4e78-bf43-c3c52cf55350
    status: accepted
    candidate_group_id: af4b62a7-86c3-4767-bdfb-69c561be42ac
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# @supabase/ssr Client Adoption for Server and Browser Contexts: Database Queries That Execute Within Server

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** SHOULD: Database queries that execute within server environments SHOULD encapsulate `@supabase/ssr` client operations within dedicated data access modules rather than mixing database operations with component presentation logic.

### Verify

```bash
# Discover the project test execution script from the dependency manifest and run tests
# Discover the project type verification script from the dependency manifest and execute type checking
```

**Accept when:**
- All unit and integration tests covering database queries and authentication flows pass with zero errors.
- Type verification passes cleanly across all modules importing the client library and repository database types without type assertions or suppressions.

<enforcement>
Claude Code MUST NOT skip or defer verification. All database queries and authentication handlers must consume approved client factories and pass automated continuous integration checks.
</enforcement>