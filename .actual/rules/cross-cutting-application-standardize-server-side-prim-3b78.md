---
version: 2
name: cross-cutting-application-standardize-server-side-prim-3b78
description: "Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Application Standardize Server Side Primary Datastore"
metadata:
  actual:
    adr_id: 3b78b698-9a63-4c74-92b4-b860b9a94cf8
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

# Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Application Standardize Server Side Primary Datastore

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: Standardize all server-side primary datastore access and mutations on Supabase client instances created via createClient.

### Verify

```bash
# Discover and execute project verification scripts and type checking from the repository manifest
# Example discovery:
# npm test
# npx tsc --noEmit
# npx eslint .
```

**Accept when:**
- All server routes, server actions, and middleware instantiate primary datastore clients using createClient without manual connection setup.
- Static type analysis and repository verification scripts pass with zero errors across all server data access modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>