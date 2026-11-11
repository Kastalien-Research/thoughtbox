---
version: 2
name: cross-cutting-storage-layer-implementations-not-implem-6ea2
description: "Adoption of revision-index Internal Module for Storage Revision Indexing: Storage Layer Implementations Not Implement Proprietary"
metadata:
  actual:
    adr_id: 6ea2d8b3-cb6a-4e05-9214-9d83eb2c55d4
    status: accepted
    candidate_group_id: 86b6050c-f4b6-4e1c-b895-cf9acb476434
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of revision-index Internal Module for Storage Revision Indexing: Storage Layer Implementations Not Implement Proprietary

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all storage engine adapters, persistence drivers managing node histories and thought hierarchies, and subsystems requiring revision lookup, thought number resolution, and branch node index tracking.

### Rules

- **R-STOR-001** MUST_NOT: Storage layer implementations MUST NOT implement proprietary revision-to-thought mapping algorithms that bypass the centralized revision-index module.

### Verify

\`\`\`bash
# Discover the project dependency manifest and test runner, then execute persistence unit and integration test suites.
# Discover the root configuration and run static analysis/linting scripts to verify module boundary compliance across persistence drivers.
\`\``

**Accept when:**
- All persistence adapter test suites verify identical revision resolution behavior using revisionIndex.get across in-memory and database-backed drivers.
- Static module dependency analysis confirms all storage drivers import revision indexing capabilities exclusively from the revision-index module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Pull requests introducing independent revision mapping structures in storage drivers will be rejected. Static analysis violations reporting improper persistence module coupling fail automated build gates.
</enforcement>