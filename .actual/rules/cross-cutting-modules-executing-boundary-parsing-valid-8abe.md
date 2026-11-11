---
version: 2
name: cross-cutting-modules-executing-boundary-parsing-valid-8abe
description: "Shared claims/types Internal Module Adoption for Domain Entity Definitions: Modules Executing Boundary Parsing Validation Align"
metadata:
  actual:
    adr_id: 8abe4e66-176f-4af8-8658-058852ce744e
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

# Shared claims/types Internal Module Adoption for Domain Entity Definitions: Modules Executing Boundary Parsing Validation Align

Scope: applies to `src/events/**`, `src/merge-evidence/**`, `src/merge/**`.

These rules are ALWAYS ACTIVE for all internal modules and subsystems that create, transform, persist, or emit claim entities, and cross-cutting services operating across merge, evidence, and event boundaries.

### Rules

- **R-SHARED-001** SHOULD: Modules executing boundary parsing or validation SHOULD align their runtime schema contracts with the static domain definitions exported by the claims/types module.
- **R-SHARED-002** MANDATORY: When writing code that uses a versioned library, discover the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact for the exact resolved version, look up official documentation for that version, and confirm every API/class/function exists before using it.
- **R-SHARED-003** MANDATORY: When extending domain contracts, prioritize backward-compatible additions and update all dependent subsystem fixtures synchronously.
- **R-SHARED-004** MANDATORY: Ensure that runtime validation schemas validating external payloads align structurally with the static definitions exported by the shared domain module.

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