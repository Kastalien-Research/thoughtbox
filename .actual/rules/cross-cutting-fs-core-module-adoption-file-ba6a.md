---
version: 2
name: cross-cutting-fs-core-module-adoption-file-ba6a
description: "node:fs Core Module Adoption: File System Interactions Across Server Side"
metadata:
  actual:
    adr_id: ba6a7bd3-01ba-467a-b541-3e93449faa6e
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

# node:fs Core Module Adoption: File System Interactions Across Server Side

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/scripts/qa/**`, `apps/web/src/lib/docs/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NFS-001** MUST: All file system interactions across server-side utilities, verification scripts, and automation hooks MUST import the file system module using the explicit protocol URI scheme node:fs or node:fs/promises.

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