---
version: 2
name: cross-cutting-direct-place-mutations-built-temporal-b75b
description: "date-fns Library Adoption for Temporal Operations: Direct Place Mutations Built Temporal Instances"
metadata:
  actual:
    adr_id: b75b6c94-db3b-4e27-abb8-43a39e2da183
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

# date-fns Library Adoption for Temporal Operations: Direct Place Mutations Built Temporal Instances

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TEMP-001** MUST_NOT: Direct in-place mutations of built-in temporal instances MUST NOT be performed; all transformations MUST produce new temporal values via pure functional operations.

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