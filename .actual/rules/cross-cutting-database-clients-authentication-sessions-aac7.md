---
version: 2
name: cross-cutting-database-clients-authentication-sessions-aac7
description: "@supabase/ssr Client Adoption for Server and Browser Contexts: Database Clients Authentication Sessions Operating Across"
metadata:
  actual:
    adr_id: aac71240-7a9c-418b-a829-c71d0c69ff87
    status: accepted
    candidate_group_id: af4b62a7-86c3-4767-bdfb-69c561be42ac
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# @supabase/ssr Client Adoption for Server and Browser Contexts: Database Clients Authentication Sessions Operating Across

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all data access modules, database query routines, authentication handlers, and client-side user interface components managing authentication credentials, password resets, or browser-based data operations.

### Rules

- **R-SSRC-001** MUST: All database clients and authentication sessions operating across server execution contexts and browser rendering boundaries MUST be initialized through `@supabase/ssr` factory functions parameterized with the repository schema type definition.

### Verify

```bash
# Discover and run the project test execution script from the dependency manifest
# Discover and run the project type verification script from the dependency manifest
```

**Accept when:**
- All unit and integration tests covering database queries and authentication flows pass with zero errors.
- Type verification passes cleanly across all modules importing the client library and repository database types without type assertions or suppressions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks, static analysis, and peer code review enforce that all database queries and authentication handlers consume approved client factories.
</enforcement>