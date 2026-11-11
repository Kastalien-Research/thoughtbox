---
version: 2
name: cross-cutting-persistence-drivers-decouple-specific-da-5bdd
description: "Adoption of revision-index Internal Module for Storage Revision Indexing: Persistence Drivers Decouple Specific Database Schema"
metadata:
  actual:
    adr_id: 5bdddb78-1979-4a3b-92aa-683e6c8de91e
    status: accepted
    candidate_group_id: 86b6050c-f4b6-4e1c-b895-cf9acb476434
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of revision-index Internal Module for Storage Revision Indexing: Persistence Drivers Decouple Specific Database Schema

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all storage engine adapters, persistence drivers, and subsystems requiring revision lookup, thought number resolution, and branch node index tracking.

### Rules

- **R-REV-001** SHOULD: Persistence drivers SHOULD decouple persistence-specific database schema mapping from internal revision index representation via shared domain types.
- **R-REV-002** MANDATORY: Initialize revision index structures alongside node caches within storage adapter constructors or factory functions.
- **R-REV-003** MANDATORY: Ensure that every delete operation against node collections coordinates with corresponding deletion invocations against revision indices.
- **R-REV-004** MANDATORY: The consumer MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-REV-005** MANDATORY (LOCK-VERSION GROUNDING): Before writing code that uses a versioned library, execute in order: (1) Find the dependency manifest in the repo declaring ranges, not installed versions; (2) Identify the build tool from the manifest; (3) Inspect the repository lock or resolution artifact to determine the exact resolved version; (4) Look up official documentation, changelog, or public API reference for that exact version; (5) Confirm every API, class, or function you will call exists in that exact version's documentation; (6) Re-run steps 3-5 per dependency at point of use for version-sensitive behavior.

### Verify

```bash
# Discover the project test runner from the dependency manifest and execute all persistence unit and integration test suites.
# Discover the project static analysis and linting scripts from the root configuration and verify module boundary compliance across persistence drivers.
```

**Accept when:**
- All persistence adapter test suites verify identical revision resolution behavior using revisionIndex.get across in-memory and database-backed drivers.
- Static module dependency analysis confirms all storage drivers import revision indexing capabilities exclusively from the revision-index module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Pull requests introducing independent revision mapping structures in storage drivers will be rejected. Static analysis violations reporting improper persistence module coupling fail automated build gates.
</enforcement>