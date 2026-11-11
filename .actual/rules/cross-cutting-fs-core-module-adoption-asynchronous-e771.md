---
version: 2
name: cross-cutting-fs-core-module-adoption-asynchronous-e771
description: "node:fs Core Module Adoption: Asynchronous File Loading Document Parsing Library"
metadata:
  actual:
    adr_id: e771d3ec-e000-440f-a1e2-00df9414b263
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

# node:fs Core Module Adoption: Asynchronous File Loading Document Parsing Library

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/scripts/qa/**`, `apps/web/src/lib/docs/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-FS-001** SHOULD: Asynchronous file loading and document parsing in library code SHOULD utilize node:fs/promises rather than blocking synchronous file system methods.

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