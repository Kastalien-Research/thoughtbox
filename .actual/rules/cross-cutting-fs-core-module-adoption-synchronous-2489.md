---
version: 2
name: cross-cutting-fs-core-module-adoption-synchronous-2489
description: "node:fs Core Module Adoption: Synchronous File System Operations Used Standalone"
metadata:
  actual:
    adr_id: 248911b1-e194-4784-a455-40cc135f4e9b
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

# node:fs Core Module Adoption: Synchronous File System Operations Used Standalone

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/scripts/qa/**`, `apps/web/src/lib/docs/**`.

These rules are ALWAYS ACTIVE for server-side utilities, verification scripts, and automation hooks requiring direct file system access.

### Rules

- **R-FS-001** MAY: Synchronous file system operations MAY be used in standalone architecture verification scripts and developer tooling hooks where blocking execution does not impact concurrent server request throughput.

### Verify

```bash
# Discover repository verification scripts from the project manifest and execute linting checks
# Discover and run the architecture verification test suite defined in repository configuration
```

**Accept when:**
- Static analysis confirms zero unadorned bare module imports for runtime core capabilities across the codebase
- Architecture verification and test suites execute without errors across all workspace packages

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis and linter rules validate module import specifiers in continuous integration.
</enforcement>