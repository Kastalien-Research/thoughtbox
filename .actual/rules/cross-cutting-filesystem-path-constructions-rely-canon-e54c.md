---
version: 2
name: cross-cutting-filesystem-path-constructions-rely-canon-e54c
description: "Native Runtime fs and path Module Adoption: Filesystem Path Constructions Rely Canonical Join"
metadata:
  actual:
    adr_id: e54cf73f-1d82-4ca1-b2b6-98662479a305
    status: accepted
    candidate_group_id: 50f055d6-85b8-4cff-8151-5a9f9f9236dc
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/persistence/**
---

# Native Runtime fs and path Module Adoption: Filesystem Path Constructions Rely Canonical Join

Scope: applies to `scripts/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NTV-001** SHOULD: Filesystem path constructions SHOULD rely on canonical path join and resolution functions rather than manual string concatenation to ensure cross-platform compatibility.

### Verify

```bash
# Discover and run the project static analysis and linting scripts to verify compliance with module import rules.
# Discover and run the project automated test suite to confirm that filesystem read, write, and export routines execute without errors.
# Inspect dependency manifests using the discovered package inspection workflow to verify no unauthorized third-party filesystem libraries have been added.
```

**Accept when:**
- Static analysis confirms all filesystem and path handling relies on runtime core modules without unauthorized third-party filesystem packages.
- Automated unit and integration test suites pass completely across all supported execution environments.
- Filesystem read, write, and serialization operations handle error conditions gracefully without unhandled process exceptions.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>