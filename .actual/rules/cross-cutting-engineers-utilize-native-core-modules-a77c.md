---
version: 2
name: cross-cutting-engineers-utilize-native-core-modules-a77c
description: "Native Runtime fs and path Module Adoption: Engineers Utilize Native Core Modules Path"
metadata:
  actual:
    adr_id: a77c973f-4521-4b4a-93fe-cfe97f782d7a
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

# Native Runtime fs and path Module Adoption: Engineers Utilize Native Core Modules Path

Scope: applies to `scripts/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for local filesystem interactions, file reading, writing, and export workflows across domain persistence components, as well as path resolution, normalizations, and filesystem checks within automation and validation scripts.

### Rules

- **R-NATIVE-001** MUST: Engineers MUST utilize the native core modules fs and path for all local filesystem access, file reads, writes, and path manipulations across persistence modules and automation scripts.

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
Claude Code MUST NOT skip or defer verification. Changes introducing unapproved external filesystem dependencies or manual path concatenations are blocked until remediated. Static analysis violations fail continuous integration builds automatically.
</enforcement>