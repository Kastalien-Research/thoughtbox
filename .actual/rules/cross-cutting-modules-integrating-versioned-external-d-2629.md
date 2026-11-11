---
version: 2
name: cross-cutting-modules-integrating-versioned-external-d-2629
description: "Shared claims/types Internal Module Adoption for Domain Entity Definitions: Modules Integrating Versioned External Dependencies Runtime"
metadata:
  actual:
    adr_id: 2629c68c-a86a-4f10-b78e-68f6608fef99
    status: accepted
    candidate_group_id: 87456ae2-1f8f-40b8-9947-3246b2f2ea4d
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/events/**
      - src/merge-evidence/**
      - src/merge/**
---

# Shared claims/types Internal Module Adoption for Domain Entity Definitions: Modules Integrating Versioned External Dependencies Runtime

Scope: applies to `src/events/**`, `src/merge-evidence/**`, `src/merge/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EXT-001** MUST: Modules integrating versioned external dependencies for runtime validation or event streaming MUST discover the repository resolution artifact and verify the exact resolved version prior to implementation.

### Verify

```bash
# Discover and run the project type-checking script to confirm that all claim type imports resolve to the canonical domain module without structural mismatches.
# Discover and execute the repository test runner across consuming subsystems to validate domain contract compatibility across boundaries.
```

**Accept when:**
- Type-checking verification confirms zero structural type mismatches across all subsystems importing canonical claim definitions.
- All consumer test suites execute successfully with valid canonical claim entity fixtures.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>