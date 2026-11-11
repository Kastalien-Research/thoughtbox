---
version: 2
name: cross-cutting-fs-core-module-adoption-client-2816
description: "node:fs Core Module Adoption: Client Side Application Bundles Targeting Browser"
metadata:
  actual:
    adr_id: 28162e95-0338-42e4-a6c6-223c254d70cb
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

# node:fs Core Module Adoption: Client Side Application Bundles Targeting Browser

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/scripts/qa/**`, `apps/web/src/lib/docs/**`.

These rules are ALWAYS ACTIVE for client-side application bundles and shared UI component libraries targeting browser runtime environments.

### Rules

- **R-FS-001** MUST_NOT: Client-side application bundles targeting browser runtime environments MUST NOT import node:fs or any server-only runtime core modules.

### Verify

```bash
# Discover repository verification scripts from the project manifest and execute linting checks
# Discover and run the architecture verification test suite defined in repository configuration
```

**Accept when:**
- Static analysis confirms zero unadorned bare module imports for runtime core capabilities across the codebase
- Architecture verification and test suites execute without errors across all workspace packages

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>