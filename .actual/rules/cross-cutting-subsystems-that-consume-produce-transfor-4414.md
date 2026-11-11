---
version: 2
name: cross-cutting-subsystems-that-consume-produce-transfor-4414
description: "Shared claims/types Internal Module Adoption for Domain Entity Definitions: Subsystems That Consume Produce Transform Claim"
metadata:
  actual:
    adr_id: 4414c118-547d-460c-82a2-e459992dfb7e
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

# Shared claims/types Internal Module Adoption for Domain Entity Definitions: Subsystems That Consume Produce Transform Claim

Scope: applies to `src/events/**`, `src/merge-evidence/**`, `src/merge/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CLAIM-001** MUST: Subsystems that consume, produce, or transform claim data structures MUST import canonical entity definitions from the centralized claims/types internal module.

### Verify

```bash
# Discover and run the project type-checking script to confirm that all claim type imports resolve to the canonical domain module without structural mismatches.
# Discover and execute the repository test runner across consuming subsystems to validate domain contract compatibility across boundaries.
```

**Accept when:**
- Type-checking verification confirms zero structural type mismatches across all subsystems importing canonical claim definitions.
- All consumer test suites execute successfully with valid canonical claim entity fixtures.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration builds fail upon detection of local type declarations shadowing canonical claim entities, and pull requests introducing divergent claim models are rejected until refactored to consume the centralized module.
</enforcement>