---
version: 2
name: cross-cutting-server-side-code-not-bypass-df34
description: "Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Server Side Code Not Bypass Createclient"
metadata:
  actual:
    adr_id: df34edf8-8947-4482-ae7e-8399e4230295
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

# Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Server Side Code Not Bypass Createclient

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for server-rendered page routes, server actions, API route handlers, and middleware requiring primary datastore querying.

### Rules

- **R-SUP-001** MUST_NOT: Server-side code MUST_NOT bypass createClient to directly expose or embed administrative service credentials into client-facing runtime contexts.

### Verify

```bash
# Discover and execute the project test runner and static analyzer to validate primary datastore client instantiation
# Discover the project verification scripts in the repository manifest and execute them
npm test
npm run lint
npm run typecheck
```

**Accept when:**
- All server routes, server actions, and middleware instantiate primary datastore clients using createClient without manual connection setup.
- Static type analysis and repository verification scripts pass with zero errors across all server data access modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>