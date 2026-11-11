---
version: 2
name: cross-cutting-primary-datastore-access-across-backend-f6c7
description: "@supabase/supabase-js Stateless Client Pattern for Primary Datastores: Primary Datastore Access Across Backend Storage"
metadata:
  actual:
    adr_id: f6c73d02-17bf-4f54-b8e1-474f8557ceb3
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

# @supabase/supabase-js Stateless Client Pattern for Primary Datastores: Primary Datastore Access Across Backend Storage

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-DAT-001** MUST: Primary datastore access across backend storage adapters, repositories, and protocol handlers MUST use @supabase/supabase-js initialized through createClient configured with stateless session options setting auth persistSession to false and auth autoRefreshToken to false.

### Verify

```bash
# Discover the project test runner and static analysis tools from the project manifest
# and execute test suites and type-checkers covering datastore client initialization and repository behavior.
```

**Accept when:**
- All persistence adapter test suites pass without session persistence warnings or unhandled background timer rejections.
- Static verification confirms that primary datastore client calls pass explicit auth configuration and compile cleanly against database schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis and peer code review enforce these rules, causing build rejections on continuous integration when unconfigured or untyped client initializations are detected.
</enforcement>