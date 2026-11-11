---
version: 2
name: cross-cutting-when-utilizing-runtime-framework-depende-ce1a
description: "Adoption of revision-index Internal Module for Storage Revision Indexing: When Utilizing Runtime Framework Dependencies Within"
metadata:
  actual:
    adr_id: ce1aa9eb-d049-450e-8d49-ff445e485a5c
    status: accepted
    candidate_group_id: 86b6050c-f4b6-4e1c-b895-cf9acb476434
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of revision-index Internal Module for Storage Revision Indexing: When Utilizing Runtime Framework Dependencies Within

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-REV-001** MUST: When utilizing runtime or framework dependencies within persistence adapters, consumers MUST inspect the project lock artifact to resolve the exact locked version before implementing or updating integrations.

### Verify

```bash
# Discover the project dependency manifest and test runner, then execute persistence test suites
# Discover the project static analysis and linting scripts from root configuration and verify module boundary compliance
```

**Accept when:**
- All persistence adapter test suites verify identical revision resolution behavior using revisionIndex.get across in-memory and database-backed drivers.
- Static module dependency analysis confirms all storage drivers import revision indexing capabilities exclusively from the revision-index module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Pull requests introducing independent revision mapping structures in storage drivers will be rejected. Static analysis violations reporting improper persistence module coupling fail automated build gates.
</enforcement>