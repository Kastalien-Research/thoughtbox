---
version: 2
name: cross-cutting-client-accessible-runtime-configuration-8c5b
description: "Next.js Runtime Environment Configuration: Client Accessible Runtime Configuration Values Utilize"
metadata:
  actual:
    adr_id: 8c5b672a-a31f-45d0-abe7-d517aeefe150
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

# Next.js Runtime Environment Configuration: Client Accessible Runtime Configuration Values Utilize

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ENV-001** MUST: All client-accessible runtime configuration values MUST utilize the framework public variable prefix convention, separating public configuration from server-only secrets at compile time.

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
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration build checks validating environment boundary isolation, static code analysis scanning for unauthorized process environment access in client bundles, and peer code review during pull request evaluations.
</enforcement>