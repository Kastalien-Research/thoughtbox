---
version: 2
name: cross-cutting-date-fns-utilities-imported-modular-00e0
description: "date-fns Library Adoption for Temporal Operations: Date Fns Utilities Imported Modular Named"
metadata:
  actual:
    adr_id: 00e0e6ed-2a18-4aca-9b80-58b427f703ae
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

# date-fns Library Adoption for Temporal Operations: Date Fns Utilities Imported Modular Named

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all temporal operations, date calculations, timeline bucketing, and timestamp formatting across domain view models, server-rendered analytics pages, and interactive client components.

### Rules

- **R-DATE-001** MUST: All date-fns utilities MUST be imported as modular named functions to ensure tree-shaking optimization in client bundles.

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