---
version: 2
name: cross-cutting-developers-consult-repository-dependency-5daa
description: "date-fns Library Adoption for Temporal Operations: Developers Consult Repository Dependency Manifest Lock"
metadata:
  actual:
    adr_id: 5daa2ff3-f145-4342-86d7-f374be3ccb11
    status: accepted
    candidate_group_id: 969dd436-fd3c-425e-8b4d-6e13c3009579
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/components/session-area/**
      - src/lib/session/**
---

# date-fns Library Adoption for Temporal Operations: Developers Consult Repository Dependency Manifest Lock

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-DATE-001** MUST: Developers MUST consult the repository dependency manifest and lock artifact to resolve the exact locked version of date-fns prior to introducing any temporal function calls.

### Verify

```bash
# Discover and execute the project dependency analysis script to verify date-fns is the sole temporal library present in manifests.
# Discover and execute the repository linter to verify all date-fns imports utilize modular named specifiers.
# Discover and execute the automated test runner to ensure all temporal view-model transformations pass test suites.
```

**Accept when:**
- All temporal manipulation, formatting, and calculation functions import modular utilities from date-fns across client components, server pages, and domain view models.
- Static analysis and dependency verification pass with zero unapproved third-party temporal calculation libraries present in the dependency manifest.
- The exact installed version of date-fns matches the resolved version documented in the repository lock artifact.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>