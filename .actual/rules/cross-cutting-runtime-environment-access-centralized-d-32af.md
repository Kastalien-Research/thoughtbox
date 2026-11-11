---
version: 2
name: cross-cutting-runtime-environment-access-centralized-d-32af
description: "Next.js Runtime Environment Configuration: Runtime Environment Access Centralized Domain Specific"
metadata:
  actual:
    adr_id: 32afd5d6-7196-4501-81ed-20e4462651e8
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

# Next.js Runtime Environment Configuration: Runtime Environment Access Centralized Domain Specific

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all runtime configuration and credential retrieval across client components, server components, middleware, and route handlers.

### Rules

- **R-ENV-001** SHOULD: Runtime environment access SHOULD be centralized into domain-specific configuration modules rather than accessed arbitrarily across presentation components.

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
Claude Code MUST NOT skip or defer verification. Continuous integration pipeline blocks pull requests that expose server-only credentials to client components, and violations must be refactored to conform to boundary conventions prior to branch merging.
</enforcement>