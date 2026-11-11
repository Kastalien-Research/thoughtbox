---
version: 2
name: cross-cutting-storage-drivers-perform-thought-sequence-0748
description: "Adoption of revision-index Internal Module for Storage Revision Indexing: Storage Drivers Perform Thought Sequence Lookups"
metadata:
  actual:
    adr_id: 0748bf16-d53d-4d41-b0e1-2f6d9f55c6a3
    status: accepted
    candidate_group_id: 86b6050c-f4b6-4e1c-b895-cf9acb476434
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of revision-index Internal Module for Storage Revision Indexing: Storage Drivers Perform Thought Sequence Lookups

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all storage engine adapters, persistence drivers, and subsystems requiring revision lookup, thought number resolution, and branch node index tracking.

### Rules

- **R-REV-001** MUST: Storage drivers MUST perform thought sequence lookups using revisionIndex.get to maintain uniform revision resolution across in-memory and external persistence layers.

### Verify

```bash
# Discover the project test runner from the dependency manifest and execute all persistence unit and integration test suites.
# Discover the project static analysis and linting scripts from the root configuration and verify module boundary compliance across persistence drivers.
```

**Accept when:**
- All persistence adapter test suites verify identical revision resolution behavior using revisionIndex.get across in-memory and database-backed drivers.
- Static module dependency analysis confirms all storage drivers import revision indexing capabilities exclusively from the revision-index module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by continuous integration test execution, automated architecture and module boundary static analysis checks, and peer code review.
</enforcement>