---
version: 2
name: cross-cutting-repositories-storage-adapters-supply-dat-59d0
description: "@supabase/supabase-js Stateless Client Pattern for Primary Datastores: Repositories Storage Adapters Supply Database Type"
metadata:
  actual:
    adr_id: 59d0faa9-e78c-43ff-8fe5-2388e6afd309
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

# @supabase/supabase-js Stateless Client Pattern for Primary Datastores: Repositories Storage Adapters Supply Database Type

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** SHOULD: Repositories and storage adapters SHOULD supply database type schemas to createClient to enforce end-to-end type safety across queries and table operations.

### Verify

```bash
# Discover the project test runner and static analysis tools from the repository manifest and execute them
# Example discovery and execution loop:
if [ -f "package.json" ]; then
  npm test
  npm run typecheck || npx tsc --noEmit
fi
```

**Accept when:**
- All persistence adapter test suites pass without session persistence warnings or unhandled background timer rejections.
- Static verification confirms that primary datastore client calls pass explicit auth configuration and compile cleanly against database schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory and enforced by automated static analysis, type verification in continuous integration pipelines, and peer code review.
</enforcement>