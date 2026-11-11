---
version: 2
name: cross-cutting-client-instantiation-across-execution-ti-d842
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Client Instantiation Across Execution Tiers Retrieve"
metadata:
  actual:
    adr_id: d84217d3-191c-4c00-b2d4-819225222c97
    status: accepted
    candidate_group_id: 78b9c376-a306-46aa-9a41-98f276cda264
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/**
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Client Instantiation Across Execution Tiers Retrieve

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all modules instantiating database clients or managing authentication sessions within client, server, or middleware execution environments, and all routes, components, and data access utilities interacting with authenticated backend services.

### Rules

- **R-CLIENT-001** MUST: Client instantiation across all execution tiers MUST retrieve connection parameters and anonymous access credentials exclusively from declared runtime environment configuration.
- **R-CLIENT-002** MANDATORY (DISCOVERY POLICY): Omit all tool names, file names, commands, package managers, and version numbers from assumptions; the consumer MUST derive them from the project repository.
- **R-CLIENT-003** MANDATORY (LOCK-VERSION GROUNDING): Before writing code that uses a versioned library, execute in order: (1) Find the dependency manifest in the repo. (2) Identify the build tool. (3) Inspect the repository lock or resolution artifact for the exact resolved version. (4) Look up official documentation/changelog/public API reference for that exact version. (5) Confirm every API, class, or function exists in that version. (6) Re-run steps 3-5 per dependency at point of use for version-sensitive behavior.

### Verify

```bash
# Discover and execute the project verification script responsible for static code analysis, linting, and module boundary checks across all application tiers.
# Discover and execute the project test runner to validate that server, client, and middleware database client adapters execute without runtime exceptions.
```

**Accept when:**
- Static analysis confirms all database client creation and authentication session reads in server, client, and middleware boundaries utilize the designated SSR library adapter.
- Project verification and type-checking routines pass without unresolved imports or type mismatches against database definitions.
- No unauthorized client instantiation or direct token manipulation bypassing the cookie adapter exists in the codebase.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated static analysis and linting rules prohibiting non-standard client creation or direct token storage, peer code review, and CI build/test verification passes. Pull requests containing non-compliant client initialization or unmanaged session cookies will be rejected automatically by continuous integration gates.
</enforcement>