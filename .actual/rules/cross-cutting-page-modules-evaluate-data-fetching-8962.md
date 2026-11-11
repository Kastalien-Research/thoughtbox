---
version: 2
name: cross-cutting-page-modules-evaluate-data-fetching-8962
description: "Next.js Core Framework Adoption: Page Modules Evaluate Data Fetching Operations"
metadata:
  actual:
    adr_id: 8962794f-fb34-420e-90d8-ae012d01a1ea
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

# Next.js Core Framework Adoption: Page Modules Evaluate Data Fetching Operations

Scope: applies to `apps/web/next.config.ts`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NXT-001** SHOULD: Page modules SHOULD evaluate data fetching operations on the server side prior to rendering view hierarchies.

### Verify

```bash
# Discover and execute the project compilation script from the repository manifest to verify route compilation integrity.
# Discover and execute the repository type-checking script to ensure all framework navigation and routing contracts are satisfied.
```

**Accept when:**
- The project build script executes successfully with zero compilation errors across all route modules.
- Static type verification passes without errors for all framework routing and navigation imports.
- The resolved dependency version matches the authoritative lock artifact in the repository.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration pipeline and mandatory peer code review enforce these requirements.
</enforcement>