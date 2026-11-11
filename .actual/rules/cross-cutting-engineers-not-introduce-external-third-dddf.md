---
version: 2
name: cross-cutting-engineers-not-introduce-external-third-dddf
description: "Native Runtime fs and path Module Adoption: Engineers Not Introduce External Third Party"
metadata:
  actual:
    adr_id: dddf291c-4e58-4831-91f6-69cd0fdac130
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

# Native Runtime fs and path Module Adoption: Engineers Not Introduce External Third Party

Scope: applies to `scripts/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for all local filesystem interactions, file reading, writing, and export workflows across domain persistence components, path resolution, normalizations, and filesystem checks within automation and validation scripts.

### Rules

- **R-ADR-001** MUST_NOT: Engineers MUST NOT introduce external third-party filesystem helper packages or path utilities when built-in capabilities in the fs and path modules satisfy the functional requirements.

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
Verification is mandatory. Claude Code MUST NOT skip or defer verification.
</enforcement>