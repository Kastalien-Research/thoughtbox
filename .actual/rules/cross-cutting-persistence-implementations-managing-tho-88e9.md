---
version: 2
name: cross-cutting-persistence-implementations-managing-tho-88e9
description: "Adoption of revision-index Internal Module for Storage Revision Indexing: Persistence Implementations Managing Thought Hierarchies Coordinate"
metadata:
  actual:
    adr_id: 88e9867b-86cf-4006-949a-07da6775736f
    status: accepted
    candidate_group_id: 86b6050c-f4b6-4e1c-b895-cf9acb476434
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of revision-index Internal Module for Storage Revision Indexing: Persistence Implementations Managing Thought Hierarchies Coordinate

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all storage engine adapters, persistence drivers, and subsystems requiring revision lookup, thought number resolution, and branch node index tracking.

### Rules

- **R-REV-001** MUST: All persistence implementations managing thought hierarchies MUST coordinate revision indexing through the shared internal revision-index module.
- **R-REV-002** MUST: Initialize revision index structures alongside node caches within storage adapter constructors or factory functions.
- **R-REV-003** MUST: Ensure that every delete operation against node collections coordinates with corresponding deletion invocations against revision indices.
- **R-REV-004** MUST: Derive all tool names, file names, commands, package managers, and version numbers from the project repository (DISCOVERY POLICY).
- **R-REV-005** MUST: Execute lock-version grounding before writing code that uses a versioned library (manifest -> build tool -> lock artifact -> docs -> API confirmation).

### Verify

```bash
# Discover the project test runner from the dependency manifest and execute all persistence unit and integration test suites.
# Discover the project static analysis and linting scripts from the root configuration and verify module boundary compliance across persistence drivers.
```

**Accept when:**
- All persistence adapter test suites verify identical revision resolution behavior using revisionIndex.get across in-memory and database-backed drivers.
- Static module dependency analysis confirms all storage drivers import revision indexing capabilities exclusively from the revision-index module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration test execution, automated architecture/module boundary static analysis checks, and peer code review enforce these rules. Pull requests introducing independent revision mapping structures in storage drivers will be rejected.
</enforcement>