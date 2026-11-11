---
version: 2
name: cross-cutting-fs-core-module-adoption-before-e3e3
description: "node:fs Core Module Adoption: Before Introducing Updating Any Dependency Runtime"
metadata:
  actual:
    adr_id: e3e38c64-96de-4ae7-80b2-e3a9e91a9dca
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

# node:fs Core Module Adoption: Before Introducing Updating Any Dependency Runtime

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/scripts/qa/**`, `apps/web/src/lib/docs/**`.

These rules are ALWAYS ACTIVE for server-side utility modules requiring file system interactions, quality assurance scripts, design token verifiers, architecture validation utilities, and developer tooling automation hooks.

### Rules

- **R-FS-001** MUST: Before introducing or updating any dependency or runtime capability, the consumer MUST inspect the authoritative repository lock artifact to verify the exact resolved environment version and confirm runtime compatibility.

### Verify

```bash
# Discover repository verification scripts from the project manifest and execute linting checks
# Discover and run the architecture verification test suite defined in repository configuration
```

**Accept when:**
- Static analysis confirms zero unadorned bare module imports for runtime core capabilities across the codebase
- Architecture verification and test suites execute without errors across all workspace packages

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration builds fail upon detection of bare runtime core module imports or client bundle leaks.
</enforcement>