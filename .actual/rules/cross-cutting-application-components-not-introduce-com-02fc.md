---
version: 2
name: cross-cutting-application-components-not-introduce-com-02fc
description: "Next.js Core Framework Adoption: Application Components Not Introduce Competing Client"
metadata:
  actual:
    adr_id: 02fce781-249e-4a8d-8e67-34a2f7cab4d8
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

# Next.js Core Framework Adoption: Application Components Not Introduce Competing Client

Scope: applies to `apps/web/next.config.ts`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-FRAMEWORK-001** MUST_NOT: Application components MUST NOT introduce competing client-side or server-side routing libraries within the web application boundary.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>