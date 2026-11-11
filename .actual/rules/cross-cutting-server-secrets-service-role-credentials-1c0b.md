---
version: 2
name: cross-cutting-server-secrets-service-role-credentials-1c0b
description: "Next.js Runtime Environment Configuration: Server Secrets Service Role Credentials Not"
metadata:
  actual:
    adr_id: 1c0b5dc4-355f-4e40-ae63-5f29b526195e
    status: accepted
    candidate_group_id: 2439c5f1-c378-48fb-9cc3-e922cefe0844
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - .claude/hooks/**
      - middleware.ts
      - src/app/**
      - src/lib/**
---

# Next.js Runtime Environment Configuration: Server Secrets Service Role Credentials Not

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all runtime configuration and credential retrieval across client components, server components, middleware, and route handlers.

### Rules

- **R-NXT-001** MUST_NOT: Server secrets and service role credentials MUST NOT be exposed with the public variable prefix and MUST only be accessed within server-side execution boundaries, route handlers, or middleware.

### Verify

```bash
# Discover and run the project test suite using the project build runner specified in repository manifests.
# Discover and run the project type checker and static analysis linters to confirm environment variable usage conforms to execution boundaries.
```

**Accept when:**
- Static analysis and type checking pass without referencing server-only environment variables in client-side compilation units.
- All runtime execution paths successfully resolve required environment configuration values without runtime errors.
- Secret credentials remain restricted to server runtime contexts.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>