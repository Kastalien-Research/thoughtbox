---
version: 2
name: cross-cutting-navigation-route-transitions-across-appl-77ac
description: "Next.js Core Framework Adoption: Navigation Route Transitions Across Application Views"
metadata:
  actual:
    adr_id: 77acc07e-eb94-4c10-9b01-da9fee26eb04
    status: accepted
    candidate_group_id: a455d5e5-139d-42ba-a628-cdc1136a84b0
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - next.config.ts
      - src/app/**
---

# Next.js Core Framework Adoption: Navigation Route Transitions Across Application Views

Scope: applies to `apps/web/next.config.ts`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NAV-001** MUST: Navigation and route transitions across application views MUST use framework navigation primitives rather than native browser window relocation.

### Verify

```bash
# Discover and execute the project compilation script from the repository manifest
# Discover and execute the repository type-checking script
```

**Accept when:**
- The project build script executes successfully with zero compilation errors across all route modules.
- Static type verification passes without errors for all framework routing and navigation imports.
- The resolved dependency version matches the authoritative lock artifact in the repository.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated CI pipeline executing project verification and linting scripts, and mandatory peer code review.
</enforcement>