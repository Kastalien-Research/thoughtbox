---
version: 2
name: cross-cutting-client-instantiations-executing-service-d4d4
description: "@supabase/supabase-js Stateless Client Pattern for Primary Datastores: Client Instantiations Executing Service Role Privileges"
metadata:
  actual:
    adr_id: d4d4bd70-3cfa-4db2-b9f3-57d82d867971
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

# @supabase/supabase-js Stateless Client Pattern for Primary Datastores: Client Instantiations Executing Service Role Privileges

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for all backend storage services, repositories, protocol handlers, and probe monitors communicating with primary datastores using service-role credentials in non-browser environments.

### Rules

- **R-SUPA-001** MUST_NOT: Client instantiations executing with service-role privileges MUST NOT enable client-side session persistence or background token refresh loops.

### Verify

```bash
# Discover the project test runner and static analysis tools from the manifest and execute them
# Example discovery sequence:
# 1. Read package.json / dependency manifest to find test and type-check scripts
# 2. Run type checking
npm run typecheck || pnpm typecheck || yarn typecheck
# 3. Run test suites covering datastore client initialization and repository behavior
npm test || pnpm test || yarn test
```

**Accept when:**
- All persistence adapter test suites pass without session persistence warnings or unhandled background timer rejections.
- Static verification confirms that primary datastore client calls pass explicit auth configuration and compile cleanly against database schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, type verification, and peer code review are mandatory enforcement mechanisms for all datastore adapters and repository implementations.
</enforcement>