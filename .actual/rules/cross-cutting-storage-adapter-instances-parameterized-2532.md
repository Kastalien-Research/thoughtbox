---
version: 2
name: cross-cutting-storage-adapter-instances-parameterized-2532
description: "@supabase/supabase-js Stateless Client Pattern for Primary Datastores: Storage Adapter Instances Parameterized Tenant Workspace"
metadata:
  actual:
    adr_id: 2532330a-ac0e-4d70-adfc-ab8dffc9a49c
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

# @supabase/supabase-js Stateless Client Pattern for Primary Datastores: Storage Adapter Instances Parameterized Tenant Workspace

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for backend storage services, repositories, protocol handlers, and probe monitors communicating with primary datastores using service-role credentials in non-browser environments.

### Rules

- **R-SUPA-001** SHOULD: Storage adapter instances parameterized by tenant or workspace identifiers SHOULD be cached in-memory using an internal lookup map to avoid redundant client allocations across repeated operations within the same process lifecycle.
- **R-SUPA-002** MANDATORY: When instantiating datastore clients in backend services, pass explicit configuration disabling session persistence and token auto-refresh to prevent unintended token storage and background refresh intervals in headless server runtimes.
- **R-SUPA-003** MANDATORY: Bind generated database type definitions directly to the client constructor to preserve compile-time schema validation across queries.
- **R-SUPA-004** MANDATORY (DISCOVERY POLICY): Omit all tool names, file names, commands, package managers, and version numbers from assumptions; the consumer MUST derive them from the project repository.
- **R-SUPA-005** MANDATORY (LOCK-VERSION GROUNDING): Before writing code that uses a versioned library, find the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact to determine the exact resolved version, look up official documentation for that exact version, confirm API existence, and re-verify per dependency at point of use.

### Verify

```bash
# Discover the project manifest and execute the test suites covering datastore client initialization and repository behavior.
# Discover and run the project static analysis and type check commands to verify that all primary datastore client usages adhere to typing and configuration constraints.
```

**Accept when:**
- All persistence adapter test suites pass without session persistence warnings or unhandled background timer rejections.
- Static verification confirms that primary datastore client calls pass explicit auth configuration and compile cleanly against database schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, type verification, and peer code reviews enforce compliance, and builds are rejected on continuous integration when unconfigured or untyped client initializations are detected.
</enforcement>