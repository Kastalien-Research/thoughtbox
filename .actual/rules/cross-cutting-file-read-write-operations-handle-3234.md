---
version: 2
name: cross-cutting-file-read-write-operations-handle-3234
description: "Native Runtime fs and path Module Adoption: File Read Write Operations Handle Operational"
metadata:
  actual:
    adr_id: 3234f7fa-9dbc-4bf9-830e-e9ed80e2a8a0
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

# Native Runtime fs and path Module Adoption: File Read Write Operations Handle Operational

Scope: applies to `scripts/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for local filesystem interactions, file reading, writing, and export workflows across domain persistence components, as well as path resolution, normalizations, and filesystem checks within automation and validation scripts.

### Rules

- **R-NATIVE-001** MUST: File read and write operations MUST handle operational failures and invalid data structures gracefully using structured exception handling.

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