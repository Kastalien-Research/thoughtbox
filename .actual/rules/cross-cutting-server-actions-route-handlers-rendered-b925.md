---
version: 2
name: cross-cutting-server-actions-route-handlers-rendered-b925
description: "Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Server Actions Route Handlers Rendered Components"
metadata:
  actual:
    adr_id: b9259617-83be-48a1-9686-5ee73953fb9a
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

# Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Server Actions Route Handlers Rendered Components

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: Server actions, API route handlers, and server-rendered components MUST obtain datastore access exclusively through createClient rather than instantiating unmanaged database connections.

### Verify

```bash
# Discover the project verification scripts in the repository manifest and execute the test runner
# Discover the repository type-checking and linting configurations and execute the static analyzer across all server routes and actions
```

**Accept when:**
- All server routes, server actions, and middleware instantiate primary datastore clients using createClient without manual connection setup.
- Static type analysis and repository verification scripts pass with zero errors across all server data access modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification steps must be executed to ensure all server actions, API route handlers, and server-rendered components exclusively use createClient for datastore access.
</enforcement>