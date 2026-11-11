---
version: 2
name: cross-cutting-components-data-helpers-requiring-derive-80a3
description: "Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Components Data Helpers Requiring Derived Memory"
metadata:
  actual:
    adr_id: 80a3a517-549f-4ef9-839b-5e4a205a45e1
    status: accepted
    candidate_group_id: 62d1546e-93ee-41c9-99f3-d8361e4129f5
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/**
      - src/components/session-area/**
      - src/lib/**
---

# Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Components Data Helpers Requiring Derived Memory

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for server-rendered page routes, server actions, API route handlers, and middleware requiring primary datastore querying and derived in-memory lookups.

### Rules

- **R-SUPA-001** SHOULD: Components and data helpers requiring derived in-memory lookups or intermediate graph aggregations SHOULD project query results into local maps after retrieving primary datastore records via createClient.

### Verify

```bash
# Discover the project verification scripts in the repository manifest and execute tests/type-checking
# Example discovery and execution:
npm test
npm run lint
npm run typecheck
```

**Accept when:**
- All server routes, server actions, and middleware instantiate primary datastore clients using createClient without manual connection setup.
- Static type analysis and repository verification scripts pass with zero errors across all server data access modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration checks executing repository type checks, unit tests, and lint rules on every pull request.
</enforcement>