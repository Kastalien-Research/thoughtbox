---
version: 2
name: cross-cutting-consumer-inspect-repository-lock-artifac-48aa
description: "Next.js Runtime Environment Configuration: Consumer Inspect Repository Lock Artifact Determine"
metadata:
  actual:
    adr_id: 48aa92ab-ab9b-4dec-b853-b7c433546fa7
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

# Next.js Runtime Environment Configuration: Consumer Inspect Repository Lock Artifact Determine

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all runtime configuration and credential retrieval across client components, server components, middleware, and route handlers.

### Rules

- **R-NEXT-001** MUST: The consumer MUST inspect the repository lock artifact to determine and verify the exact resolved version of the framework before implementing or configuring runtime environment sources.

### Verify

```bash
# Discover and run the project test suite using the project build runner specified in repository manifests
# Discover and run the project type checker and static analysis linters to confirm environment variable usage conforms to execution boundaries
```

**Accept when:**
- Static analysis and type checking pass without referencing server-only environment variables in client-side compilation units.
- All runtime execution paths successfully resolve required environment configuration values without runtime errors.
- Secret credentials remain restricted to server runtime contexts.

<enforcement>
Claude Code MUST NOT skip or defer verification. All runtime configuration implementations must strictly enforce environment boundary isolation and lock artifact version verification.
</enforcement>