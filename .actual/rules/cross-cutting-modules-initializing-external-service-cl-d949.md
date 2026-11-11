---
version: 2
name: cross-cutting-modules-initializing-external-service-cl-d949
description: "Next.js Runtime Environment Configuration: Modules Initializing External Service Clients Validate"
metadata:
  actual:
    adr_id: d9495202-baca-4b20-abca-2a4266d4a1db
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

# Next.js Runtime Environment Configuration: Modules Initializing External Service Clients Validate

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ENV-001** MUST: Modules initializing external service clients MUST validate the presence of required runtime environment variables during execution and handle unconfigured states gracefully.

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