---
version: 2
name: cross-cutting-request-middleware-use-createclient-resp-be69
description: "Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Request Middleware Use Createclient Response Cookie"
metadata:
  actual:
    adr_id: be69b3ef-b758-43b4-ba92-cfd07c8fdbbe
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

# Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Request Middleware Use Createclient Response Cookie

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST: Request middleware MUST use createClient with request and response cookie synchronization to refresh sessions and ensure authenticated claims reach downstream handlers.

### Verify

```bash
# Discover and execute project verification scripts from the repository manifest
# Run repository type-checking and static analysis across server routes and actions
```

**Accept when:**
- All server routes, server actions, and middleware instantiate primary datastore clients using createClient without manual connection setup.
- Static type analysis and repository verification scripts pass with zero errors across all server data access modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>