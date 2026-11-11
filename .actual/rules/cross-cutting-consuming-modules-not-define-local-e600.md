---
version: 2
name: cross-cutting-consuming-modules-not-define-local-e600
description: "Shared claims/types Internal Module Adoption for Domain Entity Definitions: Consuming Modules Not Define Local Duplicate"
metadata:
  actual:
    adr_id: e6002b5b-cf07-4b4e-9077-2cb8093f8a53
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

# Shared claims/types Internal Module Adoption for Domain Entity Definitions: Consuming Modules Not Define Local Duplicate

Scope: applies to `src/events/**`, `src/merge-evidence/**`, `src/merge/**`.

These rules are ALWAYS ACTIVE for all internal modules and subsystems that create, transform, persist, or emit claim entities, as well as cross-cutting services operating across merge, evidence, and event boundaries.

### Rules

- **R-CLM-001** MUST_NOT: Consuming modules MUST_NOT define local or duplicate type representations for core claim entities that conflict with or shadow the canonical domain module.

### Verify

```bash
# Discover and run the project type-checking script to confirm that all claim type imports resolve to the canonical domain module without structural mismatches.
# Discover and execute the repository test runner across consuming subsystems to validate domain contract compatibility across boundaries.
```

**Accept when:**
- Type-checking verification confirms zero structural type mismatches across all subsystems importing canonical claim definitions.
- All consumer test suites execute successfully with valid canonical claim entity fixtures.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated type-checking across all project modules during continuous integration and mandatory architectural and code review checks for pull requests modifying domain contracts.
</enforcement>