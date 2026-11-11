---
version: 2
name: cross-cutting-subsystems-extend-canonical-claim-struct-2de6
description: "Shared claims/types Internal Module Adoption for Domain Entity Definitions: Subsystems Extend Canonical Claim Structures Transient"
metadata:
  actual:
    adr_id: 2de6aef6-9527-434c-84fa-471fd345ea66
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

# Shared claims/types Internal Module Adoption for Domain Entity Definitions: Subsystems Extend Canonical Claim Structures Transient

Scope: applies to `src/events/**`, `src/merge-evidence/**`, `src/merge/**`.

These rules are ALWAYS ACTIVE for all internal modules and subsystems that create, transform, persist, or emit claim entities, and cross-cutting services operating across merge, evidence, and event boundaries.

### Rules

- **R-CLAIM-001** MAY: Subsystems MAY extend canonical claim structures with transient metadata provided the core entity contract remains intact.
- **R-CLAIM-002** MANDATORY: The consumer MUST discover tool names, file names, commands, package managers, and version numbers from the project repository (DISCOVERY POLICY).
- **R-CLAIM-003** MANDATORY: Before writing code that uses a versioned library, execute in order: find the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact, look up official documentation for that exact version, confirm API existence, and re-verify per dependency at point of use (LOCK-VERSION GROUNDING).
- **R-CLAIM-004** SHOULD: When extending domain contracts, prioritize backward-compatible additions and update all dependent subsystem fixtures synchronously.
- **R-CLAIM-005** MUST: Ensure that runtime validation schemas validating external payloads align structurally with the static definitions exported by the shared domain module.

### Verify

```bash
# Discover and run the project type-checking script to confirm that all claim type imports resolve to the canonical domain module without structural mismatches.
# Discover and execute the repository test runner across consuming subsystems to validate domain contract compatibility across boundaries.
```

**Accept when:**
- Type-checking verification confirms zero structural type mismatches across all subsystems importing canonical claim definitions.
- All consumer test suites execute successfully with valid canonical claim entity fixtures.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration builds fail upon detection of local type declarations shadowing canonical claim entities. Pull requests introducing divergent claim models are rejected until refactored to consume the centralized module.
</enforcement>