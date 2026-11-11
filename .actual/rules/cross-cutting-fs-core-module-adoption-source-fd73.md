---
version: 2
name: cross-cutting-fs-core-module-adoption-source-fd73
description: "node:fs Core Module Adoption: Source Code Not Import Runtime Core"
metadata:
  actual:
    adr_id: fd73aba2-9ae7-4b3a-a963-96c2c2f38030
    status: accepted
    candidate_group_id: 5d515469-88d5-4494-95fe-416ab3186b02
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - .claude/hooks/**
      - scripts/qa/**
      - src/lib/docs/**
---

# node:fs Core Module Adoption: Source Code Not Import Runtime Core

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/scripts/qa/**`, `apps/web/src/lib/docs/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NFS-001** MUST_NOT: Source code MUST NOT import runtime core modules using unadorned bare specifiers that omit the explicit protocol URI scheme.

### Verify

```bash
# Discover repository verification scripts from the project manifest and execute linting checks
# Discover and run the architecture verification test suite defined in repository configuration
```

**Accept when:**
- Static analysis confirms zero unadorned bare module imports for runtime core capabilities across the codebase
- Architecture verification and test suites execute without errors across all workspace packages

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>