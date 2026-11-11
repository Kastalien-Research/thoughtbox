---
version: 2
name: cross-cutting-node-deletion-routines-storage-implement-4ef1
description: "Adoption of revision-index Internal Module for Storage Revision Indexing: Node Deletion Routines Storage Implementations Synchronously"
metadata:
  actual:
    adr_id: 4ef1fa4b-05d2-4d08-af29-ca6635392b5a
    status: accepted
    candidate_group_id: 86b6050c-f4b6-4e1c-b895-cf9acb476434
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of revision-index Internal Module for Storage Revision Indexing: Node Deletion Routines Storage Implementations Synchronously

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for storage engine adapters, persistence drivers managing node histories, thought hierarchies, and subsystems requiring revision lookup, thought number resolution, and branch node index tracking.

### Rules

- **R-REV-001** MUST: Node deletion routines in storage implementations MUST synchronously purge associated revision references from revision and branch indices to prevent orphaned pointer retention.

### Verify

```bash
# Discover the project test runner from the dependency manifest and execute all persistence unit and integration test suites.
# Discover the project static analysis and linting scripts from the root configuration and verify module boundary compliance across persistence drivers.
```

**Accept when:**
- All persistence adapter test suites verify identical revision resolution behavior using revisionIndex.get across in-memory and database-backed drivers.
- Static module dependency analysis confirms all storage drivers import revision indexing capabilities exclusively from the revision-index module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration test execution, automated architecture and module boundary static analysis checks, and peer code reviews enforce compliance.
</enforcement>