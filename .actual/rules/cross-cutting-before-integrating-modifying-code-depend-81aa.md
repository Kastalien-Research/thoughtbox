---
version: 2
name: cross-cutting-before-integrating-modifying-code-depend-81aa
description: "@supabase/supabase-js Stateless Client Pattern for Primary Datastores: Before Integrating Modifying Code Depending Supabase"
metadata:
  actual:
    adr_id: 81aa9364-c316-4682-af31-6249be4c725d
    status: accepted
    candidate_group_id: 89678a68-6d50-4361-9385-767b19f8de11
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/**
---

# @supabase/supabase-js Stateless Client Pattern for Primary Datastores: Before Integrating Modifying Code Depending Supabase

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for backend storage services, repositories, protocol handlers, and probe monitors communicating with primary datastores using service-role credentials in non-browser environments.

### Rules

- **R-SUPA-001** MUST: Before integrating or modifying code depending on @supabase/supabase-js, the consumer MUST discover the dependency manifest and the authoritative repository lock artifact to determine the exact resolved dependency version and verify API compatibility against documentation for that exact version.

### Verify

```bash
# Discover the project test runner and static analysis/type check tools from the manifest, then execute them:
# Example: npm test && npm run typecheck
```

**Accept when:**
- All persistence adapter test suites pass without session persistence warnings or unhandled background timer rejections.
- Static verification confirms that primary datastore client calls pass explicit auth configuration and compile cleanly against database schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated static analysis, type verification, and peer code review.
</enforcement>